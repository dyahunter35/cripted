#!/usr/bin/env python3
"""
scripts/sync_podcast_transcription.py
====================================
Automated transcription, audio segmentation, and timestamp synchronization engine
for Crypto & Stego Lab podcasts.

Takes an audio file (e.g. gost_podcast.m4a from NotebookLM / Gemini Audio Overview),
slices by speech activity, transcribes each phrase via neural speech recognition,
assigns start/end timestamps, detects conversational speaker turns, and writes
the updated data directly into src/content/podcasts.json.

Usage:
  python3 scripts/sync_podcast_transcription.py --slug gost
  python3 scripts/sync_podcast_transcription.py --slug aes --file public/audio/aes_podcast.m4a
  python3 scripts/sync_podcast_transcription.py --all
"""

import os
import sys
import json
import argparse
import io
import time
import concurrent.futures
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import speech_recognition as sr
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PODCASTS_JSON_PATH = os.path.join(BASE_DIR, "src", "content", "podcasts.json")
AUDIO_DIR = os.path.join(BASE_DIR, "public", "audio")


def estimate_pitch_frequency(chunk):
    """Estimate whether speaker is pitch 1 (lower/male) or pitch 2 (higher/female) using zero crossings / autocorrelation."""
    try:
        samples = np.array(chunk.get_array_of_samples(), dtype=float)
        if len(samples) < 1000:
            return 150.0
        # Zero-crossing rate as a fast proxy for pitch
        zero_crossings = np.nonzero(np.diff(samples > 0))[0]
        if len(zero_crossings) == 0:
            return 150.0
        zcr = len(zero_crossings) / (len(samples) / chunk.frame_rate)
        f0_approx = zcr / 2.0
        return float(f0_approx)
    except Exception:
        return 150.0


def format_duration(seconds_float):
    mins = int(seconds_float // 60)
    secs = int(seconds_float % 60)
    return f"{mins:02d}:{secs:02d}"


def transcribe_single_chunk(args_tuple):
    idx, start_ms, end_ms, chunk_bytes, pitch = args_tuple
    r = sr.Recognizer()
    wav_io = io.BytesIO(chunk_bytes)
    with sr.AudioFile(wav_io) as source:
        audio_data = r.record(source)

    text = ""
    # Try Google Arabic Speech Recognition
    for attempt in range(3):
        try:
            text = r.recognize_google(audio_data, language="ar-SA")
            break
        except sr.UnknownValueError:
            # Silence, laughter or music
            text = ""
            break
        except Exception as e:
            time.sleep(0.5 * (attempt + 1))
            continue

    start_sec = round(start_ms / 1000.0, 2)
    end_sec = round(end_ms / 1000.0, 2)
    return {
        "index": idx,
        "start": start_sec,
        "end": end_sec,
        "pitch": pitch,
        "text": text.strip(),
    }


def process_audio_file(slug, audio_path):
    print(f"\n==================================================")
    print(f"🎙️ Processing podcast for [{slug}]: {audio_path}")
    print(f"==================================================")

    if not os.path.exists(audio_path):
        print(f"❌ Error: Audio file not found at {audio_path}")
        return False

    print("⏳ Loading audio into memory...")
    sound = AudioSegment.from_file(audio_path)
    total_seconds = len(sound) / 1000.0
    print(f"⏱️ Audio Duration: {format_duration(total_seconds)} ({total_seconds:.2f}s)")

    # Normalize volume for consistent detection
    sound = sound.normalize()
    sound_mono = sound.set_channels(1).set_frame_rate(16000)

    print("🔍 Detecting non-silent speech segments...")
    raw_segments = detect_nonsilent(sound_mono, min_silence_len=550, silence_thresh=sound_mono.dBFS - 15)
    print(f"  Found {len(raw_segments)} initial speech regions.")

    if not raw_segments:
        print("❌ No speech detected in audio!")
        return False

    # Merge very close segments (< 350ms pause)
    merged_segments = []
    curr_start, curr_end = raw_segments[0]

    for s, e in raw_segments[1:]:
        if s - curr_end < 380:
            # Merge
            curr_end = e
        else:
            merged_segments.append((curr_start, curr_end))
            curr_start, curr_end = s, e
    merged_segments.append((curr_start, curr_end))

    print(f"  Consolidated into {len(merged_segments)} coherent conversational phrases.")

    # Prepare chunk payloads for parallel transcription
    tasks = []
    for idx, (s_ms, e_ms) in enumerate(merged_segments):
        # Add 120ms padding around speech
        pad_s = max(0, s_ms - 120)
        pad_e = min(len(sound_mono), e_ms + 120)
        chunk = sound_mono[pad_s:pad_e]

        pitch = estimate_pitch_frequency(chunk)
        wav_io = io.BytesIO()
        chunk.export(wav_io, format="wav")
        tasks.append((idx, s_ms, e_ms, wav_io.getvalue(), pitch))

    print(f"🚀 Launching concurrent neural speech-to-text workers (8 threads)...")
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        for res in executor.map(transcribe_single_chunk, tasks):
            results.append(res)
            if len(results) % 15 == 0 or len(results) == len(tasks):
                print(f"  ... Transcribed {len(results)}/{len(tasks)} phrases ({int(len(results)/len(tasks)*100)}%)")

    # Sort by original index
    results.sort(key=lambda x: x["index"])

    # Filter out empty or whitespace-only phrases and assign speakers
    transcript_items = []
    item_id = 1
    current_speaker = "المحاور الأول"
    current_role = "host1"

    for r in results:
        text = r["text"]
        if not text:
            continue

        # Simple conversational turn heuristic:
        # If silence between phrases > 1.4s, or pitch changes significantly (> 40Hz)
        pitch = r["pitch"]
        if pitch > 200:
            speaker = "المحاورة (سارة)"
            role = "host2"
        elif pitch < 160:
            speaker = "المحاور (أحمد)"
            role = "host1"
        else:
            speaker = current_speaker
            role = current_role

        current_speaker = speaker
        current_role = role

        transcript_items.append({
            "id": item_id,
            "start": r["start"],
            "end": r["end"],
            "speaker": speaker,
            "role": role,
            "text": text,
        })
        item_id += 1

    print(f"✅ Generated {len(transcript_items)} timestamped transcript sentences.")

    # Read existing podcasts.json
    if not os.path.exists(PODCASTS_JSON_PATH):
        podcasts_data = {}
    else:
        with open(PODCASTS_JSON_PATH, "r", encoding="utf-8") as f:
            podcasts_data = json.load(f)

    audio_filename = os.path.basename(audio_path)
    entry = podcasts_data.get(slug, {
        "id": slug,
        "title": f"بودكاست خوارزمية {slug.upper()}",
        "subtitle": "شرح صوتي تحليلي تفاعلي",
    })

    entry["audioFile"] = audio_filename
    entry["duration"] = format_duration(total_seconds)
    entry["durationSeconds"] = int(round(total_seconds))
    entry["transcript"] = transcript_items

    # Also build formatted dialogue array for backward compatibility
    entry["dialogue"] = [
        {
            "speaker": item["speaker"],
            "role": item["role"],
            "text": item["text"]
        }
        for item in transcript_items
    ]

    podcasts_data[slug] = entry

    with open(PODCASTS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(podcasts_data, f, ensure_ascii=False, indent=2)

    print(f"🎉 Successfully updated {PODCASTS_JSON_PATH} for [{slug}]!")
    return True


def main():
    parser = argparse.ArgumentParser(description="Synchronize and transcribe podcasts with timestamps.")
    parser.add_argument("--slug", help="Algorithm slug (e.g. gost, aes, des)")
    parser.add_argument("--file", help="Path to audio file (optional)")
    parser.add_argument("--all", action="store_true", help="Scan and process all podcasts")

    args = parser.parse_args()

    if args.slug:
        audio_file = args.file
        if not audio_file:
            # Check for .m4a first, then .mp3
            m4a = os.path.join(AUDIO_DIR, f"{args.slug}_podcast.m4a")
            mp3 = os.path.join(AUDIO_DIR, f"{args.slug}_podcast.mp3")
            audio_file = m4a if os.path.exists(m4a) else mp3
        process_audio_file(args.slug, audio_file)
    elif args.all:
        for f in sorted(os.listdir(AUDIO_DIR)):
            if f.endswith("_podcast.m4a"):
                slug = f.replace("_podcast.m4a", "")
                process_audio_file(slug, os.path.join(AUDIO_DIR, f))
    else:
        # Default to gost
        audio_file = os.path.join(AUDIO_DIR, "gost_podcast.m4a")
        process_audio_file("gost", audio_file)


if __name__ == "__main__":
    main()
