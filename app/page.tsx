"use client";

import { useState, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/GlassCard";
import { VideoDrawer } from "@/components/VideoDrawer";
import { Sparkles, History, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const firebaseAuth = useMemo(() => getFirebaseAuth(), []);

  // Handle Auth State
  useEffect(() => {
    if (!firebaseAuth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [firebaseAuth, router]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) return;
    setIsGenerating(true);

    try {
      // Get Firebase ID Token
      const token = await user.getIdToken();

      // Call local proxy (which forwards to Cloud Function)
      const apiUrl = "/api/generate";

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      // Success
      setPrompt("");
      setIsDrawerOpen(true);
      alert("Dream request sent! Check the Vault for updates.");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSignOut = async () => {
    if (!firebaseAuth) {
      return;
    }

    await signOut(firebaseAuth);
    router.push("/login");
  };

  if (!user) return null; // Or a loading spinner

  return (
    <main className="min-h-screen w-full bg-black relative overflow-hidden selection:bg-violet-500/20 flex flex-col items-center justify-center p-6">

      {/* Animated gradient orbs */}
      <div className="orb orb-1" style={{ top: '-15%', left: '10%' }} />
      <div className="orb orb-2" style={{ bottom: '10%', right: '-5%' }} />
      <div className="orb orb-3" style={{ top: '50%', left: '-10%' }} />
      <div className="orb orb-4" style={{ top: '-5%', right: '15%' }} />
      <div className="orb orb-5" style={{ bottom: '-10%', right: '30%' }} />
      <div className="orb orb-6" style={{ top: '30%', right: '-8%' }} />

      {/* Aurora band */}
      <div className="aurora-band" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Header / Nav */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-sm font-medium tracking-widest uppercase gradient-text">Video Zen</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-white/50 hover:text-violet-300"
            title="Your Vault"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={handleSignOut}
            className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-white/50 hover:text-pink-300"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Creation Interface */}
      <GlassCard className="w-full max-w-2xl relative z-10 p-1 shimmer-border" delay={0.2}>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your video dream..."
            className="w-full min-h-[120px] bg-transparent text-lg md:text-2xl text-white font-light placeholder:text-white/20 p-6 resize-none focus:outline-none"
            spellCheck={false}
          />

          <div className="flex justify-between items-center px-6 pb-4 border-t border-white/5 pt-4">
            <div className="text-xs text-white/30 uppercase tracking-wider">
              30s Generator
            </div>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="h-10 px-6 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-white font-medium hover:from-violet-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-violet-500/20"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dreaming...</span>
                </>
              ) : (
                <>
                  <span>Generate</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Footer Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 text-white/15 text-xs font-light tracking-[0.2em] uppercase"
      >
        Powered by KIE AI
      </motion.p>

      {/* Video Vault Drawer */}
      <VideoDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

    </main>
  );
}
