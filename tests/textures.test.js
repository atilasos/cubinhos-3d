import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTextureCanvasData } from '../src/textures.js';

test('buildTextureCanvasData produces 16x16 RGBA bytes', () => {
  const bytes = buildTextureCanvasData('#5b9b3a');
  assert.equal(bytes.length, 16 * 16 * 4);
});

test('buildTextureCanvasData is deterministic for same color', () => {
  const a = buildTextureCanvasData('#5b9b3a');
  const b = buildTextureCanvasData('#5b9b3a');
  assert.deepEqual(a, b);
});

test('buildTextureCanvasData differs for different colors', () => {
  const a = buildTextureCanvasData('#5b9b3a');
  const b = buildTextureCanvasData('#a12722');
  assert.notDeepEqual(a, b);
});
