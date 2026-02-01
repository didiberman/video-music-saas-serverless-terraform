"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { format } from "date-fns";
import { Film, Music, CreditCard } from "lucide-react";

interface Transaction {
    id: string;
    amount_display: string;
    currency: string;
    credits: number;
    packId: string;
    created_at: string;
    status: string;
}

interface Generation {
    id: string;
    type?: 'video' | 'music';
    original_prompt: string;
    cost?: number;
    created_at: string;
    status: string;
}

export function TransactionHistory() {
    const [activeTab, setActiveTab] = useState<'payments' | 'usage'>('payments');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const auth = getFirebaseAuth();
                const token = await auth?.currentUser?.getIdToken();
                if (!token) return;

                if (activeTab === 'payments') {
                    // Fetch Payments (Cloud Function)
                    // Note: URL needs to be dynamic or configured. 
                    // Assuming similar convention to others: https://list-transactions-[id]-uc.a.run.app
                    // But we don't know the ID yet. 
                    // FALLBACK: Use local /api proxy if we had one, OR hardcode the likely URL pattern after deployment, 
                    // OR better: Assume we will know it.
                    // For now, I'll use the specific URL if I can find it, or the project-based one.
                    // Since I don't have the URL yet, I will use a placeholder that matches the others.
                    // Wait, I can't guess the random ID.
                    // I should probably check the URL for list-transactions after deployment.
                    // But I need to write the code now.
                    // I can use the `create-checkout-session` suffix as a guess or just use the project-based URL if using Cloud Functions v1, but v2 uses Cloud Run.
                    // CRITICAL: Next.js API Routes /api/proxy are safer for this, but I'm doing direct calls.
                    // I will check the URL later in verification. For now I'll use a placeholder variable.

                    const res = await fetch("https://list-transactions-7lnajjfgla-uc.a.run.app", {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setTransactions(data.transactions || []);
                    }
                } else {
                    // Fetch Usage
                    const res = await fetch("https://list-generations-7lnajjfgla-uc.a.run.app", {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setGenerations(data.generations || []);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch history:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab]);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex gap-4 border-b border-white/10 pb-4 mb-4">
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`text-sm font-medium pb-2 transition-all relative ${activeTab === 'payments' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    Payment History
                    {activeTab === 'payments' && <div className="absolute bottom-[-17px] left-0 w-full h-[1px] bg-white" />}
                </button>
                <button
                    onClick={() => setActiveTab('usage')}
                    className={`text-sm font-medium pb-2 transition-all relative ${activeTab === 'usage' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    Credit Usage
                    {activeTab === 'usage' && <div className="absolute bottom-[-17px] left-0 w-full h-[1px] bg-white" />}
                </button>
            </div>

            <div className="flex-grow overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                ) : activeTab === 'payments' ? (
                    transactions.length > 0 ? (
                        <div className="space-y-3">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">Credit Purchase</p>
                                            <p className="text-white/40 text-xs">{format(new Date(tx.created_at), 'MMM d, yyyy')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold text-sm">+{tx.credits} Credits</p>
                                        <p className="text-white/40 text-xs">${tx.amount_display} USD</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-white/30 text-sm">No payments found.</div>
                    )
                ) : (
                    generations.length > 0 ? (
                        <div className="space-y-3">
                            {generations.map((gen) => (
                                <div key={gen.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${gen.type === 'music' ? 'bg-fuchsia-500/10 text-fuchsia-400' : 'bg-violet-500/10 text-violet-400'}`}>
                                            {gen.type === 'music' ? <Music className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm line-clamp-1 max-w-[200px]">{gen.original_prompt}</p>
                                            <p className="text-white/40 text-xs">{format(new Date(gen.created_at), 'MMM d, yyyy • HH:mm')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-red-400 font-bold text-sm">-{gen.cost || (gen.type === 'music' ? 10 : 6)} Credits</p>
                                        <p className="text-white/40 text-xs capitalize">{gen.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-white/30 text-sm">No usage history found.</div>
                    )
                )}
            </div>
        </div>
    );
}
