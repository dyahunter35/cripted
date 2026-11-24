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

  // Compute audio URL considering Next.js basePath
  const basePath =
    process.env.NEXT_PUBLIC_BASE_PATH !== undefined
      ? process.env.NEXT_PUBLIC_BASE_PATH
      : process.env.NODE_ENV === "production"
      ? "/cripted"
      : "";

  const audioUrl = `${basePath}/audio/${podcast?.audioFile || `${algorithmSlug}_podcast.mp3`}`;

  // Handle Play with ZERO initial bandwidth: NEVER set src until Play is clicked!
  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Pause any other playing podcast on the platform
      window.dispatchEvent(new CustomEvent("crypto-lab:stop-all-audio"));

      // Set src ONLY on explicit user click!
      if (!audio.getAttribute("src")) {
        audio.src = audioUrl;
        setHasLoadedSrc(true);
      }

      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Audio play prevented or interrupted:", err);
      }
    }
  };

  // Event listener for stopping audio if another one plays
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

  // Cleanup on unmount: stop loading, clear src to prevent memory & bandwidth leaks
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
    <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 via-card to-card p-5 shadow-sm space-y-4">
      {/* Native HTML5 Audio element with MANDATORY preload="none" and NO initial src */}
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                Crypto Lab Podcast
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                0 KB Initial Data
              </span>
            </div>
            <h4 className="font-bold text-foreground text-sm sm:text-base">{podcast.title}</h4>
            <p className="text-xs text-muted-foreground">{podcast.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-mono text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{podcast.duration}</span>
          </span>
        </div>
      </div>

      {/* Player Controls Bar */}
      <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 space-y-3">
        <div className="flex items-center gap-3">
          {/* Main Play / Pause Button */}
          <button
            onClick={handleTogglePlay}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
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
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || podcast.durationSeconds)}</span>
            </div>
          </div>

          {/* Speed Button */}
          <button
            onClick={cycleSpeed}
            className="flex h-8 items-center justify-center rounded-md border border-border bg-secondary px-2 text-xs font-mono font-bold text-foreground hover:bg-secondary/80 transition-colors"
            title="سرعة التشغيل"
          >
            {playbackSpeed}×
          </button>

          {/* Mute Button */}
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
            <span>يبدأ تحميل البث الصوتي فقط عند النقر على زر التشغيل (استهلاك 0 KB قبل الضغط).</span>
          </div>
        )}
      </div>

      {/* Topics Covered Chips */}
      {podcast.topics && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-muted-foreground ml-1">المحاور:</span>
          {podcast.topics.map((topic: string, i: number) => (
            <span
              key={i}
              className="rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] text-foreground/80 font-medium"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Transcript Drawer Toggle */}
      <div className="border-t border-border/60 pt-3">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span>النص المكتوب للحلقة (Transcript Dialogue)</span>
          </div>
          {showTranscript ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {/* Dialogue View */}
        {showTranscript && podcast.dialogue && (
          <div className="mt-3 space-y-2.5 rounded-lg border border-border/70 bg-background/60 p-4 max-h-72 overflow-y-auto">
            {podcast.dialogue.map((item: any, idx: number) => {
              const isInstructor = item.role === "instructor";
              return (
                <div
                  key={idx}
                  className={`rounded-lg p-3 text-xs leading-relaxed border ${
                    isInstructor
                      ? "border-primary/20 bg-primary/5"
                      : "border-border/60 bg-secondary/40"
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
                      {isInstructor ? "(أستاذ المقرر)" : "(طالب ماجستير)"}
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
