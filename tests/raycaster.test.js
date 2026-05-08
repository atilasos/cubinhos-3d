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

test('castRay reports correct distance to voxel', () => {
  const model = createModel();
  setVoxel(model, 10, 0, 0, 'minecraft:stone');
  const hit = castRay(model, { origin: [0.5, 0.5, 0.5], dir: [1, 0, 0] });
  // ray enters voxel at x=10 from -X face after 9.5 units (10 - 0.5)
  assert.ok(Math.abs(hit.distance - 9.5) < 0.01, `expected ~9.5, got ${hit.distance}`);
});

test('castRay reports correct distance to floor', () => {
  const model = createModel();
  const hit = castRay(model, { origin: [16, 20, 16], dir: [0, -1, 0] });
  // floor at y=0, origin at y=20 → distance 20
  assert.equal(hit.kind, 'floor');
  assert.ok(Math.abs(hit.distance - 20) < 0.01, `expected ~20, got ${hit.distance}`);
});

test('castRay sets normal correctly when origin is outside and first cell is solid', () => {
  const model = createModel();
  setVoxel(model, 0, 15, 15, 'minecraft:stone');
  const hit = castRay(model, { origin: [-5, 15.5, 15.5], dir: [1, 0, 0] });
  assert.equal(hit.kind, 'voxel');
  assert.deepEqual(hit.voxel, [0, 15, 15]);
  assert.deepEqual(hit.normal, [-1, 0, 0]);
  assert.deepEqual(hit.ghostVoxel, [-1, 15, 15]);
});
