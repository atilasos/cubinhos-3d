// Generates 16x16 pixel-art-style RGBA textures from a base hex color.
// Output is deterministic (seeded by color) so the same color always
// produces the same texture across reloads.

const SIZE = 16;

export function buildTextureCanvasData(hexColor) {
  const [r, g, b] = parseHex(hexColor);
  const out = new Uint8ClampedArray(SIZE * SIZE * 4);
  let seed = (r * 73856093) ^ (g * 19349663) ^ (b * 83492791);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const n = (rng(seed++) - 0.5) * 0.18; // ±9% lightness noise
      const pr = clamp255(r * (1 + n));
      const pg = clamp255(g * (1 + n));
      const pb = clamp255(b * (1 + n));
      const i = (y * SIZE + x) * 4;
      out[i + 0] = pr;
      out[i + 1] = pg;
      out[i + 2] = pb;
      out[i + 3] = 255;
    }
  }
  // Top edge highlight, bottom edge shadow (1px) — gives blocks a bevelled feel.
  for (let x = 0; x < SIZE; x += 1) {
    tint(out, x, 0, 1.18);
    tint(out, x, SIZE - 1, 0.78);
  }
  return out;
}

export function buildThreeTexture(THREE, hexColor) {
  const data = buildTextureCanvasData(hexColor);
  const tex = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function parseHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [148, 163, 184];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rng(seed) {
  // xorshift32
  let x = seed | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) / 0xffffffff);
}

function clamp255(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function tint(out, x, y, factor) {
  const i = (y * SIZE + x) * 4;
  out[i] = clamp255(out[i] * factor);
  out[i + 1] = clamp255(out[i + 1] * factor);
  out[i + 2] = clamp255(out[i + 2] * factor);
}
