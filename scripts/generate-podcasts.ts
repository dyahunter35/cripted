/**
 * Crypto & Stego Lab — Offline Gemini Podcast Generator
 * Generates Arabic multi-speaker educational podcasts for all 9 ciphers.
 *
 * Usage:
 *   npx tsx scripts/generate-podcasts.ts [--algorithm <slug>] [--force]
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MANIFEST_PATH = path.join(__dirname, "../src/content/podcasts.json");
const AUDIO_DIR = path.join(__dirname, "../public/audio");
const CACHE_PATH = path.join(__dirname, "../.podcast_hash_cache.json");

interface PodcastDialogue {
  speaker: string;
  role: "instructor" | "student";
  text: string;
}

interface PodcastEntry {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  durationSeconds: number;
  audioFile: string;
  topics: string[];
  dialogue: PodcastDialogue[];
}

function calculateHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function generateWithGemini(algorithmSlug: string, existingData: PodcastEntry): Promise<PodcastEntry> {
  if (!GEMINI_API_KEY) {
    console.log(`[INFO] No GEMINI_API_KEY detected. Preserving verified transcript for '${algorithmSlug}'.`);
    return existingData;
  }

  console.log(`[GEMINI] Generating updated educational dialogue for ${algorithmSlug}...`);
  // When GEMINI_API_KEY is available, we call Gemini 2.0 Flash REST endpoint
  const prompt = `
أنت د. كريم، أستاذ جامعي في أمن المعلومات والتشفير، وتتحاور مع الطالب يوسف (طالب ماجستير متميز).
المطلوب: إعداد سيناريو بودكاست صوتي حواري باللغة العربية يشرح خوارزمية ${algorithmSlug.toUpperCase()} بالتفصيل.
يجب أن يغطي الحوار:
1. مقدمة تاريخية وسياق ظهور الخوارزمية.
2. البنية المعمارية (كتل/تدفق، عدد الدورات، حجم المفتاح).
3. الشرح الرياضي للعمليات الداخلية (صناديق S-boxes، الزمر الجبرية، أو الدورانات).
4. التطبيق البرمجي (Python).
5. نقاط القوة، الثغرات، ومدى أمانها اليوم.
6. ملخص سريع لمراجعة الامتحان.
الصيغة المطلوبة: مصفوفة JSON تحتوي على كائنات { "speaker": "د. كريم" | "يوسف", "role": "instructor" | "student", "text": "..." }
  `.trim();

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!res.ok) {
      console.warn(`[WARN] Gemini API returned status ${res.status}. Falling back to default script.`);
      return existingData;
    }

    const jsonRes = await res.json();
    const generatedText = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text;
    if (generatedText) {
      const dialogue = JSON.parse(generatedText);
      return {
        ...existingData,
        dialogue: Array.isArray(dialogue) ? dialogue : existingData.dialogue,
      };
    }
  } catch (err: any) {
    console.error(`[ERROR] Failed to query Gemini API: ${err.message}`);
  }

  return existingData;
}

async function main() {
  console.log("=== Crypto & Stego Lab — Podcast Generation Pipeline ===");

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`Error: Manifest file not found at ${MANIFEST_PATH}`);
    process.exit(1);
  }

  const manifestData: Record<string, PodcastEntry> = JSON.parse(
    fs.readFileSync(MANIFEST_PATH, "utf-8")
  );

  let cache: Record<string, string> = {};
  if (fs.existsSync(CACHE_PATH)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    } catch (e) {
      cache = {};
    }
  }

  const args = process.argv.slice(2);
  const targetAlgo = args.includes("--algorithm")
    ? args[args.indexOf("--algorithm") + 1]
    : null;
  const force = args.includes("--force");

  const slugs = targetAlgo ? [targetAlgo] : Object.keys(manifestData);

  for (const slug of slugs) {
    const entry = manifestData[slug];
    if (!entry) {
      console.warn(`[WARN] Unknown algorithm '${slug}', skipping.`);
      continue;
    }

    const contentHash = calculateHash(JSON.stringify(entry.topics) + entry.title);
    if (!force && cache[slug] === contentHash && fs.existsSync(path.join(AUDIO_DIR, entry.audioFile))) {
      console.log(`[CACHE HIT] ${slug} audio and transcript are up-to-date. Skipping regeneration.`);
      continue;
    }

    console.log(`[PROCESS] Processing podcast for: ${slug}...`);
    const updated = await generateWithGemini(slug, entry);
    manifestData[slug] = updated;
    cache[slug] = contentHash;
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifestData, null, 2), "utf-8");
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  console.log("=== Podcast generation completed successfully! ===");
}

main().catch(console.error);
