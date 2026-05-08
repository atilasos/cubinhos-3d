import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModel, setVoxel } from '../src/model.js';
import { castRay } from '../src/raycaster.js';

test('castRay hits empty model on floor plane', () => {
  const model = createModel();
  const hit = castRay(model, { origin: [16, 20, 16], dir: [0, -1, 0] });
  assert.equal(hit.kind, 'floor');
  assert.deepEqual(hit.ghostVoxel, [16, 0, 16]);
});

test('castRay hits placed voxel and reports face', () => {
  const model = createModel();
  setVoxel(model, 16, 0, 16, 'minecraft:stone');
  const hit = castRay(model, { origin: [16.5, 20, 16.5], dir: [0, -1, 0] });
  assert.equal(hit.kind, 'voxel');
  assert.deepEqual(hit.voxel, [16, 0, 16]);
  assert.deepEqual(hit.normal, [0, 1, 0]);
  assert.deepEqual(hit.ghostVoxel, [16, 1, 16]);
});

test('castRay returns null when ray misses the world', () => {
  const model = createModel();
  const hit = castRay(model, { origin: [-100, 50, -100], dir: [-1, 0, 0] });
  assert.equal(hit, null);
});

test('castRay hits side face from horizontal ray', () => {
  const model = createModel();
  setVoxel(model, 10, 5, 10, 'minecraft:stone');
  const hit = castRay(model, { origin: [0, 5.5, 10.5], dir: [1, 0, 0] });
  assert.equal(hit.kind, 'voxel');
  assert.deepEqual(hit.voxel, [10, 5, 10]);
  assert.deepEqual(hit.normal, [-1, 0, 0]);
  assert.deepEqual(hit.ghostVoxel, [9, 5, 10]);
});
