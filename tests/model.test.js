import test from 'node:test';
import assert from 'node:assert/strict';
import { createModel, setVoxel, getVoxel, fillLayer, serializeModel, deserializeModel, createHistory } from '../src/model.js';

test('model creates a 32×32×32 empty grid', () => {
  const model = createModel();
  assert.deepEqual(model.size, { x: 32, y: 32, z: 32 });
  assert.equal(model.cells.length, 32 * 32 * 32);
  assert.equal(getVoxel(model, 0, 0, 0), 'minecraft:air');
});

test('setting and clearing a voxel works at valid coordinates', () => {
  const model = createModel();
  setVoxel(model, 1, 2, 3, 'minecraft:red_concrete');
  assert.equal(getVoxel(model, 1, 2, 3), 'minecraft:red_concrete');
  setVoxel(model, 1, 2, 3, 'minecraft:air');
  assert.equal(getVoxel(model, 1, 2, 3), 'minecraft:air');
});

test('out-of-bounds edits are rejected safely', () => {
  const model = createModel();
  assert.throws(() => setVoxel(model, -1, 0, 0, 'minecraft:stone'), /out of bounds/);
  assert.throws(() => getVoxel(model, 32, 0, 0), /out of bounds/);
});

test('fillLayer modifies only the selected y layer', () => {
  const model = createModel();
  fillLayer(model, 4, 'minecraft:blue_concrete');
  assert.equal(getVoxel(model, 0, 4, 0), 'minecraft:blue_concrete');
  assert.equal(getVoxel(model, 31, 4, 31), 'minecraft:blue_concrete');
  assert.equal(getVoxel(model, 0, 3, 0), 'minecraft:air');
  assert.equal(getVoxel(model, 0, 5, 0), 'minecraft:air');
});

test('serialize and deserialize roundtrip preserves dimensions and blocks', () => {
  const model = createModel();
  setVoxel(model, 2, 3, 4, 'minecraft:oak_planks');
  const restored = deserializeModel(serializeModel(model));
  assert.deepEqual(restored.size, model.size);
  assert.equal(getVoxel(restored, 2, 3, 4), 'minecraft:oak_planks');
});

test('history undo and redo restore grid states', () => {
  const model = createModel();
  const history = createHistory(model);
  setVoxel(model, 0, 0, 0, 'minecraft:glass');
  history.commit(model);
  history.undo(model);
  assert.equal(getVoxel(model, 0, 0, 0), 'minecraft:air');
  history.redo(model);
  assert.equal(getVoxel(model, 0, 0, 0), 'minecraft:glass');
});
