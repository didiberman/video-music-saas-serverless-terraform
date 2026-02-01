"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Users, Video, Music, CreditCard, Shield, Activity } from "lucide-react";
import Link from "next/link";

interface AdminUser {
    uid: string;
    email: string;
    created_at: string;
    photoURL?: string;
}

interface AdminGeneration {
    id: string;
    user_id: string;
    type?: 'video' | 'music';
    original_prompt: string;
    status: string;
    cost?: number;
    created_at: string | null;
}

interface AdminTransaction {
    id: string;
    uid: string;
    amount: number;
    credits: number;
    packId: string;
    created_at: string | null;
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [generations, setGenerations] = useState<AdminGeneration[]>([]);
    const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const auth = getFirebaseAuth();
            const currentUser = auth?.currentUser;

            if (!currentUser) {
                router.push('/login');
                return;
            }

            if (currentUser.email !== 'yadidb@gmail.com') {
                router.push('/');
                return;
            }

            setAuthorized(true);

            try {
                const token = await currentUser.getIdToken();
                // Assumed URL pattern for new function
                const res = await fetch("https://admin-stats-7lnajjfgla-uc.a.run.app", {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                    setGenerations(data.generations || []);
                    setTransactions(data.transactions || []);
                } else {
                    console.error("Failed to fetch stats:", res.statusText);
                }
            } catch (e) {
                console.error("Admin fetch error:", e);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(checkAuth, 1000); // Give auth state a moment to settle
        return () => clearTimeout(timer);
    }, [router]);

    if (!authorized && loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!authorized) return null; // Logic in use effect will redirect

    return (
        <main className="min-h-screen w-full bg-[#050505] text-white p-6 md:p-12 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-violet-900/10 to-transparent pointer-events-none" />

            <header className="flex justify-between items-center mb-10 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                        <p className="text-white/40 text-xs uppercase tracking-widest">Restricted Access</p>
                    </div>
                </div>
                <Link href="/" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors">
                    Back to App
                </Link>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 max-w-7xl mx-auto">

                {/* 1. Recent Signups */}
                <div className="lg:col-span-1 rounded-2xl bg-[#0a0a0a] border border-white/5 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            New Signups
                        </h2>
                        <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-mono">
                            Last 20
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {users.map(u => (
                            <div key={u.uid} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                                    {u.photoURL ? (
                                        <img src={u.photoURL} alt="user" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/50">
                                            {u.email[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-white truncate group-hover:text-blue-200 transition-colors">
                                        {u.email}
                                    </p>
                                    <p className="text-xs text-white/30 truncate">
                                        ID: {u.uid.substring(0, 8)}...
                                    </p>
                                </div>
                                <div className="ml-auto text-[10px] text-white/30 font-mono whitespace-nowrap">
                                    {new Date(u.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Live Generations */}
                <div className="lg:col-span-1 rounded-2xl bg-[#0a0a0a] border border-white/5 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            Recent Activity
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {generations.map(g => (
                            <div key={g.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${g.type === 'music' ? 'bg-fuchsia-500/10 text-fuchsia-400' : 'bg-violet-500/10 text-violet-400'
                                        }`}>
                                        {g.type === 'music' ? 'Music' : 'Video'}
                                    </span>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${g.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                            g.status === 'fail' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                                        }`}>
                                        {g.status}
                                    </span>
                                </div>
                                <p className="text-sm text-white/80 line-clamp-2 leading-relaxed">
                                    "{g.original_prompt}"
                                </p>
                                <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                                        <Users className="w-3 h-3" />
                                        {g.user_id?.substring(0, 6)}...
                                    </div>
                                    <span className="text-xs font-mono text-red-300">
                                        -{g.cost || (g.type === 'music' ? 10 : 6)} CR
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Recent Transactions */}
                <div className="lg:col-span-1 rounded-2xl bg-[#0a0a0a] border border-white/5 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-amber-400" />
                            Payments
                        </h2>
                        <span className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 font-mono">
                            Revenue
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {transactions.length > 0 ? transactions.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/30 transition-colors">
                                <div>
                                    <p className="text-amber-200 font-bold text-lg">
                                        ${(t.amount / 100).toFixed(2)}
                                    </p>
                                    <p className="text-white/40 text-xs">
                                        {t.packId.toUpperCase()} • {t.credits} CR
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/60 text-xs font-mono mb-1">
                                        {t.uid.substring(0, 8)}...
                                    </p>
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                                        PAID
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-40 text-white/20">
                                <CreditCard className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">No recent transactions</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </main>
    );
}
