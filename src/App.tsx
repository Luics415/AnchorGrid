import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MODE_CONFIG,
  applyGameAction,
  createGameState,
  resolveTheme,
  type GameAction,
  type GameState
} from './game';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameScreen } from './components/GameScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { usePreferences } from './store/usePreferences';
import { useRoomSession } from './multiplayer/useRoomSession';

function initialRoomCode() {
  return new URLSearchParams(window.location.search).get('room')?.replace(/\D/g, '').slice(0, 4) ?? '';
}

export default function App() {
  const preferences = usePreferences();
  const online = useRoomSession();
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [localGame, setLocalGame] = useState<GameState | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(() => sessionStorage.getItem('anchorgrid-welcome') !== '1');
  const attemptedResume = useRef(false);

  // A refresh/app restart keeps the same anonymous Firebase identity. If this
  // browser already owns a seat, rejoin automatically from ?room=XXXX.
  useEffect(() => {
    if (welcomeOpen || attemptedResume.current || !online.firebaseConfigured || roomCode.length !== 4) return;
    attemptedResume.current = true;
    void online.resume(roomCode);
  }, [welcomeOpen, online.firebaseConfigured, online.resume, roomCode]);

  const startLocal = useCallback(() => {
    const config = MODE_CONFIG[preferences.mode];
    const players = config.seats.map((seat, index) => ({
      id: `local-${index + 1}`,
      name: index === 0 ? preferences.nickname.trim() : `Jugador ${index + 1}`,
      seat
    }));

    setLocalGame(createGameState({
      mode: preferences.mode,
      themeId: resolveTheme(preferences.themeChoice),
      players
    }));
  }, [preferences.mode, preferences.nickname, preferences.themeChoice]);

  const localAction = useCallback((action: GameAction) => {
    setLocalGame((current) => current ? applyGameAction(current, action, Date.now()) : current);
  }, []);

  const restartLocal = useCallback(() => {
    setLocalGame((current) => {
      if (!current) return current;
      return createGameState({
        mode: current.mode,
        themeId: current.themeId,
        players: current.players.map((player) => ({ id: player.id, name: player.name, seat: player.seat }))
      });
    });
  }, []);

  const dismissWelcome = useCallback(() => {
    sessionStorage.setItem('anchorgrid-welcome', '1');
    setWelcomeOpen(false);
  }, []);

  if (welcomeOpen) {
    return <WelcomeScreen roomCode={roomCode || undefined} onContinue={dismissWelcome} />;
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
    const code = await online.create({ name, mode: preferences.mode, themeId: resolveTheme(preferences.themeChoice) });
    setRoomCode(code);
    window.history.replaceState({}, '', `${window.location.pathname}?room=${code}`);
  }

  async function joinOnline() {
    const name = preferences.nickname.trim();
    if (name.length < 2 || roomCode.length !== 4) return;
    const code = await online.join(roomCode, name);
    window.history.replaceState({}, '', `${window.location.pathname}?room=${code}`);
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
    />
  );
}
