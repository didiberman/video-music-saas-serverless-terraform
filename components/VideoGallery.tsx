"use client";

import { useEffect, useState } from "react";
import { PlayCircle, Loader2, AlertCircle, Music, Play, Pause } from "lucide-react";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

interface Generation {
    id: string;
    original_prompt: string;
    prompt?: string;
    status: "waiting" | "success" | "fail";
    video_url?: string;
    audio_url?: string;
    image_url?: string;
    fail_message?: string;
    created_at: Timestamp | Date | null;
}

interface VideoGalleryProps {
    userId: string;
}

export function VideoGallery({ userId }: VideoGalleryProps) {
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [playingId, setPlayingId] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const db = getFirebaseFirestore();
        if (!db) return;

        const q = query(
            collection(db, "generations"),
            where("user_id", "==", userId),
            orderBy("created_at", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Generation[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Generation[];
            setGenerations(items);
        }, (error) => {
            console.error("Firestore listener error:", error);
        });

        return () => unsubscribe();
    }, [userId]);

    const formatDate = (timestamp: Timestamp | Date | null) => {
        if (!timestamp) return "";
        let date: Date;
        if (timestamp instanceof Timestamp) {
            date = timestamp.toDate();
        } else {
            date = timestamp;
        }

        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    // Helper state for playing audio
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

    const toggleAudio = (id: string) => {
        const audio = document.getElementById(`user-audio-${id}`) as HTMLAudioElement;
        if (playingAudioId === id) {
            audio?.pause();
            setPlayingAudioId(null);
        } else {
            // Pause others
            if (playingAudioId) {
                const prev = document.getElementById(`user-audio-${playingAudioId}`) as HTMLAudioElement;
                prev?.pause();
            }
            audio?.play();
            setPlayingAudioId(id);
        }
    };

    if (generations.length === 0) return null;

    return (
        <div className="w-full max-w-4xl mt-12 mb-20">
            {/* Note: I removed hidden md:block to make it visible on mobile too if desired, 
                 or keep it if strictly intended for desktop. 
                 User complaint wasn't determining visibility, just content. 
                 I'll keep it visible on mobile now since we fixed PublicGallery. 
             */}
            <div className="flex items-center gap-4 mb-6 px-4 md:px-0">
                <div className="h-px bg-white/10 flex-1" />
                <h3 className="text-white/40 text-sm font-medium uppercase tracking-widest">Your Collection</h3>
                <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0">
                <AnimatePresence>
                    {generations.map((gen) => (
                        <motion.div
                            key={gen.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="group relative rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-violet-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10"
                        >
                            {/* Success State */}
                            {gen.status === "success" ? (
                                <>
                                    {gen.video_url ? (
                                        // VIDEO ITEM
                                        <div
                                            className="relative aspect-[9/16] bg-black cursor-pointer"
                                            onClick={() => setPlayingId(playingId === gen.id ? null : gen.id)}
                                        >
                                            {playingId === gen.id ? (
                                                <video
                                                    src={gen.video_url}
                                                    controls
                                                    autoPlay
                                                    playsInline
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full relative">
                                                    <video
                                                        src={gen.video_url}
                                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                                                        muted
                                                        playsInline
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <PlayCircle className="w-6 h-6 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : gen.audio_url ? (
                                        // MUSIC ITEM
                                        <div
                                            className="relative aspect-[9/16] bg-black/40 cursor-pointer border-b border-white/5"
                                            style={{
                                                backgroundImage: gen.image_url
                                                    ? `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url(${gen.image_url})`
                                                    : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                            onClick={() => toggleAudio(gen.id)}
                                        >
                                            <audio
                                                id={`user-audio-${gen.id}`}
                                                src={gen.audio_url}
                                                preload="none"
                                                onEnded={() => setPlayingAudioId(null)}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className={`w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-transform ${playingAudioId === gen.id ? "scale-110" : "group-hover:scale-110"}`}>
                                                    {playingAudioId === gen.id ? (
                                                        <Pause className="w-6 h-6 text-white" />
                                                    ) : (
                                                        <Play className="w-6 h-6 text-white ml-1" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm border border-white/5 flex items-center gap-1.5">
                                                <Music className="w-3 h-3 text-emerald-400" />
                                                <span className="text-[10px] uppercase tracking-wider font-medium text-emerald-100">Song</span>
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* Info Area */}
                                    <div className="p-4 relative bg-white/5 backdrop-blur-md border-t border-white/5">
                                        <p className="text-sm text-white/80 line-clamp-2 font-light leading-relaxed">
                                            {gen.original_prompt || gen.prompt || "No prompt"}
                                        </p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-xs text-white/30 font-mono">
                                                {formatDate(gen.created_at)}
                                            </span>
                                            <span className={`text-[10px] px-2 py-1 rounded-full border ${gen.video_url ? 'border-violet-500/20 bg-violet-500/10 text-violet-300' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}`}>
                                                {gen.video_url ? 'VIDEO' : 'MUSIC'}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : gen.status === "waiting" ? (
                                <div className="aspect-[9/16] flex flex-col items-center justify-center gap-4 bg-white/5 animate-pulse">
                                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                                    <span className="text-xs text-white/40 font-medium tracking-wider">CREATING...</span>
                                </div>
                            ) : (
                                <div className="aspect-[9/16] flex flex-col items-center justify-center gap-4 bg-red-500/5 p-6 text-center">
                                    <AlertCircle className="w-8 h-8 text-red-400/50" />
                                    <span className="text-xs text-red-300/50 font-medium">GENERATION FAILED</span>
                                    {gen.fail_message && (
                                        <p className="text-[10px] text-red-200/30 line-clamp-3">
                                            {gen.fail_message}
                                        </p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
