# Atlas pixel-art para texturas — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir as texturas procedurais por células recortadas de 3 atlas PNG fornecidos, alinhando a paleta a 64 blocos exactos com IDs `minecraft:*` para manter a compatibilidade com `.mcstructure`.

**Architecture:** Catálogo de blocos passa a referenciar `{atlas, col, row}`. Um módulo puro `atlas.js` calcula `offset/repeat` para cada célula. `textures.js` carrega os 3 PNGs uma vez via `THREE.TextureLoader` e clona-os por bloco para os materiais. `voxel-mesh.js` e `ghost.js` recebem `atlases` no construtor. `app.js` boot fica `async` para esperar pelos atlas; swatches da UI passam a ser cortes do PNG via `<canvas>`.

**Tech Stack:** JavaScript ES modules vanilla, Three.js 0.164 (CDN ESM), node `--test` para módulos puros, `THREE.TextureLoader` + `Image`/`<canvas>` no browser.

**Spec de origem:** `docs/superpowers/specs/2026-05-09-atlas-pixel-art-design.md`.

**Pré-condições verificadas:**
- `assets/blocks/atlas-natural.png` (4×4), `assets/blocks/atlas-cor.png` (8×4), `assets/blocks/atlas-especial.png` (4×4) já estão no repositório.
- Branch de trabalho: `main` (acordado com o utilizador previamente).

---

## Convenções

- **Coordenadas (col, row)** começam em `0`; `(0,0)` = canto **superior-esquerdo** do PNG. A função pura faz a inversão vertical para o sistema UV de Three.js.
- **IDs de bloco** mantêm o prefixo `minecraft:` para preservar `.mcstructure`.
- **Browser smoke-tests** ficam ao cargo do controller (controller corre `npm start` e valida em browser). Subagentes não criam `scratch-*.html`.

---

## Estrutura de ficheiros

| Ficheiro | Estado | Responsabilidade |
|---|---|---|
| `assets/blocks/atlas-*.png` | já existem | Atlas pixel-art |
| `src/atlas.js` | **novo** | `ATLASES` metadata + `getAtlasTransform` puro |
| `src/blocks.js` | **reescreve** | 64 blocos com `{id, name, color, category, atlas, col, row}` |
| `src/textures.js` | **substitui** | `loadBlockAtlases`, `createBlockTexture`, `createBlockMaterial` |
| `src/voxel-mesh.js` | **adapta** | Aceita `atlases`; usa `createBlockMaterial` por blockId |
| `src/ghost.js` | **adapta** | Aceita `atlases`; usa textura clonada do atlas |
| `src/app.js` | **adapta** | Boot `async`; swatches via `<canvas>.drawImage` |
| `tests/atlas.test.js` | **novo** | Testes puros de `getAtlasTransform` |
| `tests/blocks.test.js` | **novo** | Validação determinística do catálogo |
| `tests/textures.test.js` | **remove** | Geração procedural já não existe |
| `tests/static.test.js` | **adapta** | Acrescenta presença dos PNGs |
| `README.md` | **adiciona** | Secção "Adicionar blocos novos" |

---

## Tarefa 1 · Módulo `atlas.js` puro (TDD)

**Files:**
- Create: `src/atlas.js`
- Create: `tests/atlas.test.js`

- [ ] **Passo 1: Escrever testes**

`tests/atlas.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAtlasTransform, ATLASES } from '../src/atlas.js';

test('getAtlasTransform top-left of 4x4 atlas', () => {
  const r = getAtlasTransform({ cols: 4, rows: 4, col: 0, row: 0 });
  assert.deepEqual(r, { offsetX: 0, offsetY: 0.75, repeatX: 0.25, repeatY: 0.25 });
});

test('getAtlasTransform bottom-right of 8x4 atlas', () => {
  const r = getAtlasTransform({ cols: 8, rows: 4, col: 7, row: 3 });
  assert.deepEqual(r, { offsetX: 0.875, offsetY: 0, repeatX: 0.125, repeatY: 0.25 });
});

test('getAtlasTransform bottom-right of 4x4 atlas', () => {
  const r = getAtlasTransform({ cols: 4, rows: 4, col: 3, row: 3 });
  assert.deepEqual(r, { offsetX: 0.75, offsetY: 0, repeatX: 0.25, repeatY: 0.25 });
});

test('ATLASES metadata has natural, color, special', () => {
  assert.equal(ATLASES.natural.cols, 4);
  assert.equal(ATLASES.natural.rows, 4);
  assert.equal(ATLASES.color.cols, 8);
  assert.equal(ATLASES.color.rows, 4);
  assert.equal(ATLASES.special.cols, 4);
  assert.equal(ATLASES.special.rows, 4);
  assert.match(ATLASES.natural.path, /atlas-natural\.png$/);
  assert.match(ATLASES.color.path, /atlas-cor\.png$/);
  assert.match(ATLASES.special.path, /atlas-especial\.png$/);
});
```

- [ ] **Passo 2: Verificar falha**

```bash
npm test
```

Esperado: testes falham com "Cannot find module '../src/atlas.js'".

- [ ] **Passo 3: Implementar `src/atlas.js`**

```javascript
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
```

- [ ] **Passo 4: Verificar passagem**

```bash
npm test
```

Esperado: 4 testes novos passam.

- [ ] **Passo 5: Commit**

```bash
git add src/atlas.js tests/atlas.test.js
git commit -m "feat: pure atlas-transform module with metadata"
```

---

## Tarefa 2 · Catálogo de 64 blocos (TDD)

**Files:**
- Modify: `src/blocks.js` (rewrite)
- Create: `tests/blocks.test.js`

- [ ] **Passo 1: Escrever testes**

`tests/blocks.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOCKS, BLOCK_BY_ID, paletteBlocks, blockColor, blockName } from '../src/blocks.js';
import { ATLASES } from '../src/atlas.js';

test('paletteBlocks has exactly 64 non-air blocks', () => {
  assert.equal(paletteBlocks().length, 64);
});

test('palette contains 16 natural + 32 color + 16 special', () => {
  const counts = { natural: 0, color: 0, special: 0 };
  for (const b of paletteBlocks()) counts[b.atlas] += 1;
  assert.deepEqual(counts, { natural: 16, color: 32, special: 16 });
});

test('all block ids are unique', () => {
  const ids = paletteBlocks().map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('all block ids start with minecraft:', () => {
  for (const b of paletteBlocks()) assert.match(b.id, /^minecraft:/);
});

test('all (atlas, col, row) coordinates are valid', () => {
  for (const b of paletteBlocks()) {
    const meta = ATLASES[b.atlas];
    assert.ok(meta, `unknown atlas: ${b.atlas} for ${b.id}`);
    assert.ok(b.col >= 0 && b.col < meta.cols, `col out of range for ${b.id}`);
    assert.ok(b.row >= 0 && b.row < meta.rows, `row out of range for ${b.id}`);
  }
});

test('no two blocks share the same (atlas, col, row)', () => {
  const seen = new Set();
  for (const b of paletteBlocks()) {
    const key = `${b.atlas}:${b.col},${b.row}`;
    assert.ok(!seen.has(key), `duplicate atlas slot: ${key}`);
    seen.add(key);
  }
});

test('BLOCK_BY_ID resolves every palette block', () => {
  for (const b of paletteBlocks()) assert.equal(BLOCK_BY_ID[b.id], b);
});

test('legacy helpers still work', () => {
  assert.equal(blockName('minecraft:grass_block'), 'Relva');
  assert.match(blockColor('minecraft:grass_block'), /^#[0-9a-f]{6}$/i);
});

test('air block is present and marked empty', () => {
  assert.equal(BLOCK_BY_ID['minecraft:air'].empty, true);
});
```

- [ ] **Passo 2: Verificar falha**

```bash
npm test
```

Esperado: testes do catálogo falham (a paleta actual tem 74, não 64; falta `atlas`/`col`/`row`).

- [ ] **Passo 3: Reescrever `src/blocks.js`**

```javascript
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
```

- [ ] **Passo 4: Verificar passagem**

```bash
npm test
```

Esperado: testes do catálogo passam (9 novos). Os testes existentes que dependem de blocos antigos como `minecraft:red_sand` ou `minecraft:spruce_planks` podem falhar — anotar quais e tratar nas tarefas seguintes.

- [ ] **Passo 5: Commit**

```bash
git add src/blocks.js tests/blocks.test.js
git commit -m "feat: 64-block catalogue mapped to atlas cells"
```

---

## Tarefa 3 · Carregador de atlas e materiais

**Files:**
- Modify: `src/textures.js` (substitui largamente)
- Delete: `tests/textures.test.js`

`textures.js` deixa de gerar dados procedurais. Passa a expor:
- `loadBlockAtlases(loader?)` — carrega os 3 PNGs em paralelo, aplica filtros pixel-art.
- `createBlockTexture(block, atlasTexture, atlasMeta)` — clona e aplica `offset/repeat`.
- `createBlockMaterial(block, atlases)` — devolve `MeshLambertMaterial` com `map` recortado.

- [ ] **Passo 1: Apagar os testes procedurais (já não aplicáveis)**

```bash
git rm tests/textures.test.js
```

- [ ] **Passo 2: Substituir o conteúdo de `src/textures.js`**

```javascript
import * as THREE from 'three';
import { ATLASES, getAtlasTransform } from './atlas.js';

// Carrega os 3 atlas PNG uma vez. Cada textura fica com NearestFilter
// (pixel-art preservado), SRGBColorSpace e mipmaps desligados.
export async function loadBlockAtlases(loader = new THREE.TextureLoader()) {
  const entries = await Promise.all(
    Object.entries(ATLASES).map(async ([key, meta]) => {
      const tex = await loader.loadAsync(meta.path);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      return [key, tex];
    })
  );
  return Object.fromEntries(entries);
}

// Clona uma textura de atlas e aplica offset/repeat para mostrar apenas
// a célula (col, row) do bloco. O atlas original NÃO é modificado.
export function createBlockTexture(block, atlasTexture, atlasMeta) {
  const t = atlasTexture.clone();
  const { offsetX, offsetY, repeatX, repeatY } = getAtlasTransform({
    cols: atlasMeta.cols,
    rows: atlasMeta.rows,
    col: block.col,
    row: block.row,
  });
  t.offset.set(offsetX, offsetY);
  t.repeat.set(repeatX, repeatY);
  t.needsUpdate = true;
  return t;
}

// Cria um MeshLambertMaterial pronto a usar para um bloco.
export function createBlockMaterial(block, atlases) {
  const atlasTex = atlases[block.atlas];
  const atlasMeta = ATLASES[block.atlas];
  const map = createBlockTexture(block, atlasTex, atlasMeta);
  return new THREE.MeshLambertMaterial({ map });
}
```

- [ ] **Passo 3: Correr testes**

```bash
npm test
```

Esperado: passa. Os testes que dependiam de `buildTextureCanvasData`/`buildThreeTexture` foram removidos no passo 1.

- [ ] **Passo 4: Commit**

```bash
git add src/textures.js tests/textures.test.js
git commit -m "feat: replace procedural texture generation with atlas loader"
```

---

## Tarefa 4 · `voxel-mesh.js` aceita atlases

**Files:**
- Modify: `src/voxel-mesh.js`

Substituir a chamada interna a `buildThreeTexture` por `createBlockMaterial`. O construtor passa a aceitar `atlases`.

- [ ] **Passo 1: Substituir `src/voxel-mesh.js`**

```javascript
import * as THREE from 'three';
import { createBlockMaterial } from './textures.js';
import { paletteBlocks } from './blocks.js';

const AIR = 'minecraft:air';
const MAX_PER_TYPE = 32 * 32 * 32;

export function createVoxelMeshes(scene, atlases) {
  const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
  const meshesById = new Map();

  for (const block of paletteBlocks()) {
    const mat = createBlockMaterial(block, atlases);
    const mesh = new THREE.InstancedMesh(cubeGeo, mat, MAX_PER_TYPE);
    mesh.count = 0;
    mesh.userData.blockId = block.id;
    mesh.frustumCulled = false; // bounding box not auto-recomputed for InstancedMesh
    scene.add(mesh);
    meshesById.set(block.id, { mesh, slots: new Map(), free: [] });
  }

  function rebuild(model) {
    for (const entry of meshesById.values()) {
      entry.mesh.count = 0;
      entry.slots.clear();
      entry.free.length = 0;
    }
    for (let x = 0; x < model.size.x; x += 1) {
      for (let y = 0; y < model.size.y; y += 1) {
        for (let z = 0; z < model.size.z; z += 1) {
          const id = model.cells[x * model.size.y * model.size.z + y * model.size.z + z];
          if (id && id !== AIR) appendInstance(id, x, y, z);
        }
      }
    }
    for (const entry of meshesById.values()) entry.mesh.instanceMatrix.needsUpdate = true;
  }

  function appendInstance(id, x, y, z) {
    const entry = meshesById.get(id);
    if (!entry) return;
    const slot = entry.free.pop() ?? entry.mesh.count++;
    const key = keyOf(x, y, z);
    entry.slots.set(key, slot);
    const m = new THREE.Matrix4().setPosition(x + 0.5, y + 0.5, z + 0.5);
    entry.mesh.setMatrixAt(slot, m);
    entry.mesh.instanceMatrix.needsUpdate = true;
  }

  function removeInstance(id, x, y, z) {
    const entry = meshesById.get(id);
    if (!entry) return;
    const key = keyOf(x, y, z);
    const slot = entry.slots.get(key);
    if (slot === undefined) return;
    const last = entry.mesh.count - 1;
    if (slot !== last) {
      const m = new THREE.Matrix4();
      entry.mesh.getMatrixAt(last, m);
      entry.mesh.setMatrixAt(slot, m);
      for (const [k, s] of entry.slots) if (s === last) { entry.slots.set(k, slot); break; }
    }
    entry.mesh.count -= 1;
    entry.slots.delete(key);
    entry.mesh.instanceMatrix.needsUpdate = true;
  }

  function setVoxel(prevId, nextId, x, y, z) {
    if (prevId && prevId !== AIR) removeInstance(prevId, x, y, z);
    if (nextId && nextId !== AIR) appendInstance(nextId, x, y, z);
  }

  function meshList() {
    return [...meshesById.values()].map((e) => e.mesh);
  }

  return { rebuild, setVoxel, meshList };
}

function keyOf(x, y, z) { return (x << 12) | (y << 6) | z; }
```

- [ ] **Passo 2: Correr testes**

```bash
npm test
```

Esperado: passa.

- [ ] **Passo 3: Commit**

```bash
git add src/voxel-mesh.js
git commit -m "feat: voxel-mesh accepts atlases for material creation"
```

---

## Tarefa 5 · `ghost.js` aceita atlases

**Files:**
- Modify: `src/ghost.js`

`ghost.showBuild` deixa de gerar textura procedural; usa o atlas do bloco activo. Aceita `atlases` no construtor.

- [ ] **Passo 1: Substituir `src/ghost.js`**

```javascript
import * as THREE from 'three';
import { createBlockTexture } from './textures.js';
import { ATLASES } from './atlas.js';
import { BLOCK_BY_ID } from './blocks.js';

export function createGhost(scene, atlases) {
  const geo = new THREE.BoxGeometry(1.001, 1.001, 1.001);
  const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  scene.add(mesh);

  const eraseGeo = new THREE.BoxGeometry(1.06, 1.06, 1.06);
  const eraseMat = new THREE.MeshBasicMaterial({ color: 0xff4444, wireframe: true, transparent: true, opacity: 0.85 });
  const eraseMesh = new THREE.Mesh(eraseGeo, eraseMat);
  eraseMesh.visible = false;
  scene.add(eraseMesh);

  let currentTextureKey = null;

  function showBuild(blockId, voxel) {
    const block = BLOCK_BY_ID[blockId];
    if (!block || block.empty || block.atlas == null) { mesh.visible = false; return; }
    if (currentTextureKey !== blockId) {
      mat.map?.dispose();
      mat.map = createBlockTexture(block, atlases[block.atlas], ATLASES[block.atlas]);
      mat.needsUpdate = true;
      currentTextureKey = blockId;
    }
    mesh.position.set(voxel[0] + 0.5, voxel[1] + 0.5, voxel[2] + 0.5);
    mesh.visible = true;
    eraseMesh.visible = false;
  }

  function showErase(voxel) {
    eraseMesh.position.set(voxel[0] + 0.5, voxel[1] + 0.5, voxel[2] + 0.5);
    eraseMesh.visible = true;
    mesh.visible = false;
  }

  function hide() {
    mesh.visible = false;
    eraseMesh.visible = false;
  }

  return { showBuild, showErase, hide };
}
```

- [ ] **Passo 2: Correr testes**

```bash
npm test
```

Esperado: passa.

- [ ] **Passo 3: Commit**

```bash
git add src/ghost.js
git commit -m "feat: ghost uses atlas-clone texture instead of procedural"
```

---

## Tarefa 6 · `app.js` boot async + swatches via atlas

**Files:**
- Modify: `src/app.js`

Mudanças:
1. Tornar o boot `async` (envolver em `init()`).
2. Mostrar status "A carregar texturas..." antes de carregar.
3. Após `loadBlockAtlases`, criar scene/voxel-mesh/ghost passando `atlases`.
4. Carregar os atlas como `Image` para gerar swatches via `<canvas>.drawImage`.
5. Tratar erro de carregamento mostrando mensagem visível.

- [ ] **Passo 1: Editar `src/app.js`**

Substituir os imports + a totalidade do código top-level por:

```javascript
import * as THREE from 'three';
import { createScene } from './scene.js';
import { createVoxelMeshes } from './voxel-mesh.js';
import { createControls, attachViewCube } from './controls.js';
import { createGhost } from './ghost.js';
import { castRay } from './raycaster.js';
import { createTools } from './tools.js';
import { createModel, createHistory, deserializeModel, serializeModel, clearModel } from './model.js';
import { exportMcStructure, importMcStructure, downloadMcStructure } from './mcstructure.js';
import { paletteBlocks, BLOCK_BY_ID } from './blocks.js';
import { ATLASES } from './atlas.js';
import { loadBlockAtlases } from './textures.js';

const STORAGE_KEY = 'cubinhos3d:project';

const canvas = document.getElementById('canvas3d');
const model = createModel();
const history = createHistory(model);

let activeBlockId = 'minecraft:grass_block';
const swatchCache = new Map();
const atlasImages = {};   // {natural: HTMLImageElement, color: ..., special: ...}

init().catch((err) => {
  console.error(err);
  status('Erro ao carregar texturas: ' + err.message);
});

async function init() {
  status('A carregar texturas...');
  const atlases = await loadBlockAtlases();
  await loadAtlasImages(); // para os swatches da UI

  const sceneCtx = createScene(canvas);
  const meshes = createVoxelMeshes(sceneCtx.scene, atlases);
  const ghost = createGhost(sceneCtx.scene, atlases);
  const controls = createControls(sceneCtx.camera, canvas);
  attachViewCube(controls, document.getElementById('viewcubeHost'));

  const tools = createTools(model, (changes) => {
    for (const c of changes) meshes.setVoxel(c.prevId, c.nextId, c.x, c.y, c.z);
  });
  tools.setBlock(activeBlockId);

  renderPalette(tools);
  meshes.rebuild(model);
  wireCanvasInput(sceneCtx, meshes, ghost, tools);
  wireToolButtons(tools, meshes);
  wireFileButtons(meshes);
  loadLocal(meshes);
  status('');
}

// ----- Atlas images for UI swatches ------------------------------------------
async function loadAtlasImages() {
  const entries = await Promise.all(
    Object.entries(ATLASES).map(([key, meta]) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve([key, img]);
      img.onerror = () => reject(new Error(`Falha a carregar ${meta.path}`));
      img.src = meta.path;
    }))
  );
  for (const [key, img] of entries) atlasImages[key] = img;
}

// ----- Canvas input → raycaster → tools/ghost --------------------------------
function wireCanvasInput(sceneCtx, meshes, ghost, tools) {
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  let painting = false;

  function pointerToTarget(e) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ndc, sceneCtx.camera);
    return castRay(model, { origin: ray.ray.origin.toArray(), dir: ray.ray.direction.toArray() });
  }

  canvas.addEventListener('pointermove', (e) => {
    const target = pointerToTarget(e);
    if (!target) { ghost.hide(); return; }
    if (tools.getTool() === 'erase' && target.kind === 'voxel') ghost.showErase(target.voxel);
    else if (target.ghostVoxel) ghost.showBuild(activeBlockId, target.ghostVoxel);
    else ghost.hide();
    if (painting && target) tools.applyAt(target);
  });

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    painting = true;
    tools.startStroke();
    const target = pointerToTarget(e);
    if (target) {
      tools.applyAt(target);
      saveLocal();
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (e.button !== 0 || !painting) return;
    painting = false;
    const changes = tools.endStroke();
    if (changes.length) { history.commit(model); saveLocal(); }
  });

  canvas.addEventListener('pointercancel', () => {
    if (!painting) return;
    painting = false;
    tools.endStroke();
  });
}

// ----- Tool buttons ----------------------------------------------------------
function wireToolButtons(tools, meshes) {
  document.querySelectorAll('.left-rail .tool[data-tool]').forEach((btn) => {
    btn.addEventListener('click', () => activateTool(btn.dataset.tool, tools));
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key === '1') activateTool('build', tools);
    else if (e.key === '2') activateTool('erase', tools);
    else if (e.key === '3') activateTool('paint', tools);
    else if (e.key === '4') activateTool('fill', tools);
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { undo(meshes); e.preventDefault(); }
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') { redo(meshes); e.preventDefault(); }
  });

  document.getElementById('undoBtn').addEventListener('click', () => undo(meshes));
  document.getElementById('redoBtn').addEventListener('click', () => redo(meshes));
}

function activateTool(name, tools) {
  tools.setTool(name);
  document.querySelectorAll('.left-rail .tool[data-tool]').forEach((b) => {
    b.classList.toggle('active', b.dataset.tool === name);
  });
}

function undo(meshes) { if (history.undo(model)) { meshes.rebuild(model); saveLocal(); } }
function redo(meshes) { if (history.redo(model)) { meshes.rebuild(model); saveLocal(); } }

// ----- Palette ---------------------------------------------------------------
function renderPalette(tools) {
  const strip = document.getElementById('paletteStrip');
  const popular = ['minecraft:grass_block','minecraft:dirt','minecraft:stone','minecraft:oak_planks',
                   'minecraft:cobblestone','minecraft:sand','minecraft:white_concrete','minecraft:gold_block'];
  strip.innerHTML = '';
  for (const id of popular) strip.appendChild(makeSwatch(id, tools));

  const full = document.getElementById('paletteFull');
  full.innerHTML = '';
  const byCategory = new Map();
  for (const block of paletteBlocks()) {
    if (!byCategory.has(block.category)) byCategory.set(block.category, []);
    byCategory.get(block.category).push(block);
  }
  for (const [cat, list] of byCategory) {
    const h = document.createElement('h3'); h.textContent = cat; full.appendChild(h);
    const grid = document.createElement('div'); grid.className = 'grid';
    for (const block of list) grid.appendChild(makeSwatch(block.id, tools));
    full.appendChild(grid);
  }

  document.getElementById('paletteToggle').addEventListener('click', () => {
    const drawer = document.getElementById('paletteDrawer');
    drawer.dataset.state = drawer.dataset.state === 'open' ? 'closed' : 'open';
  });
  document.getElementById('paletteMore').addEventListener('click', () => {
    document.getElementById('paletteFull').classList.toggle('hidden');
  });
}

function makeSwatch(blockId, tools) {
  const block = BLOCK_BY_ID[blockId];
  const btn = document.createElement('button');
  btn.className = 'swatch';
  btn.dataset.blockId = blockId;
  btn.title = block.name;
  btn.style.background = block.color;
  btn.style.backgroundImage = swatchDataUrl(block);
  if (blockId === activeBlockId) btn.classList.add('active');
  btn.addEventListener('click', () => {
    activeBlockId = blockId;
    tools.setBlock(blockId);
    document.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('active', s.dataset.blockId === blockId));
  });
  return btn;
}

function swatchDataUrl(block) {
  if (swatchCache.has(block.id)) return swatchCache.get(block.id);
  const img = atlasImages[block.atlas];
  if (!img) return '';
  const meta = ATLASES[block.atlas];
  const cellW = img.naturalWidth / meta.cols;
  const cellH = img.naturalHeight / meta.rows;
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, block.col * cellW, block.row * cellH, cellW, cellH, 0, 0, 32, 32);
  const url = `url("${c.toDataURL()}")`;
  swatchCache.set(block.id, url);
  return url;
}

// ----- File / storage --------------------------------------------------------
function saveLocal() {
  try { localStorage.setItem(STORAGE_KEY, serializeModel(model)); } catch {}
}

function loadLocal(meshes) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const next = deserializeModel(raw);
    model.cells = next.cells; model.size = next.size;
    history.reset(model);
    meshes.rebuild(model);
    return true;
  } catch { return false; }
}

function wireFileButtons(meshes) {
  document.getElementById('newProject').addEventListener('click', () => {
    const hasContent = model.cells.some((id) => id && id !== 'minecraft:air');
    if (hasContent && !confirm('Começar uma nova construção apaga a actual. Continuar?')) return;
    clearModel(model);
    history.commit(model);
    meshes.rebuild(model);
    saveLocal();
    status('Nova construção começada.');
  });

  document.getElementById('saveLocal').addEventListener('click', () => {
    saveLocal();
    status('Projecto guardado no browser.');
  });

  document.getElementById('loadLocal').addEventListener('click', () => {
    if (loadLocal(meshes)) status('Projecto carregado do browser.');
    else status('Não há projecto guardado no browser.');
  });

  document.getElementById('downloadProject').addEventListener('click', () => {
    downloadMcStructure(model, 'cubinhos-3d.mcstructure');
  });

  document.getElementById('exportStructure').addEventListener('click', () => {
    downloadMcStructure(model, 'cubinhos-3d.mcstructure');
    status('Ficheiro pronto. Abre o Structure Block no Minecraft Education.');
  });

  document.getElementById('openProject').addEventListener('change', async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const { model: imported, warnings } = importMcStructure(buf);
      // Mapear blocos não suportados para air
      const validIds = new Set(paletteBlocks().map((b) => b.id));
      let dropped = 0;
      for (let i = 0; i < imported.cells.length; i += 1) {
        const id = imported.cells[i];
        if (id && id !== 'minecraft:air' && !validIds.has(id)) {
          imported.cells[i] = 'minecraft:air';
          dropped += 1;
        }
      }
      model.cells = imported.cells; model.size = imported.size;
      history.reset(model);
      meshes.rebuild(model);
      saveLocal();
      const msg = dropped > 0
        ? `Importado, mas ${dropped} blocos não suportados foram removidos.`
        : (warnings && warnings.length ? `Importado com avisos: ${warnings[0]}` : 'Importado.');
      status(msg);
    } catch (err) {
      status('Falha ao importar: ' + err.message);
    }
    e.target.value = '';
  });
}

function status(msg) {
  const el = document.getElementById('status');
  el.textContent = msg;
  if (msg) setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 3500);
}
```

- [ ] **Passo 2: Correr testes**

```bash
npm test
```

Esperado: passa (todos os testes Node).

- [ ] **Passo 3: Browser smoke-test**

(Reservado ao controller — corre `npm start` e valida em http://localhost:8000.)

Critérios:
- "A carregar texturas..." aparece brevemente.
- Cena carrega; blocos colocados aparecem com texturas dos PNGs (sem blur).
- Paleta mostra swatches recortados dos PNG.
- Ferramentas e ficheiros funcionam como antes.
- Importar `.mcstructure` antigo com blocos fora dos 64 mostra mensagem "X blocos não suportados foram removidos".

- [ ] **Passo 4: Commit**

```bash
git add src/app.js
git commit -m "feat: async boot loads atlases; UI swatches use drawImage"
```

---

## Tarefa 7 · Actualizar `tests/static.test.js`

**Files:**
- Modify: `tests/static.test.js`

Acrescentar três asserções de presença dos PNGs no repositório.

- [ ] **Passo 1: Acrescentar asserções**

No fim de `tests/static.test.js`, antes da última `test(...)` ou após a última, acrescentar:

```javascript
import { stat } from 'node:fs/promises';

test('atlas PNGs exist in assets/blocks/', async () => {
  for (const name of ['atlas-natural.png', 'atlas-cor.png', 'atlas-especial.png']) {
    const path = new URL(`../assets/blocks/${name}`, import.meta.url);
    const st = await stat(path);
    assert.ok(st.isFile(), `${name} missing`);
    assert.ok(st.size > 0, `${name} is empty`);
  }
});

test('app.js imports loadBlockAtlases from textures', async () => {
  const src = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(src, /loadBlockAtlases/);
});

test('app.js imports ATLASES from atlas module', async () => {
  const src = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(src, /from '\.\/atlas\.js'/);
});
```

(Se já existe `import { readFile } from 'node:fs/promises';` no topo, não duplicar; o `stat` é uma adição.)

- [ ] **Passo 2: Correr testes**

```bash
npm test
```

Esperado: 3 testes novos passam. Total continua compatível.

- [ ] **Passo 3: Commit**

```bash
git add tests/static.test.js
git commit -m "test: assert presence of atlas PNGs and app.js wiring"
```

---

## Tarefa 8 · Documentação no README

**Files:**
- Modify: `README.md`

Adicionar uma secção após "## Escopo actual" com instruções de como adicionar blocos novos.

- [ ] **Passo 1: Acrescentar secção ao `README.md`**

Imediatamente antes de `## Desenvolvimento`, inserir:

```markdown
## Adicionar blocos novos

A paleta tem 64 blocos correspondentes às células dos atlas em `assets/blocks/`:

| Atlas | Grelha | Conteúdo |
|---|---|---|
| `atlas-natural.png` | 4×4 | naturais (relva, terra, troncos, …) |
| `atlas-cor.png` | 8×4 | concrete (16) + wool (16) |
| `atlas-especial.png` | 4×4 | especiais (gold, diamond, glowstone, …) |

Para acrescentar um bloco:

1. Edita o PNG correspondente preservando a grelha lógica (mesma divisão de células).
2. Em `src/blocks.js`, acrescenta uma entrada com o ID `minecraft:*` real, `name`, `color` (hex aproximado), `category`, `atlas` e `(col, row)`.
3. As coordenadas `col` e `row` são índices a partir de zero, com `(0, 0)` no canto superior-esquerdo do PNG.
4. Se o atlas ficar cheio, aumenta `cols` ou `rows` em `src/atlas.js` e ajusta o PNG.

A função pura `getAtlasTransform({cols, rows, col, row})` em `src/atlas.js` calcula `offset/repeat` para Three.js (com a inversão vertical UV).
```

- [ ] **Passo 2: Confirmar testes**

```bash
npm test
```

Esperado: passa.

- [ ] **Passo 3: Commit**

```bash
git add README.md
git commit -m "docs: explain how to add new blocks to the atlas catalogue"
```

---

## Tarefa 9 · Verificação final integrada

- [ ] **Passo 1: Correr todos os testes**

```bash
npm test
```

Esperado: todos passam (existentes + 4 atlas + 9 blocks + 3 static = ≥ 65 totais — número final dependerá dos testes originais ainda válidos).

- [ ] **Passo 2: Browser smoke-test (controller)**

`npm start` → http://localhost:8000. Validar:

- [ ] "A carregar texturas..." aparece brevemente; depois desaparece.
- [ ] Console sem erros (`F12` → Console).
- [ ] Aba Network: 3 requests `200` para os atlas, cada um servido apenas uma vez.
- [ ] Colocar bloco de `relva`, `pedra`, `ouro`, `vidro azul` — cada um mostra textura distinta vinda do atlas correto.
- [ ] Texturas vêem-se nítidas (sem blur), aspecto pixel-art preservado.
- [ ] Paleta inferior: 8 swatches; ▾ "mais" abre painel completo com 64 itens organizados por categoria.
- [ ] Ferramentas Construir/Apagar/Pintar/Encher funcionam.
- [ ] Câmara, ViewCube, undo/redo, ficheiros — sem regressões.
- [ ] Importar `.mcstructure` antigo com blocos fora dos 64 mostra "X blocos não suportados foram removidos".
- [ ] Round-trip: descarregar `.mcstructure`, abrir o mesmo, maquete idêntica.

- [ ] **Passo 3: Push para `main`**

```bash
git push origin main
```

GitHub Pages reconstrói automaticamente. Em ~30-90s a versão nova fica em `https://atilasos.github.io/cubinhos-3d/`.

---

## Auto-revisão (cobertura do spec)

| Requisito do spec | Tarefa(s) |
|---|---|
| `src/atlas.js` com `ATLASES` + `getAtlasTransform` puro | T1 |
| Função pura testada em Node (3 cenários) | T1 |
| Catálogo de 64 blocos com `{id, name, atlas, col, row, color, category}` | T2 |
| Testes determinísticos do catálogo | T2 |
| `loadBlockAtlases` async com `NearestFilter` + `SRGBColorSpace` | T3 |
| `createBlockTexture` clona atlas e aplica offset/repeat | T3 |
| `createBlockMaterial` devolve `MeshLambertMaterial` | T3 |
| `voxel-mesh.js` aceita `atlases` | T4 |
| `ghost.js` aceita `atlases` | T5 |
| `app.js` boot async com status visível | T6 |
| Swatches via `drawImage` do PNG | T6 |
| Importação descarta blocos fora dos 64 com aviso | T6 |
| Sem `tests/textures.test.js` | T3 |
| `tests/static.test.js` confirma PNGs presentes | T7 |
| README explica como adicionar blocos | T8 |
| Verificação browser final | T9 |
| IDs `minecraft:*` mantidos | T2 (catálogo) |
| Sem build step (continua static-site) | — (nada introduzido) |

**Lacunas conscientes deferidas:**
- Texturas por face (top/sides/bottom diferentes) — fora de escopo.
- Hot-reload dos PNGs.
- Snapshot tests visuais.
- Migração automática de blocos removidos.

Plano sem placeholders TBD. Cada passo tem comando ou código completo. Tipos e assinaturas consistentes entre tarefas (`createBlockMaterial(block, atlases)`, `loadBlockAtlases()`, `getAtlasTransform({cols, rows, col, row})`).
