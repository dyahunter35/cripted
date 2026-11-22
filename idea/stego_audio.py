"""LSB steganography for WAV audio (16-bit PCM, stdlib wave)."""

import wave
import struct


def _read_wav(path):
    with wave.open(path, "rb") as w:
        params = w.getparams()
        frames = w.readframes(w.getnframes())
    if params.sampwidth != 2:
        raise ValueError("only 16-bit PCM WAV is supported")
    # unpack samples
    count = len(frames) // 2
    samples = list(struct.unpack("<" + "h" * count, frames))
    return params, samples


def capacity_bytes(params, samples):
    return len(samples) // 8 - 4


def hide(input_path, output_path, payload_bytes):
    params, samples = _read_wav(input_path)
    if len(payload_bytes) > capacity_bytes(params, samples):
        raise ValueError("payload too large for this audio")
    full = len(payload_bytes).to_bytes(4, "big") + payload_bytes
    bits = []
    for b in full:
        for i in range(7, -1, -1):
            bits.append((b >> i) & 1)
    for idx, bit in enumerate(bits):
        samples[idx] = (samples[idx] & ~1) | bit
    out_frames = struct.pack("<" + "h" * len(samples), *samples)
    with wave.open(output_path, "wb") as w:
        w.setparams(params)
        w.writeframes(out_frames)
    return len(payload_bytes)


def extract(input_path):
    params, samples = _read_wav(input_path)
    # read length
    length = 0
    for i in range(32):
        length = (length << 1) | (samples[i] & 1)
    if length > capacity_bytes(params, samples) or length < 0:
        raise ValueError("invalid or no hidden data")
    total_bits = (4 + length) * 8
    out = bytearray()
    cur = 0
    bit_count = 0
    for i in range(32, total_bits):
        cur = (cur << 1) | (samples[i] & 1)
        bit_count += 1
        if bit_count == 8:
            out.append(cur)
            cur = 0
            bit_count = 0
    return bytes(out)
