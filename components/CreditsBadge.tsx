"use client";

import { useEffect, useState } from "react";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import { doc, onSnapshot } from "firebase/firestore";
import { Plus } from "lucide-react";
import { CreditsModal } from "@/components/CreditsModal";

interface CreditsBadgeProps {
    userId: string;
}

export function CreditsBadge({ userId }: CreditsBadgeProps) {
    const [credits, setCredits] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!userId) return;
        const db = getFirebaseFirestore();
        if (!db) return;

        const unsub = onSnapshot(doc(db, "credits", userId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Fallback to legacy field logic if needed, but we standardized on 'seconds_remaining' as unit
                setCredits(data.seconds_remaining || 0);
            } else {
                setCredits(0);
            }
        });

        return () => unsub();
    }, [userId]);

    if (credits === null) return null; // Loading state (invisible)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition-all cursor-pointer"
                title="Your Vibe Credits"
            >
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                <span className="text-sm font-medium text-white/90 font-mono tracking-tight">
                    {credits} <span className="text-white/40 text-xs">CR</span>
                </span>
                <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center ml-1 group-hover:scale-110 transition-transform">
                    <Plus className="w-3 h-3" />
                </div>
            </button>

            <CreditsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userId={userId}
            />
        </>
    );
}
