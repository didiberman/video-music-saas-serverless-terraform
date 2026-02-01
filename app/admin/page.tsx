"use client";

import { useState, useEffect, useMemo } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { Sparkles, Users, Video, Clock, RefreshCw, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface UserStats {
    uid: string;
    email: string | null;
    displayName: string | null;
    secondsRemaining: number;
    videoCount: number;
    lastActivity: string | null;
}

interface VideoRecord {
    taskId: string;
    userId: string;
    userEmail: string | null;
    prompt: string;
    script: string;
    status: string;
    videoUrl: string | null;
    createdAt: string;
}

interface AdminData {
    users: UserStats[];
    videos: VideoRecord[];
    summary: {
        totalUsers: number;
        totalVideos: number;
        totalSecondsRemaining: number;
    };
}

export default function AdminPage() {
    const [user, setUser] = useState<User | null>(null);
    const [data, setData] = useState<AdminData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"users" | "videos">("users");
    const router = useRouter();
    const firebaseAuth = useMemo(() => getFirebaseAuth(), []);

    useEffect(() => {
        if (!firebaseAuth) return;
        const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
            if (!currentUser) {
                router.push("/login");
            } else {
                setUser(currentUser);
            }
        });
        return () => unsubscribe();
    }, [firebaseAuth, router]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/admin/stats", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to fetch");
            }

            const json = await res.json();
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    if (!user) return null;

    return (
        <main className="min-h-screen w-full bg-black relative overflow-x-hidden overflow-y-auto selection:bg-violet-500/20 p-6">
            {/* Background elements */}
            <div className="orb orb-1" style={{ top: "-15%", left: "10%" }} />
            <div className="orb orb-2" style={{ bottom: "10%", right: "-5%" }} />
            <div className="aurora-band" />
            <div className="ambient-light" />

            {/* Header */}
            <header className="flex justify-between items-center mb-8 relative z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/")}
                        className="p-2 rounded-lg hover:bg-white/5 transition-all text-white/50 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                            <Users className="w-4 h-4 text-violet-400" />
                        </div>
                        <span className="text-lg font-medium text-white">Admin Dashboard</span>
                    </div>
                </div>

                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="p-2.5 rounded-lg hover:bg-white/5 transition-all text-white/50 hover:text-white disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                </button>
            </header>

            {/* Error state */}
            {error && (
                <GlassCard className="p-4 mb-6 border-red-500/30">
                    <p className="text-red-400 text-sm">{error}</p>
                </GlassCard>
            )}

            {/* Loading state */}
            {loading && !data && (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-pulse text-white/30">Loading...</div>
                </div>
            )}

            {/* Stats Summary */}
            {data && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
                >
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{data.summary.totalUsers}</p>
                                <p className="text-xs text-white/40">Total Users</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                <Video className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{data.summary.totalVideos}</p>
                                <p className="text-xs text-white/40">Videos Created</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{data.summary.totalSecondsRemaining}s</p>
                                <p className="text-xs text-white/40">Total Credits</p>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            )}

            {/* Tabs */}
            {data && (
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "users"
                                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                : "text-white/40 hover:text-white/60 border border-transparent"
                            }`}
                    >
                        Users ({data.users.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("videos")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "videos"
                                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                : "text-white/40 hover:text-white/60 border border-transparent"
                            }`}
                    >
                        Videos ({data.videos.length})
                    </button>
                </div>
            )}

            {/* Users Table */}
            {data && activeTab === "users" && (
                <GlassCard className="p-4 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-white/40 border-b border-white/10">
                                <th className="pb-3 font-medium">User</th>
                                <th className="pb-3 font-medium">Seconds</th>
                                <th className="pb-3 font-medium">Videos</th>
                                <th className="pb-3 font-medium">Last Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.users.map((u) => (
                                <tr key={u.uid} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3">
                                        <div>
                                            <p className="text-white font-medium">{u.email || "No email"}</p>
                                            <p className="text-white/30 text-xs">{u.uid.slice(0, 12)}...</p>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <span className={`font-mono ${u.secondsRemaining <= 0 ? "text-red-400" : "text-emerald-400"}`}>
                                            {u.secondsRemaining}s
                                        </span>
                                    </td>
                                    <td className="py-3 text-white/70">{u.videoCount}</td>
                                    <td className="py-3 text-white/40 text-xs">
                                        {u.lastActivity ? new Date(u.lastActivity).toLocaleDateString() : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </GlassCard>
            )}

            {/* Videos Grid */}
            {data && activeTab === "videos" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.videos.map((v) => (
                        <GlassCard key={v.taskId} className="p-4 space-y-3">
                            {/* Video player or placeholder */}
                            {v.videoUrl && v.status === "success" ? (
                                <video
                                    src={v.videoUrl}
                                    controls
                                    className="w-full rounded-lg aspect-video object-cover"
                                />
                            ) : (
                                <div className="w-full aspect-video rounded-lg bg-white/5 flex items-center justify-center">
                                    <span className={`text-xs px-2 py-1 rounded ${v.status === "success" ? "bg-emerald-500/20 text-emerald-400" :
                                            v.status === "fail" ? "bg-red-500/20 text-red-400" :
                                                "bg-yellow-500/20 text-yellow-400"
                                        }`}>
                                        {v.status}
                                    </span>
                                </div>
                            )}

                            <div>
                                <p className="text-white/80 text-sm line-clamp-2">{v.prompt}</p>
                                <p className="text-white/30 text-xs mt-1">
                                    {v.userEmail || v.userId.slice(0, 12)} • {new Date(v.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </main>
    );
}
