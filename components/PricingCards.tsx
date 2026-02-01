"use client";

import { Check, Zap } from "lucide-react";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";

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

export function PricingCards() {
    const [loading, setLoading] = useState<string | null>(null);

    const handlePurchase = async (packId: string) => {
        setLoading(packId);
        try {
            const auth = getFirebaseAuth();
            const token = await auth?.currentUser?.getIdToken();
            if (!token) {
                // If on pricing page and not logged in, redirect to login might be better,
                // but for now let's assume this component is used where auth is likely or handled.
                // Or we can just redirect to /login
                window.location.href = "/login?redirect=/pricing";
                return;
            }

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

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full w-full">
            {PACKS.map((pack) => (
                <div
                    key={pack.id}
                    className={`relative rounded-xl border ${pack.popular ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/10 bg-white/5'} p-6 flex flex-col hover:border-white/20 transition-all hover:-translate-y-1`}
                >
                    {pack.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-violet-500/40 tracking-wider">
                            MOST POPULAR
                        </div>
                    )}

                    <div className="text-center mb-6 mt-2">
                        <h3 className="text-white font-medium text-lg">{pack.name}</h3>
                        <div className="text-3xl font-bold text-white mt-2">
                            ${pack.price}
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg bg-gradient-to-r ${pack.gradient} text-center mb-6 shadow-lg`}>
                        <p className="text-3xl font-bold text-white">{pack.credits}</p>
                        <p className="text-[10px] text-white/80 uppercase tracking-widest mt-1">Vibe Credits</p>
                    </div>

                    <ul className="space-y-3 mb-8 flex-grow block text-left">
                        {pack.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => handlePurchase(pack.id)}
                        disabled={!!loading}
                        className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg ${loading === pack.id
                            ? "bg-white/10 text-white/40 cursor-wait"
                            : "bg-white text-black hover:bg-violet-50 hover:scale-[1.02]"
                            }`}
                    >
                        {loading === pack.id ? "Processing..." : "Select Pack"}
                    </button>
                </div>
            ))}
        </div>
    );
}
