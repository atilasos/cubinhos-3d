import test from 'node:test';
import assert from 'node:assert/strict';
import { createModel, getVoxel, setVoxel } from '../src/model.js';
import { NbtWriter, parseNbt } from '../src/nbt.js';
import { exportMcStructure, importMcStructure, buildPalette, flattenIndexZYX } from '../src/mcstructure.js';

function asciiIncludes(bytes, text) {
  return Buffer.from(bytes).includes(Buffer.from(text, 'utf8'));
}

function tinyExternalStructure({ size = { x: 2, y: 1, z: 2 }, palette = ['minecraft:air', 'minecraft:blue_wool'], primary = [1, 0, 0, 1], entities = false, blockData = false, stateful = false } = {}) {
  const volume = size.x * size.y * size.z;
  const writer = new NbtWriter();
  return writer.rootCompound(() => {
    writer.int('format_version', 1);
    writer.intList('size', [size.x, size.y, size.z]);
    writer.compound('structure', () => {
      writer.listOfIntLists('block_indices', [primary, new Array(volume).fill(-1)]);
      if (entities) {
        writer.compoundList('entities', [(item) => item.string('identifier', 'minecraft:pig')]);
      } else {
        writer.emptyCompoundList('entities');
      }
      writer.compound('palette', () => {
        writer.compound('default', () => {
          writer.compoundList('block_palette', palette.map((blockId, index) => (item) => {
            item.string('name', blockId);
            if (stateful && index === 1) {
              item.compound('states', () => item.byte('open_bit', 1));
            } else {
              item.emptyCompound('states');
            }
            item.int('version', 17959425);
          }));
          if (blockData) {
            writer.compound('block_position_data', () => writer.emptyCompound('0'));
          } else {
            writer.emptyCompound('block_position_data');
          }
        });
      });
    });
    writer.intList('structure_world_origin', [0, 0, 0]);
  });
}

test('NBT reader parses little-endian compounds written by NbtWriter', () => {
  const writer = new NbtWriter();
  const bytes = writer.rootCompound(() => {
    writer.int('format_version', 1);
    writer.string('name', 'Cubinhos');
    writer.intList('size', [2, 3, 4]);
    writer.compound('child', () => writer.byte('ok', 1));
  });
  assert.deepEqual(parseNbt(bytes), {
    format_version: 1,
    name: 'Cubinhos',
    size: [2, 3, 4],
    child: { ok: 1 },
  });
});

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

test('exported mcstructure imports back into an editable model', () => {
  const model = createModel();
  setVoxel(model, 0, 0, 0, 'minecraft:red_concrete');
  setVoxel(model, 4, 5, 6, 'minecraft:light_blue_wool');
  setVoxel(model, 31, 31, 31, 'minecraft:diamond_block');
  const result = importMcStructure(exportMcStructure(model));
  assert.deepEqual(result.model.size, model.size);
  assert.deepEqual(result.warnings, []);
  assert.equal(getVoxel(result.model, 0, 0, 0), 'minecraft:red_concrete');
  assert.equal(getVoxel(result.model, 4, 5, 6), 'minecraft:light_blue_wool');
  assert.equal(getVoxel(result.model, 31, 31, 31), 'minecraft:diamond_block');
});

test('simple external mcstructure imports palette names in ZYX order', () => {
  const result = importMcStructure(tinyExternalStructure({
    palette: ['minecraft:air', 'minecraft:yellow_concrete', 'minecraft:blue_stained_glass'],
    primary: [1, 2, 0, 1],
  }));
  assert.deepEqual(result.model.size, { x: 2, y: 1, z: 2 });
  assert.equal(getVoxel(result.model, 0, 0, 0), 'minecraft:yellow_concrete');
  assert.equal(getVoxel(result.model, 0, 0, 1), 'minecraft:blue_stained_glass');
  assert.equal(getVoxel(result.model, 1, 0, 0), 'minecraft:air');
  assert.equal(getVoxel(result.model, 1, 0, 1), 'minecraft:yellow_concrete');
});

test('external advanced data is ignored with friendly warnings', () => {
  const result = importMcStructure(tinyExternalStructure({ entities: true, blockData: true, stateful: true }));
  assert.ok(result.warnings.some((warning) => /entidades/i.test(warning)));
  assert.ok(result.warnings.some((warning) => /dados avançados/i.test(warning)));
  assert.ok(result.warnings.some((warning) => /Estados avançados/i.test(warning)));
  assert.equal(getVoxel(result.model, 0, 0, 0), 'minecraft:blue_wool');
});


test('invalid external palette indexes become air with a warning', () => {
  const result = importMcStructure(tinyExternalStructure({ primary: [1, 99, -2, 0] }));
  assert.equal(getVoxel(result.model, 0, 0, 0), 'minecraft:blue_wool');
  assert.equal(getVoxel(result.model, 0, 0, 1), 'minecraft:air');
  assert.equal(getVoxel(result.model, 1, 0, 0), 'minecraft:air');
  assert.ok(result.warnings.some((warning) => /índices de paleta inválidos/i.test(warning)));
});

test('import rejects structures larger than the classroom limit', () => {
  assert.throws(() => importMcStructure(tinyExternalStructure({
    size: { x: 33, y: 1, z: 1 },
    primary: new Array(33).fill(0),
  })), /suporta até 32/);
});
