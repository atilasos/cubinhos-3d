import { getVoxel } from './model.js';
import { NbtWriter } from './nbt.js';

const AIR = 'minecraft:air';
const BLOCK_VERSION = 17959425;

export function flattenIndexZYX(size, x, y, z) {
  return x * size.y * size.z + y * size.z + z;
}

export function buildPalette(model) {
  const palette = [AIR];
  const seen = new Set(palette);
  for (let x = 0; x < model.size.x; x += 1) {
    for (let y = 0; y < model.size.y; y += 1) {
      for (let z = 0; z < model.size.z; z += 1) {
        const block = getVoxel(model, x, y, z) || AIR;
        if (!seen.has(block)) {
          seen.add(block);
          palette.push(block);
        }
      }
    }
  }
  return palette;
}

export function exportMcStructure(model) {
  const palette = buildPalette(model);
  const paletteIndex = new Map(palette.map((id, index) => [id, index]));
  const volume = model.size.x * model.size.y * model.size.z;
  const primary = new Array(volume).fill(0);
  const secondary = new Array(volume).fill(-1);

  for (let x = 0; x < model.size.x; x += 1) {
    for (let y = 0; y < model.size.y; y += 1) {
      for (let z = 0; z < model.size.z; z += 1) {
        const flat = flattenIndexZYX(model.size, x, y, z);
        primary[flat] = paletteIndex.get(getVoxel(model, x, y, z) || AIR) ?? 0;
      }
    }
  }

  const writer = new NbtWriter();
  return writer.rootCompound(() => {
    writer.int('format_version', 1);
    writer.intList('size', [model.size.x, model.size.y, model.size.z]);
    writer.compound('structure', () => {
      writer.listOfIntLists('block_indices', [primary, secondary]);
      writer.emptyCompoundList('entities');
      writer.compound('palette', () => {
        writer.compound('default', () => {
          writer.compoundList('block_palette', palette.map((blockId) => (itemWriter) => {
            itemWriter.string('name', blockId);
            itemWriter.emptyCompound('states');
            itemWriter.int('version', BLOCK_VERSION);
          }));
          writer.emptyCompound('block_position_data');
        });
      });
    });
    writer.intList('structure_world_origin', [0, 0, 0]);
  });
}

export function downloadMcStructure(model, filename = 'voxelcraft.mcstructure') {
  const bytes = exportMcStructure(model);
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.mcstructure') ? filename : `${filename}.mcstructure`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
