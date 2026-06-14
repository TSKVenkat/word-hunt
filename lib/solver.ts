import { GRID_SIZE, Tile } from "./grid";

// Find every valid word on the board. Strategy: first cheaply reject dictionary
// words that can't be built from the board's available letters (multiset
// filter), then trace each survivor along adjacency. This is far faster than a
// full trie DFS and runs in well under a second for a 4x4 board.

function buildAdjacency(tiles: Tile[]): number[][] {
  const adj: number[][] = tiles.map(() => []);
  for (let i = 0; i < tiles.length; i++) {
    for (let j = 0; j < tiles.length; j++) {
      if (i === j) continue;
      const dr = Math.abs(tiles[i].row - tiles[j].row);
      const dc = Math.abs(tiles[i].col - tiles[j].col);
      if (dr <= 1 && dc <= 1) adj[i].push(j);
    }
  }
  return adj;
}

// Can `word` (lowercase) be traced starting at tile `start`, given letters
// already used (bitmask)? Tiles may carry 2 chars ("qu").
function trace(
  word: string,
  pos: number,
  tile: number,
  used: number,
  tiles: Tile[],
  adj: number[][]
): boolean {
  const letter = tiles[tile].letter.toLowerCase();
  if (word.startsWith(letter, pos) === false) return false;
  const next = pos + letter.length;
  if (next === word.length) return true;
  const nowUsed = used | (1 << tile);
  for (const nb of adj[tile]) {
    if (nowUsed & (1 << nb)) continue;
    if (trace(word, next, nb, nowUsed, tiles, adj)) return true;
  }
  return false;
}

export function solveBoard(tiles: Tile[], dict: Set<string>): string[] {
  const adj = buildAdjacency(tiles);

  // Available-letter multiset from the board (qu contributes q + u).
  const counts: Record<string, number> = {};
  for (const t of tiles) {
    for (const ch of t.letter.toLowerCase()) {
      counts[ch] = (counts[ch] || 0) + 1;
    }
  }
  const maxLen = GRID_SIZE * GRID_SIZE + 1; // qu can push effective length past 16

  const found: string[] = [];
  outer: for (const word of dict) {
    if (word.length < 3 || word.length > maxLen) continue;
    // Multiset feasibility check.
    const need: Record<string, number> = {};
    for (const ch of word) {
      need[ch] = (need[ch] || 0) + 1;
      if (need[ch] > (counts[ch] || 0)) continue outer;
    }
    // Try to trace it from any tile.
    for (let i = 0; i < tiles.length; i++) {
      if (trace(word, 0, i, 0, tiles, adj)) {
        found.push(word);
        break;
      }
    }
  }
  return found;
}
