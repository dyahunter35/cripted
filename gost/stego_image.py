"""LSB steganography for 24-bit BMP images (no external dependencies)."""

import struct


def _read_bmp(path):
    with open(path, "rb") as f:
        data = f.read()
    if data[:2] != b"BM":
        raise ValueError("not a BMP file")
    pixel_offset = struct.unpack_from("<I", data, 10)[0]
    width = struct.unpack_from("<i", data, 18)[0]
    height = struct.unpack_from("<i", data, 22)[0]
    bpp = struct.unpack_from("<H", data, 28)[0]
    compression = struct.unpack_from("<I", data, 30)[0]
    if bpp != 24 or compression != 0:
        raise ValueError("only uncompressed 24-bit BMP is supported")
    # row size padded to multiple of 4 bytes
    row_size = (width * 3 + 3) & ~3
    abs_h = abs(height)
    pixels = bytearray()
    for y in range(abs_h):
        # BMP stores bottom-up unless height negative
        if height > 0:
            row_start = pixel_offset + (abs_h - 1 - y) * row_size
        else:
            row_start = pixel_offset + y * row_size
        pixels += data[row_start:row_start + width * 3]
    return width, height, pixel_offset, row_size, abs_h, data, pixels


def capacity_bytes(width, height):
    return (width * height * 3) // 8 - 4  # 4 bytes length header


def hide(input_path, output_path, payload_bytes):
    width, height, pixel_offset, row_size, abs_h, data, pixels = _read_bmp(input_path)
    if len(payload_bytes) > capacity_bytes(width, height):
        raise ValueError("payload too large for this image")
    # prepend 32-bit length
    full = len(payload_bytes).to_bytes(4, "big") + payload_bytes
    bits = []
    for b in full:
        for i in range(7, -1, -1):
            bits.append((b >> i) & 1)
    # embed
    for idx, bit in enumerate(bits):
        pixels[idx] = (pixels[idx] & 0xFE) | bit
    # write back
    out = bytearray(data)
    for y in range(abs_h):
        if height > 0:
            row_start = pixel_offset + (abs_h - 1 - y) * row_size
        else:
            row_start = pixel_offset + y * row_size
        out[row_start:row_start + width * 3] = pixels[y * width * 3:(y + 1) * width * 3]
    with open(output_path, "wb") as f:
        f.write(out)
    return len(payload_bytes)


def extract(input_path):
    width, height, pixel_offset, row_size, abs_h, data, pixels = _read_bmp(input_path)
    # read 32-bit length
    length_bits = 32
    length = 0
    for i in range(length_bits):
        length = (length << 1) | (pixels[i] & 1)
    if length > capacity_bytes(width, height) or length < 0:
        raise ValueError("invalid or no hidden data")
    total_bits = (4 + length) * 8
    out = bytearray()
    cur = 0
    bit_count = 0
    for i in range(32, total_bits):
        cur = (cur << 1) | (pixels[i] & 1)
        bit_count += 1
        if bit_count == 8:
            out.append(cur)
            cur = 0
            bit_count = 0
    return bytes(out)
