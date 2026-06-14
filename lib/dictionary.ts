// Client-side dictionary: loaded once from /public/dictionary.txt (ENABLE word
// list, 3–16 letters) and cached as a Set for O(1) validation.
let cache: Set<string> | null = null;
let loading: Promise<Set<string>> | null = null;

export function loadDictionary(): Promise<Set<string>> {
  if (cache) return Promise.resolve(cache);
  if (loading) return loading;
  loading = fetch("/dictionary.txt")
    .then((r) => r.text())
    .then((text) => {
      const set = new Set<string>();
      for (const line of text.split("\n")) {
        const w = line.trim();
        if (w) set.add(w);
      }
      cache = set;
      return set;
    });
  return loading;
}

export function isWord(dict: Set<string>, word: string): boolean {
  return word.length >= 3 && dict.has(word.toLowerCase());
}
