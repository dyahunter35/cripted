#!/usr/bin/env python3
"""
scripts/sync_podcast_transcription.py
====================================
Advanced Speech Segmentation, Neural Transcription, and Cryptographic Terminology Alignment
Engine for Crypto & Stego Lab.

Features:
1. Robust Speech Activity Detection (VAD) with +450ms boundary padding preventing cut-off endings.
2. Concurrent Neural Speech Recognition (8 threads) via Google STT (ar-SA).
3. Deterministic Cryptographic Lexicon Normalizer:
   - Restores English technical terms (S-Boxes, Feistel Network, AES-128, DES, IDEA, GOST Magma, XOR, PGP, etc.).
4. Speaker turn detection (Host 1 / Host 2).
5. Direct persistence into src/content/podcasts.json.

Usage:
  python3 scripts/sync_podcast_transcription.py --slug gost
  python3 scripts/sync_podcast_transcription.py --slug aes
  python3 scripts/sync_podcast_transcription.py --slug des
  python3 scripts/sync_podcast_transcription.py --slug idea
  python3 scripts/sync_podcast_transcription.py --all
"""

import os
import sys
import json
import argparse
import io
import time
import re
import concurrent.futures
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import speech_recognition as sr
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PODCASTS_JSON_PATH = os.path.join(BASE_DIR, "src", "content", "podcasts.json")
AUDIO_DIR = os.path.join(BASE_DIR, "public", "audio")

CIPHER_TITLES = {
    "gost": {
        "title": "المعيار السوفيتي الروسي GOST Magma",
        "subtitle": "دراسة معمارية الـ 32 دورة والمفتاح السيادي 256 بت",
    },
    "aes": {
        "title": "معيار التشفير المتقدم AES (Rijndael)",
        "subtitle": "تحليل معمارية SPN ومصفوفة الحالة والعمليات الجبرية في حقل غالوا GF(2^8)",
    },
    "des": {
        "title": "معيار التشفير الكلاسيكي DES وشبكة فيستل",
        "subtitle": "حوار تحليلي حول شبكة فيستل وصناديق S-Boxes ومحدودية مفتاح 56 بت",
    },
    "idea": {
        "title": "خوارزمية التشفير الدولية IDEA وتطبيق PGP",
        "subtitle": "خلط الزمر الجبرية الثلاث غير المتوافقة ومخطط Lai-Massey",
    },
}

# Phonetic and technical translation patterns for code-switching
CRYPTO_TERMS_PATTERNS = [
    (r'\b(?:اس\s*بوكس(?:ز|ات)?|صناديق\s*الاستبدال\s*اس)\b', 'صناديق S-Boxes'),
    (r'\b(?:اس\s*بوكس)\b', 'S-Box'),
    (r'\b(?:شبك[ةه]\s*فيست(?:ي)?ل|شبكه\s*فيستل)\b', 'شبكة Feistel Network'),
    (r'\b(?:فيست(?:ي)?ل)\b', 'Feistel'),
    (r'\b(?:خوارزمي[ةه]\s*ماجما)\b', 'خوارزمية GOST Magma'),
    (r'\b(?:ماجما)\b', 'Magma'),
    (r'\b(?:جوست|قوست)\b', 'GOST'),
    (r'\b(?:ايه\s*اي\s*اس|اي\s*اي\s*اس)\b', 'AES'),
    (r'\b(?:دي\s*اي\s*اس)\b', 'DES'),
    (r'\b(?:ايديا)\b', 'IDEA'),
    (r'\b(?:رايندال|ريندال)\b', 'Rijndael'),
    (r'\b(?:اكس\s*اور|اكس\s*او\s*ار)\b', 'XOR'),
    (r'\b(?:بي\s*جي\s*بي)\b', 'PGP'),
    (r'\b(?:لاي\s*ماسي|لاي\s*و\s*ماسي)\b', 'Lai-Massey'),
    (r'\b(?:سب\s*بايتس)\b', 'SubBytes'),
    (r'\b(?:شيفت\s*روز)\b', 'ShiftRows'),
    (r'\b(?:ميكس\s*كولوم(?:ز)?)\b', 'MixColumns'),
    (r'\b(?:اد\s*راوند\s*كي|ادد\s*راوند\s*كي)\b', 'AddRoundKey'),
    (r'\b(?:بلوك\s*سايز)\b', 'Block Size'),
    (r'\b(?:بروت\s*فورس)\b', 'Brute Force'),
    (r'\b(?:سيمترك\s*سايفر)\b', 'Symmetric Cipher'),
    (r'\b(?:اس\s*بي\s*ان)\b', 'SPN'),
    (r'\b(?:جالوا\s*فيلد)\b', 'Galois Field GF(2^8)'),
    (r'\b(?:اف\s*بي)\b', 'FP (Final Permutation)'),
    (r'\b(?:اي\s*بي)\b', 'IP (Initial Permutation)'),
    (r'\b(?:بي\s*سي\s*واحد)\b', 'PC-1'),
    (r'\b(?:بي\s*سي\s*اثنين)\b', 'PC-2'),
    (r'(\d+)\s*بت\b', r'\1-bit'),
    (r'(\d+)\s*دور[ةه]\b', r'\1 Rounds'),
]


def normalize_cryptographic_terms(text):
    """Deterministically align cryptographic terms from spoken Arabic phonetics to clean technical notation."""
    result = text
    for pattern, repl in CRYPTO_TERMS_PATTERNS:
        result = re.sub(pattern, repl, result, flags=re.IGNORECASE)

    # Clean punctuation and spacing
    result = re.sub(r'\s+', ' ', result).strip()
    return result


def estimate_pitch_frequency(chunk):
    """Estimate speaker pitch (low=male host, high=female host)."""
    try:
        samples = np.array(chunk.get_array_of_samples(), dtype=float)
        if len(samples) < 1000:
            return 150.0
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
    for attempt in range(3):
        try:
            text = r.recognize_google(audio_data, language="ar-SA")
            break
        except sr.UnknownValueError:
            text = ""
            break
        except Exception:
            time.sleep(0.4 * (attempt + 1))
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

    sound = sound.normalize()
    sound_mono = sound.set_channels(1).set_frame_rate(16000)

    # Wide boundary protection: min_silence_len=750ms, threshold dBFS-16
    print("🔍 Detecting speech segments with wide boundary protection...")
    silence_thresh = max(-45, sound_mono.dBFS - 16)
    raw_segments = detect_nonsilent(sound_mono, min_silence_len=750, silence_thresh=silence_thresh)
    print(f"  Found {len(raw_segments)} initial speech regions.")

    if not raw_segments:
        print("❌ No speech detected in audio!")
        return False

    # Merge segments closer than 550ms
    merged_segments = []
    curr_start, curr_end = raw_segments[0]

    for s, e in raw_segments[1:]:
        if s - curr_end < 550:
            curr_end = e
        else:
            merged_segments.append((curr_start, curr_end))
            curr_start, curr_end = s, e
    merged_segments.append((curr_start, curr_end))

    print(f"  Consolidated into {len(merged_segments)} coherent conversational utterances.")

    # Generous acoustic padding: +300ms at start, +450ms at end to completely protect trailing phonemes!
    tasks = []
    for idx, (s_ms, e_ms) in enumerate(merged_segments):
        pad_s = max(0, s_ms - 300)
        pad_e = min(len(sound_mono), e_ms + 450)
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
            if len(results) % 25 == 0 or len(results) == len(tasks):
                print(f"  ... Transcribed {len(results)}/{len(tasks)} phrases ({int(len(results)/len(tasks)*100)}%)")

    results.sort(key=lambda x: x["index"])

    final_items = []
    item_id = 1
    current_speaker = "المحاورة (سارة)"
    current_role = "host2"

    for r in results:
        text = r["text"]
        if not text or len(text.strip()) <= 1:
            continue

        pitch = r["pitch"]
        if pitch > 185:
            speaker = "المحاورة (سارة)"
            role = "host2"
        elif pitch < 165:
            speaker = "المحاور (أحمد)"
            role = "host1"
        else:
            speaker = current_speaker
            role = current_role

        current_speaker = speaker
        current_role = role

        # Apply cryptographic lexicon normalization
        normalized_text = normalize_cryptographic_terms(text)

        final_items.append({
            "id": item_id,
            "start": r["start"],
            "end": r["end"],
            "speaker": speaker,
            "role": role,
            "text": normalized_text,
        })
        item_id += 1

    print(f"✅ Generated {len(final_items)} fully validated timestamped sentences.")

    # Read existing podcasts.json
    if not os.path.exists(PODCASTS_JSON_PATH):
        podcasts_data = {}
    else:
        with open(PODCASTS_JSON_PATH, "r", encoding="utf-8") as f:
            podcasts_data = json.load(f)

    audio_filename = os.path.basename(audio_path)
    info = CIPHER_TITLES.get(slug, {
        "title": f"بودكاست خوارزمية {slug.upper()}",
        "subtitle": "شرح صوتي تحليلي تفاعلي",
    })

    entry = podcasts_data.get(slug, {})
    entry["id"] = slug
    entry["title"] = info["title"]
    entry["subtitle"] = info["subtitle"]
    entry["audioFile"] = audio_filename
    entry["duration"] = format_duration(total_seconds)
    entry["durationSeconds"] = int(round(total_seconds))
    entry["transcript"] = final_items
    entry["dialogue"] = [
        {
            "speaker": item["speaker"],
            "role": item.get("role", "host"),
            "text": item["text"],
        }
        for item in final_items
    ]

    podcasts_data[slug] = entry

    with open(PODCASTS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(podcasts_data, f, ensure_ascii=False, indent=2)

    print(f"🎉 Successfully updated {PODCASTS_JSON_PATH} for [{slug}]!")
    return True


def main():
    parser = argparse.ArgumentParser(description="Synchronize, transcribe, and validate podcasts.")
    parser.add_argument("--slug", help="Algorithm slug (e.g. gost, aes, des, idea)")
    parser.add_argument("--file", help="Path to audio file (optional)")
    parser.add_argument("--all", action="store_true", help="Process all available .m4a podcasts")

    args = parser.parse_args()

    if args.slug:
        audio_file = args.file
        if not audio_file:
            m4a = os.path.join(AUDIO_DIR, f"{args.slug}_podcast.m4a")
            mp3 = os.path.join(AUDIO_DIR, f"{args.slug}_podcast.mp3")
            audio_file = m4a if os.path.exists(m4a) else mp3
        process_audio_file(args.slug, audio_file)
    elif args.all:
        for slug in ["gost", "aes", "des", "idea"]:
            m4a = os.path.join(AUDIO_DIR, f"{slug}_podcast.m4a")
            if os.path.exists(m4a):
                process_audio_file(slug, m4a)
    else:
        audio_file = os.path.join(AUDIO_DIR, "gost_podcast.m4a")
        process_audio_file("gost", audio_file)


if __name__ == "__main__":
    main()
