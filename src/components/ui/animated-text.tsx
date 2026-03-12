"use client";

import { animate } from "framer-motion";
import { useEffect, useState } from "react";

export function useAnimatedText(text: string, delimiter: string = "", speed: number = 120) {
  const [cursor, setCursor] = useState(0);
  const [startingCursor, setStartingCursor] = useState(0);
  const [prevText, setPrevText] = useState(text);

  if (prevText !== text) {
    setPrevText(text);
    setStartingCursor(text.startsWith(prevText) ? cursor : 0);
  }

  useEffect(() => {
    const parts = text.split(delimiter);
    const newParts = parts.length - startingCursor;
    // Dynamic duration based on how many new parts need to animate
    const duration = Math.max(0.15, newParts / speed);

    const controls = animate(startingCursor, parts.length, {
      duration,
      ease: "linear",
      onUpdate(latest) {
        setCursor(Math.floor(latest));
      },
    });

    return () => controls.stop();
  }, [startingCursor, text, delimiter, speed]);

  return text.split(delimiter).slice(0, cursor).join(delimiter);
}
