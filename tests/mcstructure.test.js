import test from 'node:test';
import assert from 'node:assert/strict';
import { createModel, setVoxel } from '../src/model.js';
import { exportMcStructure, buildPalette, flattenIndexZYX } from '../src/mcstructure.js';

function asciiIncludes(bytes, text) {
  return Buffer.from(bytes).includes(Buffer.from(text, 'utf8'));
}

test('export returns a non-empty mcstructure byte array with required NBT names', () => {
  const model = createModel();
  setVoxel(model, 0, 0, 0, 'minecraft:red_concrete');
  const bytes = exportMcStructure(model);
  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.length > 100);
  for (const name of ['format_version', 'size', 'structure', 'block_indices', 'palette', 'default', 'block_palette', 'structure_world_origin']) {
    assert.ok(asciiIncludes(bytes, name), `missing ${name}`);
  }
});

test('palette includes air and used blocks only', () => {
  const model = createModel();
  setVoxel(model, 0, 0, 0, 'minecraft:red_concrete');
  setVoxel(model, 1, 0, 0, 'minecraft:red_concrete');
  setVoxel(model, 2, 0, 0, 'minecraft:glass');
  assert.deepEqual(buildPalette(model), ['minecraft:air', 'minecraft:red_concrete', 'minecraft:glass']);
});

test('flattenIndexZYX follows Bedrock z-fastest then y then x order', () => {
  assert.equal(flattenIndexZYX({ x: 2, y: 3, z: 4 }, 0, 0, 0), 0);
  assert.equal(flattenIndexZYX({ x: 2, y: 3, z: 4 }, 0, 0, 3), 3);
  assert.equal(flattenIndexZYX({ x: 2, y: 3, z: 4 }, 0, 1, 0), 4);
  assert.equal(flattenIndexZYX({ x: 2, y: 3, z: 4 }, 1, 0, 0), 12);
});

test('export writes little-endian size values for 32×32×32', () => {
  const bytes = exportMcStructure(createModel());
  const marker = Buffer.from('size', 'utf8');
  const markerIndex = Buffer.from(bytes).indexOf(marker);
  assert.ok(markerIndex > 0);
  const afterName = markerIndex + marker.length;
  const sizePayload = Buffer.from(bytes).subarray(afterName, afterName + 32);
  assert.ok(sizePayload.includes(Buffer.from([32, 0, 0, 0])));
});
