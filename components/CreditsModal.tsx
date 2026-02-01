"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, Check, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseAuth } from "@/lib/firebase/client";

interface CreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

const PACKS = [
    {
        id: "starter",
        name: "Starter Pack",
        credits: 100,
        price: 9,
        features: ["~10 Videos (10s)", "Normal Generation Queue"],
        popular: false,
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        id: "creator",
        name: "Creator Pack",
        credits: 400,
        price: 25,
        features: ["~40 Videos (10s)", "Best for frequent creation", "20% Discount"],
        popular: true,
        gradient: "from-violet-500 to-fuchsia-500",
    },
    {
        id: "pro",
        name: "Pro Pack",
        credits: 1000,
        price: 50,
        features: ["~100 Videos (10s)", "Max Value (50% Bonus)", "Priority Support"],
        popular: false,
        gradient: "from-amber-400 to-orange-500",
    },
];

export function CreditsModal({ isOpen, onClose, userId }: CreditsModalProps) {
    const [loading, setLoading] = useState<string | null>(null);

    const handlePurchase = async (packId: string) => {
        setLoading(packId);
        try {
            const auth = getFirebaseAuth();
            const token = await auth?.currentUser?.getIdToken();
            if (!token) throw new Error("Not authenticated");

            // Call Cloud Function to create session
            const res = await fetch(
                "https://create-checkout-session-7lnajjfgla-uc.a.run.app",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ packId })
                }
            );

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "Failed to create checkout session");
            }
        } catch (e) {
            console.error("Purchase error:", e);
            alert("Something went wrong initializing checkout. Please try again.");
            setLoading(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 rounded-full transition-all z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Left Side: Info / Value Prop */}
                    <div className="md:w-1/3 bg-gradient-to-br from-violet-900/20 to-blue-900/10 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5">
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Top Up Vibe Credits</h2>
                            <p className="text-white/60 text-sm leading-relaxed">
                                Generate more stunning videos and music. Credits never expire.
                            </p>
                        </div>

                        <div className="space-y-4 mt-8 md:mt-0">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Exchange Rate</p>
                                <div className="flex justify-between text-sm text-white/80">
                                    <span>1 Video Second</span>
                                    <span className="font-mono">1 Credit</span>
                                </div>
                                <div className="flex justify-between text-sm text-white/80 mt-1">
                                    <span>1 Song</span>
                                    <span className="font-mono">10 Credits</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Pricing Options */}
                    <div className="md:w-2/3 p-6 md:p-8 bg-black/40">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                            {PACKS.map((pack) => (
                                <div
                                    key={pack.id}
                                    className={`relative rounded-xl border ${pack.popular ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/10 bg-white/5'} p-4 flex flex-col hover:border-white/20 transition-all hover:-translate-y-1`}
                                >
                                    {pack.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-violet-500/40 tracking-wider">
                                            MOST POPULAR
                                        </div>
                                    )}

                                    <div className="text-center mb-4 mt-2">
                                        <h3 className="text-white font-medium">{pack.name}</h3>
                                        <div className="text-2xl font-bold text-white mt-1">
                                            ${pack.price}
                                        </div>
                                    </div>

                                    <div className={`p-3 rounded-lg bg-gradient-to-r ${pack.gradient} text-center mb-4 shadow-lg`}>
                                        <p className="text-2xl font-bold text-white">{pack.credits}</p>
                                        <p className="text-[10px] text-white/80 uppercase tracking-widest">Credits</p>
                                    </div>

                                    <ul className="space-y-2 mb-6 flex-grow">
                                        {pack.features.map((feat, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                                                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handlePurchase(pack.id)}
                                        disabled={!!loading}
                                        className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${loading === pack.id
                                            ? "bg-white/10 text-white/40 cursor-wait"
                                            : "bg-white text-black hover:bg-white/90"
                                            }`}
                                    >
                                        {loading === pack.id ? "Loading..." : "Select Pack"}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <p className="text-center text-white/20 text-xs mt-6 flex items-center justify-center gap-1">
                            <Zap className="w-3 h-3" />
                            Secure Payment via Stripe
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
