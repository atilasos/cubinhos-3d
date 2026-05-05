import { createModel, getVoxel, setVoxel } from './model.js';
import { NbtWriter, parseNbt } from './nbt.js';

const AIR = 'minecraft:air';
const BLOCK_VERSION = 17959425;
const MAX_IMPORT_SIZE = 32;

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

export function importMcStructure(bytes) {
  const root = parseNbt(bytes);
  const warnings = [];
  const size = readSize(root.size);
  const volume = size.x * size.y * size.z;
  const structure = requiredCompound(root.structure, 'structure');
  const blockIndices = readBlockIndices(structure.block_indices, volume);
  const palette = readPalette(structure.palette, warnings);

  if (Array.isArray(structure.entities) && structure.entities.length > 0) {
    warnings.push('O ficheiro tinha entidades. Foram ignoradas para manter o projeto simples.');
  }

  const defaultPalette = structure.palette?.default;
  if (defaultPalette?.block_position_data && Object.keys(defaultPalette.block_position_data).length > 0) {
    warnings.push('O ficheiro tinha dados avançados de blocos. Foram ignorados.');
  }

  if (blockIndices[1]?.some((index) => index > 0)) {
    warnings.push('A camada secundária da estrutura foi ignorada.');
  }

  const model = createModel(size);
  const primary = blockIndices[0];
  let invalidPaletteIndexes = 0;
  for (let x = 0; x < size.x; x += 1) {
    for (let y = 0; y < size.y; y += 1) {
      for (let z = 0; z < size.z; z += 1) {
        const flat = flattenIndexZYX(size, x, y, z);
        const paletteIndex = primary[flat];
        let block = AIR;
        if (paletteIndex === -1) {
          block = AIR;
        } else if (Number.isInteger(paletteIndex) && paletteIndex >= 0 && paletteIndex < palette.length) {
          block = palette[paletteIndex];
        } else {
          invalidPaletteIndexes += 1;
        }
        setVoxel(model, x, y, z, block);
      }
    }
  }

  if (invalidPaletteIndexes > 0) {
    warnings.push(`${invalidPaletteIndexes} blocos tinham índices de paleta inválidos e foram tratados como ar.`);
  }

  return { model, warnings };
}

function readSize(value) {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new Error('O ficheiro .mcstructure não tem um tamanho válido.');
  }
  const [x, y, z] = value.map(Number);
  const size = { x, y, z };
  for (const [axis, dimension] of Object.entries(size)) {
    if (!Number.isInteger(dimension) || dimension <= 0) {
      throw new Error(`O tamanho ${axis} da estrutura é inválido.`);
    }
    if (dimension > MAX_IMPORT_SIZE) {
      throw new Error(`Esta estrutura tem ${dimension} blocos no eixo ${axis}; o Cubinhos 3D suporta até ${MAX_IMPORT_SIZE}.`);
    }
  }
  return size;
}

function readBlockIndices(value, volume) {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error('O ficheiro .mcstructure não tem as duas listas block_indices necessárias.');
  }
  return value.map((layer, index) => {
    if (!Array.isArray(layer) || layer.length !== volume) {
      throw new Error(`A lista block_indices ${index} não corresponde ao tamanho da estrutura.`);
    }
    return layer.map((item) => Number(item));
  });
}

function readPalette(value, warnings) {
  const paletteRoot = requiredCompound(value, 'palette');
  const defaultPalette = requiredCompound(paletteRoot.default, 'palette.default');
  if (!Array.isArray(defaultPalette.block_palette) || defaultPalette.block_palette.length === 0) {
    throw new Error('O ficheiro .mcstructure não tem uma paleta de blocos válida.');
  }
  return defaultPalette.block_palette.map((entry, index) => {
    const name = typeof entry?.name === 'string' ? entry.name : AIR;
    if (entry?.states && Object.keys(entry.states).length > 0) {
      warnings.push(`Estados avançados ignorados no bloco ${name}.`);
    }
    if (index === 0 && name !== AIR) {
      warnings.push('A primeira entrada da paleta não era ar; a estrutura foi importada mesmo assim.');
    }
    return name;
  });
}

function requiredCompound(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`O ficheiro .mcstructure não tem ${label} válido.`);
  }
  return value;
}

export function downloadMcStructure(model, filename = 'cubinhos-3d.mcstructure') {
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
