import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOCKS, BLOCK_BY_ID, paletteBlocks, blockColor, blockName } from '../src/blocks.js';
import { ATLASES } from '../src/atlas.js';

test('paletteBlocks has exactly 64 non-air blocks', () => {
  assert.equal(paletteBlocks().length, 64);
});

test('palette contains 16 natural + 32 color + 16 special', () => {
  const counts = { natural: 0, color: 0, special: 0 };
  for (const b of paletteBlocks()) counts[b.atlas] += 1;
  assert.deepEqual(counts, { natural: 16, color: 32, special: 16 });
});

test('all block ids are unique', () => {
  const ids = paletteBlocks().map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('all block ids start with minecraft:', () => {
  for (const b of paletteBlocks()) assert.match(b.id, /^minecraft:/);
});

test('all (atlas, col, row) coordinates are valid', () => {
  for (const b of paletteBlocks()) {
    const meta = ATLASES[b.atlas];
    assert.ok(meta, `unknown atlas: ${b.atlas} for ${b.id}`);
    assert.ok(b.col >= 0 && b.col < meta.cols, `col out of range for ${b.id}`);
    assert.ok(b.row >= 0 && b.row < meta.rows, `row out of range for ${b.id}`);
  }
});

test('no two blocks share the same (atlas, col, row)', () => {
  const seen = new Set();
  for (const b of paletteBlocks()) {
    const key = `${b.atlas}:${b.col},${b.row}`;
    assert.ok(!seen.has(key), `duplicate atlas slot: ${key}`);
    seen.add(key);
  }
});

test('BLOCK_BY_ID resolves every palette block', () => {
  for (const b of paletteBlocks()) assert.equal(BLOCK_BY_ID[b.id], b);
});

test('legacy helpers still work', () => {
  assert.equal(blockName('minecraft:grass_block'), 'Relva');
  assert.match(blockColor('minecraft:grass_block'), /^#[0-9a-f]{6}$/i);
});

test('air block is present and marked empty', () => {
  assert.equal(BLOCK_BY_ID['minecraft:air'].empty, true);
});
