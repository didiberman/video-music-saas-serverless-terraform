"use client";

import { PricingCards } from "@/components/PricingCards";
import { Sparkles, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PricingPage() {
    return (
        <main className="min-h-screen w-full bg-black relative overflow-x-hidden overflow-y-auto selection:bg-violet-500/20 flex flex-col items-center">

            {/* Background Elements */}
            <div className="orb orb-1" style={{ top: '-15%', left: '10%' }} />
            <div className="orb orb-3" style={{ top: '50%', left: '-10%' }} />
            <div className="aurora-band" />
            <div className="ambient-light" />
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Nav */}
            <nav className="w-full max-w-7xl mx-auto p-6 flex justify-between items-center z-10">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                        <ArrowLeft className="w-4 h-4 text-white/70" />
                    </div>
                    <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Back to Create</span>
                </Link>
                <div className="flex items-center gap-2 opacity-50">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-medium tracking-widest uppercase gradient-text">VibeFlow</span>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="w-full max-w-5xl mx-auto px-6 py-12 md:py-20 z-10 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Start for free with <span className="text-emerald-400 font-semibold">30 Vibe Credits</span>.
                        <br />
                        Top up anytime. Credits roll over forever.
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-full"
                >
                    <PricingCards />
                </motion.div>

                {/* FAQ / Info */}
                <div className="mt-20 grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                        <h3 className="text-xl font-semibold text-white mb-3">What are Vibe Credits?</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Credits are the currency of VibeFlow.
                            <br /><br />
                            • 1 Second of Video = 1 Credit (~$0.05)
                            <br />
                            • 1 Song = 10 Credits (~$0.50)
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                        <h3 className="text-xl font-semibold text-white mb-3">Do credits expire?</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            No. Your credits are yours forever. They roll over month to month and never expire as long as your account is active.
                        </p>
                    </div>
                </div>

                <p className="text-white/20 text-xs mt-12 flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3" />
                    Payments processed securely by Stripe. We do not store your card details.
                </p>

            </div>
        </main>
    );
}
