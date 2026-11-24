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

export const CACHE_NAME = "crypto-lab-podcasts-v1";
const META_STORAGE_KEY = "crypto_lab_cached_podcasts_meta";

const KNOWN_PODCASTS: Record<
  string,
  { title: string; subtitle: string; duration: string; durationSeconds: number; audioFile: string }
> = {
  des: {
    title: "معيار التشفير الكلاسيكي DES وشبكة فيستل",
    subtitle: "حوار تحليلي حول شبكة فيستل وصناديق S-Boxes ومحدودية مفتاح 56 بت",
    duration: "25:15",
    durationSeconds: 1515,
    audioFile: "des_podcast.m4a",
  },
  aes: {
    title: "معيار التشفير المتقدم AES (Rijndael)",
    subtitle: "تحليل معمارية SPN ومصفوفة الحالة والعمليات الجبرية في حقل غالوا GF(2^8)",
    duration: "21:03",
    durationSeconds: 1263,
    audioFile: "aes_podcast.m4a",
  },
  gost: {
    title: "المعيار السوفيتي الروسي GOST Magma",
    subtitle: "دراسة معمارية الـ 32 دورة والمفتاح السيادي 256 بت",
    duration: "12:31",
    durationSeconds: 751,
    audioFile: "gost_podcast.m4a",
  },
  idea: {
    title: "خوارزمية التشفير الدولية IDEA وتطبيق PGP",
    subtitle: "خلط الزمر الجبرية الثلاث غير المتوافقة ومخطط Lai-Massey",
    duration: "22:29",
    durationSeconds: 1349,
    audioFile: "idea_podcast.m4a",
  },
  rc4: {
    title: "خوارزمية التشفير الانسيابي RC4 والتبديل العشوائي PRGA",
    subtitle: "مصفوفة الحالة S-Box ومشاكل المفتاح الضعيف WEP",
    duration: "11:20",
    durationSeconds: 680,
    audioFile: "rc4_podcast.mp3",
  },
  rc5: {
    title: "خوارزمية التشفير المتغير RC5 والدوران المعتمد على البيانات",
    subtitle: "توسيع المفتاح بالثوابت الذهبية P و Q والعمليات السريعة",
    duration: "09:40",
    durationSeconds: 580,
    audioFile: "rc5_podcast.mp3",
  },
  rc6: {
    title: "خوارزمية التشفير المتقدمة RC6 والدوران المعتمد على الدالة التربيعية",
    subtitle: "استخدام الضرب النمطي لتعزيز اللاخطية ومقاومة الهجمات التفاضلية",
    duration: "10:58",
    durationSeconds: 658,
    audioFile: "rc6_podcast.mp3",
  },
  cast: {
    title: "معيار التشفير CAST-128 ودوال فايستل غير المتجانسة",
    subtitle: "صناديق الاستبدال المنحنية والمفاتيح الفرعية المعقدة",
    duration: "10:24",
    durationSeconds: 624,
    audioFile: "cast_podcast.mp3",
  },
  blowfish: {
    title: "خوارزمية Blowfish وصناديق S-Boxes المعتمدة على المفتاح",
    subtitle: "أمان متين بكتل 64 بت وتوسيع مفتاح يعتمد على أرقام Pi",
    duration: "12:10",
    durationSeconds: 730,
    audioFile: "blowfish_podcast.mp3",
  },
};

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
export function saveCachedPodcastsMeta(list: CachedPodcastMeta[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("crypto-lab:cache-updated"));
  } catch (err) {
    console.error("Error saving cached podcasts meta:", err);
  }
}

/**
 * Synchronize CacheStorage with localStorage and return validated cached metadata.
 */
export async function syncAndGetCachedPodcasts(): Promise<CachedPodcastMeta[]> {
  if (!isCacheStorageSupported()) {
    return getCachedPodcastsMeta();
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    const storedMetas = getCachedPodcastsMeta();
    const validatedMetas: CachedPodcastMeta[] = [];

    // Check each request in CacheStorage
    for (const req of requests) {
      const url = req.url;
      // Extract slug from URL pattern
      let matchedSlug: string | null = null;
      for (const slug of Object.keys(KNOWN_PODCASTS)) {
        if (url.includes(`${slug}_podcast`)) {
          matchedSlug = slug;
          break;
        }
      }

      if (matchedSlug) {
        // Find existing meta or create from known catalog
        const existing = storedMetas.find((m) => m.slug === matchedSlug);
        const known = KNOWN_PODCASTS[matchedSlug];
        
        let sizeBytes = existing?.sizeBytes || 0;
        if (!sizeBytes) {
          const resp = await cache.match(req);
          if (resp) {
            const blob = await resp.blob();
            sizeBytes = blob.size;
          }
        }

        validatedMetas.push({
          slug: matchedSlug,
          title: existing?.title || known?.title || `${matchedSlug.toUpperCase()} Podcast`,
          subtitle: existing?.subtitle || known?.subtitle,
          duration: existing?.duration || known?.duration || "00:00",
          durationSeconds: existing?.durationSeconds || known?.durationSeconds || 0,
          audioFile: existing?.audioFile || known?.audioFile || `${matchedSlug}_podcast.m4a`,
          sizeBytes: sizeBytes,
          cachedAt: existing?.cachedAt || Date.now(),
        });
      }
    }

    // Deduplicate by slug
    const uniqueMetas: CachedPodcastMeta[] = [];
    const seenSlugs = new Set<string>();
    for (const item of validatedMetas) {
      if (!seenSlugs.has(item.slug)) {
        seenSlugs.add(item.slug);
        uniqueMetas.push(item);
      }
    }

    // Update localStorage if list changed
    if (JSON.stringify(uniqueMetas) !== JSON.stringify(storedMetas)) {
      saveCachedPodcastsMeta(uniqueMetas);
    }

    return uniqueMetas;
  } catch (err) {
    console.error("Error syncing cached podcasts:", err);
    return getCachedPodcastsMeta();
  }
}

/**
 * Check if a specific algorithm's podcast is currently stored in CacheStorage.
 */
export async function isPodcastCached(slug: string): Promise<boolean> {
  if (!isCacheStorageSupported()) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const hasKey = keys.some((k) => k.url.includes(`${slug}_podcast`));
    if (hasKey) return true;
  } catch {
    // fallback
  }
  const metas = getCachedPodcastsMeta();
  return metas.some((m) => m.slug === slug);
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
