/**
 * src/lib/audio-cache.ts
 * =======================
 * Client-side multimedia caching engine for Crypto & Stego Lab.
 * Uses the Web CacheStorage API (`window.caches`) and localStorage index
 * to persist podcast audio files offline across reloads, internet disconnects,
 * and browser restarts, with byte-level progress tracking and cache management.
 */

export interface CachedPodcastMeta {
  slug: string;
  title: string;
  subtitle?: string;
  duration: string;
  durationSeconds: number;
  audioFile: string;
  sizeBytes: number;
  cachedAt: number; // Unix timestamp
}

const CACHE_NAME = "crypto-lab-podcasts-v1";
const META_STORAGE_KEY = "crypto_lab_cached_podcasts_meta";

/**
 * Check if the CacheStorage API is supported in the current browser.
 */
export function isCacheStorageSupported(): boolean {
  return typeof window !== "undefined" && "caches" in window;
}

/**
 * Get all cached podcasts metadata from localStorage.
 */
export function getCachedPodcastsMeta(): CachedPodcastMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading cached podcasts meta:", err);
    return [];
  }
}

/**
 * Save metadata list to localStorage and trigger global sync event.
 */
function saveCachedPodcastsMeta(list: CachedPodcastMeta[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("crypto-lab:cache-updated"));
  } catch (err) {
    console.error("Error saving cached podcasts meta:", err);
  }
}

/**
 * Check if a specific algorithm's podcast is currently stored in CacheStorage.
 */
export async function isPodcastCached(slug: string): Promise<boolean> {
  if (!isCacheStorageSupported()) return false;
  const metas = getCachedPodcastsMeta();
  const exists = metas.some((m) => m.slug === slug);
  if (!exists) return false;

  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    return keys.some((k) => k.url.includes(`${slug}_podcast`));
  } catch {
    return false;
  }
}

/**
 * Retrieve a local object URL from CacheStorage if cached, or null.
 */
export async function getCachedAudioUrl(
  slug: string,
  remoteUrl: string
): Promise<string | null> {
  if (!isCacheStorageSupported()) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(remoteUrl);
    if (!response) {
      // Also try matching by filename substring
      const keys = await cache.keys();
      const matchKey = keys.find((k) => k.url.includes(`${slug}_podcast`));
      if (matchKey) {
        const matchRes = await cache.match(matchKey);
        if (matchRes) {
          const blob = await matchRes.blob();
          return URL.createObjectURL(blob);
        }
      }
      return null;
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn("Failed to get cached audio URL:", err);
    return null;
  }
}

/**
 * Download and permanently store an audio file in CacheStorage with streaming progress.
 */
export async function downloadAndCachePodcast(
  slug: string,
  remoteUrl: string,
  meta: {
    title: string;
    subtitle?: string;
    duration: string;
    durationSeconds: number;
    audioFile: string;
  },
  onProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void
): Promise<boolean> {
  if (!isCacheStorageSupported()) {
    console.warn("CacheStorage not supported.");
    return false;
  }

  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentLength = response.headers.get("Content-Length");
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

    let loadedBytes = 0;
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loadedBytes += value.length;
          if (totalBytes > 0 && onProgress) {
            const pct = Math.min(100, Math.round((loadedBytes / totalBytes) * 100));
            onProgress(pct, loadedBytes, totalBytes);
          }
        }
      }
    }

    const mimeType = remoteUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg";
    const audioBlob = new Blob(chunks as BlobPart[], { type: mimeType });
    const cacheResponse = new Response(audioBlob, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": audioBlob.size.toString(),
      },
    });

    const cache = await caches.open(CACHE_NAME);
    await cache.put(remoteUrl, cacheResponse);

    // Update metadata index
    const metas = getCachedPodcastsMeta().filter((m) => m.slug !== slug);
    metas.push({
      slug,
      title: meta.title,
      subtitle: meta.subtitle,
      duration: meta.duration,
      durationSeconds: meta.durationSeconds,
      audioFile: meta.audioFile,
      sizeBytes: audioBlob.size,
      cachedAt: Date.now(),
    });
    saveCachedPodcastsMeta(metas);

    if (onProgress) {
      onProgress(100, audioBlob.size, audioBlob.size);
    }
    return true;
  } catch (err) {
    console.error("Failed to download and cache podcast:", err);
    return false;
  }
}

/**
 * Delete a specific podcast from CacheStorage and remove from metadata index.
 */
export async function deleteCachedPodcast(
  slug: string,
  remoteUrl?: string
): Promise<boolean> {
  if (!isCacheStorageSupported()) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    for (const key of keys) {
      if (
        (remoteUrl && key.url === remoteUrl) ||
        key.url.includes(`${slug}_podcast`)
      ) {
        await cache.delete(key);
      }
    }

    const metas = getCachedPodcastsMeta().filter((m) => m.slug !== slug);
    saveCachedPodcastsMeta(metas);
    return true;
  } catch (err) {
    console.error("Error deleting cached podcast:", err);
    return false;
  }
}

/**
 * Clear all cached podcasts completely.
 */
export async function clearAllCachedPodcasts(): Promise<boolean> {
  if (!isCacheStorageSupported()) return false;
  try {
    await caches.delete(CACHE_NAME);
    saveCachedPodcastsMeta([]);
    return true;
  } catch (err) {
    console.error("Error clearing all cached podcasts:", err);
    return false;
  }
}

/**
 * Format bytes into human-readable string (e.g. 15.2 MB).
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}
