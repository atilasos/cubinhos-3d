const NATURE   = 'Natureza';
const WOOD     = 'Madeiras';
const STONE    = 'Pedra';
const CONCRETE = 'Cores fortes';
const WOOL     = 'Lãs suaves';
const GLASS    = 'Vidros e luz';
const SPECIAL  = 'Materiais especiais';

// Cores hex aproximadas para fallback de UI (badges, status).
// Texturas reais vêm dos atlas PNG — estas cores não geram texturas.
export const BLOCKS = [
  { id: 'minecraft:air', name: 'Ar', color: '#f8fafc', category: 'Sistema', empty: true },

  // ── Atlas natural (4×4) ────────────────────────────────────────────
  { id: 'minecraft:grass_block',   name: 'Relva',         color: '#5b9b3a', category: NATURE, atlas: 'natural', col: 0, row: 0 },
  { id: 'minecraft:dirt',          name: 'Terra',         color: '#866043', category: NATURE, atlas: 'natural', col: 1, row: 0 },
  { id: 'minecraft:sand',          name: 'Areia',         color: '#d9c47a', category: NATURE, atlas: 'natural', col: 2, row: 0 },
  { id: 'minecraft:snow',          name: 'Neve',          color: '#f7fbff', category: NATURE, atlas: 'natural', col: 3, row: 0 },
  { id: 'minecraft:ice',           name: 'Gelo',          color: '#9bd6ff', category: NATURE, atlas: 'natural', col: 0, row: 1 },
  { id: 'minecraft:clay',          name: 'Argila',        color: '#a7b0bd', category: NATURE, atlas: 'natural', col: 1, row: 1 },
  { id: 'minecraft:stone',         name: 'Pedra',         color: '#7d7d7d', category: STONE,  atlas: 'natural', col: 2, row: 1 },
  { id: 'minecraft:cobblestone',   name: 'Calçada',       color: '#6f6f6f', category: STONE,  atlas: 'natural', col: 3, row: 1 },
  { id: 'minecraft:gravel',        name: 'Cascalho',      color: '#857f78', category: NATURE, atlas: 'natural', col: 0, row: 2 },
  { id: 'minecraft:mud',           name: 'Lama',          color: '#3a2e26', category: NATURE, atlas: 'natural', col: 1, row: 2 },
  { id: 'minecraft:birch_log',     name: 'Tronco claro',  color: '#d6c17b', category: WOOD,   atlas: 'natural', col: 2, row: 2 },
  { id: 'minecraft:oak_log',       name: 'Tronco médio',  color: '#7a5b32', category: WOOD,   atlas: 'natural', col: 3, row: 2 },
  { id: 'minecraft:dark_oak_log',  name: 'Tronco escuro', color: '#3a2818', category: WOOD,   atlas: 'natural', col: 0, row: 3 },
  { id: 'minecraft:oak_planks',    name: 'Tábuas',        color: '#b98b4b', category: WOOD,   atlas: 'natural', col: 1, row: 3 },
  { id: 'minecraft:oak_wood',      name: 'Casca',         color: '#5d4222', category: WOOD,   atlas: 'natural', col: 2, row: 3 },
  { id: 'minecraft:oak_leaves',    name: 'Folhas',        color: '#4a7d2a', category: NATURE, atlas: 'natural', col: 3, row: 3 },

  // ── Atlas cor (8×4) — concrete rows 0-1, wool rows 2-3 ─────────────
  { id: 'minecraft:white_concrete',      name: 'Branco',         color: '#f2f3f3', category: CONCRETE, atlas: 'color', col: 0, row: 0 },
  { id: 'minecraft:light_gray_concrete', name: 'Cinza claro',    color: '#8e8e86', category: CONCRETE, atlas: 'color', col: 1, row: 0 },
  { id: 'minecraft:gray_concrete',       name: 'Cinza',          color: '#373a3e', category: CONCRETE, atlas: 'color', col: 2, row: 0 },
  { id: 'minecraft:black_concrete',      name: 'Preto',          color: '#080a0f', category: CONCRETE, atlas: 'color', col: 3, row: 0 },
  { id: 'minecraft:brown_concrete',      name: 'Castanho',       color: '#603b1f', category: CONCRETE, atlas: 'color', col: 4, row: 0 },
  { id: 'minecraft:red_concrete',        name: 'Vermelho',       color: '#8e2020', category: CONCRETE, atlas: 'color', col: 5, row: 0 },
  { id: 'minecraft:orange_concrete',     name: 'Laranja',        color: '#e06101', category: CONCRETE, atlas: 'color', col: 6, row: 0 },
  { id: 'minecraft:yellow_concrete',     name: 'Amarelo',        color: '#f0af15', category: CONCRETE, atlas: 'color', col: 7, row: 0 },
  { id: 'minecraft:lime_concrete',       name: 'Lima',           color: '#5ea918', category: CONCRETE, atlas: 'color', col: 0, row: 1 },
  { id: 'minecraft:green_concrete',      name: 'Verde',          color: '#495b24', category: CONCRETE, atlas: 'color', col: 1, row: 1 },
  { id: 'minecraft:cyan_concrete',       name: 'Ciano',          color: '#157788', category: CONCRETE, atlas: 'color', col: 2, row: 1 },
  { id: 'minecraft:light_blue_concrete', name: 'Azul claro',     color: '#2389c6', category: CONCRETE, atlas: 'color', col: 3, row: 1 },
  { id: 'minecraft:blue_concrete',       name: 'Azul',           color: '#2c2e8f', category: CONCRETE, atlas: 'color', col: 4, row: 1 },
  { id: 'minecraft:purple_concrete',     name: 'Roxo',           color: '#641f9c', category: CONCRETE, atlas: 'color', col: 5, row: 1 },
  { id: 'minecraft:magenta_concrete',    name: 'Magenta',        color: '#a9309f', category: CONCRETE, atlas: 'color', col: 6, row: 1 },
  { id: 'minecraft:pink_concrete',       name: 'Rosa',           color: '#d5658e', category: CONCRETE, atlas: 'color', col: 7, row: 1 },

  { id: 'minecraft:white_wool',      name: 'Lã branca',     color: '#e9ecec', category: WOOL, atlas: 'color', col: 0, row: 2 },
  { id: 'minecraft:light_gray_wool', name: 'Lã cinza clara', color: '#8d8d87', category: WOOL, atlas: 'color', col: 1, row: 2 },
  { id: 'minecraft:gray_wool',       name: 'Lã cinza',      color: '#3e4447', category: WOOL, atlas: 'color', col: 2, row: 2 },
  { id: 'minecraft:black_wool',      name: 'Lã preta',      color: '#141519', category: WOOL, atlas: 'color', col: 3, row: 2 },
  { id: 'minecraft:brown_wool',      name: 'Lã castanha',   color: '#724728', category: WOOL, atlas: 'color', col: 4, row: 2 },
  { id: 'minecraft:red_wool',        name: 'Lã vermelha',   color: '#a12722', category: WOOL, atlas: 'color', col: 5, row: 2 },
  { id: 'minecraft:orange_wool',     name: 'Lã laranja',    color: '#f07613', category: WOOL, atlas: 'color', col: 6, row: 2 },
  { id: 'minecraft:yellow_wool',     name: 'Lã amarela',    color: '#f8c628', category: WOOL, atlas: 'color', col: 7, row: 2 },
  { id: 'minecraft:lime_wool',       name: 'Lã lima',       color: '#70b919', category: WOOL, atlas: 'color', col: 0, row: 3 },
  { id: 'minecraft:green_wool',      name: 'Lã verde',      color: '#556e2c', category: WOOL, atlas: 'color', col: 1, row: 3 },
  { id: 'minecraft:cyan_wool',       name: 'Lã ciano',      color: '#178691', category: WOOL, atlas: 'color', col: 2, row: 3 },
  { id: 'minecraft:light_blue_wool', name: 'Lã azul clara', color: '#3aa8db', category: WOOL, atlas: 'color', col: 3, row: 3 },
  { id: 'minecraft:blue_wool',       name: 'Lã azul',       color: '#35399d', category: WOOL, atlas: 'color', col: 4, row: 3 },
  { id: 'minecraft:purple_wool',     name: 'Lã roxa',       color: '#7b2bb2', category: WOOL, atlas: 'color', col: 5, row: 3 },
  { id: 'minecraft:magenta_wool',    name: 'Lã magenta',    color: '#c64fbd', category: WOOL, atlas: 'color', col: 6, row: 3 },
  { id: 'minecraft:pink_wool',       name: 'Lã rosa',       color: '#ed8dac', category: WOOL, atlas: 'color', col: 7, row: 3 },

  // ── Atlas especial (4×4) ───────────────────────────────────────────
  { id: 'minecraft:glass',                     name: 'Vidro',           color: '#a8d8ff', category: GLASS,   atlas: 'special', col: 0, row: 0 },
  { id: 'minecraft:light_blue_stained_glass',  name: 'Vidro azul',      color: '#75c7ee', category: GLASS,   atlas: 'special', col: 1, row: 0 },
  { id: 'minecraft:gold_block',                name: 'Ouro',            color: '#f5d33b', category: SPECIAL, atlas: 'special', col: 2, row: 0 },
  { id: 'minecraft:iron_block',                name: 'Ferro',           color: '#d8d8d8', category: SPECIAL, atlas: 'special', col: 3, row: 0 },
  { id: 'minecraft:diamond_block',             name: 'Diamante',        color: '#63d6cf', category: SPECIAL, atlas: 'special', col: 0, row: 1 },
  { id: 'minecraft:emerald_block',             name: 'Esmeralda',       color: '#2ecc71', category: SPECIAL, atlas: 'special', col: 1, row: 1 },
  { id: 'minecraft:lapis_block',               name: 'Lápis-lazúli',    color: '#214aa6', category: SPECIAL, atlas: 'special', col: 2, row: 1 },
  { id: 'minecraft:amethyst_block',            name: 'Ametista',        color: '#8561c5', category: SPECIAL, atlas: 'special', col: 3, row: 1 },
  { id: 'minecraft:glowstone',                 name: 'Glowstone',       color: '#d7a947', category: GLASS,   atlas: 'special', col: 0, row: 2 },
  { id: 'minecraft:sea_lantern',               name: 'Lanterna do mar', color: '#bce6df', category: GLASS,   atlas: 'special', col: 1, row: 2 },
  { id: 'minecraft:quartz_block',              name: 'Quartzo',         color: '#eee7dc', category: STONE,   atlas: 'special', col: 2, row: 2 },
  { id: 'minecraft:copper_block',              name: 'Cobre',           color: '#c87534', category: SPECIAL, atlas: 'special', col: 3, row: 2 },
  { id: 'minecraft:obsidian',                  name: 'Obsidiana',       color: '#1c0f2a', category: STONE,   atlas: 'special', col: 0, row: 3 },
  { id: 'minecraft:redstone_block',            name: 'Cristal vermelho', color: '#a52121', category: SPECIAL, atlas: 'special', col: 1, row: 3 },
  { id: 'minecraft:smooth_quartz',             name: 'Mármore',         color: '#ece4d3', category: STONE,   atlas: 'special', col: 2, row: 3 },
  { id: 'minecraft:deepslate_bricks',          name: 'Tijolo escuro',   color: '#3a3a3a', category: STONE,   atlas: 'special', col: 3, row: 3 },
];

export const BLOCK_BY_ID = Object.fromEntries(BLOCKS.map((block) => [block.id, block]));

export function blockColor(id) {
  return BLOCK_BY_ID[id]?.color ?? '#94a3b8';
}

export function blockName(id) {
  return BLOCK_BY_ID[id]?.name ?? id.replace('minecraft:', '').replaceAll('_', ' ');
}

export function paletteBlocks() {
  return BLOCKS.filter((b) => !b.empty);
}
