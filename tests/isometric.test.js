import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findIsoFaceTarget,
  projectIsoBlockFaces,
  rotatePointXZ,
  projectIsoCell,
  screenToIsoCell,
} from '../src/isometric.js';

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

function centroid(points) {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

test('findIsoFaceTarget selects the top face target above a visible block', () => {
  const options = { size: { x: 32, y: 32, z: 32 }, originX: 300, originY: 80, zoom: 1 };
  const faces = projectIsoBlockFaces(4, 2, 5, options);
  const click = centroid(faces.top);
  const target = findIsoFaceTarget(click.x, click.y, [{ x: 4, y: 2, z: 5, block: 'minecraft:stone' }], options);
  assert.equal(target.face, 'top');
  assert.equal(target.placeable, true);
  assert.deepEqual(target.target, { x: 4, y: 3, z: 5 });
});

test('findIsoFaceTarget selects side face targets in world coordinates', () => {
  const options = { size: { x: 32, y: 32, z: 32 }, originX: 300, originY: 80, zoom: 1, rotation: 0 };
  const faces = projectIsoBlockFaces(4, 2, 5, options);
  const rightClick = centroid(faces.right);
  const leftClick = centroid(faces.left);
  assert.deepEqual(findIsoFaceTarget(rightClick.x, rightClick.y, [{ x: 4, y: 2, z: 5 }], options).target, { x: 5, y: 2, z: 5 });
  assert.deepEqual(findIsoFaceTarget(leftClick.x, leftClick.y, [{ x: 4, y: 2, z: 5 }], options).target, { x: 4, y: 2, z: 6 });
});

test('findIsoFaceTarget rotates side targets with the view', () => {
  const options = { size: { x: 32, y: 32, z: 32 }, originX: 300, originY: 80, zoom: 1, rotation: 1 };
  const faces = projectIsoBlockFaces(4, 2, 5, options);
  const rightClick = centroid(faces.right);
  const leftClick = centroid(faces.left);
  assert.deepEqual(findIsoFaceTarget(rightClick.x, rightClick.y, [{ x: 4, y: 2, z: 5 }], options).target, { x: 4, y: 2, z: 4 });
  assert.deepEqual(findIsoFaceTarget(leftClick.x, leftClick.y, [{ x: 4, y: 2, z: 5 }], options).target, { x: 5, y: 2, z: 5 });
});


test('findIsoFaceTarget reports out-of-bounds side placements as not placeable', () => {
  const options = { size: { x: 6, y: 6, z: 6 }, originX: 180, originY: 80, zoom: 1, rotation: 0 };
  const faces = projectIsoBlockFaces(5, 1, 2, options);
  const click = centroid(faces.right);
  const target = findIsoFaceTarget(click.x, click.y, [{ x: 5, y: 1, z: 2 }], options);
  assert.equal(target.face, 'right');
  assert.equal(target.placeable, false);
  assert.deepEqual(target.target, { x: 6, y: 1, z: 2 });
});
