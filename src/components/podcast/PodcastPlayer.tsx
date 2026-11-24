"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Activity,
  Search,
  Check,
} from "lucide-react";
import podcastsData from "@/content/podcasts.json";

interface PodcastPlayerProps {
  algorithmSlug: string;
}

interface TranscriptSentence {
  id?: number;
  start: number;
  end: number;
  speaker: string;
  role?: string;
  text: string;
}

export function PodcastPlayer({ algorithmSlug }: PodcastPlayerProps) {
  const podcast = (podcastsData as Record<string, any>)[algorithmSlug];

  const audioRef = useRef<HTMLAudioElement>(null);
  const activeSentenceRef = useRef<HTMLDivElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(podcast?.durationSeconds || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLoadedSrc, setHasLoadedSrc] = useState(false);

  const basePath =
    process.env.NEXT_PUBLIC_BASE_PATH !== undefined
      ? process.env.NEXT_PUBLIC_BASE_PATH
      : process.env.NODE_ENV === "production"
      ? "/cripted"
      : "";

  const audioUrl = `${basePath}/audio/${podcast?.audioFile || `${algorithmSlug}_podcast.mp3`}`;

  // Normalized transcript: use real neural transcript if available, or generate estimated timeline from dialogue
  const transcript: TranscriptSentence[] = useMemo(() => {
    if (!podcast) return [];
    if (podcast.transcript && Array.isArray(podcast.transcript) && podcast.transcript.length > 0) {
      return podcast.transcript;
    }
    // Fallback: estimate timestamps from dialogue based on average reading rate (~2.5 words per sec)
    if (podcast.dialogue && Array.isArray(podcast.dialogue)) {
      let cumulativeTime = 0.0;
      return podcast.dialogue.map((item: any, idx: number) => {
        const words = (item.text || "").trim().split(/\s+/).length;
        const estDuration = Math.max(2.5, words / 2.6);
        const start = Math.round(cumulativeTime * 10) / 10;
        const end = Math.round((cumulativeTime + estDuration) * 10) / 10;
        cumulativeTime += estDuration + 0.4;
        return {
          id: idx + 1,
          start,
          end,
          speaker: item.speaker || (item.role === "instructor" ? "د. كريم" : "يوسف"),
          role: item.role || "host",
          text: item.text,
        };
      });
    }
    return [];
  }, [podcast]);

  // Find currently active sentence based on audio currentTime
  const activeIndex = useMemo(() => {
    if (!transcript.length) return -1;
    return transcript.findIndex(
      (item) => currentTime >= item.start && currentTime <= item.end
    );
  }, [transcript, currentTime]);

  const activeSentence = activeIndex !== -1 ? transcript[activeIndex] : null;

  // Auto-scroll transcript container to keep the active sentence smoothly visible
  useEffect(() => {
    if (!autoScroll || !activeSentenceRef.current || !transcriptContainerRef.current) return;
    activeSentenceRef.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [activeIndex, autoScroll]);

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

  // Jump audio position directly to sentence start time
  const handleSeekToSentence = async (startTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.getAttribute("src")) {
      audio.src = audioUrl;
      setHasLoadedSrc(true);
    }

    audio.currentTime = startTime;
    setCurrentTime(startTime);

    if (!isPlaying) {
      window.dispatchEvent(new CustomEvent("crypto-lab:stop-all-audio"));
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

  const filteredTranscript = useMemo(() => {
    if (!searchQuery.trim()) return transcript;
    const q = searchQuery.toLowerCase();
    return transcript.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        item.speaker.toLowerCase().includes(q)
    );
  }, [transcript, searchQuery]);

  if (!podcast) return null;

  return (
    <div className="rounded-2xl border border-primary/25 bg-card p-5 sm:p-6 shadow-sm space-y-5">
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
              {podcast.audioFile?.endsWith(".m4a") && (
                <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  NotebookLM Audio Overview
                </span>
              )}
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
      <div className="flex items-center justify-center gap-1 h-8 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 overflow-hidden">
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
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
            />
          );
        })}
      </div>

      {/* Cyber Player Console Bar */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
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
            <span>يبدأ تحميل البث الصوتي تدريجياً فقط بعد النقر على زر التشغيل أو اختيار أي جملة (0 KB مستهلكة قبل الضغط).</span>
          </div>
        )}
      </div>

      {/* 📺 Live Subtitles Box (الترجمة الحية المتزامنة أسفل عناصر التحكم مباشرة) */}
      <div className="rounded-xl border border-primary/30 bg-slate-50/80 dark:bg-slate-900/80 p-4 shadow-xs transition-all">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-border text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? "bg-emerald-400" : "bg-slate-400"} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? "bg-emerald-500" : "bg-slate-400"}`} />
            </span>
            <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>الترجمة الفورية المتزامنة (Live Subtitles)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeSentence && (
              <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[11px] font-mono font-bold">
                {activeSentence.speaker}
              </span>
            )}
            <span className="text-[11px] font-mono text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration || podcast.durationSeconds)}
            </span>
          </div>
        </div>

        <div className="pt-3 min-h-[52px] flex items-center justify-center text-center">
          {activeSentence ? (
            <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed animate-in fade-in-50 duration-200">
              {activeSentence.text}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground italic flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              <span>
                {isPlaying
                  ? "استمع إلى سياق الحديث..."
                  : "اضغط تشغيل أو اختر أي سطر في السلسلة الزمنية بالأسفل للانتقال الفوري إليه."}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* 📜 Interactive Timeline Transcript Drawer (السلسلة الزمنية الكاملة مع التنقل التلقائي والنقر للانتقال) */}
      <div className="border-t border-border pt-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>السلسلة الزمنية والنص المكتوب الكامل ({transcript.length} جملة متزامنة)</span>
            {showTranscript ? <ChevronUp className="h-3.5 w-3.5 mr-1" /> : <ChevronDown className="h-3.5 w-3.5 mr-1" />}
          </button>

          {showTranscript && (
            <div className="flex items-center gap-2">
              {/* Auto Scroll Toggle */}
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                  autoScroll
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-secondary text-muted-foreground border-border"
                }`}
                title="تفعيل أو تعطيل التمرير التلقائي لملاحقة السطر الحالي"
              >
                <Activity className="h-3 w-3" />
                <span>التتبع التلقائي: {autoScroll ? "مفعّل" : "متوقف"}</span>
              </button>

              {/* Search Inside Transcript */}
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3 w-3 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="بحث في كلام البودكاست..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 w-36 sm:w-48 rounded-lg border border-border bg-card pl-7 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                />
              </div>
            </div>
          )}
        </div>

        {/* Timeline Items List */}
        {showTranscript && (
          <div
            ref={transcriptContainerRef}
            className="space-y-2 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/50 p-3 sm:p-4 max-h-96 overflow-y-auto"
          >
            {filteredTranscript.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                لا توجد جمل تطابق بحثك: &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredTranscript.map((item, idx) => {
                const isActive = activeIndex !== -1 && transcript[activeIndex]?.id === item.id;
                return (
                  <div
                    key={item.id || idx}
                    ref={isActive ? activeSentenceRef : null}
                    onClick={() => handleSeekToSentence(item.start)}
                    className={`group cursor-pointer rounded-xl p-3 text-xs leading-relaxed border transition-all duration-200 ${
                      isActive
                        ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs"
                        : "border-border/70 bg-card hover:border-primary/40 hover:bg-card/90"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                            isActive
                              ? "bg-primary text-white"
                              : "bg-secondary text-foreground"
                          }`}
                        >
                          {item.speaker}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            <Radio className="h-3 w-3 animate-pulse" />
                            <span>يتحدث الآن</span>
                          </span>
                        )}
                      </div>

                      {/* Click to Seek Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeekToSentence(item.start);
                        }}
                        className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground group-hover:text-primary bg-secondary/80 hover:bg-primary/10 px-2.5 py-0.5 rounded-md transition-colors"
                        title="انقر للاستماع إلى هذه الجملة"
                      >
                        <Play className="h-2.5 w-2.5" />
                        <span>{formatTime(item.start)}</span>
                      </button>
                    </div>

                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${
                        isActive ? "font-bold text-foreground" : "text-foreground/85"
                      }`}
                    >
                      {item.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
