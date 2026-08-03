#!/usr/bin/env node
/**
 * Pure-Node.js favicon generator.
 *
 * Generates:
 *   - public/favicon.ico         Multi-size ICO (16x16, 32x32, 48x48) containing
 *                                 uncompressed 32-bit BGRA DIBs (no deps).
 *   - public/favicon-16x16.png
 *   - public/favicon-32x32.png
 *   - public/android-chrome-192x192.png
 *   - public/android-chrome-512x512.png
 *   - public/apple-touch-icon.png
 *   - public/mstile-150x150.png
 *
 * The mark is a simplified version of public/favicon.svg: rounded-square orange
 * background with a bold white "D" monogram. The design is authored in code so
 * every size is hand-tuned for pixel clarity.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PUBLIC = path.join(__dirname, 'public');

/* -------------------------------------------------------------------------- */
/*  Palette                                                                   */
/* -------------------------------------------------------------------------- */

const ORANGE = [0xFF, 0x6B, 0x00, 0xFF]; // brand
const ORANGE_DARK = [0xE0, 0x5D, 0x00, 0xFF];
const ORANGE_LIGHT = [0xFF, 0x8A, 0x33, 0xFF];
const WHITE = [0xFF, 0xFF, 0xFF, 0xFF];
const WHITE_SOFT = [0xFF, 0xFF, 0xFF, 0xD9];
const SHADOW = [0x00, 0x00, 0x00, 0x1A]; // ~10%

/* -------------------------------------------------------------------------- */
/*  Pixel buffer helpers                                                      */
/* -------------------------------------------------------------------------- */

function makeBuffer(w, h) {
  const buf = Buffer.alloc(w * h * 4);
  return { w, h, buf };
}

function setPx(img, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (y * img.w + x) * 4;
  if (a === 0xFF) {
    img.buf[i] = r; img.buf[i + 1] = g; img.buf[i + 2] = b; img.buf[i + 3] = a;
  } else {
    // Blend over existing
    const sr = img.buf[i], sg = img.buf[i + 1], sb = img.buf[i + 2], sa = img.buf[i + 3];
    const aa = a / 255, as = sa / 255;
    const outA = aa + as * (1 - aa);
    const outR = (r * aa + sr * as * (1 - aa)) / (outA || 1);
    const outG = (g * aa + sg * as * (1 - aa)) / (outA || 1);
    const outB = (b * aa + sb * as * (1 - aa)) / (outA || 1);
    img.buf[i] = outR | 0;
    img.buf[i + 1] = outG | 0;
    img.buf[i + 2] = outB | 0;
    img.buf[i + 3] = (outA * 255) | 0;
  }
}

function fillRect(img, x0, y0, w, h, color) {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) setPx(img, x, y, color);
}

/* Fills a rounded rectangle with optional gradient (2-stop vertical). */
function fillRoundedRect(img, x0, y0, w, h, r, colTop, colBot) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      // Distance to nearest corner for rounding
      const cx = x < x0 + r ? x0 + r : x > x0 + w - 1 - r ? x0 + w - 1 - r : x;
      const cy = y < y0 + r ? y0 + r : y > y0 + h - 1 - r ? y0 + h - 1 - r : y;
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        const t = h === 1 ? 0 : (y - y0) / (h - 1);
        const mix = (a, b) => (a * (1 - t) + b * t) | 0;
        setPx(img, x, y, [
          mix(colTop[0], colBot[0]),
          mix(colTop[1], colBot[1]),
          mix(colTop[2], colBot[2]),
          (colTop[3] * (1 - t) + colBot[3] * t) | 0,
        ]);
      }
    }
  }
}

/* Render path from polygon + bezier outlines using scanlines. For simplicity,
   we accept an array of scanline y-ranges at integer positions (anti-alias
   edges via alpha blending). */
function fillScanlines(img, scanFn, color) {
  for (let y = 0; y < img.h; y++) {
    const ranges = scanFn(y);
    for (const [x0, x1] of ranges) {
      for (let x = x0 | 0; x <= (x1 | 0); x++) {
        const ax = x < x0 ? x + 1 - x0 : x > x1 ? x1 + 1 - x : 1;
        const c = [...color];
        c[3] = (c[3] * Math.min(1, ax)) | 0;
        setPx(img, x, y, c);
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Size-specific painter                                                     */
/* -------------------------------------------------------------------------- */

/** Returns a scanline function for a bold "D" monogram sized to fit NxN.
 *  Layout: the D fills most of the square with a thick stem on the left and
 *  a rounded right belly. */
function dMonogramScanlines(N) {
  // Box (padding + content size) proportional to N
  const pad = Math.max(1, Math.round(N * 0.18));
  const x0 = pad;
  const x1 = N - pad;
  const y0 = pad;
  const y1 = N - pad;
  const stemW = Math.max(1, Math.round((x1 - x0) * 0.34));

  // The right side is approximated by an ellipse quadrant sweep.
  // We compute the ellipse centered at (stemTopX, centerY) with rx, ry.
  const stemX = x0 + stemW;
  const cx = stemX;
  const cy = (y0 + y1) / 2;
  const rx = x1 - stemX + 0.5;
  const ry = (y1 - y0) / 2 - 0.5;

  return (y) => {
    if (y < y0 || y > y1) return [];
    const ranges = [];
    // Stem is always painted full width.
    ranges.push([x0, stemX - 1 + 0.999]);

    // Rounded belly: x range for this scanline (only if inside ellipse).
    const dy = y - cy + 0.5;
    if (Math.abs(dy) <= ry) {
      const t = 1 - (dy * dy) / (ry * ry);
      const dx = rx * Math.sqrt(Math.max(0, t));
      const xL = stemX - 0.5;
      const xR = cx + dx;
      ranges.push([Math.min(xL, xR), Math.max(xL, xR)]);
    }
    // Merge overlap (simple) by returning union range
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const r of ranges) {
      if (merged.length && r[0] <= merged[merged.length - 1][1] + 0.5) {
        merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], r[1]);
      } else merged.push([...r]);
    }
    return merged;
  };
}

/* Top gloss highlight: a soft band over the upper half of the rounded square. */
function paintGloss(img, x0, y0, w, h, r) {
  const bandH = Math.max(1, Math.floor(h * 0.48));
  for (let y = y0; y < y0 + bandH; y++) {
    const t = (y - y0) / (bandH - 1 || 1);
    const a = (1 - t) * 0.35 * 255;
    if (a <= 0) continue;
    for (let x = x0; x < x0 + w; x++) {
      const cx = x < x0 + r ? x0 + r : x > x0 + w - 1 - r ? x0 + w - 1 - r : x;
      const cy = y < y0 + r ? y0 + r : y;
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        setPx(img, x, y, [0xFF, 0xFF, 0xFF, a | 0]);
      }
    }
  }
}

/* Soft 1px bottom shadow under the rounded-square. */
function paintShadow(img, x0, y0, w, h, r) {
  const yy = y0 + h;
  for (let x = x0; x < x0 + w; x++) {
    const cx = x < x0 + r ? x0 + r : x > x0 + w - 1 - r ? x0 + w - 1 - r : x;
    const cy = yy - 1 - r;
    const dx = x - cx, dy = yy - cy;
    // We paint a shadow under the lower edge using distance-to-circle approx.
    const d = Math.sqrt(dx * dx + Math.max(0, dy - r) ** 2);
    if (d < 1.6) {
      const a = (1 - d / 1.6) * 0.12 * 255;
      setPx(img, x, yy, [0, 0, 0, a | 0]);
    }
  }
}

function paintSize(N) {
  const img = makeBuffer(N, N);
  const pad = Math.max(1, Math.round(N * 0.06));
  const x0 = pad;
  const y0 = pad;
  const w = N - pad * 2;
  const h = N - pad * 2;
  const r = Math.max(2, Math.round(N * 0.22));

  fillRoundedRect(img, x0, y0, w, h, r, ORANGE_LIGHT, ORANGE_DARK);
  paintGloss(img, x0, y0, w, h, r);
  paintShadow(img, x0, y0, w, h, r);

  // D monogram on top (scanlines over the whole canvas)
  fillScanlines(img, dMonogramScanlines(N), WHITE);

  // Tiny "steam" dot accent for larger sizes
  if (N >= 32) {
    const cx = Math.round(N * 0.76);
    const cy = Math.round(N * 0.27);
    const s = N >= 48 ? 2 : 1;
    fillRect(img, cx - s + 1, cy, s, s, WHITE_SOFT);
    if (N >= 48) fillRect(img, cx + s + 1, cy - s, 1, 1, [0xFF, 0xFF, 0xFF, 0x88]);
  }
  return img;
}

/* -------------------------------------------------------------------------- */
/*  PNG writer (minimal, no deps)                                             */
/* -------------------------------------------------------------------------- */

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : (c >>> 1);
    table[n] = c >>> 0;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const tBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([tBuf, data])), 0);
  return Buffer.concat([len, tBuf, data, crcBuf]);
}

function toPNG(img) {
  const { w, h, buf } = img;
  // PNG scanlines: each row starts with filter byte 0, then RGBA
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    // PNG stores rows top-to-bottom. Our buffer is also top-to-bottom.
    // PNG is RGBA; our buffer is RGBA already. But BMP/DIB is BGRA. We keep
    // our canvas RGBA for PNG and byte-swap for BMP output separately.
    buf.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const comp = zlib.deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;     // bit depth
  ihdr[9] = 6;     // RGBA
  ihdr[10] = 0;    // compression
  ihdr[11] = 0;    // filter
  ihdr[12] = 0;    // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', comp),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------------------- */
/*  ICO writer (multi-size, embeds 32-bit BGRA DIBs)                          */
/* -------------------------------------------------------------------------- */

/** Converts RGBA buffer (top-down) to BGRA bottom-up DIB pixel data with mask
 *  after the pixels. ICO expects BMP DIB without the 14-byte file header,
 *  rows stored bottom-up, BGRA order, and a 1-bit AND mask appended. */
function toIcoDib(img) {
  const { w, h, buf } = img;
  const stride = Math.ceil((w * 4) / 4) * 4; // 32-bit BGRA
  const maskStride = Math.ceil((w / 8) / 4) * 4; // 1-bit, 4-byte aligned
  const pixels = Buffer.alloc(stride * h);
  const mask = Buffer.alloc(maskStride * h, 0x00); // 0 = opaque pixel, 1 = transparent

  for (let y = 0; y < h; y++) {
    const srcY = y;                 // our buf top-down
    const dstY = h - 1 - y;         // DIB bottom-up
    for (let x = 0; x < w; x++) {
      const s = (srcY * w + x) * 4;
      const d = (dstY * stride) + x * 4;
      // BGRA
      pixels[d]     = buf[s + 2];   // B
      pixels[d + 1] = buf[s + 1];   // G
      pixels[d + 2] = buf[s + 0];   // R
      pixels[d + 3] = buf[s + 3];   // A
      if (buf[s + 3] < 128) {
        // Set mask bit = 1 for transparent
        const maskByte = (dstY * maskStride) + (x >> 3);
        mask[maskByte] |= (0x80 >> (x & 7));
      }
    }
  }

  // BITMAPINFOHEADER (40 bytes). Note: biHeight is DOUBLED for ICO because
  // Windows expects biHeight = AND mask height + XOR DIB height.
  const bih = Buffer.alloc(40);
  bih.writeUInt32LE(40, 0);                  // biSize
  bih.writeInt32LE(w, 4);                    // biWidth
  bih.writeInt32LE(h * 2, 8);                // biHeight (doubled)
  bih.writeUInt16LE(1, 12);                  // biPlanes
  bih.writeUInt16LE(32, 14);                 // biBitCount
  bih.writeUInt32LE(0, 16);                  // biCompression (BI_RGB)
  bih.writeUInt32LE(pixels.length + mask.length, 20); // biSizeImage
  bih.writeInt32LE(0, 24);
  bih.writeInt32LE(0, 28);
  bih.writeUInt32LE(0, 32);
  bih.writeUInt32LE(0, 36);
  return Buffer.concat([bih, pixels, mask]);
}

function buildIco(images) {
  // Each entry: { size: N, dib: Buffer }
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);       // reserved
  header.writeUInt16LE(1, 2);       // type = 1 (ICO)
  header.writeUInt16LE(count, 4);   // count

  const headerSize = 6 + 16 * count;
  let offset = headerSize;
  const dirs = [];
  const datas = [];
  for (const im of images) {
    const dir = Buffer.alloc(16);
    const w = im.size >= 256 ? 0 : im.size;
    const h = im.size >= 256 ? 0 : im.size;
    dir[0] = w;
    dir[1] = h;
    dir[2] = 0;   // color count
    dir[3] = 0;   // reserved
    dir.writeUInt16LE(1, 4);      // planes
    dir.writeUInt16LE(32, 6);     // bit count
    dir.writeUInt32LE(im.dib.length, 8); // dwBytesInRes
    dir.writeUInt32LE(offset, 12);       // dwImageOffset
    dirs.push(dir);
    datas.push(im.dib);
    offset += im.dib.length;
  }
  return Buffer.concat([header, ...dirs, ...datas]);
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                      */
/* -------------------------------------------------------------------------- */

function writeFile(name, data) {
  const p = path.join(PUBLIC, name);
  fs.writeFileSync(p, data);
  console.log('  -', name, `(${data.length.toLocaleString()} bytes)`);
}

function main() {
  if (!fs.existsSync(PUBLIC)) fs.mkdirSync(PUBLIC, { recursive: true });
  console.log('Generating DUMUNI favicon assets...');

  const sizes = [16, 32, 48];
  const icoImages = sizes.map((N) => {
    const img = paintSize(N);
    // Also emit standalone PNG for each favicon size
    writeFile(`favicon-${N}x${N}.png`, toPNG(img));
    return { size: N, dib: toIcoDib(img) };
  });

  writeFile('favicon.ico', buildIco(icoImages));

  // App-size PNG icons
  const appSizes = [180, 192, 150, 512];
  const nameMap = {
    180: 'apple-touch-icon.png',
    192: 'android-chrome-192x192.png',
    150: 'mstile-150x150.png',
    512: 'android-chrome-512x512.png',
  };
  for (const N of appSizes) writeFile(nameMap[N], toPNG(paintSize(N)));

  console.log('Done.');
}

main();
