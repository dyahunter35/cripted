#!/usr/bin/env python3
"""Generate high-fidelity Neural AI spoken Arabic podcasts using Neural voices (no robotic Mac voices)."""

import asyncio
import json
import os
import subprocess
import tempfile
import sys
import edge_tts

AUDIO_DIR = os.path.abspath("public/audio")
OUT_AUDIO_DIR = os.path.abspath("out/audio")
PODCASTS_FILE = os.path.abspath("src/content/podcasts.json")

os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(OUT_AUDIO_DIR, exist_ok=True)

# Acoustic intro chime (gentle harp/sine chord)
INTRO_MP3 = "/tmp/podcast_intro.mp3"
if not os.path.exists(INTRO_MP3):
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "sine=frequency=587.33:duration=1.2,afade=t=in:st=0:d=0.2,afade=t=out:st=0.8:d=0.4,volume=0.35",
        "-c:a", "libmp3lame", "-b:a", "128k", INTRO_MP3
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

# 0.5s natural conversational pause
PAUSE_MP3 = "/tmp/podcast_pause.mp3"
if not os.path.exists(PAUSE_MP3):
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "anullsrc=r=24000:cl=mono",
        "-t", "0.55", "-c:a", "libmp3lame", "-b:a", "128k", PAUSE_MP3
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)


async def synthesize_neural_turn(text: str, role: str, speaker: str, output_path: str):
    """Synthesize Arabic speech with high-grade Deep Neural AI voice."""
    if "student" in role.lower() or "يوسف" in speaker:
        voice = "ar-JO-TaimNeural"   # Young, inquisitive, intelligent Arabic student
        rate = "+3%"
        pitch = "+0Hz"
    else:
        voice = "ar-SA-HamedNeural"  # Prestigious, clear, authoritative Arabic professor
        rate = "-2%"
        pitch = "-2Hz"

    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=rate,
        pitch=pitch,
    )
    await communicate.save(output_path)


async def generate_episode(slug: str):
    with open(PODCASTS_FILE, "r", encoding="utf-8") as f:
        podcasts = json.load(f)

    if slug not in podcasts:
        print(f"Error: Slug {slug} not found in podcasts.json")
        return

    ep = podcasts[slug]
    title = ep.get("title", slug)
    audio_file = ep.get("audioFile", f"{slug}_podcast.mp3")
    dialogue = ep.get("dialogue", [])

    print(f"\n========================================================")
    print(f"🎙️ Generating Neural AI Podcast for: [{slug.upper()}]")
    print(f"   Title: {title}")
    print(f"   Turns: {len(dialogue)}")
    print(f"========================================================")

    turn_files = []
    turn_files.append(INTRO_MP3)

    for idx, turn in enumerate(dialogue):
        speaker = turn.get("speaker", "المحاضر")
        role = turn.get("role", "instructor")
        text = turn.get("text", "")
        if not text.strip():
            continue

        turn_mp3 = f"/tmp/neural_turn_{slug}_{idx}.mp3"
        print(f"  [{idx+1}/{len(dialogue)}] ({speaker} - {role}): {text[:50]}...")
        await synthesize_neural_turn(text, role, speaker, turn_mp3)
        turn_files.append(turn_mp3)
        turn_files.append(PAUSE_MP3)

    # Concat files via FFmpeg
    concat_list = f"/tmp/concat_{slug}.txt"
    with open(concat_list, "w") as f:
        for tf in turn_files:
            f.write(f"file '{tf}'\n")

    out_public_path = os.path.join(AUDIO_DIR, audio_file)
    out_dist_path = os.path.join(OUT_AUDIO_DIR, audio_file)

    cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list,
        "-c:a", "libmp3lame", "-qscale:a", "2",
        out_public_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    subprocess.run(["cp", out_public_path, out_dist_path], check=False)

    # Clean up temp turn files
    for tf in turn_files:
        if tf not in (INTRO_MP3, PAUSE_MP3) and os.path.exists(tf):
            os.remove(tf)
    if os.path.exists(concat_list):
        os.remove(concat_list)

    size_kb = os.path.getsize(out_public_path) // 1024
    print(f"✅ Saved Neural Podcast for {slug.upper()}: {out_public_path} ({size_kb} KB)")


async def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "aes"
    if target == "all":
        with open(PODCASTS_FILE, "r", encoding="utf-8") as f:
            podcasts = json.load(f)
        for slug in podcasts.keys():
            await generate_episode(slug)
    else:
        await generate_episode(target)

if __name__ == "__main__":
    asyncio.run(main())
