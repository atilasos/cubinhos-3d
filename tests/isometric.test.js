import test from 'node:test';
import assert from 'node:assert/strict';
import { rotatePointXZ, projectIsoCell, screenToIsoCell } from '../src/isometric.js';

test('rotatePointXZ rotates grid coordinates by quarter turns', () => {
  const size = { x: 32, z: 32 };
  assert.deepEqual(rotatePointXZ(2, 5, size, 0), { x: 2, z: 5 });
  assert.deepEqual(rotatePointXZ(2, 5, size, 1), { x: 26, z: 2 });
  assert.deepEqual(rotatePointXZ(2, 5, size, 2), { x: 29, z: 26 });
  assert.deepEqual(rotatePointXZ(2, 5, size, 3), { x: 5, z: 29 });
});

test('screenToIsoCell inverts projected cell centers at different zoom levels', () => {
  const size = { x: 32, z: 32 };
  for (const zoom of [0.75, 1, 1.5]) {
    const projected = projectIsoCell(7, 9, { size, rotation: 1, zoom, originX: 300, originY: 120 });
    assert.deepEqual(screenToIsoCell(projected.cx, projected.cy, { size, rotation: 1, zoom, originX: 300, originY: 120 }), { x: 7, z: 9 });
  }
});

test('projectIsoCell zoom changes screen scale but not logical coordinate', () => {
  const size = { x: 32, z: 32 };
  const a = projectIsoCell(10, 4, { size, rotation: 0, zoom: 1, originX: 0, originY: 0 });
  const b = projectIsoCell(10, 4, { size, rotation: 0, zoom: 2, originX: 0, originY: 0 });
  assert.equal(b.cx, a.cx * 2);
  assert.equal(b.cy, a.cy * 2);
});
