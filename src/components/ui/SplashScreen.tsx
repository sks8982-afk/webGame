"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "td-splash-seen";
const DISPLAY_DURATION = 2500; // 2.5s
const FADE_IN_DURATION = 600;
const FADE_OUT_DURATION = 700;

interface Props {
  readonly onFinished: () => void;
}

export default function SplashScreen({ onFinished }: Props) {
  // phase: "fadein" -> "visible" -> "fadeout" -> "done"
  const [phase, setPhase] = useState<"fadein" | "visible" | "fadeout" | "done">("fadein");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("visible"), 50);
    const t2 = setTimeout(() => setPhase("fadeout"), DISPLAY_DURATION);
    const t3 = setTimeout(() => {
      setPhase("done");
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
      onFinished();
    }, DISPLAY_DURATION + FADE_OUT_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinished]);

  const skip = () => {
    setPhase("done");
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
    onFinished();
  };

  if (phase === "done") return null;

  const opacity = phase === "fadein" ? 0 : phase === "visible" ? 1 : 0;
  const scale = phase === "fadein" ? 0.92 : phase === "visible" ? 1 : 1.05;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black cursor-pointer"
      onClick={skip}
      style={{
        opacity: phase === "fadein" ? 0.3 : 1,
        transition: `opacity ${FADE_IN_DURATION}ms ease-out`,
      }}
    >
      <div
        className="relative"
        style={{
          opacity,
          transform: `scale(${scale})`,
          transition: phase === "fadein"
            ? `opacity ${FADE_IN_DURATION}ms ease-out, transform ${FADE_IN_DURATION}ms ease-out`
            : `opacity ${FADE_OUT_DURATION}ms ease-in, transform ${FADE_OUT_DURATION}ms ease-in`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/intro.png"
          alt="타워의 반격"
          className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl"
          style={{ filter: "drop-shadow(0 0 40px rgba(255, 200, 0, 0.3))" }}
        />
      </div>

      {phase === "visible" && (
        <div className="absolute bottom-10 text-gray-500 text-sm animate-pulse">
          클릭하여 넘기기
        </div>
      )}
    </div>
  );
}

export function hasSeenSplash(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}
