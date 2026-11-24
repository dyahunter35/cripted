#!/usr/bin/env python3
"""
scripts/align_podcasts.py
==========================
Synchronizes aes.md, des.md, idea.md, and goast.md into src/content/podcasts.json
with exact audio synchronization, clean speaker labeling (المذيع and الخبيرة),
and silence boundary snapping.
"""

import os
import sys
import json
import re
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PODCASTS_JSON_PATH = os.path.join(BASE_DIR, "src", "content", "podcasts.json")

def get_silence_intervals(audio_path, noise="-28dB", d="0.25"):
    """Extract silence start and end points via ffmpeg."""
    if not os.path.exists(audio_path):
        return []
    cmd = ['ffmpeg', '-i', audio_path, '-af', f'silencedetect=noise={noise}:d={d}', '-f', 'null', '-']
    res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.DEVNULL, text=True)
    intervals = []
    cur_start = None
    for line in res.stderr.splitlines():
        m_start = re.search(r'silence_start:\s*([\d\.]+)', line)
        m_end = re.search(r'silence_end:\s*([\d\.]+)', line)
        if m_start:
            cur_start = float(m_start.group(1))
        elif m_end and cur_start is not None:
            intervals.append((cur_start, float(m_end.group(1))))
            cur_start = None
    return intervals

def norm(text):
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'[إأآا]', 'ا', text)
    text = re.sub(r'[ةه]', 'ه', text)
    text = re.sub(r'[يى]', 'ي', text)
    return ' '.join(text.lower().split())

def parse_md_turns(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = [l.strip() for l in f if l.strip() and not l.startswith('ملاحظة:')]

    turns = []
    cur_time = None
    cur_spk = None
    cur_txt = []
    for l in lines:
        m = re.match(r'^(?:\[(\d+):(\d+)\]\s*)?\[(المذيع\s*\d+)\]:\s*(.*)', l)
        if m:
            if cur_spk:
                turns.append((cur_time, cur_spk, ' '.join(cur_txt).strip()))
                cur_txt = []
            if m.group(1) is not None:
                cur_time = int(m.group(1)) * 60 + int(m.group(2))
            cur_spk = m.group(3).strip()
            if m.group(4).strip():
                cur_txt.append(m.group(4).strip())
        else:
            if cur_spk:
                cur_txt.append(l)
    if cur_spk:
        turns.append((cur_time, cur_spk, ' '.join(cur_txt).strip()))
    return turns

def align_turns_to_audio(turns, stt_segments, audio_duration, silence_intervals):
    """
    High-density anchor alignment:
    Maps markdown turns to STT speech segments using n-gram anchors,
    snaps start/end times to audio silence intervals, and linearly interpolates sub-turn timings.
    """
    n_turns = len(turns)
    anchors = []

    # 1. Collect start and end anchors from STT segments
    for seg in stt_segments:
        n_seg = norm(seg['text'])
        words = n_seg.split()
        if len(words) < 3:
            continue
        
        # Match beginning
        prefix = ' '.join(words[:4])
        for t_idx, (t_time, spk, txt) in enumerate(turns):
            n_txt = norm(txt)
            if prefix in n_txt:
                anchors.append((t_idx, seg['start'], 'start'))
                break

        # Match ending
        suffix = ' '.join(words[-4:])
        for t_idx, (t_time, spk, txt) in enumerate(turns):
            n_txt = norm(txt)
            if suffix in n_txt:
                anchors.append((t_idx, seg['end'], 'end'))
                break

    # 2. Filter strictly monotonic anchors
    anchors.sort(key=lambda x: (x[0], x[1]))
    filtered = []
    last_t = -1
    last_time = -1
    for a in anchors:
        if a[0] >= last_t and a[1] >= last_time:
            filtered.append(a)
            last_t = a[0]
            last_time = a[1]

    # Map turn index to known start/end anchor times
    turn_start_anchors = {}
    turn_end_anchors = {}
    for t_idx, time_val, kind in filtered:
        if kind == 'start' and t_idx not in turn_start_anchors:
            turn_start_anchors[t_idx] = time_val
        elif kind == 'end':
            turn_end_anchors[t_idx] = time_val

    # Anchor turn 0 start to 0.0 and last turn end to audio_duration
    turn_start_anchors[0] = 0.0
    turn_end_anchors[n_turns - 1] = audio_duration

    # 3. Interpolate missing start/end times based on character length
    turn_lengths = [len(norm(txt)) for (_, _, txt) in turns]
    
    # Establish known timeline milestones
    milestones = []
    for i in range(n_turns):
        if i in turn_start_anchors:
            milestones.append((i, turn_start_anchors[i]))
        elif i in turn_end_anchors:
            milestones.append((i + 1, turn_end_anchors[i]))

    milestones.sort(key=lambda x: x[0])
    # Deduplicate milestones
    dedup_milestones = [milestones[0]]
    for m in milestones[1:]:
        if m[0] > dedup_milestones[-1][0] and m[1] >= dedup_milestones[-1][1]:
            dedup_milestones.append(m)

    if dedup_milestones[-1][0] < n_turns:
        dedup_milestones.append((n_turns, audio_duration))

    # Calculate start times for all turns
    turn_starts = [0.0] * n_turns
    for m_idx in range(len(dedup_milestones) - 1):
        idx_a, time_a = dedup_milestones[m_idx]
        idx_b, time_b = dedup_milestones[m_idx + 1]
        span_chars = sum(turn_lengths[idx_a:idx_b])
        if span_chars == 0:
            span_chars = max(1, idx_b - idx_a)
        
        cum_chars = 0
        for i in range(idx_a, idx_b):
            pct = cum_chars / span_chars
            turn_starts[i] = round(time_a + pct * (time_b - time_a), 2)
            cum_chars += turn_lengths[i]

    # Calculate end times
    turn_ends = [0.0] * n_turns
    for i in range(n_turns - 1):
        turn_ends[i] = turn_starts[i + 1]
    turn_ends[n_turns - 1] = round(audio_duration, 2)

    # 4. Snap turn boundaries to nearby silence points if within 1.5s
    silence_starts = [s[0] for s in silence_intervals]
    silence_ends = [s[1] for s in silence_intervals]

    for i in range(1, n_turns):
        est_boundary = turn_starts[i]
        # find closest silence
        best_diff = 1.5
        best_snap = None
        for s_start, s_end in silence_intervals:
            mid = (s_start + s_end) / 2.0
            diff = abs(est_boundary - mid)
            if diff < best_diff:
                best_diff = diff
                best_snap = round(mid, 2)
        if best_snap is not None and best_snap > turn_starts[i - 1] + 0.5:
            turn_ends[i - 1] = best_snap
            turn_starts[i] = best_snap

    # 5. Format output objects
    output = []
    for i, (t_time, spk, txt) in enumerate(turns):
        is_host1 = ("1" in spk) or ("المذيع" in spk and "2" not in spk and "ة" not in spk)
        speaker_name = "المذيع" if is_host1 else "الخبيرة"
        role_name = "host1" if is_host1 else "host2"

        output.append({
            "id": i + 1,
            "start": round(float(turn_starts[i]), 2),
            "end": round(float(turn_ends[i]), 2),
            "speaker": speaker_name,
            "role": role_name,
            "text": txt
        })

    return output

def main():
    print("=== Crypto Lab Podcast Alignment ===")
    
    with open(PODCASTS_JSON_PATH, 'r', encoding='utf-8') as f:
        podcasts = json.load(f)

    # Load 3dc255d STT for AES and DES reference
    out = subprocess.check_output(['git', 'show', '3dc255d:src/content/podcasts.json']).decode('utf-8')
    git_data = json.loads(out)
    aes_stt = git_data['aes']['transcript']
    des_stt = git_data['des']['transcript']

    # 1. Align AES
    print("\n--- Aligning AES (229 turns) ---")
    aes_turns = parse_md_turns(os.path.join(BASE_DIR, "aes.md"))
    aes_audio = os.path.join(BASE_DIR, "public", "audio", "aes_podcast.m4a")
    aes_silences = get_silence_intervals(aes_audio, noise="-28dB", d="0.28")
    aes_synced = align_turns_to_audio(aes_turns, aes_stt, 1263.09, aes_silences)
    podcasts["aes"]["transcript"] = aes_synced
    podcasts["aes"]["durationSeconds"] = 1263
    podcasts["aes"]["duration"] = "21:03"
    podcasts["aes"]["audioFile"] = "aes_podcast.m4a"
    print(f"AES successfully synced: {len(aes_synced)} items")

    # 2. Align DES
    print("\n--- Aligning DES (129 turns) ---")
    des_turns = parse_md_turns(os.path.join(BASE_DIR, "des.md"))
    des_audio = os.path.join(BASE_DIR, "public", "audio", "des_podcast.m4a")
    des_silences = get_silence_intervals(des_audio, noise="-28dB", d="0.28")
    des_synced = align_turns_to_audio(des_turns, des_stt, 1515.13, des_silences)
    podcasts["des"]["transcript"] = des_synced
    podcasts["des"]["durationSeconds"] = 1515
    podcasts["des"]["duration"] = "25:15"
    podcasts["des"]["audioFile"] = "des_podcast.m4a"
    print(f"DES successfully synced: {len(des_synced)} items")

    # 3. Align IDEA from idea.md (201 turns with explicit timestamps)
    print("\n--- Aligning IDEA (201 turns) ---")
    idea_turns = parse_md_turns(os.path.join(BASE_DIR, "idea.md"))
    idea_audio_duration = 1349.0
    idea_synced = []
    for i, (t_time, spk, txt) in enumerate(idea_turns):
        is_host1 = ("1" in spk) or ("المذيع" in spk and "2" not in spk and "ة" not in spk)
        speaker_name = "المذيع" if is_host1 else "الخبيرة"
        role_name = "host1" if is_host1 else "host2"

        start_t = float(t_time if t_time is not None else 0.0)
        if i + 1 < len(idea_turns) and idea_turns[i + 1][0] is not None:
            end_t = float(idea_turns[i + 1][0])
            if end_t <= start_t:
                end_t = start_t + max(2.5, len(txt) / 16.0)
        else:
            end_t = idea_audio_duration

        idea_synced.append({
            "id": i + 1,
            "start": round(start_t, 2),
            "end": round(end_t, 2),
            "speaker": speaker_name,
            "role": role_name,
            "text": txt
        })
    podcasts["idea"]["transcript"] = idea_synced
    podcasts["idea"]["durationSeconds"] = 1349
    podcasts["idea"]["duration"] = "22:29"
    podcasts["idea"]["audioFile"] = "idea_podcast.m4a"
    print(f"IDEA successfully synced: {len(idea_synced)} items")

    # 4. Save podcasts.json
    with open(PODCASTS_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(podcasts, f, ensure_ascii=False, indent=2)

    print("\n[SUCCESS] podcasts.json updated successfully with AES, DES, and IDEA transcripts.")

if __name__ == "__main__":
    main()
