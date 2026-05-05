export const BLOCKS = [
  { id: 'minecraft:air', name: 'Ar', color: '#dbeafe', empty: true },
  { id: 'minecraft:white_concrete', name: 'Branco', color: '#f2f3f3' },
  { id: 'minecraft:light_gray_concrete', name: 'Cinza claro', color: '#8e8e86' },
  { id: 'minecraft:gray_concrete', name: 'Cinza', color: '#373a3e' },
  { id: 'minecraft:black_concrete', name: 'Preto', color: '#080a0f' },
  { id: 'minecraft:red_concrete', name: 'Vermelho', color: '#8e2020' },
  { id: 'minecraft:orange_concrete', name: 'Laranja', color: '#e06101' },
  { id: 'minecraft:yellow_concrete', name: 'Amarelo', color: '#f0af15' },
  { id: 'minecraft:lime_concrete', name: 'Lima', color: '#5ea918' },
  { id: 'minecraft:green_concrete', name: 'Verde', color: '#495b24' },
  { id: 'minecraft:cyan_concrete', name: 'Ciano', color: '#157788' },
  { id: 'minecraft:light_blue_concrete', name: 'Azul claro', color: '#2389c6' },
  { id: 'minecraft:blue_concrete', name: 'Azul', color: '#2c2e8f' },
  { id: 'minecraft:purple_concrete', name: 'Roxo', color: '#641f9c' },
  { id: 'minecraft:magenta_concrete', name: 'Magenta', color: '#a9309f' },
  { id: 'minecraft:pink_concrete', name: 'Rosa', color: '#d5658e' },
  { id: 'minecraft:brown_concrete', name: 'Castanho', color: '#603b1f' },
  { id: 'minecraft:stone', name: 'Pedra', color: '#7d7d7d' },
  { id: 'minecraft:cobblestone', name: 'Calçada', color: '#6f6f6f' },
  { id: 'minecraft:oak_planks', name: 'Madeira', color: '#b98b4b' },
  { id: 'minecraft:bricks', name: 'Tijolo', color: '#974b37' },
  { id: 'minecraft:glass', name: 'Vidro', color: '#a8d8ff' },
  { id: 'minecraft:grass_block', name: 'Relva', color: '#5b9b3a' },
  { id: 'minecraft:gold_block', name: 'Ouro', color: '#f5d33b' }
];

export const BLOCK_BY_ID = Object.fromEntries(BLOCKS.map((block) => [block.id, block]));

export function blockColor(id) {
  return BLOCK_BY_ID[id]?.color ?? '#ff00ff';
}

export function blockName(id) {
  return BLOCK_BY_ID[id]?.name ?? id.replace('minecraft:', '');
}
