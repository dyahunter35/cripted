/** Owns one media element. Seeking never loads audio; only play() may set src. */
export class PodcastSession {
  private disposed = false;
  private request = 0;
  private loading: Promise<void> | null = null;
  private blobUrl: string | null = null;
  private pendingSeek: number | null = null;
  constructor(
    private audio: HTMLAudioElement,
    private remoteUrl: string,
    private resolveCachedUrl: () => Promise<string | null>,
    private revokeUrl: (url: string) => void = url => URL.revokeObjectURL(url),
  ) {
    audio.addEventListener("loadedmetadata", this.applySeek);
  }
  private applySeek = () => {
    if (this.pendingSeek !== null && this.audio.readyState >= 1) {
      this.audio.currentTime = this.pendingSeek;
      this.pendingSeek = null;
    }
  };
  seek(time: number) {
    if (this.disposed || !Number.isFinite(time)) return;
    this.pendingSeek = Math.max(0, time);
    if (this.audio.getAttribute("src")) this.applySeek();
  }
  async play(): Promise<void> {
    if (this.disposed) return;
    const request = ++this.request;
    if (!this.audio.getAttribute("src")) {
      this.loading ??= (async () => {
        const cached = await this.resolveCachedUrl();
        if (this.disposed) {
          if (cached?.startsWith("blob:")) this.revokeUrl(cached);
          return;
        }
        this.blobUrl = cached?.startsWith("blob:") ? cached : null;
        this.audio.src = cached || this.remoteUrl;
      })().finally(() => { this.loading = null; });
      await this.loading;
    }
    if (this.disposed || request !== this.request) return;
    this.applySeek();
    await this.audio.play();
  }
  pause() {
    ++this.request;
    this.audio.pause();
  }
  /** Adopt a completed offline copy only for media already initialized by Play. */
  async useCachedSource(): Promise<void> {
    if (this.disposed || this.blobUrl || !this.audio.getAttribute("src")) return;
    const request = this.request;
    const cached = await this.resolveCachedUrl();
    if (!cached) return;
    if (this.disposed || this.blobUrl || request !== this.request) {
      if (cached.startsWith("blob:")) this.revokeUrl(cached);
      return;
    }
    const resume = !this.audio.paused;
    this.pendingSeek ??= this.audio.currentTime;
    this.audio.pause();
    this.blobUrl = cached.startsWith("blob:") ? cached : null;
    this.audio.src = cached;
    if (resume) await this.play();
  }
  dispose() {
    this.disposed = true;
    this.pause();
    this.audio.removeEventListener("loadedmetadata", this.applySeek);
    this.audio.removeAttribute("src");
    this.audio.load();
    if (this.blobUrl) this.revokeUrl(this.blobUrl);
    this.blobUrl = null;
  }
}
