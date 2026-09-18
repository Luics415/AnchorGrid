import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from 'react';
import {
  CENTER,
  getLegalMoves,
  validateWallPlacement,
  type GameAction,
  type GameState,
  type LegalMove,
  type Seat,
  type WallOrientation
} from '../game';

interface Props {
  game: GameState;
  localPlayerId?: string | null;
  controllablePlayerIds?: string[];
  canControlAll?: boolean;
  onAction: (action: GameAction) => void | Promise<void>;
}

interface WallDragState {
  orientation: WallOrientation;
  pointerId: number;
}

interface WallPreview {
  row: number;
  col: number;
  orientation: WallOrientation;
  valid: boolean;
}

function cellGridIndex(index: number) {
  return index * 2 + 1;
}

function AnchorMark({ seat }: { seat: Seat }) {
  return (
    <svg className={`pawn-anchor anchor-${seat}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="4.2" r="2.15" />
      <path d="M12 6.5v12.2M7.1 9.3h9.8M5.2 14.1c.7 4.1 3.2 6.4 6.8 6.4s6.1-2.3 6.8-6.4M5.2 14.1l-2 2.2M5.2 14.1l2.35 1.7M18.8 14.1l2 2.2M18.8 14.1l-2.35 1.7" />
    </svg>
  );
}

function samePreview(a: WallPreview | null, b: WallPreview | null) {
  if (!a || !b) return a === b;
  return (
    a.row === b.row &&
    a.col === b.col &&
    a.orientation === b.orientation &&
    a.valid === b.valid
  );
}

export const GameBoard = memo(function GameBoard({
  game,
  localPlayerId,
  controllablePlayerIds = [],
  canControlAll = false,
  onAction
}: Props) {
  const [wallDrag, setWallDrag] = useState<WallDragState | null>(null);
  const [wallPreview, setWallPreview] = useState<WallPreview | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingPointRef = useRef<{ x: number; y: number } | null>(null);

  const activePlayer = game.players.find(
    (player) => player.id === game.turn.currentPlayerId
  );

  const canAct = Boolean(
    activePlayer &&
    !activePlayer.eliminated &&
    (
      canControlAll ||
      localPlayerId === activePlayer.id ||
      controllablePlayerIds.includes(activePlayer.id)
    )
  );

  const legalMoves = useMemo(
    () => activePlayer ? getLegalMoves(game, activePlayer.id) : [],
    [game, activePlayer]
  );

  const legalMoveByKey = useMemo(() => {
    const map = new Map<string, LegalMove>();
    legalMoves.forEach((move) => map.set(`${move.to.row}:${move.to.col}`, move));
    return map;
  }, [legalMoves]);

  useEffect(() => () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  function playMove(row: number, col: number) {
    if (!canAct || !activePlayer || wallDrag) return;

    const move = legalMoveByKey.get(`${row}:${col}`);
    if (!move) return;

    void onAction({
      type: 'MOVE_PAWN',
      playerId: activePlayer.id,
      to: { row, col }
    });
  }

  function placeWall(row: number, col: number, orientation: WallOrientation) {
    if (!canAct || !activePlayer) return;

    const wall = {
      row,
      col,
      orientation,
      ownerId: activePlayer.id
    };

    const validation = validateWallPlacement(game, activePlayer.id, wall);
    if (!validation.valid) return;

    void onAction({
      type: 'PLACE_WALL',
      playerId: activePlayer.id,
      wall
    });
  }

  function slotAtPoint(
    x: number,
    y: number,
    orientation: WallOrientation
  ): Omit<WallPreview, 'valid'> | null {
    const element = document.elementFromPoint(x, y) as HTMLElement | null;
    const slot = element?.closest<HTMLElement>('[data-wall-slot="true"]');

    if (!slot || slot.dataset.orientation !== orientation) return null;

    const row = Number(slot.dataset.row);
    const col = Number(slot.dataset.col);

    if (!Number.isInteger(row) || !Number.isInteger(col)) return null;

    return { row, col, orientation };
  }

  function evaluatePreview(
    x: number,
    y: number,
    orientation: WallOrientation
  ): WallPreview | null {
    if (!activePlayer) return null;

    const slot = slotAtPoint(x, y, orientation);
    if (!slot) return null;

    const wall = {
      ...slot,
      ownerId: activePlayer.id
    };

    return {
      ...slot,
      valid: validateWallPlacement(game, activePlayer.id, wall).valid
    };
  }

  function updateGhost(x: number, y: number) {
    const ghost = ghostRef.current;
    if (!ghost) return;
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y}px`;
  }

  function schedulePointerFrame(
    x: number,
    y: number,
    orientation: WallOrientation
  ) {
    pendingPointRef.current = { x, y };
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const point = pendingPointRef.current;
      if (!point) return;

      updateGhost(point.x, point.y);
      const next = evaluatePreview(point.x, point.y, orientation);

      setWallPreview((current) => (
        samePreview(current, next) ? current : next
      ));
    });
  }

  function beginWallDrag(
    orientation: WallOrientation,
    event: ReactPointerEvent<HTMLButtonElement>
  ) {
    if (!canAct || !activePlayer || activePlayer.wallsRemaining <= 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    setWallDrag({
      orientation,
      pointerId: event.pointerId
    });
    setWallPreview(null);

    requestAnimationFrame(() => {
      updateGhost(event.clientX, event.clientY);
    });
  }

  function moveWallDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!wallDrag || event.pointerId !== wallDrag.pointerId) return;

    event.preventDefault();
    schedulePointerFrame(
      event.clientX,
      event.clientY,
      wallDrag.orientation
    );
  }

  function finishWallDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!wallDrag || event.pointerId !== wallDrag.pointerId) return;

    event.preventDefault();

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const latest = evaluatePreview(
      event.clientX,
      event.clientY,
      wallDrag.orientation
    ) ?? wallPreview;

    if (latest?.valid) {
      placeWall(latest.row, latest.col, latest.orientation);
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture can already be gone on a few mobile browsers.
    }

    pendingPointRef.current = null;
    setWallDrag(null);
    setWallPreview(null);
  }

  function cancelWallDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!wallDrag || event.pointerId !== wallDrag.pointerId) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    pendingPointRef.current = null;
    setWallDrag(null);
    setWallPreview(null);
  }

  const currentWalls = activePlayer?.wallsRemaining ?? 0;

  return (
    <section className={`board-section ${wallDrag ? 'wall-dragging' : ''}`}>
      <div className="board-toolbar glass-panel wall-dock">
        <div className="movement-status">
          <span className="movement-status-dot" />
          <div>
            <strong>Movimiento activo</strong>
            <small>Toca cualquiera de las casillas marcadas.</small>
          </div>
        </div>

        <div className="wall-dock-pieces" aria-label="Paredes disponibles">
          <span className="walls-counter">{currentWalls} paredes</span>

          <button
            type="button"
            className="wall-piece wall-piece-horizontal"
            disabled={!canAct || currentWalls <= 0}
            onPointerDown={(event) => beginWallDrag('horizontal', event)}
            onPointerMove={moveWallDrag}
            onPointerUp={finishWallDrag}
            onPointerCancel={cancelWallDrag}
            aria-label="Arrastrar pared horizontal"
          >
            <span className="wall-piece-shape" />
            <small>Arrastra</small>
          </button>

          <button
            type="button"
            className="wall-piece wall-piece-vertical"
            disabled={!canAct || currentWalls <= 0}
            onPointerDown={(event) => beginWallDrag('vertical', event)}
            onPointerMove={moveWallDrag}
            onPointerUp={finishWallDrag}
            onPointerCancel={cancelWallDrag}
            aria-label="Arrastrar pared vertical"
          >
            <span className="wall-piece-shape" />
            <small>Arrastra</small>
          </button>
        </div>
      </div>

      <div className="board-wrap">
        <div className="board" aria-label="Tablero 11 por 11">
          {Array.from({ length: 11 }).flatMap((_, row) =>
            Array.from({ length: 11 }).map((__, col) => {
              const key = `${row}:${col}`;
              const move = legalMoveByKey.get(key);
              const isCenter = row === CENTER.row && col === CENTER.col;
              const duelGoal = game.mode === 'duel' && (row === 0 || row === 10);

              return (
                <button
                  key={`cell-${key}`}
                  className={`cell ${isCenter ? 'center-cell' : ''} ${duelGoal ? 'duel-goal-cell' : ''} ${move && canAct ? 'legal-cell' : ''}`}
                  style={{
                    gridRow: cellGridIndex(row),
                    gridColumn: cellGridIndex(col)
                  }}
                  onClick={() => playMove(row, col)}
                  disabled={!move || !canAct}
                  aria-label={`Casilla ${row + 1}, ${col + 1}${move ? `, movimiento ${move.kind}` : ''}`}
                >
                  {isCenter && game.mode !== 'duel' && (
                    <span className="center-mark">✦</span>
                  )}
                  {move && canAct && (
                    <span className={`move-marker move-${move.kind}`} />
                  )}
                </button>
              );
            })
          )}

          {game.walls.map((wall, index) => {
            const isHorizontal = wall.orientation === 'horizontal';
            const owner = game.players.find(
              (player) => player.id === wall.ownerId
            );

            return (
              <div
                key={`wall-${index}-${wall.row}-${wall.col}-${wall.orientation}`}
                className={`placed-wall ${isHorizontal ? 'horizontal' : 'vertical'} seat-${owner?.seat ?? 'north'}`}
                style={isHorizontal ? {
                  gridRow: wall.row * 2 + 2,
                  gridColumn: `${wall.col * 2 + 1} / span 3`
                } : {
                  gridColumn: wall.col * 2 + 2,
                  gridRow: `${wall.row * 2 + 1} / span 3`
                }}
              />
            );
          })}

          {wallDrag && canAct && Array.from({ length: 10 }).flatMap((_, row) =>
            Array.from({ length: 10 }).map((__, col) => {
              const isHorizontal = wallDrag.orientation === 'horizontal';
              const previewed =
                wallPreview?.row === row &&
                wallPreview.col === col &&
                wallPreview.orientation === wallDrag.orientation;

              return (
                <span
                  key={`slot-${row}-${col}-${wallDrag.orientation}`}
                  data-wall-slot="true"
                  data-row={row}
                  data-col={col}
                  data-orientation={wallDrag.orientation}
                  className={`wall-slot ${isHorizontal ? 'horizontal' : 'vertical'} ${previewed ? `previewed ${wallPreview?.valid ? 'valid' : 'invalid'}` : 'candidate-slot'}`}
                  style={isHorizontal ? {
                    gridRow: row * 2 + 2,
                    gridColumn: `${col * 2 + 1} / span 3`
                  } : {
                    gridColumn: col * 2 + 2,
                    gridRow: `${row * 2 + 1} / span 3`
                  }}
                />
              );
            })
          )}

          {game.players
            .filter((player) => !player.eliminated)
            .map((player) => (
              <div
                key={player.id}
                className={`pawn seat-${player.seat} ${player.id === game.turn.currentPlayerId ? 'active' : ''} ${!player.connected ? 'disconnected' : ''}`}
                style={{
                  gridRow: cellGridIndex(player.position.row),
                  gridColumn: cellGridIndex(player.position.col)
                }}
                title={player.name}
              >
                <span className="pawn-core" aria-hidden="true" />
                <AnchorMark seat={player.seat} />
              </div>
            ))}
        </div>
      </div>

      {wallDrag && (
        <div
          ref={ghostRef}
          className={`drag-wall-ghost ${wallDrag.orientation}`}
          aria-hidden="true"
        />
      )}
    </section>
  );
});
