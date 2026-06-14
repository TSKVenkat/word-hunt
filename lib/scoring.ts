// Length-based scoring tuned to feel like GamePigeon's Word Hunt: longer words
// are dramatically more valuable, so chasing one big word beats lots of 3s.
export function scoreWord(word: string): number {
  const n = word.length;
  if (n <= 2) return 0;
  switch (n) {
    case 3:
      return 100;
    case 4:
      return 400;
    case 5:
      return 800;
    case 6:
      return 1400;
    case 7:
      return 1800;
    default:
      // 8+: keep climbing so monster words feel huge.
      return 2200 + (n - 8) * 400;
  }
}

export function totalScore(words: Iterable<string>): number {
  let sum = 0;
  for (const w of words) sum += scoreWord(w);
  return sum;
}
