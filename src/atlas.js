// Catálogo de atlas e função pura para calcular offset/repeat.
// (col, row) começam em 0 no canto superior-esquerdo do PNG.
// Em Three.js, offset.y é medido a partir de baixo, daí a inversão
// `1 - (row + 1) / rows`.

export const ATLASES = {
  natural: { path: './assets/blocks/atlas-natural.png', cols: 4, rows: 4 },
  color:   { path: './assets/blocks/atlas-cor.png',     cols: 8, rows: 4 },
  special: { path: './assets/blocks/atlas-especial.png', cols: 4, rows: 4 },
};

export function getAtlasTransform({ cols, rows, col, row }) {
  return {
    offsetX: col / cols,
    offsetY: 1 - (row + 1) / rows,
    repeatX: 1 / cols,
    repeatY: 1 / rows,
  };
}
