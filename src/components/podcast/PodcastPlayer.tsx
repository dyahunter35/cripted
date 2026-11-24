"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Headphones,
  Info,
  Radio,
  User,
  GraduationCap,
} from "lucide-react";
import podcastsData from "@/content/podcasts.json";

interface PodcastPlayerProps {
  algorithmSlug: string;
}

export function PodcastPlayer({ algorithmSlug }: PodcastPlayerProps) {
  const podcast = (podcastsData as Record<string, any>)[algorithmSlug];

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(podcast?.durationSeconds || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [hasLoadedSrc, setHasLoadedSrc] = useState(false);

  const basePath =
    process.env.NEXT_PUBLIC_BASE_PATH !== undefined
      ? process.env.NEXT_PUBLIC_BASE_PATH
      : process.env.NODE_ENV === "production"
      ? "/cripted"
      : "";

  const audioUrl = `${basePath}/audio/${podcast?.audioFile || `${algorithmSlug}_podcast.mp3`}`;

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      window.dispatchEvent(new CustomEvent("crypto-lab:stop-all-audio"));

      if (!audio.getAttribute("src")) {
        audio.src = audioUrl;
        setHasLoadedSrc(true);
      }

      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Audio play interrupted:", err);
      }
    }
  };

  useEffect(() => {
    const stopAudio = () => {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener("crypto-lab:stop-all-audio", stopAudio);
    return () => window.removeEventListener("crypto-lab:stop-all-audio", stopAudio);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
    };
  }, []);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!podcast) return null;

  return (
    <div className="rounded-2xl border border-primary/25 bg-gradient-to-b from-card/95 via-card/80 to-background/90 p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-5">
      {/* Native HTML5 Audio element with MANDATORY preload="none" and NO initial src */}
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan-500 text-white shadow-md">
            <Radio className="h-6 w-6" />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-primary tracking-wide">
                استوديو بودكاست التشفير (Crypto Lab Podcast)
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                0 KB عند الفتح
              </span>
            </div>
            <h4 className="font-extrabold text-foreground text-base sm:text-lg">{podcast.title}</h4>
            <p className="text-xs text-muted-foreground">{podcast.subtitle}</p>
          </div>
        </div>

        {/* Duration badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs font-mono text-foreground font-semibold">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>{podcast.duration}</span>
          </span>
        </div>
      </div>

      {/* Animated Sound Wave Visualizer */}
      <div className="flex items-center justify-center gap-1 h-8 px-4 rounded-xl bg-black/40 border border-border/40 overflow-hidden">
        {Array.from({ length: 32 }).map((_, i) => {
          const height = isPlaying
            ? `${Math.max(15, ((Math.sin(i * 0.5 + currentTime * 5) + 1) / 2) * 100)}%`
            : "18%";
          return (
            <div
              key={i}
              style={{ height }}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPlaying
                  ? "bg-gradient-to-t from-primary via-cyan-400 to-emerald-400"
                  : "bg-muted-foreground/30"
              }`}
            />
          );
        })}
      </div>

      {/* Cyber Player Console Bar */}
      <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3 shadow-inner">
        <div className="flex items-center gap-3">
          {/* Main Play / Pause Button */}
          <button
            onClick={handleTogglePlay}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-cyan-500 text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
            aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل البودكاست"}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 mr-0.5" />}
          </button>

          {/* Progress Slider */}
          <div className="flex-1 space-y-1">
            <input
              type="range"
              min={0}
              max={duration || podcast.durationSeconds}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || podcast.durationSeconds)}</span>
            </div>
          </div>

          {/* Speed Toggle */}
          <button
            onClick={cycleSpeed}
            className="flex h-8 items-center justify-center rounded-md border border-border bg-secondary px-2.5 text-xs font-mono font-bold text-foreground hover:bg-secondary/80 transition-colors"
            title="تغيير سرعة البودكاست"
          >
            {playbackSpeed}×
          </button>

          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title={isMuted ? "إلغاء الكتم" : "كتم الصوت"}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Zero Bandwidth Notice Indicator */}
        {!hasLoadedSrc && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 pt-1">
            <Info className="h-3.5 w-3.5 text-primary" />
            <span>يبدأ تحميل البث الصوتي تدريجياً فقط بعد النقر على زر التشغيل (0 KB مستهلكة قبل الضغط).</span>
          </div>
        )}
      </div>

      {/* Speakers Info */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <div className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs">
          <GraduationCap className="h-3.5 w-3.5 text-primary" />
          <span className="font-bold text-primary">د. كريم:</span>
          <span className="text-muted-foreground">أستاذ المقرر (مقدمة وتحليل)</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-xs">
          <User className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-bold text-emerald-600 dark:text-emerald-400">يوسف:</span>
          <span className="text-muted-foreground">طالب ماجستير (أسئلة واستفسارات)</span>
        </div>
      </div>

      {/* Transcript Drawer Toggle */}
      <div className="border-t border-border/60 pt-3">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span>النص المكتوب الكامل للحلقة (Interactive Transcript)</span>
          </div>
          {showTranscript ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {/* Dialogue View */}
        {showTranscript && podcast.dialogue && (
          <div className="mt-3 space-y-2.5 rounded-xl border border-border/70 bg-background/60 p-4 max-h-80 overflow-y-auto">
            {podcast.dialogue.map((item: any, idx: number) => {
              const isInstructor = item.role === "instructor";
              return (
                <div
                  key={idx}
                  className={`rounded-xl p-3 text-xs leading-relaxed border transition-colors ${
                    isInstructor
                      ? "border-primary/20 bg-primary/5 hover:border-primary/40"
                      : "border-border/60 bg-secondary/30 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-bold ${
                        isInstructor ? "text-primary" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {item.speaker}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {isInstructor ? "• أستاذ المقرر" : "• طالب ماجستير"}
                    </span>
                  </div>
                  <p className="text-foreground/90">{item.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
