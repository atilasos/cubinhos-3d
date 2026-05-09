import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAtlasTransform, ATLASES } from '../src/atlas.js';

test('getAtlasTransform top-left of 4x4 atlas', () => {
  const r = getAtlasTransform({ cols: 4, rows: 4, col: 0, row: 0 });
  assert.deepEqual(r, { offsetX: 0, offsetY: 0.75, repeatX: 0.25, repeatY: 0.25 });
});

test('getAtlasTransform bottom-right of 8x4 atlas', () => {
  const r = getAtlasTransform({ cols: 8, rows: 4, col: 7, row: 3 });
  assert.deepEqual(r, { offsetX: 0.875, offsetY: 0, repeatX: 0.125, repeatY: 0.25 });
});

test('getAtlasTransform bottom-right of 4x4 atlas', () => {
  const r = getAtlasTransform({ cols: 4, rows: 4, col: 3, row: 3 });
  assert.deepEqual(r, { offsetX: 0.75, offsetY: 0, repeatX: 0.25, repeatY: 0.25 });
});

test('ATLASES metadata has natural, color, special', () => {
  assert.equal(ATLASES.natural.cols, 4);
  assert.equal(ATLASES.natural.rows, 4);
  assert.equal(ATLASES.color.cols, 8);
  assert.equal(ATLASES.color.rows, 4);
  assert.equal(ATLASES.special.cols, 4);
  assert.equal(ATLASES.special.rows, 4);
  assert.match(ATLASES.natural.path, /atlas-natural\.png$/);
  assert.match(ATLASES.color.path, /atlas-cor\.png$/);
  assert.match(ATLASES.special.path, /atlas-especial\.png$/);
});
