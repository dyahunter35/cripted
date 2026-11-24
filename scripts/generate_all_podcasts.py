#!/usr/bin/env python3
"""Generate genuine spoken Arabic podcast MP3s for all 9 ciphers using macOS Majed voice and FFmpeg."""

import json
import os
import subprocess
import tempfile
import sys

AUDIO_DIR = os.path.abspath("public/audio")
OUT_AUDIO_DIR = os.path.abspath("out/audio")
PODCASTS_FILE = os.path.abspath("src/content/podcasts.json")

os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(OUT_AUDIO_DIR, exist_ok=True)

# Generate intro chime (gentle academic chord)
INTRO_WAV = "/tmp/podcast_intro.wav"
subprocess.run([
    "ffmpeg", "-y", "-f", "lavfi",
    "-i", "sine=frequency=523.25:duration=0.8,afade=t=out:st=0.5:d=0.3,volume=0.3",
    "-ar", "22050", INTRO_WAV
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

SILENCE_WAV = "/tmp/podcast_silence.wav"
subprocess.run([
    "ffmpeg", "-y", "-f", "lavfi",
    "-i", "anullsrc=r=22050:cl=mono",
    "-t", "0.45", SILENCE_WAV
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)


def synthesize_turn(text, speaker, output_wav):
    """Synthesize Arabic text using say -v Majed with pitch and tempo variations."""
    temp_aiff = tempfile.mktemp(suffix=".aiff")
    # Clean text: remove special characters that might trip up say
    clean_text = text.replace("$", "").replace("GF(2^8)", "جي إف اثنين أس ثمانية").replace("XOR", "إكس أور").replace("S-Box", "إس بوكس").replace("DES", "دي إي إس").replace("AES", "إيه إي إس")
    
    rate = "175"
    if "يوسف" in speaker or "طالب" in speaker:
        rate = "190"
        filter_str = "asetrate=22050*1.12,atempo=1/1.12,volume=1.0"
    else:
        rate = "165"
        filter_str = "asetrate=22050*0.96,atempo=1/0.96,volume=1.0"

    # 1. macOS say command
    say_cmd = ["say", "-v", "Majed", "-r", rate, clean_text, "-o", temp_aiff]
    res = subprocess.run(say_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        # Fallback without custom rate
        subprocess.run(["say", "-v", "Majed", clean_text, "-o", temp_aiff], check=True)

    # 2. FFmpeg filter to adjust pitch/rate and convert to wav 22050Hz mono
    ff_cmd = [
        "ffmpeg", "-y", "-i", temp_aiff,
        "-filter:a", filter_str,
        "-ar", "22050", "-ac", "1", output_wav
    ]
    subprocess.run(ff_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    if os.path.exists(temp_aiff):
        os.remove(temp_aiff)


def build_episode(slug, episode_data):
    title = episode_data.get("title", slug)
    audio_file = episode_data.get("audioFile", f"{slug}_podcast.mp3")
    dialogue = episode_data.get("dialogue", [])
    
    print(f"--> Generating podcast for {slug}: {title} ({len(dialogue)} turns)...")
    
    turn_files = []
    # Add intro chime
    turn_files.append(INTRO_WAV)
    
    for idx, turn in enumerate(dialogue):
        speaker = turn.get("speaker", "المحاضر")
        text = turn.get("text", "")
        if not text.strip():
            continue
        turn_wav = f"/tmp/turn_{slug}_{idx}.wav"
        synthesize_turn(text, speaker, turn_wav)
        turn_files.append(turn_wav)
        turn_files.append(SILENCE_WAV)

    # Concat all wavs into a final MP3
    concat_list_file = f"/tmp/concat_{slug}.txt"
    with open(concat_list_file, "w") as f:
        for tf in turn_files:
            f.write(f"file '{tf}'\n")

    out_mp3_path = os.path.join(AUDIO_DIR, audio_file)
    concat_cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list_file,
        "-codec:a", "libmp3lame", "-qscale:a", "4",
        out_mp3_path
    ]
    subprocess.run(concat_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    # Copy to out directory as well
    out_dir_file = os.path.join(OUT_AUDIO_DIR, audio_file)
    subprocess.run(["cp", out_mp3_path, out_dir_file], check=False)

    # Clean up temp turn wavs
    for tf in turn_files:
        if tf not in (INTRO_WAV, SILENCE_WAV) and os.path.exists(tf):
            os.remove(tf)
    if os.path.exists(concat_list_file):
        os.remove(concat_list_file)

    size_kb = os.path.getsize(out_mp3_path) // 1024
    print(f"    [OK] Saved {out_mp3_path} ({size_kb} KB)")


def main():
    with open(PODCASTS_FILE, "r", encoding="utf-8") as f:
        podcasts = json.load(f)

    for slug, ep in podcasts.items():
        build_episode(slug, ep)

    print("\nAll spoken Arabic podcast MP3s successfully generated!")

if __name__ == "__main__":
    main()
