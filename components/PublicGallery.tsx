"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Music, Video } from "lucide-react";

interface GalleryItem {
    id: string;
    type: "video" | "music";
    prompt: string;
    videoUrl: string | null;
    audioUrl: string | null;
    imageUrl: string | null;
    createdAt: string | null;
}

export function PublicGallery() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);
    const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        fetch("/api/gallery")
            .then((res) => res.json())
            .then((data) => {
                setItems(data.items || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleAudio = (id: string, audioUrl: string) => {
        const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
        if (playingAudio === id) {
            audio?.pause();
            setPlayingAudio(null);
        } else {
            // Pause any currently playing audio
            if (playingAudio) {
                const prev = document.getElementById(`audio-${playingAudio}`) as HTMLAudioElement;
                prev?.pause();
            }
            audio?.play();
            setPlayingAudio(id);
        }
    };

    const displayedItems = isMobile ? items.slice(0, 10) : items.slice(0, 15);

    if (loading) {
        return (
            <div className="w-full py-8">
                <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-hide">
                    {[...Array(isMobile ? 3 : 5)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-shrink-0 w-48 h-72 rounded-xl bg-white/5 animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (items.length === 0) return null;

    return (
        <section className="w-full py-6 mb-6">
            <div className="flex items-center gap-2 px-4 mb-4">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center">
                    <span className="text-xs">✨</span>
                </div>
                <h2 className="text-sm font-medium text-white/60">Community Creations</h2>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 px-4 snap-x snap-mandatory scrollbar-hide">
                {displayedItems.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex-shrink-0 snap-start"
                    >
                        {item.type === "video" && item.videoUrl ? (
                            <div
                                className="relative w-48 h-72 rounded-xl overflow-hidden bg-black/50 border border-white/10 group cursor-pointer"
                                onMouseEnter={() => !isMobile && setHoveredVideo(item.id)}
                                onMouseLeave={() => !isMobile && setHoveredVideo(null)}
                            >
                                <video
                                    src={item.videoUrl}
                                    className="w-full h-full object-cover"
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata" // Optimize loading
                                    poster={item.imageUrl || undefined} // Use thumbnail if available
                                    ref={(el) => {
                                        if (el && !isMobile) {
                                            if (hoveredVideo === item.id) {
                                                el.play().catch(() => { });
                                            } else {
                                                el.pause();
                                                el.currentTime = 0;
                                            }
                                        }
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-xs text-white/80 line-clamp-2">{item.prompt}</p>
                                </div>
                                <div className="absolute top-2 left-2">
                                    <Video className="w-4 h-4 text-white/50" />
                                </div>
                            </div>
                        ) : item.type === "music" && item.audioUrl ? (
                            <div
                                className="relative w-48 h-72 rounded-xl overflow-hidden border border-white/10 group cursor-pointer"
                                style={{
                                    background: item.imageUrl
                                        ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(${item.imageUrl}) center/cover`
                                        : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
                                }}
                                onClick={() => toggleAudio(item.id, item.audioUrl!)}
                            >
                                <audio
                                    id={`audio-${item.id}`}
                                    src={item.audioUrl}
                                    preload="none" // Optimize loading
                                    onEnded={() => setPlayingAudio(null)}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-transform ${playingAudio === item.id ? "scale-110" : "group-hover:scale-110"}`}>
                                        {playingAudio === item.id ? (
                                            <Pause className="w-6 h-6 text-white" />
                                        ) : (
                                            <Play className="w-6 h-6 text-white ml-1" />
                                        )}
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <p className="text-xs text-white/80 line-clamp-2">{item.prompt}</p>
                                </div>
                                <div className="absolute top-2 left-2">
                                    <Music className="w-4 h-4 text-white/50" />
                                </div>
                                {playingAudio === item.id && (
                                    <div className="absolute top-2 right-2">
                                        <div className="flex gap-0.5">
                                            {[...Array(4)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-1 bg-violet-400 rounded-full animate-pulse"
                                                    style={{
                                                        height: `${8 + Math.random() * 12}px`,
                                                        animationDelay: `${i * 0.1}s`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
