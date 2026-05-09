# Atlas pixel-art para texturas de blocos — design

**Data:** 2026-05-09
**Estado:** validado em brainstorming, pronto para plano de implementação
**Origem:** o utilizador produziu três PNGs pixel-art (atlas-natural, atlas-cor, atlas-especial) e quer substituir as texturas procedurais actuais por células recortadas destes atlas.

## Contexto e problema

O Cubinhos 3D actual gera as texturas dos blocos proceduralmente em `src/textures.js`, a partir do campo `color` de cada bloco em `src/blocks.js`. Visualmente funciona, mas perde o aspecto Minecraft fiel que faz a ponte com o jogo. A paleta tem hoje 74 blocos.

O utilizador produziu três atlas pixel-art que cobrem **64 blocos** específicos:
- `atlas-natural.png` (4×4): grass, dirt, sand, snow, ice, clay, stone, cobblestone, gravel, mud, troncos claro/médio/escuro, oak_planks, oak_wood (casca), oak_leaves
- `atlas-cor.png` (8×4): 16 concrete + 16 wool, branco→rosa
- `atlas-especial.png` (4×4): glass, light_blue_glass, gold, iron, diamond, emerald, lapis, amethyst, glowstone, sea_lantern, quartz, copper, obsidian, redstone (cristal vermelho), smooth_quartz (mármore), deepslate_bricks (tijolo decorativo escuro)

A paleta passa a ter **exactamente 64 blocos**, alinhada com as células dos atlas.

## Princípios

- **Atlas é a verdade.** Sem fallback procedural; se um PNG falhar a carregar, a app mostra erro.
- **IDs `minecraft:*` mantêm-se** — autoridade para `.mcstructure`. Continua a abrir no Minecraft Education.
- **Sem build step.** Projecto continua a ser static-site puro; PNGs em `assets/blocks/`.
- **Função pura no centro.** A matemática `(col, row, cols, rows) → (offset, repeat)` é puramente testável em Node, sem THREE nem DOM.
- **Fronteiras claras.** Catálogo de blocos, metadados de atlas, carregador de texturas e composição de materiais são módulos separados.

## Mapeamento atlas ↔ Minecraft IDs

### `atlas-natural.png` (4×4)

| col,row | Cell | minecraft id |
|---|---|---|
| 0,0 | relva | `minecraft:grass_block` |
| 1,0 | terra | `minecraft:dirt` |
| 2,0 | areia | `minecraft:sand` |
| 3,0 | neve | `minecraft:snow` |
| 0,1 | gelo | `minecraft:ice` |
| 1,1 | argila | `minecraft:clay` |
| 2,1 | pedra lisa | `minecraft:stone` |
| 3,1 | calçada | `minecraft:cobblestone` |
| 0,2 | cascalho | `minecraft:gravel` |
| 1,2 | lama | `minecraft:mud` |
| 2,2 | tronco claro | `minecraft:birch_log` |
| 3,2 | tronco médio | `minecraft:oak_log` |
| 0,3 | tronco escuro | `minecraft:dark_oak_log` |
| 1,3 | tábuas de madeira | `minecraft:oak_planks` |
| 2,3 | casca de árvore | `minecraft:oak_wood` |
| 3,3 | folhas | `minecraft:oak_leaves` |

### `atlas-cor.png` (8×4)

Rows 0–1 = concrete (16 cores), rows 2–3 = wool (16 cores). Ordem das cores: white, light_gray, gray, black, brown, red, orange, yellow, lime, green, cyan, light_blue, blue, purple, magenta, pink. IDs: `minecraft:white_concrete` … `minecraft:pink_wool`.

### `atlas-especial.png` (4×4)

| col,row | Cell | minecraft id |
|---|---|---|
| 0,0 | vidro transparente | `minecraft:glass` |
| 1,0 | vidro azul claro | `minecraft:light_blue_stained_glass` |
| 2,0 | ouro | `minecraft:gold_block` |
| 3,0 | ferro | `minecraft:iron_block` |
| 0,1 | diamante | `minecraft:diamond_block` |
| 1,1 | esmeralda | `minecraft:emerald_block` |
| 2,1 | lápis-lazúli | `minecraft:lapis_block` |
| 3,1 | ametista | `minecraft:amethyst_block` |
| 0,2 | glowstone | `minecraft:glowstone` |
| 1,2 | sea lantern | `minecraft:sea_lantern` |
| 2,2 | quartzo | `minecraft:quartz_block` |
| 3,2 | cobre | `minecraft:copper_block` |
| 0,3 | obsidiana | `minecraft:obsidian` |
| 1,3 | cristal vermelho | `minecraft:redstone_block` |
| 2,3 | mármore | `minecraft:smooth_quartz` |
| 3,3 | tijolo decorativo escuro | `minecraft:deepslate_bricks` |

Total: **16 + 32 + 16 = 64 blocos**.

## Estrutura técnica

### Ficheiros

| Ficheiro | Estado | Responsabilidade |
|---|---|---|
| `assets/blocks/atlas-natural.png` | novo (fornecido pelo utilizador) | 4×4 grelha pixel-art |
| `assets/blocks/atlas-cor.png` | novo (fornecido) | 8×4 grelha (concrete + wool) |
| `assets/blocks/atlas-especial.png` | novo (fornecido) | 4×4 grelha |
| `src/blocks.js` | reescreve | 64 blocos com `{id, name, atlas, col, row, category, color}`. O `color` (hex) fica como cor representativa para casos sem textura (status badge, etc.) — não é usado para gerar texturas. Mantém `BLOCKS`, `BLOCK_BY_ID`, `paletteBlocks()`, `blockColor()`, `blockName()` |
| `src/atlas.js` | novo | Constante `ATLASES = {natural, color, special}` com `{path, cols, rows}`. Função pura `getAtlasTransform({cols, rows, col, row})` → `{offsetX, offsetY, repeatX, repeatY}` |
| `src/textures.js` | reduz | Remove geração procedural. Adiciona `loadBlockAtlases(loader)` async (carrega 3 PNGs em paralelo, aplica `NearestFilter` + `SRGBColorSpace`) e `createBlockTexture(block, atlasTexture, atlasMeta)` (clona, aplica offset/repeat, marca `needsUpdate`) |
| `src/voxel-mesh.js` | adapta | `createVoxelMeshes(scene, atlases)` aceita `atlases`. Cria material por `blockId` via `createBlockMaterial`. Interface externa (`rebuild`, `setVoxel`, `meshList`) inalterada |
| `src/ghost.js` | adapta | `createGhost(scene, atlases)`. `showBuild` consulta `atlases` para construir a textura clonada do bloco activo. Cache continua a evitar recomputação por bloco repetido |
| `src/app.js` | adapta | Boot fica `async`: mostra "A carregar texturas..." na status bar, `await loadBlockAtlases(...)`, depois cria scene/mesh/ghost com `atlases`. Swatches da paleta passam a usar `<canvas>` com `drawImage` da célula correspondente do PNG |
| `tests/atlas.test.js` | novo | Testes puros de `getAtlasTransform` (3 cenários) |
| `tests/blocks.test.js` | novo | Validação determinística do catálogo (contagem, unicidade, coordenadas válidas) |
| `tests/textures.test.js` | remove | Testa geração procedural que deixa de existir. Substituído por `atlas.test.js` que cobre a função pura nova |
| `tests/static.test.js` | adapta | Acrescenta asserções de presença dos PNGs em `assets/blocks/` |
| `README.md` | adiciona | Secção "Adicionar blocos novos" explicando catálogo + atlas |

### Função pura central

```js
// src/atlas.js
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

### Carregamento e materiais

```js
// src/textures.js
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

export function createBlockTexture(block, atlasTexture, atlasMeta) {
  const t = atlasTexture.clone();
  const { offsetX, offsetY, repeatX, repeatY } = getAtlasTransform({ ...atlasMeta, col: block.col, row: block.row });
  t.offset.set(offsetX, offsetY);
  t.repeat.set(repeatX, repeatY);
  t.needsUpdate = true;
  return t;
}

export function createBlockMaterial(block, atlases) {
  const atlasTex = atlases[block.atlas];
  const atlasMeta = ATLASES[block.atlas];
  const map = createBlockTexture(block, atlasTex, atlasMeta);
  return new THREE.MeshLambertMaterial({ map });
}
```

### InstancedMesh por blockId

Mantém-se a estrutura actual: um `InstancedMesh` por tipo de bloco. Cada mesh recebe o material correspondente via `createBlockMaterial`. Sem alteração de offset/repeat por instância.

### Swatches da paleta

Em `app.js`, `swatchDataUrl(blockId)` substitui o caminho actual baseado em cor:

1. Carrega `Image` para o atlas correspondente (uma vez, em cache).
2. Cria `<canvas>` 32×32, `imageSmoothingEnabled = false`.
3. `drawImage(atlasImg, col*cellW, row*cellH, cellW, cellH, 0, 0, 32, 32)` onde `cellW = atlasImg.naturalWidth/cols`.
4. `canvas.toDataURL()` para `background-image`.

Cache `Map<blockId, dataUrl>` evita recomputação.

### Boot assíncrono

`src/app.js` actual é síncrono no top-level. Passa a:

```js
async function init() {
  status('A carregar texturas...');
  const atlases = await loadBlockAtlases();
  const sceneCtx = createScene(canvas);
  const meshes = createVoxelMeshes(sceneCtx.scene, atlases);
  const ghost = createGhost(sceneCtx.scene, atlases);
  // ... resto inalterado
  status('');
}

init().catch((err) => {
  document.body.innerHTML = `<div style="padding:2rem">Erro ao carregar texturas: ${err.message}</div>`;
});
```

Top-level `await` é suportado em ESM modules — alternativa equivalente.

## Testes

`tests/atlas.test.js`:
- `getAtlasTransform({cols:4, rows:4, col:0, row:0})` → `{offsetX:0, offsetY:0.75, repeatX:0.25, repeatY:0.25}`
- `getAtlasTransform({cols:8, rows:4, col:7, row:3})` → `{offsetX:0.875, offsetY:0, repeatX:0.125, repeatY:0.25}`
- `getAtlasTransform({cols:4, rows:4, col:3, row:3})` → `{offsetX:0.75, offsetY:0, repeatX:0.25, repeatY:0.25}`

`tests/blocks.test.js`:
- `paletteBlocks().length === 64`
- 16 com `atlas === 'natural'`, 32 com `'color'`, 16 com `'special'`
- IDs únicos
- Todos começam com `minecraft:`
- Para cada bloco, `0 ≤ col < ATLASES[atlas].cols` e `0 ≤ row < ATLASES[atlas].rows`
- `BLOCK_BY_ID[id]` resolve para todos
- Sem duplicação de `(atlas, col, row)`

Não testados em Node:
- `loadBlockAtlases` (necessita `Image`/`fetch` do browser)
- `createBlockTexture` clonagem (necessita `THREE.Texture`)
- Renderização visual

## Compatibilidade `.mcstructure`

- **Export:** funciona normalmente — a paleta gerada inclui apenas os 64 IDs presentes no modelo.
- **Import:** ficheiros com IDs fora dos 64 (ex.: `minecraft:red_sand`, `minecraft:spruce_planks`) avisam o utilizador via status bar e descartam esses blocos (`'minecraft:air'`). Sem migração automática para "equivalente próximo".

## Critérios de sucesso

- `npm test` passa (incluindo os novos testes `atlas.test.js` e `blocks.test.js`).
- App abre no browser sem erros de consola; os 3 PNGs carregam **uma única vez**; rede mostra exactamente 3 requests `200`.
- Cada bloco renderiza apenas a célula correcta do atlas; sem blur (`NearestFilter` confirmado).
- Paleta da UI mostra 64 swatches gerados a partir dos PNGs.
- Round-trip `.mcstructure` para os 64 blocos novos funciona.
- Adicionar um bloco novo exige apenas:
  1. acrescentar célula ao PNG correspondente;
  2. adicionar entrada ao catálogo `BLOCKS`.

## Fora de escopo

- Texturas por face (top/side/bottom diferentes — relevante para `grass_block`, deferido).
- Hot-reload dos PNGs em desenvolvimento.
- UV-por-instância via shader.
- Snapshot tests visuais.
- Migração automática de blocos removidos da paleta para equivalentes (red_sand → sand). Importação descarta com aviso.
- Texturas animadas (água, lava).
