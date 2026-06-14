import { hashSeed, mulberry32, shuffle } from "./random";

export const GRID_SIZE = 4;

// Classic 16-die Boggle set (modern distribution). The "Qu" die keeps the game
// authentic — Q almost never appears alone in English words.
const BOGGLE_DICE = [
  "AAEEGN",
  "ABBJOO",
  "ACHOPS",
  "AFFKPS",
  "AOOTTW",
  "CIMOTU",
  "DEILRX",
  "DELRVY",
  "DISTTY",
  "EEGHNW",
  "EEINSU",
  "EHRTVW",
  "EIOSST",
  "ELRTTY",
  "HIMNQU",
  "HLNNRZ",
];

export interface Tile {
  // What is shown / used for words. "QU" counts as two letters.
  letter: string;
  // 0..15 position in row-major order.
  index: number;
  row: number;
  col: number;
}

// The UTC calendar day key, e.g. "2026-06-15". Using UTC guarantees the board
// is literally identical for every player worldwide on a given day.
export function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

// Pretty, human label for the daily puzzle number (days since launch).
const EPOCH = Date.UTC(2026, 0, 1); // 2026-01-01
export function puzzleNumber(date: Date = new Date()): number {
  const today = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  return Math.floor((today - EPOCH) / 86400000) + 1;
}

// Build the deterministic daily board.
export function generateGrid(key: string): Tile[] {
  const rng = mulberry32(hashSeed("word-hunt::" + key));
  const dice = shuffle([...BOGGLE_DICE], rng);
  const tiles: Tile[] = [];
  for (let i = 0; i < dice.length; i++) {
    const face = dice[i][Math.floor(rng() * 6)];
    const letter = face === "Q" ? "QU" : face;
    tiles.push({
      letter,
      index: i,
      row: Math.floor(i / GRID_SIZE),
      col: i % GRID_SIZE,
    });
  }
  return tiles;
}

// Two cells are connectable when they are orthogonally OR diagonally adjacent.
export function areAdjacent(a: Tile, b: Tile): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
}

// The string formed by a selection path (indices into the tile array).
export function pathToWord(path: number[], tiles: Tile[]): string {
  return path.map((i) => tiles[i].letter).join("");
}
