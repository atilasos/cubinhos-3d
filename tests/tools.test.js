import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModel, getVoxel, setVoxel } from '../src/model.js';
import { createTools } from '../src/tools.js';

test('build tool places block at ghostVoxel on floor hit', () => {
  const model = createModel();
  const tools = createTools(model);
  tools.setTool('build'); tools.setBlock('minecraft:stone');
  tools.applyAt({ kind: 'floor', ghostVoxel: [10, 0, 10] });
  assert.equal(getVoxel(model, 10, 0, 10), 'minecraft:stone');
});

test('build tool places adjacent to face on voxel hit', () => {
  const model = createModel();
  setVoxel(model, 5, 0, 5, 'minecraft:dirt');
  const tools = createTools(model);
  tools.setTool('build'); tools.setBlock('minecraft:grass_block');
  tools.applyAt({ kind: 'voxel', voxel: [5, 0, 5], normal: [0, 1, 0], ghostVoxel: [5, 1, 5] });
  assert.equal(getVoxel(model, 5, 1, 5), 'minecraft:grass_block');
});

test('erase tool removes voxel', () => {
  const model = createModel();
  setVoxel(model, 5, 0, 5, 'minecraft:dirt');
  const tools = createTools(model);
  tools.setTool('erase');
  tools.applyAt({ kind: 'voxel', voxel: [5, 0, 5], normal: [0, 1, 0], ghostVoxel: [5, 1, 5] });
  assert.equal(getVoxel(model, 5, 0, 5), 'minecraft:air');
});

test('paint tool replaces voxel id', () => {
  const model = createModel();
  setVoxel(model, 5, 0, 5, 'minecraft:dirt');
  const tools = createTools(model);
  tools.setTool('paint'); tools.setBlock('minecraft:gold_block');
  tools.applyAt({ kind: 'voxel', voxel: [5, 0, 5], normal: [0, 1, 0], ghostVoxel: [5, 1, 5] });
  assert.equal(getVoxel(model, 5, 0, 5), 'minecraft:gold_block');
});

test('fill tool flood-fills connected same-id cells in same Y layer', () => {
  const model = createModel();
  for (let x = 0; x < 5; x += 1) setVoxel(model, x, 0, 0, 'minecraft:dirt');
  setVoxel(model, 2, 0, 0, 'minecraft:stone');
  const tools = createTools(model);
  tools.setTool('fill'); tools.setBlock('minecraft:gold_block');
  tools.applyAt({ kind: 'voxel', voxel: [0, 0, 0], normal: [0, 1, 0], ghostVoxel: [0, 1, 0] });
  assert.equal(getVoxel(model, 0, 0, 0), 'minecraft:gold_block');
  assert.equal(getVoxel(model, 1, 0, 0), 'minecraft:gold_block');
  assert.equal(getVoxel(model, 2, 0, 0), 'minecraft:stone');
  assert.equal(getVoxel(model, 3, 0, 0), 'minecraft:dirt');
});

test('drag-paint applies to multiple targets and dedupes the same voxel', () => {
  const model = createModel();
  const tools = createTools(model);
  tools.setTool('build'); tools.setBlock('minecraft:stone');
  tools.startStroke();
  tools.applyAt({ kind: 'floor', ghostVoxel: [3, 0, 3] });
  tools.applyAt({ kind: 'floor', ghostVoxel: [3, 0, 3] });
  tools.applyAt({ kind: 'floor', ghostVoxel: [4, 0, 3] });
  const changes = tools.endStroke();
  assert.equal(changes.length, 2);
  assert.equal(getVoxel(model, 3, 0, 3), 'minecraft:stone');
  assert.equal(getVoxel(model, 4, 0, 3), 'minecraft:stone');
});
