/** Read-only validation of manually supplied podcasts. No generation or API calls. */
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

export function checkPodcasts() {
  const manifest = JSON.parse(readFileSync(path.join(root, "src/content/podcasts.json"), "utf8"));
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Invalid podcast manifest");
  }
  for (const [slug, entry] of Object.entries(manifest)) {
    const filename = entry?.audioFile;
    if (typeof filename !== "string" || path.basename(filename) !== filename) {
      throw new Error(`Invalid audio filename for ${slug}`);
    }
    const audio = statSync(path.join(root, "public/audio", filename));
    if (!audio.isFile() || !audio.size) throw new Error(`Missing audio for ${slug}`);
    if (!Array.isArray(entry.transcript) && !Array.isArray(entry.dialogue)) {
      throw new Error(`Missing manually supplied transcript for ${slug}`);
    }
  }
  console.log(`Validated ${Object.keys(manifest).length} manually supplied podcasts. No files changed.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { checkPodcasts(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
