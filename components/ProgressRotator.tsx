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

export function ProgressRotator() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % MESSAGES.length);
        }, 3000); // Rotate every 3 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-6 flex items-center justify-center overflow-hidden relative">
            <AnimatePresence mode="wait">
                <motion.p
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="text-sm font-light text-violet-200/70 tracking-wide text-center absolute w-full"
                >
                    {MESSAGES[index]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
