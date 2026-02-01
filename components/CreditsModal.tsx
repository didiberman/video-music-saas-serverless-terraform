import { X, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PricingCards } from "./PricingCards";
import { TransactionHistory } from "./TransactionHistory";

interface CreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export function CreditsModal({ isOpen, onClose, userId }: CreditsModalProps) {
    const [view, setView] = useState<'buy' | 'history'>('buy');

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
                    className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 rounded-full transition-all z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Left Side: Info / Value Prop */}
                    <div className="md:w-1/3 bg-gradient-to-br from-violet-900/20 to-blue-900/10 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto">
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Top Up Vibe Credits</h2>
                            <p className="text-white/60 text-sm leading-relaxed mb-6">
                                Generate more stunning videos and music. Credits never expire and rollover forever.
                            </p>

                            {/* Free Trial Notification */}
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-6">
                                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-1">Free Trial Active</p>
                                <p className="text-white/70 text-sm">Every new account gets 30 Credits on the house.</p>
                            </div>
                        </div>

                        <div className="space-y-4 mt-8 md:mt-0">
                            {/* View Toggle */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setView('buy')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${view === 'buy' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white'
                                        }`}
                                >
                                    Buy Credits
                                </button>
                                <button
                                    onClick={() => setView('history')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${view === 'history' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white'
                                        }`}
                                >
                                    History
                                </button>
                            </div>

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

                    {/* Right Side: Content */}
                    <div className="md:w-2/3 p-6 md:p-8 bg-black/40 overflow-y-auto">
                        {view === 'buy' ? (
                            <>
                                <PricingCards />
                                <p className="text-center text-white/20 text-xs mt-8 flex items-center justify-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    Secure Payment via Stripe
                                </p>
                            </>
                        ) : (
                            <TransactionHistory />
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
