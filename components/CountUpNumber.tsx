"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpNumberProps {
  value: number | string;
  durationMs?: number;
  suffix?: string;
}

export default function CountUpNumber({
  value,
  durationMs = 2000,
  suffix,
}: CountUpNumberProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);

  // Extract numeric part and optional trailing symbol (e.g., "850+" -> target 850, parsedSuffix "+")
  const rawStr = String(value ?? "0").trim();
  const numericMatch = rawStr.match(/\d+/);
  const targetNumber = numericMatch ? parseInt(numericMatch[0], 10) : 0;
  const parsedSuffix =
    suffix !== undefined
      ? suffix
      : rawStr.includes("+")
      ? "+"
      : "";

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") {
      setHasEntered(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasEntered(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!hasEntered) return;

    if (targetNumber <= 0) {
      setDisplayValue(0);
      return;
    }

    let animationFrameId = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // easeOutQuart for a natural fast-start, gentle-finish count-up
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(eased * targetNumber);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetNumber);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hasEntered, targetNumber, durationMs]);

  return (
    <span ref={ref} className="inline-flex items-baseline gap-0.5 tabular-nums">
      <span>{displayValue.toLocaleString("tr-TR")}</span>
      {parsedSuffix && (
        <span className="font-headline-sm text-headline-sm font-bold">
          {parsedSuffix}
        </span>
      )}
    </span>
  );
}
