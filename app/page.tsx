"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Board from "@/components/Board";
import { Tile, generateGrid, pathToWord, puzzleNumber } from "@/lib/grid";
import { loadDictionary } from "@/lib/dictionary";
import { scoreWord } from "@/lib/scoring";
import { solveBoard } from "@/lib/solver";
import { getBest, setBest as persistBest } from "@/lib/storage";

const GAME_SECONDS = 80;

const COLOR = {
  neutral: "#2038ec", // Mario blue — valid path, not yet a word
  valid: "#00a800", // pipe green — valid new word
  dup: "#fbd000", // coin gold — already found
  bad: "#d82800", // fireball red — committed an invalid word
};

type Phase = "idle" | "playing" | "over";

interface Toast {
  text: string;
  color: string;
  id: number;
}

// A fresh seed for every game so no two boards are the same.
function randomSeed(): string {
  return "g" + Math.floor(Math.random() * 4294967296) + "-" + Date.now();
}

export default function Page() {
  const puzzleNo = useMemo(() => puzzleNumber(), []);
  // A deterministic seed for the very first render so SSR and hydration match;
  // we swap in a random board on mount and on every new game.
  const [tiles, setTiles] = useState<Tile[]>(() => generateGrid("welcome"));

  const [dict, setDict] = useState<Set<string> | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [found, setFound] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [path, setPath] = useState<number[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [allWords, setAllWords] = useState<string[] | null>(null);
  const [best, setBest] = useState(0);
  const [isRecord, setIsRecord] = useState(false);

  const foundSet = useMemo(() => new Set(found), [found]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load dictionary + best score, and shuffle in a real random board on mount.
  useEffect(() => {
    loadDictionary().then(setDict);
  }, []);
  useEffect(() => setBest(getBest()), []);
  useEffect(() => setTiles(generateGrid(randomSeed())), []);

  // Current word + live validity (drives trail color + header).
  const currentWord = useMemo(() => pathToWord(path, tiles), [path, tiles]);
  const liveStatus = useMemo<keyof typeof COLOR>(() => {
    if (currentWord.length < 3 || !dict) return "neutral";
    const w = currentWord.toLowerCase();
    if (foundSet.has(w)) return "dup";
    if (dict.has(w)) return "valid";
    return "neutral";
  }, [currentWord, dict, foundSet]);

  const showToast = useCallback((text: string, color: string) => {
    setToast({ text, color, id: Date.now() + Math.random() });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 850);
  }, []);

  const commit = useCallback(
    (committed: number[]) => {
      if (phase !== "playing" || !dict) return;
      const word = pathToWord(committed, tiles).toLowerCase();
      if (word.length < 3) return;
      if (foundSet.has(word)) {
        showToast(`Already found`, COLOR.dup);
        return;
      }
      if (!dict.has(word)) {
        showToast(`Not a word`, COLOR.bad);
        return;
      }
      const pts = scoreWord(word);
      setFound((f) => [word, ...f]);
      setScore((s) => s + pts);
      showToast(`${word.toUpperCase()} +${pts}`, COLOR.valid);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(18);
      }
    },
    [phase, dict, tiles, foundSet, showToast]
  );

  // Timer.
  useEffect(() => {
    if (phase !== "playing") return;
    tickTimer.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (tickTimer.current) clearInterval(tickTimer.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
  }, [phase]);

  // Transition to results when time runs out.
  useEffect(() => {
    if (phase === "playing" && timeLeft === 0) {
      setPhase("over");
    }
  }, [phase, timeLeft]);

  // On game over: record a new personal best + solve this board (to show misses).
  useEffect(() => {
    if (phase !== "over") return;
    const record = score > 0 && score > best;
    setIsRecord(record);
    if (record) {
      setBest(score);
      persistBest(score);
    }
    if (dict && allWords === null) {
      // Defer so the results screen paints before the (fast) solve runs.
      const id = setTimeout(() => setAllWords(solveBoard(tiles, dict)), 30);
      return () => clearTimeout(id);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    if (!dict) return;
    setTiles(generateGrid(randomSeed())); // brand-new board every game
    setAllWords(null);
    setFound([]);
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setPhase("playing");
  }, [dict]);

  if (phase === "over") {
    return (
      <ResultScreen
        puzzleNo={puzzleNo}
        score={score}
        isNewBest={isRecord}
        found={found}
        allWords={allWords}
        onPlayAgain={start}
      />
    );
  }

  return (
    <main className="screen">
      {phase === "idle" ? (
        <StartScreen puzzleNo={puzzleNo} tiles={tiles} ready={!!dict} onStart={start} />
      ) : (
        <>
          <Hud
            score={score}
            timeLeft={timeLeft}
            word={currentWord}
            status={liveStatus}
          />
          <div className="boardWrap">
            <Board
              tiles={tiles}
              trailColor={COLOR[liveStatus]}
              onPathChange={setPath}
              onCommit={commit}
            />
            {toast && (
              <div
                key={toast.id}
                className="toast"
                style={{ color: toast.color }}
              >
                {toast.text}
              </div>
            )}
          </div>
          {found.length === 0 ? (
            <p className="hint">👆 SWIPE ACROSS LETTERS TO SPELL</p>
          ) : (
            <FoundStrip found={found} />
          )}
        </>
      )}
    </main>
  );
}

/* ------------------------------ sub-screens ------------------------------ */

function MiniGrid({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="miniGrid">
      {tiles.map((t) => (
        <div key={t.index} className="miniCell">
          {t.letter}
        </div>
      ))}
    </div>
  );
}

function StartScreen({
  puzzleNo,
  tiles,
  ready,
  onStart,
}: {
  puzzleNo: number;
  tiles: Tile[];
  ready: boolean;
  onStart: () => void;
}) {
  return (
    <div className="start">
      <h1 className="logo">
        WORD<span>HUNT</span>
      </h1>
      <p className="tagline">WORLD {puzzleNo}</p>
      <MiniGrid tiles={tiles} />
      <ul className="rules">
        <li>SWIPE TO LINK ADJACENT LETTERS</li>
        <li>LONGER WORDS = MORE COINS</li>
        <li>
          <b>{GAME_SECONDS}s</b> ON THE CLOCK
        </li>
      </ul>
      <button className="cta" onClick={onStart} disabled={!ready}>
        {ready ? "PRESS START" : "LOADING…"}
      </button>
    </div>
  );
}

function Hud({
  score,
  timeLeft,
  word,
  status,
}: {
  score: number;
  timeLeft: number;
  word: string;
  status: keyof typeof COLOR;
}) {
  const pct = (timeLeft / GAME_SECONDS) * 100;
  const low = timeLeft <= 10;
  return (
    <div className="hud">
      <div className="hudRow">
        <div className="score">{score.toLocaleString()}</div>
        <div className={"clock" + (low ? " low" : "")}>{timeLeft}s</div>
      </div>
      <div className="timerBar">
        <div
          className={"timerFill" + (low ? " low" : "")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="currentWord" style={{ color: COLOR[status] }}>
        {word || " "}
      </div>
    </div>
  );
}

function FoundStrip({ found }: { found: string[] }) {
  return (
    <div className="foundStrip">
      <div className="foundCount">{found.length} words</div>
      <div className="chips">
        {found.map((w) => (
          <span key={w} className="chip">
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResultScreen({
  puzzleNo,
  score,
  isNewBest,
  found,
  allWords,
  onPlayAgain,
}: {
  puzzleNo: number;
  score: number;
  isNewBest: boolean;
  found: string[];
  allWords: string[] | null;
  onPlayAgain: () => void;
}) {
  const [shareMsg, setShareMsg] = useState("");

  const longest = useMemo(
    () => found.reduce((a, b) => (b.length > a.length ? b : a), ""),
    [found]
  );
  const bestPossible = useMemo(
    () => (allWords ? allWords.reduce((s, w) => s + scoreWord(w), 0) : 0),
    [allWords]
  );
  const missed = useMemo(() => {
    if (!allWords) return [] as string[];
    const got = new Set(found);
    return allWords
      .filter((w) => !got.has(w))
      .sort((a, b) => b.length - a.length);
  }, [allWords, found]);

  const share = useCallback(async () => {
    const url =
      typeof window !== "undefined" ? window.location.origin : "wordhunt";
    const text = `Word Hunt #${puzzleNo}\n🏆 ${score.toLocaleString()} · ${
      found.length
    } words${
      longest ? ` · longest ${longest.toUpperCase()}` : ""
    }\nCan you beat it? 👉 ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      /* fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareMsg("Copied!");
      setTimeout(() => setShareMsg(""), 1500);
    } catch {
      setShareMsg("Copy failed");
    }
  }, [puzzleNo, score, found.length, longest]);

  const pctOfBest = bestPossible
    ? Math.round((score / bestPossible) * 100)
    : null;

  return (
    <main className="screen result">
      <h2 className="resultTitle">TIME UP!</h2>
      <p className="tagline">WORLD {puzzleNo}</p>

      {isNewBest && <div className="newBest">★ NEW BEST ★</div>}
      <div className="bigScore">{score.toLocaleString()}</div>
      <div className="statsRow">
        <div>
          <b>{found.length}</b>
          <span>words</span>
        </div>
        <div>
          <b>{longest ? longest.toUpperCase() : "—"}</b>
          <span>longest</span>
        </div>
        <div>
          <b>{pctOfBest !== null ? `${pctOfBest}%` : "…"}</b>
          <span>of best</span>
        </div>
      </div>

      <div className="actions">
        <button className="cta" onClick={onPlayAgain}>
          PLAY AGAIN
        </button>
        <button className="cta ghost" onClick={share}>
          SHARE SCORE
        </button>
        {shareMsg && <span className="shareMsg">{shareMsg}</span>}
      </div>

      <section className="panel">
        <h3>
          {allWords
            ? `YOU FOUND ${found.length} OF ${allWords.length}`
            : "FINDING EVERY WORD…"}
        </h3>
        {allWords && (
          <div className="chips muted">
            {missed.slice(0, 60).map((w) => (
              <span key={w} className="chip">
                {w}
              </span>
            ))}
            {missed.length > 60 && (
              <span className="chip more">+{missed.length - 60} more</span>
            )}
          </div>
        )}
      </section>

      <p className="fineprint">PLAY AGAIN TO BEAT YOUR BEST</p>
    </main>
  );
}
