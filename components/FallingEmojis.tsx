"use client";

import { useEffect, useState } from "react";

const EMOJIS = ["✨", "🎬", "🎥", "🌟", "💫", "🎨", "🔮", "🪄", "⭐", "🎭", "🎪", "🌈"];

interface Emoji {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

export function FallingEmojis() {
  const [emojis, setEmojis] = useState<Emoji[]>([]);

  useEffect(() => {
    // Generate initial emojis
    const initial: Emoji[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 6,
      size: 16 + Math.random() * 16,
    }));
    setEmojis(initial);

    // Add new emojis periodically
    const interval = setInterval(() => {
      setEmojis(prev => {
        const newEmoji: Emoji = {
          id: Date.now(),
          emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
          left: Math.random() * 100,
          delay: 0,
          duration: 8 + Math.random() * 6,
          size: 16 + Math.random() * 16,
        };
        // Keep max 20 emojis
        const updated = [...prev, newEmoji];
        if (updated.length > 20) updated.shift();
        return updated;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {emojis.map((e) => (
        <div
          key={e.id}
          className="absolute animate-fall opacity-60"
          style={{
            left: `${e.left}%`,
            fontSize: `${e.size}px`,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
          }}
        >
          {e.emoji}
        </div>
      ))}
    </div>
  );
}
