"use client";

import { GlassCard } from "@/components/GlassCard";
import { Sparkles, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase/client";
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const firebaseAuth = useMemo(() => getFirebaseAuth(), []);
    const provider = useMemo(() => getGoogleProvider(), []);

    const handleGoogleLogin = async () => {
        if (!firebaseAuth || !provider) {
            setError("Authentication is unavailable. Please verify environment configuration.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            await signInWithPopup(firebaseAuth, provider);
            router.push("/");
        } catch (e: any) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseAuth || !email || !password) return;

        setLoading(true);
        setError("");
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(firebaseAuth, email, password);
            } else {
                await signInWithEmailAndPassword(firebaseAuth, email, password);
            }
            router.push("/");
        } catch (err: any) {
            console.error(err);
            const code = err.code || "";
            if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
                setError("Invalid email or password.");
            } else if (code === "auth/email-already-in-use") {
                setError("An account with this email already exists.");
            } else if (code === "auth/weak-password") {
                setError("Password must be at least 6 characters.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Animated gradient orbs */}
            <div className="orb orb-1" style={{ top: '-10%', left: '-5%' }} />
            <div className="orb orb-2" style={{ top: '60%', right: '-10%' }} />
            <div className="orb orb-3" style={{ bottom: '-5%', left: '30%' }} />
            <div className="orb orb-4" style={{ top: '20%', right: '20%' }} />
            <div className="orb orb-5" style={{ bottom: '20%', left: '-8%' }} />
            <div className="orb orb-6" style={{ top: '5%', right: '-5%' }} />

            {/* Aurora band */}
            <div className="aurora-band" />

            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="mb-10 flex flex-col items-center gap-4"
            >
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shimmer-border">
                    <Sparkles className="w-7 h-7 text-violet-400" />
                </div>
                <h1 className="text-3xl font-light tracking-wider gradient-text">Video Zen</h1>
                <p className="text-sm text-white/30 tracking-wide">AI-powered video creation</p>
            </motion.div>

            <GlassCard className="w-full max-w-sm p-8 flex flex-col gap-5 shimmer-border" delay={0.15}>
                <div className="text-center">
                    <h2 className="text-lg font-medium text-white mb-1">
                        {isSignUp ? "Create Account" : "Welcome"}
                    </h2>
                    <p className="text-sm text-white/40">
                        {isSignUp ? "Sign up to start creating." : "Sign in to start creating."}
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Email / Password form */}
                <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-11 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white font-medium hover:from-violet-400 hover:to-blue-400 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-violet-500/20"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Mail className="w-4 h-4" />
                                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <button
                    onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                    {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-white/25 uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Google button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="h-11 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:hover:scale-100"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                        <>
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Continue with Google</span>
                        </>
                    )}
                </button>
            </GlassCard>

            {/* Footer */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-8 text-white/15 text-xs font-light tracking-[0.2em] uppercase"
            >
                Powered by KIE AI
            </motion.p>
        </main>
    );
}
