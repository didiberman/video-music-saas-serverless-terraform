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
    <main className="min-h-screen w-full bg-black relative overflow-hidden selection:bg-white/20 flex flex-col items-center justify-center p-6">

      {/* Background Elements */}
      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

      {/* Header / Nav */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white/50" />
          </div>
          <span className="text-sm font-medium text-white/50 tracking-widest uppercase">Video Zen</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/60 hover:text-white"
            title="Your Vault"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/60 hover:text-white"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Creation Interface */}
      <GlassCard className="w-full max-w-2xl relative z-10 p-1" delay={0.2}>
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
              className="h-10 px-6 rounded-full bg-white text-black font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
        className="absolute bottom-8 text-white/20 text-xs font-light tracking-[0.2em] uppercase"
      >
        Powered by KIE AI
      </motion.p>

      {/* Video Vault Drawer */}
      <VideoDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

    </main>
  );
}
