import { BOARD_SIZE, type Position, type Wall } from './types';

export const DIRECTIONS: Position[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 }
];

export function samePosition(a: Position, b: Position) {
  return a.row === b.row && a.col === b.col;
}

export function positionKey(position: Position) {
  return `${position.row}:${position.col}`;
}

export function addPosition(position: Position, delta: Position): Position {
  return { row: position.row + delta.row, col: position.col + delta.col };
}

export function inBounds(position: Position) {
  return (
    position.row >= 0 &&
    position.row < BOARD_SIZE &&
    position.col >= 0 &&
    position.col < BOARD_SIZE
  );
}

export function perpendicularDirections(direction: Position): Position[] {
  if (direction.row !== 0) {
    return [
      { row: 0, col: -1 },
      { row: 0, col: 1 }
    ];
  }

  return [
    { row: -1, col: 0 },
    { row: 1, col: 0 }
  ];
}

/**
 * Returns true when a placed wall blocks an orthogonally-adjacent move.
 * Horizontal wall H(r,c) blocks vertical movement between rows r/r+1
 * across columns c and c+1. Vertical is the mirrored rule.
 */
export function isBlockedByWall(from: Position, to: Position, walls: Wall[]) {
  const rowDelta = to.row - from.row;
  const colDelta = to.col - from.col;

  if (Math.abs(rowDelta) + Math.abs(colDelta) !== 1) return true;

  if (rowDelta !== 0) {
    const boundaryRow = Math.min(from.row, to.row);
    const col = from.col;
    return walls.some(
      (wall) =>
        wall.orientation === 'horizontal' &&
        wall.row === boundaryRow &&
        (wall.col === col || wall.col === col - 1)
    );
  }

  const boundaryCol = Math.min(from.col, to.col);
  const row = from.row;
  return walls.some(
    (wall) =>
      wall.orientation === 'vertical' &&
      wall.col === boundaryCol &&
      (wall.row === row || wall.row === row - 1)
  );
}
