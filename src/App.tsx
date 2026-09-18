import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MODE_CONFIG,
  applyGameAction,
  createGameState,
  getLegalMoves,
  resolveTheme,
  type GameAction,
  type GameState,
  type Seat
} from './game';
import {
  AI_DIFFICULTIES,
  chooseAiAction,
  disposeAiWorker,
  requestAiDecision
} from './ai';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameScreen } from './components/GameScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { NearbyLobbyScreen } from './components/NearbyLobbyScreen';
import { usePreferences } from './store/usePreferences';
import { useRoomSession } from './multiplayer/useRoomSession';
import {
  advertiseNearbyLobby,
  buildNearbyGamePlan,
  createNearbyLobby,
  getOrCreateNearbyDeviceId,
  nearbyNativeAvailable,
  nearbyPlatform,
  stopNearbyBridge,
  toggleLocalNearbySeat,
  updateLocalNearbySeatName,
  type NearbyLobbyState
} from './nearby';

function initialRoomCode() {
  return new URLSearchParams(window.location.search)
    .get('room')
    ?.replace(/\D/g, '')
    .slice(0, 4) ?? '';
}

const SEAT_NAME: Record<Seat, string> = {
  north: 'Norte',
  east: 'Este',
  south: 'Sur',
  west: 'Oeste'
};

const MIN_AI_PRESENTATION_MS = {
  easy: 220,
  normal: 300,
  hard: 360,
  master: 440
} as const;

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export default function App() {
  const preferences = usePreferences();
  const online = useRoomSession();

  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [localGame, setLocalGame] = useState<GameState | null>(null);
  const [aiGame, setAiGame] = useState<GameState | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [nearbyLobby, setNearbyLobby] = useState<NearbyLobbyState | null>(null);
  const [nearbyGame, setNearbyGame] = useState<GameState | null>(null);
  const [nearbyControlIds, setNearbyControlIds] = useState<string[]>([]);
  const [welcomeOpen, setWelcomeOpen] = useState(
    () => sessionStorage.getItem('anchorgrid-welcome') !== '1'
  );

  const attemptedResume = useRef(false);
  const aiRequestedRevision = useRef<number | null>(null);

  useEffect(() => {
    if (
      welcomeOpen ||
      attemptedResume.current ||
      !online.firebaseConfigured ||
      roomCode.length !== 4
    ) {
      return;
    }

    attemptedResume.current = true;
    void online.resume(roomCode);
  }, [
    welcomeOpen,
    online.firebaseConfigured,
    online.resume,
    roomCode
  ]);

  useEffect(() => () => {
    disposeAiWorker();
  }, []);

  const startLocal = useCallback(() => {
    const config = MODE_CONFIG[preferences.mode];

    const players = config.seats.map((seat, index) => ({
      id: `local-${index + 1}`,
      name: index === 0
        ? preferences.nickname.trim()
        : `Jugador ${index + 1}`,
      seat
    }));

    setAiGame(null);
    setLocalGame(createGameState({
      mode: preferences.mode,
      themeId: resolveTheme(preferences.themeChoice),
      players
    }));
  }, [
    preferences.mode,
    preferences.nickname,
    preferences.themeChoice
  ]);

  const startAi = useCallback(() => {
    const config = MODE_CONFIG[preferences.mode];

    const players = config.seats.map((seat, index) => {
      if (index === 0) {
        return {
          id: 'ai-human',
          name: preferences.nickname.trim(),
          seat
        };
      }

      let name = `CPU ${SEAT_NAME[seat]}`;

      if (preferences.mode === 'team2v2') {
        name = seat === 'south'
          ? 'CPU Morado'
          : `CPU Naranja ${seat === 'east' ? 'Este' : 'Oeste'}`;
      }

      return {
        id: `cpu-${seat}`,
        name,
        seat
      };
    });

    aiRequestedRevision.current = null;
    setAiThinking(false);
    setLocalGame(null);
    setAiGame(createGameState({
      mode: preferences.mode,
      themeId: resolveTheme(preferences.themeChoice),
      players
    }));
  }, [
    preferences.mode,
    preferences.nickname,
    preferences.themeChoice
  ]);

  const startNearbyLobby = useCallback(() => {
    const name = preferences.nickname.trim();
    if (name.length < 2) return;

    const lobby = createNearbyLobby({
      mode: preferences.mode,
      themeId: resolveTheme(preferences.themeChoice),
      deviceId: getOrCreateNearbyDeviceId(),
      deviceName: name,
      platform: nearbyPlatform()
    });

    setLocalGame(null);
    setAiGame(null);
    setNearbyGame(null);
    setNearbyControlIds([]);
    setNearbyLobby(lobby);

    void advertiseNearbyLobby(lobby).catch(() => undefined);
  }, [
    preferences.mode,
    preferences.nickname,
    preferences.themeChoice
  ]);

  const startNearbyGame = useCallback(() => {
    setNearbyLobby((current) => {
      if (!current) return current;

      const plan = buildNearbyGamePlan(current);

      setNearbyControlIds(plan.localPlayerIds);
      setNearbyGame(createGameState({
        mode: plan.lobby.mode,
        themeId: plan.lobby.themeId,
        players: plan.players
      }));

      return plan.lobby;
    });
  }, []);

  const nearbyAction = useCallback((action: GameAction) => {
    setNearbyGame((current) => {
      if (!current) return current;
      if (
        action.type !== 'TIMEOUT' &&
        !nearbyControlIds.includes(action.playerId)
      ) {
        return current;
      }

      return applyGameAction(current, action, Date.now());
    });
  }, [nearbyControlIds]);

  const restartNearby = useCallback(() => {
    setNearbyGame((current) => {
      if (!current) return current;

      return createGameState({
        mode: current.mode,
        themeId: current.themeId,
        players: current.players.map((player) => ({
          id: player.id,
          name: player.name,
          seat: player.seat
        }))
      });
    });
  }, []);

  const localAction = useCallback((action: GameAction) => {
    setLocalGame((current) => (
      current
        ? applyGameAction(current, action, Date.now())
        : current
    ));
  }, []);

  const aiHumanAction = useCallback((action: GameAction) => {
    if (action.type !== 'TIMEOUT' && action.playerId !== 'ai-human') {
      return;
    }

    setAiGame((current) => {
      if (
        !current ||
        current.turn.currentPlayerId !== action.playerId
      ) {
        return current;
      }

      return applyGameAction(current, action, Date.now());
    });
  }, []);

  const restartLocal = useCallback(() => {
    setLocalGame((current) => {
      if (!current) return current;

      return createGameState({
        mode: current.mode,
        themeId: current.themeId,
        players: current.players.map((player) => ({
          id: player.id,
          name: player.name,
          seat: player.seat
        }))
      });
    });
  }, []);

  const restartAi = useCallback(() => {
    aiRequestedRevision.current = null;
    setAiThinking(false);

    setAiGame((current) => {
      if (!current) return current;

      return createGameState({
        mode: current.mode,
        themeId: current.themeId,
        players: current.players.map((player) => ({
          id: player.id,
          name: player.name,
          seat: player.seat
        }))
      });
    });
  }, []);

  useEffect(() => {
    if (!aiGame || aiGame.status !== 'playing') {
      setAiThinking(false);
      return;
    }

    const active = aiGame.players.find(
      (player) => player.id === aiGame.turn.currentPlayerId
    );

    if (!active || !active.id.startsWith('cpu-')) {
      setAiThinking(false);
      return;
    }

    if (aiRequestedRevision.current === aiGame.revision) return;
    aiRequestedRevision.current = aiGame.revision;

    let cancelled = false;
    const expectedRevision = aiGame.revision;
    const playerId = active.id;
    const difficulty = preferences.aiDifficulty;

    setAiThinking(true);

    const minimumDelay = delay(MIN_AI_PRESENTATION_MS[difficulty]);

    void Promise.all([
      requestAiDecision(aiGame, playerId, difficulty)
        .catch(() => chooseAiAction(aiGame, playerId, difficulty)),
      minimumDelay
    ])
      .then(([decision]) => {
        if (cancelled) return;

        setAiGame((current) => {
          if (
            !current ||
            current.revision !== expectedRevision ||
            current.turn.currentPlayerId !== playerId
          ) {
            return current;
          }

          return applyGameAction(
            current,
            decision.action,
            Date.now()
          );
        });
      })
      .catch(() => {
        if (cancelled) return;

        // Absolute last-resort fallback: advance legally instead of locking
        // the match if a browser rejects workers or a search is interrupted.
        setAiGame((current) => {
          if (
            !current ||
            current.revision !== expectedRevision ||
            current.turn.currentPlayerId !== playerId
          ) {
            return current;
          }

          const move = getLegalMoves(current, playerId)[0];
          if (!move) return current;

          return applyGameAction(
            current,
            {
              type: 'MOVE_PAWN',
              playerId,
              to: move.to
            },
            Date.now()
          );
        });
      })
      .finally(() => {
        if (!cancelled) setAiThinking(false);
      });

    return () => {
      cancelled = true;
      if (aiRequestedRevision.current === expectedRevision) {
        aiRequestedRevision.current = null;
      }
    };
  }, [
    aiGame,
    preferences.aiDifficulty
  ]);

  const dismissWelcome = useCallback(() => {
    sessionStorage.setItem('anchorgrid-welcome', '1');
    setWelcomeOpen(false);
  }, []);

  if (welcomeOpen) {
    return (
      <WelcomeScreen
        roomCode={roomCode || undefined}
        onContinue={dismissWelcome}
      />
    );
  }

  const leaveOnline = async () => {
    await online.leave();
    window.history.replaceState({}, '', window.location.pathname);
    setRoomCode('');
    attemptedResume.current = false;
  };

  if (localGame) {
    return (
      <GameScreen
        game={localGame}
        canControlAll
        networkConnected
        serverNow={() => Date.now()}
        onAction={localAction}
        onLeave={() => setLocalGame(null)}
        onRematch={restartLocal}
      />
    );
  }

  if (aiGame) {
    const difficulty = AI_DIFFICULTIES.find(
      (item) => item.id === preferences.aiDifficulty
    ) ?? AI_DIFFICULTIES[1];

    return (
      <GameScreen
        game={aiGame}
        localPlayerId="ai-human"
        networkConnected
        serverNow={() => Date.now()}
        onAction={aiHumanAction}
        onLeave={() => {
          aiRequestedRevision.current = null;
          setAiThinking(false);
          setAiGame(null);
        }}
        onRematch={restartAi}
        aiThinking={aiThinking}
        aiLabel={`IA ${difficulty.label}`}
      />
    );
  }

  if (nearbyGame) {
    return (
      <GameScreen
        game={nearbyGame}
        controllablePlayerIds={nearbyControlIds}
        isHost
        networkConnected
        serverNow={() => Date.now()}
        onAction={nearbyAction}
        onLeave={() => {
          setNearbyGame(null);
          setNearbyLobby(null);
          setNearbyControlIds([]);
          void stopNearbyBridge().catch(() => undefined);
        }}
        onRematch={restartNearby}
        sessionLabel="JUEGO CERCANO"
      />
    );
  }

  if (nearbyLobby) {
    return (
      <NearbyLobbyScreen
        lobby={nearbyLobby}
        nativeAvailable={nearbyNativeAvailable()}
        onChange={setNearbyLobby}
        onToggleSeat={(seat) => {
          setNearbyLobby((current) => current
            ? toggleLocalNearbySeat(
                current,
                seat,
                `${preferences.nickname.trim()} · ${SEAT_NAME[seat]}`
              )
            : current
          );
        }}
        onRenameSeat={(seat, value) => {
          setNearbyLobby((current) => current
            ? updateLocalNearbySeatName(current, seat, value)
            : current
          );
        }}
        onStart={startNearbyGame}
        onLeave={() => {
          setNearbyLobby(null);
          setNearbyControlIds([]);
          void stopNearbyBridge().catch(() => undefined);
        }}
      />
    );
  }

  if (online.room?.game) {
    return (
      <GameScreen
        game={online.room.game}
        roomCode={online.room.code}
        localPlayerId={online.firebaseConnected ? online.uid : null}
        isHost={online.isHost}
        authorityEpoch={online.room.authority.epoch}
        networkConnected={online.firebaseConnected}
        serverOffsetMs={online.serverOffsetMs}
        serverNow={online.serverNow}
        onAction={online.act}
        onLeave={leaveOnline}
        onRematch={online.rematch}
        onRequestRematch={online.requestRematch}
        onReturnLobby={online.returnToLobby}
        rematchVotes={online.room.rematchVotes}
        requiredPlayers={online.room.meta.requiredPlayers}
        reactions={Object.values(online.room.reactions ?? {})}
        onReact={online.react}
      />
    );
  }

  if (online.room) {
    return (
      <LobbyScreen
        room={online.room}
        isHost={online.isHost}
        networkConnected={online.firebaseConnected}
        serverOffsetMs={online.serverOffsetMs}
        error={online.error}
        onStart={online.start}
        onLeave={leaveOnline}
      />
    );
  }

  async function createOnline() {
    const name = preferences.nickname.trim();
    if (name.length < 2) return;

    const code = await online.create({
      name,
      mode: preferences.mode,
      themeId: resolveTheme(preferences.themeChoice)
    });

    setRoomCode(code);
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?room=${code}`
    );
  }

  async function joinOnline() {
    const name = preferences.nickname.trim();

    if (name.length < 2 || roomCode.length !== 4) return;

    const code = await online.join(roomCode, name);

    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?room=${code}`
    );
  }

  return (
    <HomeScreen
      firebaseConfigured={online.firebaseConfigured}
      firebaseConnected={online.firebaseConnected}
      busy={online.busy || online.resuming}
      resuming={online.resuming}
      error={online.error}
      roomCode={roomCode}
      setRoomCode={setRoomCode}
      onCreateOnline={createOnline}
      onJoinOnline={joinOnline}
      onStartLocal={startLocal}
      onStartAi={startAi}
      nearbyNativeAvailable={nearbyNativeAvailable()}
      onCreateNearby={startNearbyLobby}
    />
  );
}
