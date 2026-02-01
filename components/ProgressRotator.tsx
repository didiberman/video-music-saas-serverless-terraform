"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
    "Analyzing script for visual cues...",
    "Compose cinematic shots...",
    "Synthesizing lifelike AI voiceover...",
    "Generating complex video frames...",
    "Applying lighting and textures...",
    "Reviewing scene consistency...",
    "Polishing final output...",
];

export function ProgressRotator({ messages = MESSAGES }: { messages?: string[] }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, 3000); // Rotate every 3 seconds

        return () => clearInterval(interval);
    }, [messages.length]);

    return (
        <div className="min-h-[3rem] flex items-center justify-center w-full px-4">
            <AnimatePresence mode="wait">
                <motion.p
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="text-sm font-light text-violet-200/70 tracking-wide text-center w-full"
                >
                    {messages[index]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
