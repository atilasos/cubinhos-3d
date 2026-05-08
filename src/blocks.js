const COLOR_CONCRETE = 'Cores fortes';
const SOFT_WOOL = 'Lãs suaves';
const GLASS_LIGHT = 'Vidro e luz';
const NATURE = 'Natureza';
const WOOD = 'Madeiras';
const STONE_BUILD = 'Pedra e construção';
const SPECIAL = 'Materiais especiais';

export const BLOCKS = [
  { id: 'minecraft:air', name: 'Ar', color: '#f8fafc', category: 'Sistema', empty: true },

  { id: 'minecraft:white_concrete', name: 'Branco', color: '#f2f3f3', category: COLOR_CONCRETE },
  { id: 'minecraft:light_gray_concrete', name: 'Cinza claro', color: '#8e8e86', category: COLOR_CONCRETE },
  { id: 'minecraft:gray_concrete', name: 'Cinza', color: '#373a3e', category: COLOR_CONCRETE },
  { id: 'minecraft:black_concrete', name: 'Preto', color: '#080a0f', category: COLOR_CONCRETE },
  { id: 'minecraft:brown_concrete', name: 'Castanho', color: '#603b1f', category: COLOR_CONCRETE },
  { id: 'minecraft:red_concrete', name: 'Vermelho', color: '#8e2020', category: COLOR_CONCRETE },
  { id: 'minecraft:orange_concrete', name: 'Laranja', color: '#e06101', category: COLOR_CONCRETE },
  { id: 'minecraft:yellow_concrete', name: 'Amarelo', color: '#f0af15', category: COLOR_CONCRETE },
  { id: 'minecraft:lime_concrete', name: 'Lima', color: '#5ea918', category: COLOR_CONCRETE },
  { id: 'minecraft:green_concrete', name: 'Verde', color: '#495b24', category: COLOR_CONCRETE },
  { id: 'minecraft:cyan_concrete', name: 'Ciano', color: '#157788', category: COLOR_CONCRETE },
  { id: 'minecraft:light_blue_concrete', name: 'Azul claro', color: '#2389c6', category: COLOR_CONCRETE },
  { id: 'minecraft:blue_concrete', name: 'Azul', color: '#2c2e8f', category: COLOR_CONCRETE },
  { id: 'minecraft:purple_concrete', name: 'Roxo', color: '#641f9c', category: COLOR_CONCRETE },
  { id: 'minecraft:magenta_concrete', name: 'Magenta', color: '#a9309f', category: COLOR_CONCRETE },
  { id: 'minecraft:pink_concrete', name: 'Rosa', color: '#d5658e', category: COLOR_CONCRETE },

  { id: 'minecraft:white_wool', name: 'Lã branca', color: '#e9ecec', category: SOFT_WOOL },
  { id: 'minecraft:light_gray_wool', name: 'Lã cinza clara', color: '#8d8d87', category: SOFT_WOOL },
  { id: 'minecraft:gray_wool', name: 'Lã cinza', color: '#3e4447', category: SOFT_WOOL },
  { id: 'minecraft:black_wool', name: 'Lã preta', color: '#141519', category: SOFT_WOOL },
  { id: 'minecraft:brown_wool', name: 'Lã castanha', color: '#724728', category: SOFT_WOOL },
  { id: 'minecraft:red_wool', name: 'Lã vermelha', color: '#a12722', category: SOFT_WOOL },
  { id: 'minecraft:orange_wool', name: 'Lã laranja', color: '#f07613', category: SOFT_WOOL },
  { id: 'minecraft:yellow_wool', name: 'Lã amarela', color: '#f8c628', category: SOFT_WOOL },
  { id: 'minecraft:lime_wool', name: 'Lã lima', color: '#70b919', category: SOFT_WOOL },
  { id: 'minecraft:green_wool', name: 'Lã verde', color: '#556e2c', category: SOFT_WOOL },
  { id: 'minecraft:cyan_wool', name: 'Lã ciano', color: '#178691', category: SOFT_WOOL },
  { id: 'minecraft:light_blue_wool', name: 'Lã azul clara', color: '#3aa8db', category: SOFT_WOOL },
  { id: 'minecraft:blue_wool', name: 'Lã azul', color: '#35399d', category: SOFT_WOOL },
  { id: 'minecraft:purple_wool', name: 'Lã roxa', color: '#7b2bb2', category: SOFT_WOOL },
  { id: 'minecraft:magenta_wool', name: 'Lã magenta', color: '#c64fbd', category: SOFT_WOOL },
  { id: 'minecraft:pink_wool', name: 'Lã rosa', color: '#ed8dac', category: SOFT_WOOL },

  { id: 'minecraft:glass', name: 'Vidro claro', color: '#a8d8ff', category: GLASS_LIGHT },
  { id: 'minecraft:white_stained_glass', name: 'Vidro branco', color: '#d9f2ff', category: GLASS_LIGHT },
  { id: 'minecraft:yellow_stained_glass', name: 'Vidro amarelo', color: '#f7d85a', category: GLASS_LIGHT },
  { id: 'minecraft:orange_stained_glass', name: 'Vidro laranja', color: '#f59e32', category: GLASS_LIGHT },
  { id: 'minecraft:light_blue_stained_glass', name: 'Vidro azul claro', color: '#75c7ee', category: GLASS_LIGHT },
  { id: 'minecraft:blue_stained_glass', name: 'Vidro azul', color: '#3756b6', category: GLASS_LIGHT },
  { id: 'minecraft:cyan_stained_glass', name: 'Vidro ciano', color: '#2aa6b8', category: GLASS_LIGHT },
  { id: 'minecraft:green_stained_glass', name: 'Vidro verde', color: '#5f8e35', category: GLASS_LIGHT },
  { id: 'minecraft:red_stained_glass', name: 'Vidro vermelho', color: '#b43a31', category: GLASS_LIGHT },
  { id: 'minecraft:pink_stained_glass', name: 'Vidro rosa', color: '#ef9abb', category: GLASS_LIGHT },
  { id: 'minecraft:glowstone', name: 'Luz dourada', color: '#d7a947', category: GLASS_LIGHT },
  { id: 'minecraft:sea_lantern', name: 'Lanterna do mar', color: '#bce6df', category: GLASS_LIGHT },

  { id: 'minecraft:grass_block', name: 'Relva', color: '#5b9b3a', category: NATURE },
  { id: 'minecraft:dirt', name: 'Terra', color: '#866043', category: NATURE },
  { id: 'minecraft:sand', name: 'Areia', color: '#d9c47a', category: NATURE },
  { id: 'minecraft:red_sand', name: 'Areia vermelha', color: '#b96f32', category: NATURE },
  { id: 'minecraft:snow', name: 'Neve', color: '#f7fbff', category: NATURE },
  { id: 'minecraft:ice', name: 'Gelo', color: '#9bd6ff', category: NATURE },
  { id: 'minecraft:packed_ice', name: 'Gelo compacto', color: '#72aee8', category: NATURE },
  { id: 'minecraft:clay', name: 'Argila', color: '#a7b0bd', category: NATURE },

  { id: 'minecraft:oak_planks', name: 'Carvalho', color: '#b98b4b', category: WOOD },
  { id: 'minecraft:spruce_planks', name: 'Abeto', color: '#7f5730', category: WOOD },
  { id: 'minecraft:birch_planks', name: 'Bétula', color: '#d6c17b', category: WOOD },
  { id: 'minecraft:jungle_planks', name: 'Selva', color: '#b67855', category: WOOD },
  { id: 'minecraft:acacia_planks', name: 'Acácia', color: '#b76032', category: WOOD },
  { id: 'minecraft:dark_oak_planks', name: 'Carvalho escuro', color: '#4a2f18', category: WOOD },
  { id: 'minecraft:mangrove_planks', name: 'Mangue', color: '#7a2f2a', category: WOOD },
  { id: 'minecraft:cherry_planks', name: 'Cerejeira', color: '#e6a3b5', category: WOOD },

  { id: 'minecraft:stone', name: 'Pedra', color: '#7d7d7d', category: STONE_BUILD },
  { id: 'minecraft:cobblestone', name: 'Calçada', color: '#6f6f6f', category: STONE_BUILD },
  { id: 'minecraft:stone_bricks', name: 'Tijolo de pedra', color: '#767976', category: STONE_BUILD },
  { id: 'minecraft:bricks', name: 'Tijolo vermelho', color: '#974b37', category: STONE_BUILD },
  { id: 'minecraft:sandstone', name: 'Arenito', color: '#d7c27a', category: STONE_BUILD },
  { id: 'minecraft:quartz_block', name: 'Quartzo', color: '#eee7dc', category: STONE_BUILD },
  { id: 'minecraft:deepslate', name: 'Ardósia', color: '#4f4f55', category: STONE_BUILD },
  { id: 'minecraft:prismarine', name: 'Prismarinho', color: '#5a9c95', category: STONE_BUILD },

  { id: 'minecraft:gold_block', name: 'Ouro', color: '#f5d33b', category: SPECIAL },
  { id: 'minecraft:iron_block', name: 'Ferro', color: '#d8d8d8', category: SPECIAL },
  { id: 'minecraft:diamond_block', name: 'Diamante', color: '#63d6cf', category: SPECIAL },
  { id: 'minecraft:emerald_block', name: 'Esmeralda', color: '#2ecc71', category: SPECIAL },
  { id: 'minecraft:lapis_block', name: 'Lápis-lazúli', color: '#214aa6', category: SPECIAL },
  { id: 'minecraft:amethyst_block', name: 'Ametista', color: '#8561c5', category: SPECIAL },
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
