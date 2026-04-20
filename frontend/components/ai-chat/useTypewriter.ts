'use client';

import { useEffect, useState } from 'react';

type TypewriterOptions = {
  text: string;
  speed?: number;
  batchSize?: number;
  enabled?: boolean;
};

export function useTypewriter({
  text,
  speed = 18,
  batchSize = 1,
  enabled = true,
}: TypewriterOptions) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let frameId = 0;
    let lastTimestamp = 0;
    let accumulatedTime = 0;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      accumulatedTime += timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (accumulatedTime >= speed) {
        accumulatedTime = 0;
        setDisplayedText((current) => {
          if (!text.startsWith(current)) {
            return text.slice(0, batchSize);
          }

          if (current.length >= text.length) {
            return current;
          }

          return text.slice(0, current.length + batchSize);
        });
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [batchSize, enabled, speed, text]);

  return displayedText;
}
