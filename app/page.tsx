"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { GlassCard } from "@/components/GlassCard";
import { VideoDrawer } from "@/components/VideoDrawer";
import { VideoGallery } from "@/components/VideoGallery";
import { Sparkles, History, LogOut, Clock, RotateCcw, RectangleHorizontal, RectangleVertical, Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { StreamingText } from "@/components/StreamingText";
import { ProgressRotator } from "@/components/ProgressRotator";

type Phase = "idle" | "scripting" | "generating" | "done" | "error";
type AspectRatio = "9:16" | "16:9";

const SCRIPTING_MESSAGES = [
  "Analyzing your prompt...",
  "Understanding context & tone...",
  "Brainstorming creative angles...",
  "Drafting the perfect script...",
  "Refining dialogue & pacing...",
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<"6" | "10">("6");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const firebaseAuth = useMemo(() => getFirebaseAuth(), []);

  // Streaming state
  const [phase, setPhase] = useState<Phase>("idle");
  const [streamedScript, setStreamedScript] = useState("");
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in your browser. Please try Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setPrompt(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

  // Handle Auth State
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

  // Poll for video completion (Firestore cross-project access doesn't work from client)
  useEffect(() => {
    if (!currentTaskId || phase !== "generating" || !user) return;

    let cancelled = false;

    const pollStatus = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/status/${currentTaskId}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();

        if (cancelled) return;

        if (data.status === "success" && data.video_url) {
          setVideoUrl(data.video_url);
          setPhase("done");
        } else if (data.status === "fail") {
          setErrorMessage(data.fail_message || "Video generation failed");
          setPhase("error");
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollStatus, 3000);
    pollStatus();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentTaskId, phase, user]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) return;

    // Reset streaming state
    setPhase("scripting");
    setStreamedScript("");
    setCurrentTaskId(null);
    setVideoUrl(null);
    setErrorMessage(null);

    try {
      const token = await user.getIdToken();

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt, duration, aspectRatio }),
      });

      const contentType = res.headers.get("content-type") || "";

      // Non-streaming error response
      if (!contentType.includes("ndjson")) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      // Read NDJSON stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (event.type === "script") {
              setStreamedScript((prev) => prev + event.text);
            } else if (event.type === "status") {
              setPhase("generating");
            } else if (event.type === "done") {
              setCurrentTaskId(event.taskId);
              setPhase("generating");
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (parseErr: unknown) {
            // Check if error is Error object before accessing message
            const parseErrMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
            if (parseErrMsg && !parseErrMsg.includes("JSON")) {
              throw parseErr;
            }
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage("An unknown error occurred.");
      }
      setPhase("error");
    }
  };

  const handleReset = () => {
    setPhase("idle");
    setPrompt("");
    setStreamedScript("");
    setCurrentTaskId(null);
    setVideoUrl(null);
    setErrorMessage(null);
  };

  const handleSignOut = async () => {
    if (!firebaseAuth) return;
    await signOut(firebaseAuth);
    router.push("/login");
  };

  if (!user) return null;

  return (
    <main className="min-h-screen w-full bg-black relative overflow-x-hidden overflow-y-auto selection:bg-violet-500/20 flex flex-col items-center p-6">

      {/* Animated gradient orbs */}
      <div className="orb orb-1" style={{ top: '-15%', left: '10%' }} />
      <div className="orb orb-2" style={{ bottom: '10%', right: '-5%' }} />
      <div className="orb orb-3" style={{ top: '50%', left: '-10%' }} />
      <div className="orb orb-4" style={{ top: '-5%', right: '15%' }} />
      <div className="orb orb-5" style={{ bottom: '-10%', right: '30%' }} />
      <div className="orb orb-6" style={{ top: '30%', right: '-8%' }} />

      <div className="aurora-band" />
      <div className="ambient-light" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
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

      {/* Main Content — switches between prompt form and streaming panel */}
      {phase === "idle" ? (
        <>
          <div className="w-full flex flex-col items-center justify-center py-20 min-h-[60vh] relative z-10 transition-all duration-700">
            <GlassCard className="w-full max-w-2xl p-1 shimmer-border" delay={0.2}>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your video dream..."
                  className="w-full min-h-[120px] bg-transparent text-lg md:text-2xl text-white font-light placeholder:text-white/20 p-6 pr-14 resize-none focus:outline-none"
                  spellCheck={false}
                />

                {/* Voice input button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`absolute top-4 right-4 p-2.5 rounded-full transition-all ${isRecording
                    ? "bg-red-500/20 text-red-400 animate-pulse"
                    : "bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10"
                    }`}
                  title={isRecording ? "Stop recording" : "Voice input"}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <div className="flex flex-col gap-3 px-4 md:px-6 pb-4 border-t border-white/5 pt-4 md:flex-row md:justify-between md:items-center">
                  <div className="flex items-center gap-3 md:gap-4">
                    {/* Duration selector */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-white/30" />
                      <div className="flex rounded-lg overflow-hidden border border-white/10">
                        <button
                          type="button"
                          onClick={() => setDuration("6")}
                          className={`px-3 py-1.5 text-xs font-medium transition-all ${duration === "6"
                            ? "bg-violet-500/20 text-violet-300 border-r border-white/10"
                            : "text-white/30 hover:text-white/50 border-r border-white/10"
                            }`}
                        >
                          6s
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuration("10")}
                          className={`px-3 py-1.5 text-xs font-medium transition-all ${duration === "10"
                            ? "bg-violet-500/20 text-violet-300"
                            : "text-white/30 hover:text-white/50"
                            }`}
                        >
                          10s
                        </button>
                      </div>
                    </div>

                    {/* Aspect ratio selector */}
                    <div className="flex rounded-lg overflow-hidden border border-white/10">
                      <button
                        type="button"
                        onClick={() => setAspectRatio("9:16")}
                        className={`px-2.5 py-1.5 transition-all flex items-center gap-1 ${aspectRatio === "9:16"
                          ? "bg-violet-500/20 text-violet-300"
                          : "text-white/30 hover:text-white/50"
                          }`}
                        title="Portrait / Instagram (9:16)"
                      >
                        <RectangleVertical className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAspectRatio("16:9")}
                        className={`px-2.5 py-1.5 transition-all border-l border-white/10 flex items-center gap-1 ${aspectRatio === "16:9"
                          ? "bg-violet-500/20 text-violet-300"
                          : "text-white/30 hover:text-white/50"
                          }`}
                        title="Landscape / YouTube (16:9)"
                      >
                        <RectangleHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim()}
                    className="h-10 px-6 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-white font-medium hover:from-violet-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 w-full md:w-auto"
                  >
                    <span>Generate</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
            {/* Scroll hint icon if needed, or just let the gallery peek */}
          </div>

          <VideoGallery userId={user.uid} />
        </>
      ) : (
        /* Streaming / Progress Panel */
        <div className="w-full flex flex-col items-center justify-center min-h-[85vh] relative z-10">
          <GlassCard className="w-full max-w-2xl relative z-10 p-1 shimmer-border" delay={0}>
            <div className="p-6 space-y-4">
              {/* Phase indicator */}
              <div className="flex flex-col gap-2 items-center w-full">
                <div className="flex items-center gap-2">
                  {phase === "generating" ? (
                    <div className="w-full flex flex-col items-center gap-3">
                      <div className="w-full max-w-md">
                        <ProgressRotator />
                      </div>
                      <span className="text-xs text-white/20">Usually takes 30-60 seconds</span>
                    </div>
                  ) : phase === "scripting" ? (
                    <div className="w-full flex flex-col items-center gap-3">
                      <div className="w-full max-w-md">
                        <ProgressRotator messages={SCRIPTING_MESSAGES} />
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-white/40">
                      {phase === "done" && "Video ready"}
                      {phase === "error" && "Something went wrong"}
                    </span>
                  )}
                </div>
              </div>

              {/* Streamed script display */}
              {streamedScript && (
                <StreamingText
                  text={streamedScript}
                  isStreaming={phase === "scripting"}
                  className={`max-h-[350px] min-h-[150px] rounded-lg bg-white/5 border p-5 text-sm text-white/80 font-light leading-relaxed transition-all duration-1000 ${phase === "generating"
                    ? "border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)] animate-pulse"
                    : "border-white/10"
                    }`}
                />
              )}

              {/* Video player */}
              {phase === "done" && videoUrl && (
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    className="w-full"
                  />
                </div>
              )}

              {/* Error message */}
              {phase === "error" && errorMessage && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                  <p className="text-sm text-red-300">{errorMessage}</p>
                </div>
              )}

              {/* Actions */}
              {(phase === "done" || phase === "error") && (
                <button
                  onClick={handleReset}
                  className="h-10 px-6 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 font-medium transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Create another</span>
                </button>
              )}
            </div>
          </GlassCard>
        </div>
      )}

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
      <VideoDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} userId={user.uid} />

    </main>
  );
}
