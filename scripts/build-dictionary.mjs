// Regenerate public/dictionary.txt from the ENABLE word list.
// Usage:  node scripts/build-dictionary.mjs
import { writeFileSync } from "node:fs";

const SRC =
  "https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt";

const res = await fetch(SRC);
if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
const text = await res.text();

const words = text
  .split("\n")
  .map((w) => w.trim().toLowerCase())
  .filter((w) => /^[a-z]+$/.test(w) && w.length >= 3 && w.length <= 16);

writeFileSync("public/dictionary.txt", words.join("\n") + "\n");
console.log(`wrote public/dictionary.txt (${words.length} words)`);
