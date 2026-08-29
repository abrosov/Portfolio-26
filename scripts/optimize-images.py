#!/usr/bin/env python3
"""Convert fully-opaque PNGs in a directory to JPEG. Images that genuinely use
transparency are left alone, since flattening them would show a background."""
import os, struct, subprocess, sys, zlib

def fully_opaque(path):
    with open(path, 'rb') as f: data = f.read()
    pos, w, h, ct, idat = 8, None, None, None, b''
    while pos < len(data):
        ln = struct.unpack('>I', data[pos:pos+4])[0]
        typ = data[pos+4:pos+8]
        body = data[pos+8:pos+8+ln]
        if typ == b'IHDR': w, h, _, ct = struct.unpack('>IIBB', body[:10])
        elif typ == b'IDAT': idat += body
        elif typ == b'IEND': break
        pos += 12 + ln
    if ct != 6: return False
    raw = zlib.decompress(idat); bpp = 4; stride = w * bpp
    prev = bytearray(stride); i = 0
    for _ in range(h):
        ft = raw[i]; i += 1
        line = bytearray(raw[i:i+stride]); i += stride
        for x in range(stride):
            a = line[x-bpp] if x >= bpp else 0
            b = prev[x]; c = prev[x-bpp] if x >= bpp else 0
            if ft == 1: line[x] = (line[x] + a) & 255
            elif ft == 2: line[x] = (line[x] + b) & 255
            elif ft == 3: line[x] = (line[x] + ((a + b) >> 1)) & 255
            elif ft == 4:
                p = a + b - c; pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        for x in range(3, stride, 4):
            if line[x] != 255: return False
        prev = line
    return True

for d in sys.argv[1:]:
    for name in sorted(os.listdir(d)):
        if not name.endswith('.png'): continue
        src = os.path.join(d, name)
        if not fully_opaque(src):
            print(f'  keep  {name} (transparent)'); continue
        dst = src[:-4] + '.jpg'
        subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', src, '--out', dst],
                       capture_output=True, check=True)
        before, after = os.path.getsize(src), os.path.getsize(dst)
        if after >= before:
            os.remove(dst)
            print(f'  keep  {name} (jpeg was larger)')
        else:
            os.remove(src)
            print(f'  jpeg  {name} -> .jpg  {before//1024}KB -> {after//1024}KB')
