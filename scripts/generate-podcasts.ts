/** Legacy entry point: generation is disabled; validate manual files only. */
import { checkPodcasts } from "./check-podcasts.mjs";

console.log("Podcast generation is disabled. Using manually supplied audio and transcripts.");
try { checkPodcasts(); }
catch (error) { console.error(error instanceof Error ? error.message : "Validation failed"); process.exitCode = 1; }
