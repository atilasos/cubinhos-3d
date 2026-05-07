# Edição 3D Tinkercad + Minecraft Education — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os modos camadas/iso/3D-falso por um único editor 3D real com câmara orbital tipo Tinkercad, ferramentas activas tipo Minecraft Education, e aspecto pixel-art convidativo para alunos do 1.º ciclo.

**Architecture:** Three.js via ESM/CDN renderiza a cena. Camada de dados (`model.js`) fica intacta e autoritária. Novos módulos `scene.js`, `voxel-mesh.js`, `raycaster.js`, `controls.js`, `tools.js` são puros e desacoplados; `app.js` é o único orquestrador que liga model ↔ scene ↔ tools ↔ UI.

**Tech Stack:** Three.js 0.164.0 (ESM/CDN, sem build), JavaScript ES modules vanilla, Canvas 2D para texturas procedurais, HTML/CSS standard, Node test runner para testes puros.

**Spec de origem:** `docs/superpowers/specs/2026-05-07-edicao-3d-tinkercad-minecraft-design.md`.

**Desvio do spec a registar:** Em vez de texturas oficiais Minecraft em `assets/blocks/*.png` (copyright), as texturas 16×16 são geradas em runtime via Canvas 2D a partir da `color` de cada bloco em `blocks.js`, mantendo `NearestFilter` para preservar o pixel. Hook deixado em `voxel-mesh.js` para substituir por PNGs reais que o utilizador possa colocar em `assets/blocks/<id>.png`.

---

## Convenções

- **Sistema de coordenadas:** O espaço do `model` é `(x, y, z)` com `y` para cima, `0..31` em cada eixo. A cena Three.js usa o mesmo: `y` em cima, voxel `(x,y,z)` ocupa o cubo unitário com centro em `(x+0.5, y+0.5, z+0.5)`.
- **Faces:** Codificadas como vector normal: `+X`, `-X`, `+Y`, `-Y`, `+Z`, `-Z`. Para a UI usamos os nomes Frente (`-Z`), Atrás (`+Z`), Direita (`+X`), Esquerda (`-X`), Cima (`+Y`), Baixo (`-Y`).
- **Verificação visual:** Cada tarefa que toca em renderização inclui passo manual no browser (`npm start` → `http://localhost:8000`).
- **Testes:** Lógica pura (raycaster, tools, ferramentas que mutam model) tem testes Node. Three.js e DOM não são testados em unidade.

---

## Estrutura de ficheiros (decomposição)

| Ficheiro | Estado | Responsabilidade | Tamanho alvo |
|---|---|---|---|
| `src/model.js` | mantém | Estado + undo/redo (autoritário) | inalterado |
| `src/blocks.js` | estende | Paleta + cor + helper de textura | +20 linhas |
| `src/mcstructure.js` | mantém | I/O `.mcstructure` | inalterado |
| `src/nbt.js` | mantém | NBT | inalterado |
| `src/isometric.js` | **remove** | (renderer 2D antigo) | 0 |
| `src/textures.js` | novo | Gera `THREE.Texture` 16×16 procedural | ~80 |
| `src/scene.js` | novo | Cena, câmara, luzes, plataforma, limites | ~150 |
| `src/voxel-mesh.js` | novo | `InstancedMesh` por tipo de bloco | ~180 |
| `src/raycaster.js` | novo | Picking pointer→voxel/face | ~120 |
| `src/controls.js` | novo | Câmara orbital + ViewCube + atalhos | ~250 |
| `src/tools.js` | novo | Ferramenta activa + drag-paint + ghost | ~150 |
| `src/app.js` | reduz | Orquestração apenas | ~200 (de 665) |
| `index.html` | reescreve | Cabeçalho fino + lateral + gaveta + canvas | ~80 |
| `styles.css` | reescreve | Layout novo + tipografia + animações | ~300 |

Total novo código: ~1100 linhas. Removidas: ~840 linhas (isometric.js + grande parte de app.js + styles antigos).

---

## Tarefa 1 · Setup: importmap, fonte, gitignore

**Files:**
- Modify: `index.html` (cabeçalho `<head>` apenas — restante reescrito mais tarde)
- Modify: `.gitignore` (verificar se `.superpowers/` lá está)

- [ ] **Passo 1: Adicionar importmap do Three.js e fonte Fredoka ao `<head>`**

Editar `index.html` para que o `<head>` fique:

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cubinhos 3D — Construtor Voxel para Minecraft Education</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.164.0/build/three.module.js"
      }
    }
  </script>
  <link rel="stylesheet" href="./styles.css">
</head>
```

- [ ] **Passo 2: Verificar `.gitignore`**

Confirma que existe a linha `.superpowers/`. Se não existir, adicionar.

- [ ] **Passo 3: Smoke-test local do importmap**

Criar ficheiro temporário `scratch-three.html` no root com:

```html
<!doctype html>
<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.164.0/build/three.module.js"}}</script>
<script type="module">
  import * as THREE from 'three';
  document.title = 'OK ' + THREE.REVISION;
</script>
```

Correr `npm start` e abrir `http://localhost:8000/scratch-three.html`. O título da janela deve ficar "OK 164" (ou similar).

- [ ] **Passo 4: Apagar o ficheiro temporário**

```bash
rm scratch-three.html
```

- [ ] **Passo 5: Commit**

```bash
git add index.html .gitignore
git commit -m "chore: pin three.js 0.164 importmap + Fredoka font"
```

---

## Tarefa 2 · Texturas procedurais 16×16

**Files:**
- Create: `src/textures.js`
- Create: `tests/textures.test.js`

- [ ] **Passo 1: Escrever teste de propriedades determinísticas**

`tests/textures.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTextureCanvasData } from '../src/textures.js';

test('buildTextureCanvasData produces 16x16 RGBA bytes', () => {
  const bytes = buildTextureCanvasData('#5b9b3a');
  assert.equal(bytes.length, 16 * 16 * 4);
});

test('buildTextureCanvasData is deterministic for same color', () => {
  const a = buildTextureCanvasData('#5b9b3a');
  const b = buildTextureCanvasData('#5b9b3a');
  assert.deepEqual(a, b);
});

test('buildTextureCanvasData differs for different colors', () => {
  const a = buildTextureCanvasData('#5b9b3a');
  const b = buildTextureCanvasData('#a12722');
  assert.notDeepEqual(a, b);
});
```

- [ ] **Passo 2: Verificar falha**

```bash
npm test
```

Esperado: testes falham com "Cannot find module '../src/textures.js'".

- [ ] **Passo 3: Implementar `textures.js`**

`src/textures.js`:

```javascript
// Generates 16x16 pixel-art-style RGBA textures from a base hex color.
// Output is deterministic (seeded by color) so the same color always
// produces the same texture across reloads.

const SIZE = 16;

export function buildTextureCanvasData(hexColor) {
  const [r, g, b] = parseHex(hexColor);
  const out = new Uint8ClampedArray(SIZE * SIZE * 4);
  let seed = (r * 73856093) ^ (g * 19349663) ^ (b * 83492791);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const n = (rng(seed++) - 0.5) * 0.18; // ±9% lightness noise
      const pr = clamp255(r * (1 + n));
      const pg = clamp255(g * (1 + n));
      const pb = clamp255(b * (1 + n));
      const i = (y * SIZE + x) * 4;
      out[i + 0] = pr;
      out[i + 1] = pg;
      out[i + 2] = pb;
      out[i + 3] = 255;
    }
  }
  // Top edge highlight, bottom edge shadow (1px) — gives blocks a bevelled feel.
  for (let x = 0; x < SIZE; x += 1) {
    tint(out, x, 0, 1.18);
    tint(out, x, SIZE - 1, 0.78);
  }
  return out;
}

export function buildThreeTexture(THREE, hexColor) {
  const data = buildTextureCanvasData(hexColor);
  const tex = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function parseHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [148, 163, 184];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rng(seed) {
  // xorshift32
  let x = seed | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) / 0xffffffff);
}

function clamp255(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function tint(out, x, y, factor) {
  const i = (y * SIZE + x) * 4;
  out[i] = clamp255(out[i] * factor);
  out[i + 1] = clamp255(out[i + 1] * factor);
  out[i + 2] = clamp255(out[i + 2] * factor);
}
```

- [ ] **Passo 4: Verificar passagem dos testes**

```bash
npm test
```

Esperado: 3 testes passam.

- [ ] **Passo 5: Commit**

```bash
git add src/textures.js tests/textures.test.js
git commit -m "feat: procedural 16x16 pixel textures from block color"
```

---

## Tarefa 3 · Cena Three.js mínima (canvas a render)

**Files:**
- Create: `src/scene.js`

Esta tarefa cria uma cena vazia visível. Sem voxels, sem controlos. Só céu + plataforma + câmara estática isométrica.

- [ ] **Passo 1: Implementar `scene.js`**

`src/scene.js`:

```javascript
import * as THREE from 'three';

const WORLD = 32;

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = makeSkyTexture();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  setHomeView(camera);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(40, 60, 30);
  scene.add(ambient, sun);

  scene.add(makeFloorPlane());
  scene.add(makeWorldBoundsLines());

  resize(renderer, camera, canvas);
  window.addEventListener('resize', () => resize(renderer, camera, canvas));

  function render() { renderer.render(scene, camera); }
  function loop() { render(); requestAnimationFrame(loop); }
  loop();

  return { scene, camera, renderer, render, setHomeView: () => setHomeView(camera) };
}

function setHomeView(camera) {
  const center = new THREE.Vector3(WORLD / 2, 0, WORLD / 2);
  camera.position.set(center.x + 36, 36, center.z + 36);
  camera.lookAt(center);
}

function makeSkyTexture() {
  const c = document.createElement('canvas');
  c.width = 2; c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#bfe3ff');
  grad.addColorStop(1, '#dff3ff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeFloorPlane() {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(WORLD, WORLD);
  const mat = new THREE.MeshLambertMaterial({ color: 0xcfeaff });
  const plane = new THREE.Mesh(geo, mat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(WORLD / 2, 0, WORLD / 2);
  group.add(plane);
  // Grid 1×1 ligeiramente visível
  const grid = new THREE.GridHelper(WORLD, WORLD, 0x99c2e5, 0x99c2e5);
  grid.position.set(WORLD / 2, 0.001, WORLD / 2);
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  group.add(grid);
  return group;
}

function makeWorldBoundsLines() {
  const geo = new THREE.BoxGeometry(WORLD, WORLD, WORLD);
  const edges = new THREE.EdgesGeometry(geo);
  const mat = new THREE.LineDashedMaterial({ color: 0x88aacc, dashSize: 0.6, gapSize: 0.4, opacity: 0.55, transparent: true });
  const line = new THREE.LineSegments(edges, mat);
  line.computeLineDistances();
  line.position.set(WORLD / 2, WORLD / 2, WORLD / 2);
  return line;
}

function resize(renderer, camera, canvas) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
```

- [ ] **Passo 2: Smoke-test no browser**

Criar `scratch-scene.html` no root:

```html
<!doctype html>
<style>html,body{margin:0;height:100%}canvas{width:100vw;height:100vh;display:block}</style>
<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.164.0/build/three.module.js"}}</script>
<canvas id="c"></canvas>
<script type="module">
  import { createScene } from './src/scene.js';
  createScene(document.getElementById('c'));
</script>
```

`npm start` → abrir `http://localhost:8000/scratch-scene.html`. Devias ver: céu azul, plataforma azul-pastel com grelha, caixa tracejada à volta. Vista isométrica de 3/4.

- [ ] **Passo 3: Apagar ficheiro temporário**

```bash
rm scratch-scene.html
```

- [ ] **Passo 4: Commit**

```bash
git add src/scene.js
git commit -m "feat: minimal three.js scene with sky, floor, world bounds"
```

---

## Tarefa 4 · Voxel mesh (InstancedMesh por tipo)

**Files:**
- Create: `src/voxel-mesh.js`
- Modify: `src/blocks.js` (adicionar helper `paletteBlocks()` que filtra ar)

- [ ] **Passo 1: Estender `blocks.js`**

Acrescentar no fim de `src/blocks.js`:

```javascript
export function paletteBlocks() {
  return BLOCKS.filter((b) => !b.empty);
}
```

- [ ] **Passo 2: Implementar `voxel-mesh.js`**

`src/voxel-mesh.js`:

```javascript
import * as THREE from 'three';
import { buildThreeTexture } from './textures.js';
import { BLOCK_BY_ID, paletteBlocks } from './blocks.js';

const AIR = 'minecraft:air';
const MAX_PER_TYPE = 32 * 32 * 32;

// Cria uma "fábrica" de meshes instanciadas — uma InstancedMesh por bloco.
// Mantém um índice (x,y,z)->instanceId para updates granulares.
export function createVoxelMeshes(scene) {
  const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
  const meshesById = new Map();

  for (const block of paletteBlocks()) {
    const tex = buildThreeTexture(THREE, block.color);
    const mat = new THREE.MeshLambertMaterial({ map: tex });
    const mesh = new THREE.InstancedMesh(cubeGeo, mat, MAX_PER_TYPE);
    mesh.count = 0;
    mesh.userData.blockId = block.id;
    mesh.frustumCulled = false;
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
    // Mover a última instância para o slot a libertar (swap-and-pop).
    const last = entry.mesh.count - 1;
    if (slot !== last) {
      const m = new THREE.Matrix4();
      entry.mesh.getMatrixAt(last, m);
      entry.mesh.setMatrixAt(slot, m);
      // Actualizar o key->slot da instância que foi movida.
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

- [ ] **Passo 3: Smoke-test no browser**

Criar `scratch-voxels.html`:

```html
<!doctype html>
<style>html,body{margin:0;height:100%}canvas{width:100vw;height:100vh;display:block}</style>
<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.164.0/build/three.module.js"}}</script>
<canvas id="c"></canvas>
<script type="module">
  import { createScene } from './src/scene.js';
  import { createVoxelMeshes } from './src/voxel-mesh.js';
  import { createModel, setVoxel } from './src/model.js';
  const { scene } = createScene(document.getElementById('c'));
  const meshes = createVoxelMeshes(scene);
  const model = createModel();
  for (let x = 8; x < 16; x++) for (let z = 8; z < 16; z++) {
    setVoxel(model, x, 0, z, 'minecraft:grass_block');
    setVoxel(model, x, 1, z, 'minecraft:dirt');
  }
  setVoxel(model, 12, 2, 12, 'minecraft:gold_block');
  meshes.rebuild(model);
</script>
```

`npm start` → abrir `http://localhost:8000/scratch-voxels.html`. Esperado: pequena plataforma 8×8 de relva com bloco dourado em cima.

- [ ] **Passo 4: Apagar ficheiro temporário**

```bash
rm scratch-voxels.html
```

- [ ] **Passo 5: Commit**

```bash
git add src/voxel-mesh.js src/blocks.js
git commit -m "feat: instanced voxel meshes per block type"
```

---

## Tarefa 5 · Raycaster (pointer → voxel + face)

**Files:**
- Create: `src/raycaster.js`
- Create: `tests/raycaster.test.js`

O raycaster faz DDA na grelha do `model` em vez de usar `THREE.Raycaster` contra cada InstancedMesh — é O(comprimento do raio) em voxels, independentemente da contagem.

- [ ] **Passo 1: Escrever testes**

`tests/raycaster.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModel, setVoxel } from '../src/model.js';
import { castRay } from '../src/raycaster.js';

test('castRay hits empty model on floor plane', () => {
  const model = createModel();
  // Ray apontando para baixo, atinge plataforma Y=0
  const hit = castRay(model, { origin: [16, 20, 16], dir: [0, -1, 0] });
  assert.equal(hit.kind, 'floor');
  assert.deepEqual(hit.ghostVoxel, [16, 0, 16]);
});

test('castRay hits placed voxel and reports face', () => {
  const model = createModel();
  setVoxel(model, 16, 0, 16, 'minecraft:stone');
  const hit = castRay(model, { origin: [16.5, 20, 16.5], dir: [0, -1, 0] });
  assert.equal(hit.kind, 'voxel');
  assert.deepEqual(hit.voxel, [16, 0, 16]);
  assert.deepEqual(hit.normal, [0, 1, 0]); // face de cima
  assert.deepEqual(hit.ghostVoxel, [16, 1, 16]); // bloco fantasma vai para cima
});

test('castRay returns null when ray misses the world', () => {
  const model = createModel();
  const hit = castRay(model, { origin: [-100, 50, -100], dir: [-1, 0, 0] });
  assert.equal(hit, null);
});

test('castRay hits side face from horizontal ray', () => {
  const model = createModel();
  setVoxel(model, 10, 5, 10, 'minecraft:stone');
  const hit = castRay(model, { origin: [0, 5.5, 10.5], dir: [1, 0, 0] });
  assert.equal(hit.kind, 'voxel');
  assert.deepEqual(hit.voxel, [10, 5, 10]);
  assert.deepEqual(hit.normal, [-1, 0, 0]);
  assert.deepEqual(hit.ghostVoxel, [9, 5, 10]);
});
```

- [ ] **Passo 2: Verificar falha**

```bash
npm test
```

Esperado: testes do raycaster falham — módulo não existe.

- [ ] **Passo 3: Implementar `raycaster.js`**

`src/raycaster.js`:

```javascript
import { getVoxel } from './model.js';

const AIR = 'minecraft:air';
const MAX_STEPS = 200;

// Faz DDA na grelha do model. Devolve:
//   { kind: 'voxel', voxel:[x,y,z], normal:[nx,ny,nz], ghostVoxel:[x',y',z'], distance }
//   { kind: 'floor', ghostVoxel:[x,0,z], distance }     (raio atinge plano Y=0)
//   null                                                  (raio sai do mundo)
export function castRay(model, ray) {
  const { origin, dir } = ray;
  const sx = model.size.x, sy = model.size.y, sz = model.size.z;

  let [ox, oy, oz] = origin;
  let [dx, dy, dz] = dir;
  // Normalizar direcção
  const len = Math.hypot(dx, dy, dz) || 1;
  dx /= len; dy /= len; dz /= len;

  // Avançar até entrar na bounding box [0..s] (se origem estiver fora)
  const tEntry = enterBox(ox, oy, oz, dx, dy, dz, sx, sy, sz);
  if (tEntry === null) return null;
  ox += dx * tEntry; oy += dy * tEntry; oz += dz * tEntry;
  let distance = tEntry;

  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const stepX = dx > 0 ? 1 : -1;
  const stepY = dy > 0 ? 1 : -1;
  const stepZ = dz > 0 ? 1 : -1;
  const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
  const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
  const tDeltaZ = dz !== 0 ? Math.abs(1 / dz) : Infinity;
  let tMaxX = dx !== 0 ? ((dx > 0 ? Math.floor(ox) + 1 - ox : ox - Math.floor(ox)) * tDeltaX) : Infinity;
  let tMaxY = dy !== 0 ? ((dy > 0 ? Math.floor(oy) + 1 - oy : oy - Math.floor(oy)) * tDeltaY) : Infinity;
  let tMaxZ = dz !== 0 ? ((dz > 0 ? Math.floor(oz) + 1 - oz : oz - Math.floor(oz)) * tDeltaZ) : Infinity;

  let lastNormal = [0, 0, 0];

  for (let step = 0; step < MAX_STEPS; step += 1) {
    if (x < 0 || y < 0 || z < 0 || x >= sx || y >= sy || z >= sz) {
      // Saiu do mundo. Se a saída for pelo lado de baixo, é o chão.
      if (lastNormal[1] === 1 && y < 0) {
        // entrámos no plano abaixo do mundo — tratado pelo passo do "chão" abaixo
      }
      return null;
    }
    const id = getVoxel(model, x, y, z);
    if (id !== AIR) {
      return {
        kind: 'voxel',
        voxel: [x, y, z],
        normal: lastNormal,
        ghostVoxel: [x + lastNormal[0], y + lastNormal[1], z + lastNormal[2]],
        distance,
      };
    }
    // Antes de avançar, verificar se o raio atravessa o plano Y=0 dentro deste passo.
    // Se sim e ainda não acertámos voxel, é um hit "chão".
    if (dy < 0 && y === 0 && stepY === -1) {
      // Próxima parede de y leva-nos abaixo de 0 → hit no chão
      const tToFloor = ((0 - oy) / dy);
      if (tToFloor > 0 && tToFloor <= tMaxY) {
        const fx = ox + dx * tToFloor;
        const fz = oz + dz * tToFloor;
        const gx = Math.max(0, Math.min(sx - 1, Math.floor(fx)));
        const gz = Math.max(0, Math.min(sz - 1, Math.floor(fz)));
        return { kind: 'floor', ghostVoxel: [gx, 0, gz], distance: distance + tToFloor };
      }
    }
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX; distance += tMaxX; tMaxX += tDeltaX; lastNormal = [-stepX, 0, 0];
    } else if (tMaxY < tMaxZ) {
      y += stepY; distance += tMaxY; tMaxY += tDeltaY; lastNormal = [0, -stepY, 0];
    } else {
      z += stepZ; distance += tMaxZ; tMaxZ += tDeltaZ; lastNormal = [0, 0, -stepZ];
    }
  }
  return null;
}

function enterBox(ox, oy, oz, dx, dy, dz, sx, sy, sz) {
  // Se já estamos dentro, t=0
  if (ox >= 0 && ox <= sx && oy >= 0 && oy <= sy && oz >= 0 && oz <= sz) return 0;
  let tMin = 0, tMax = Infinity;
  for (const [o, d, s] of [[ox, dx, sx], [oy, dy, sy], [oz, dz, sz]]) {
    if (Math.abs(d) < 1e-9) {
      if (o < 0 || o > s) return null;
    } else {
      let t1 = (0 - o) / d;
      let t2 = (s - o) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return null;
    }
  }
  return tMin;
}
```

- [ ] **Passo 4: Verificar passagem dos testes**

```bash
npm test
```

Esperado: 4 testes do raycaster passam (mais os existentes).

- [ ] **Passo 5: Commit**

```bash
git add src/raycaster.js tests/raycaster.test.js
git commit -m "feat: voxel-grid DDA raycaster with floor fallback"
```

---

## Tarefa 6 · Câmara orbital (botão direito + roda)

**Files:**
- Create: `src/controls.js` (parte 1: orbit + zoom)

A primeira parte de `controls.js`. Encerra o estado da câmara e expõe `attach(canvas)`. ViewCube e setas vêm na Tarefa 7.

- [ ] **Passo 1: Implementar orbit + zoom**

`src/controls.js`:

```javascript
import * as THREE from 'three';

const WORLD = 32;
const PITCH_MIN = 0.15;            // não permitir olhar de baixo
const PITCH_MAX = Math.PI / 2 - 0.05;
const DIST_MIN = 12;
const DIST_MAX = 90;
const ROT_SPEED = 0.005;
const ZOOM_SPEED = 0.12;

export function createControls(camera, canvas) {
  const target = new THREE.Vector3(WORLD / 2, WORLD / 2 - 4, WORLD / 2);
  // Estado em coordenadas esféricas em torno de target
  const state = {
    yaw: -Math.PI / 4,       // orientação inicial (vista isométrica)
    pitch: Math.PI / 5,
    distance: 56,
  };
  apply();

  let dragging = false;
  let lastX = 0, lastY = 0;

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 2) return;             // só botão direito
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    state.yaw -= dx * ROT_SPEED;
    state.pitch = clamp(state.pitch - dy * ROT_SPEED, PITCH_MIN, PITCH_MAX);
    apply();
  });

  canvas.addEventListener('pointerup', (e) => {
    if (e.button !== 2) return;
    dragging = false;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const dir = Math.sign(e.deltaY);
    state.distance = clamp(state.distance * (1 + dir * ZOOM_SPEED), DIST_MIN, DIST_MAX);
    apply();
  }, { passive: false });

  function apply() {
    const r = state.distance;
    const cy = Math.cos(state.pitch);
    camera.position.set(
      target.x + r * cy * Math.sin(state.yaw),
      target.y + r * Math.sin(state.pitch),
      target.z + r * cy * Math.cos(state.yaw),
    );
    camera.lookAt(target);
  }

  function home() {
    state.yaw = -Math.PI / 4;
    state.pitch = Math.PI / 5;
    state.distance = 56;
    apply();
  }

  function rotateBy(deltaYawRadians) {
    state.yaw += deltaYawRadians;
    apply();
  }

  function setView(yaw, pitch) {
    state.yaw = yaw; state.pitch = pitch; apply();
  }

  return { home, rotateBy, setView, state, apply };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
```

- [ ] **Passo 2: Smoke-test**

`scratch-controls.html`:

```html
<!doctype html>
<style>html,body{margin:0;height:100%}canvas{width:100vw;height:100vh;display:block}</style>
<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.164.0/build/three.module.js"}}</script>
<canvas id="c"></canvas>
<script type="module">
  import { createScene } from './src/scene.js';
  import { createVoxelMeshes } from './src/voxel-mesh.js';
  import { createControls } from './src/controls.js';
  import { createModel, setVoxel } from './src/model.js';
  const canvas = document.getElementById('c');
  const { scene, camera } = createScene(canvas);
  const model = createModel();
  for (let x=10;x<22;x++) for (let z=10;z<22;z++) setVoxel(model,x,0,z,'minecraft:grass_block');
  setVoxel(model,16,1,16,'minecraft:gold_block');
  createVoxelMeshes(scene).rebuild(model);
  createControls(camera, canvas);
</script>
```

Verificar manualmente:
- Botão direito + arrastar → câmara roda à volta da maquete suavemente.
- Roda do rato → zoom in/out até aos limites.
- Não inverte de cabeça para baixo.

- [ ] **Passo 3: Apagar ficheiro temporário**

```bash
rm scratch-controls.html
```

- [ ] **Passo 4: Commit**

```bash
git add src/controls.js
git commit -m "feat: orbital camera with right-click drag + wheel zoom"
```

---

## Tarefa 7 · ViewCube + setas + 🏠

**Files:**
- Modify: `src/controls.js` (acrescentar widget HTML overlay)

O ViewCube é construído como overlay HTML/CSS sobre o canvas (não 3D), mais simples e nítido.

- [ ] **Passo 1: Acrescentar `attachViewCube()` em `controls.js`**

Acrescentar no fim de `src/controls.js`:

```javascript
const VIEWS = {
  'front':  { yaw: 0,           pitch: 0.001 },
  'back':   { yaw: Math.PI,     pitch: 0.001 },
  'right':  { yaw: -Math.PI/2,  pitch: 0.001 },
  'left':   { yaw: Math.PI/2,   pitch: 0.001 },
  'top':    { yaw: -Math.PI/4,  pitch: PITCH_MAX },
  'iso':    { yaw: -Math.PI/4,  pitch: Math.PI / 5 },
};

export function attachViewCube(controls, container) {
  const wrap = document.createElement('div');
  wrap.className = 'viewcube';
  wrap.innerHTML = `
    <button data-view="top" aria-label="Vista de cima">CIMA</button>
    <div class="viewcube-row">
      <button data-view="left" aria-label="Vista da esquerda">ESQ</button>
      <button data-view="front" aria-label="Vista da frente">FRENTE</button>
      <button data-view="right" aria-label="Vista da direita">DIR</button>
    </div>
    <button data-view="back" aria-label="Vista de trás">ATRÁS</button>
    <div class="viewcube-arrows">
      <button data-rotate="-1" aria-label="Rodar 45° à esquerda">⟲</button>
      <button data-rotate="1" aria-label="Rodar 45° à direita">⟳</button>
    </div>
    <button class="home" data-home aria-label="Vista inicial">🏠</button>
  `;
  container.appendChild(wrap);

  wrap.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.view) {
      const v = VIEWS[t.dataset.view];
      controls.setView(v.yaw, v.pitch);
    } else if (t.dataset.rotate) {
      controls.rotateBy(Number(t.dataset.rotate) * Math.PI / 4);
    } else if (t.dataset.home !== undefined) {
      controls.home();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isTypingTarget(e.target)) {
      e.preventDefault();
      controls.home();
    }
  });
}

function isTypingTarget(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}
```

- [ ] **Passo 2: Smoke-test (parte do scratch da tarefa 8 já é o app real)**

A verificação visual definitiva fica para a Tarefa 11 quando o `index.html` real estiver pronto. Por agora confirma só que o módulo carrega sem erros num scratch:

```html
<!-- scratch-viewcube.html -->
<!doctype html>
<style>
html,body{margin:0;height:100%}
canvas{width:100vw;height:100vh;display:block}
.viewcube{position:absolute;top:10px;right:10px;display:flex;flex-direction:column;align-items:center;gap:4px;z-index:10}
.viewcube button{padding:6px 8px;border-radius:6px;border:none;background:#fff;cursor:pointer}
</style>
<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.164.0/build/three.module.js"}}</script>
<canvas id="c"></canvas>
<script type="module">
  import { createScene } from './src/scene.js';
  import { createControls, attachViewCube } from './src/controls.js';
  const canvas = document.getElementById('c');
  const { camera } = createScene(canvas);
  const ctl = createControls(camera, canvas);
  attachViewCube(ctl, document.body);
</script>
```

Abrir `http://localhost:8000/scratch-viewcube.html`. Clicar nos botões: a vista deve saltar para cima/frente/lado. ⟲ ⟳ rodam 45°. 🏠 e Espaço repõem.

- [ ] **Passo 3: Apagar scratch**

```bash
rm scratch-viewcube.html
```

- [ ] **Passo 4: Commit**

```bash
git add src/controls.js
git commit -m "feat: viewcube overlay with snap views + rotate arrows + home"
```

---

## Tarefa 8 · Ferramentas (construir/apagar/pintar/encher) + ghost

**Files:**
- Create: `src/tools.js`
- Create: `tests/tools.test.js`

`tools.js` é responsável por: ferramenta activa, bloco activo, aplicar acção a um *target* do raycaster, e drag-paint. Não conhece Three.js — recebe um *target* `{kind, voxel, normal, ghostVoxel}` e despacha mutações ao `model`.

- [ ] **Passo 1: Escrever testes**

`tests/tools.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModel, getVoxel, setVoxel } from '../src/model.js';
import { createTools } from '../src/tools.js';

test('build tool places block at ghostVoxel on floor hit', () => {
  const model = createModel();
  const tools = createTools(model);
  tools.setTool('build'); tools.setBlock('minecraft:stone');
  tools.applyAt({ kind: 'floor', ghostVoxel: [10, 0, 10] });
  assert.equal(getVoxel(model, 10, 0, 10), 'minecraft:stone');
});

test('build tool places adjacent to face on voxel hit', () => {
  const model = createModel();
  setVoxel(model, 5, 0, 5, 'minecraft:dirt');
  const tools = createTools(model);
  tools.setTool('build'); tools.setBlock('minecraft:grass_block');
  tools.applyAt({ kind: 'voxel', voxel: [5, 0, 5], normal: [0, 1, 0], ghostVoxel: [5, 1, 5] });
  assert.equal(getVoxel(model, 5, 1, 5), 'minecraft:grass_block');
});

test('erase tool removes voxel', () => {
  const model = createModel();
  setVoxel(model, 5, 0, 5, 'minecraft:dirt');
  const tools = createTools(model);
  tools.setTool('erase');
  tools.applyAt({ kind: 'voxel', voxel: [5, 0, 5], normal: [0, 1, 0], ghostVoxel: [5, 1, 5] });
  assert.equal(getVoxel(model, 5, 0, 5), 'minecraft:air');
});

test('paint tool replaces voxel id', () => {
  const model = createModel();
  setVoxel(model, 5, 0, 5, 'minecraft:dirt');
  const tools = createTools(model);
  tools.setTool('paint'); tools.setBlock('minecraft:gold_block');
  tools.applyAt({ kind: 'voxel', voxel: [5, 0, 5], normal: [0, 1, 0], ghostVoxel: [5, 1, 5] });
  assert.equal(getVoxel(model, 5, 0, 5), 'minecraft:gold_block');
});

test('fill tool flood-fills connected same-id cells in same Y layer', () => {
  const model = createModel();
  for (let x = 0; x < 5; x += 1) setVoxel(model, x, 0, 0, 'minecraft:dirt');
  setVoxel(model, 2, 0, 0, 'minecraft:stone'); // quebra a fila
  const tools = createTools(model);
  tools.setTool('fill'); tools.setBlock('minecraft:gold_block');
  tools.applyAt({ kind: 'voxel', voxel: [0, 0, 0], normal: [0, 1, 0], ghostVoxel: [0, 1, 0] });
  // Só os contíguos (0,0,0) e (1,0,0) devem mudar; (3,0,0)+ ficam dirt.
  assert.equal(getVoxel(model, 0, 0, 0), 'minecraft:gold_block');
  assert.equal(getVoxel(model, 1, 0, 0), 'minecraft:gold_block');
  assert.equal(getVoxel(model, 2, 0, 0), 'minecraft:stone');
  assert.equal(getVoxel(model, 3, 0, 0), 'minecraft:dirt');
});

test('drag-paint applies to multiple targets and dedupes the same voxel', () => {
  const model = createModel();
  const tools = createTools(model);
  tools.setTool('build'); tools.setBlock('minecraft:stone');
  tools.startStroke();
  tools.applyAt({ kind: 'floor', ghostVoxel: [3, 0, 3] });
  tools.applyAt({ kind: 'floor', ghostVoxel: [3, 0, 3] }); // mesmo voxel
  tools.applyAt({ kind: 'floor', ghostVoxel: [4, 0, 3] });
  const changes = tools.endStroke();
  assert.equal(changes.length, 2);
  assert.equal(getVoxel(model, 3, 0, 3), 'minecraft:stone');
  assert.equal(getVoxel(model, 4, 0, 3), 'minecraft:stone');
});
```

- [ ] **Passo 2: Verificar falha**

```bash
npm test
```

Esperado: testes do tools falham — módulo não existe.

- [ ] **Passo 3: Implementar `tools.js`**

`src/tools.js`:

```javascript
import { getVoxel, setVoxel, assertInBounds } from './model.js';

const AIR = 'minecraft:air';

export function createTools(model, onChange = () => {}) {
  let activeTool = 'build';
  let activeBlock = 'minecraft:stone';
  let strokeOpen = false;
  let strokeChanges = [];      // [{x,y,z,prevId,nextId}]
  let strokeTouched = new Set();

  function setTool(name) {
    if (!['build', 'erase', 'paint', 'fill'].includes(name)) throw new Error(`unknown tool: ${name}`);
    activeTool = name;
  }
  function setBlock(id) { activeBlock = id; }
  function getTool() { return activeTool; }
  function getBlock() { return activeBlock; }

  function startStroke() { strokeOpen = true; strokeChanges = []; strokeTouched = new Set(); }
  function endStroke() {
    strokeOpen = false;
    const out = strokeChanges;
    strokeChanges = [];
    strokeTouched = new Set();
    return out;
  }

  // target = { kind:'floor'|'voxel', voxel?, normal?, ghostVoxel }
  function applyAt(target) {
    if (!target) return [];
    const changes = [];
    switch (activeTool) {
      case 'build': {
        const [x, y, z] = target.ghostVoxel;
        commitChange(x, y, z, activeBlock, changes);
        break;
      }
      case 'erase': {
        if (target.kind !== 'voxel') break;
        const [x, y, z] = target.voxel;
        commitChange(x, y, z, AIR, changes);
        break;
      }
      case 'paint': {
        if (target.kind !== 'voxel') break;
        const [x, y, z] = target.voxel;
        commitChange(x, y, z, activeBlock, changes);
        break;
      }
      case 'fill': {
        if (target.kind !== 'voxel') {
          // No chão, "encher" significa preencher área conectada de ar na camada Y=0.
          const [gx, gy, gz] = target.ghostVoxel;
          floodFill(gx, gy, gz, AIR, activeBlock, changes);
        } else {
          const [x, y, z] = target.voxel;
          floodFill(x, y, z, getVoxel(model, x, y, z), activeBlock, changes);
        }
        break;
      }
    }
    if (changes.length) onChange(changes);
    return changes;
  }

  function commitChange(x, y, z, nextId, sink) {
    try { assertInBounds(model, x, y, z); } catch { return; }
    if (strokeOpen) {
      const key = (x << 12) | (y << 6) | z;
      if (strokeTouched.has(key)) return;
      strokeTouched.add(key);
    }
    const prevId = getVoxel(model, x, y, z);
    if (prevId === nextId) return;
    setVoxel(model, x, y, z, nextId);
    const change = { x, y, z, prevId, nextId };
    sink.push(change);
    if (strokeOpen) strokeChanges.push(change);
  }

  function floodFill(sx, sy, sz, matchId, nextId, sink) {
    if (matchId === nextId) return;
    const queue = [[sx, sy, sz]];
    const seen = new Set();
    while (queue.length) {
      const [x, y, z] = queue.pop();
      const key = (x << 12) | (y << 6) | z;
      if (seen.has(key)) continue;
      seen.add(key);
      try { assertInBounds(model, x, y, z); } catch { continue; }
      if (getVoxel(model, x, y, z) !== matchId) continue;
      commitChange(x, y, z, nextId, sink);
      // Vizinhos só na mesma camada Y
      queue.push([x + 1, y, z], [x - 1, y, z], [x, y, z + 1], [x, y, z - 1]);
    }
  }

  return { setTool, getTool, setBlock, getBlock, applyAt, startStroke, endStroke };
}
```

- [ ] **Passo 4: Verificar passagem**

```bash
npm test
```

Esperado: 6 testes do tools passam.

- [ ] **Passo 5: Commit**

```bash
git add src/tools.js tests/tools.test.js
git commit -m "feat: active tool model with build/erase/paint/fill + drag stroke"
```

---

## Tarefa 9 · Cubinho fantasma (preview Three.js)

**Files:**
- Modify: `src/scene.js` (expor helpers para o ghost mesh)
- Create: `src/ghost.js`

- [ ] **Passo 1: Implementar `ghost.js`**

`src/ghost.js`:

```javascript
import * as THREE from 'three';
import { buildThreeTexture } from './textures.js';
import { BLOCK_BY_ID } from './blocks.js';

export function createGhost(scene) {
  const geo = new THREE.BoxGeometry(1.001, 1.001, 1.001); // ligeiramente maior para evitar z-fighting
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
    if (!block) { mesh.visible = false; return; }
    if (currentTextureKey !== blockId) {
      mat.map?.dispose();
      mat.map = buildThreeTexture(THREE, block.color);
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

- [ ] **Passo 2: Smoke-test integrado**

`scratch-ghost.html`:

```html
<!doctype html>
<style>html,body{margin:0;height:100%}canvas{width:100vw;height:100vh;display:block}</style>
<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.164.0/build/three.module.js"}}</script>
<canvas id="c"></canvas>
<script type="module">
  import * as THREE from 'three';
  import { createScene } from './src/scene.js';
  import { createControls } from './src/controls.js';
  import { createVoxelMeshes } from './src/voxel-mesh.js';
  import { createGhost } from './src/ghost.js';
  import { castRay } from './src/raycaster.js';
  import { createModel, setVoxel } from './src/model.js';

  const canvas = document.getElementById('c');
  const { scene, camera } = createScene(canvas);
  const model = createModel();
  for (let x=12;x<20;x++) for (let z=12;z<20;z++) setVoxel(model,x,0,z,'minecraft:grass_block');
  const meshes = createVoxelMeshes(scene); meshes.rebuild(model);
  const ghost = createGhost(scene);
  createControls(camera, canvas);

  const mouse = new THREE.Vector2();
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    const hit = castRay(model, { origin: ray.ray.origin.toArray(), dir: ray.ray.direction.toArray() });
    if (!hit) return ghost.hide();
    ghost.showBuild('minecraft:gold_block', hit.ghostVoxel);
  });
</script>
```

`npm start` → abrir, mover o rato sobre a relva: o cubinho dourado fantasma deve seguir o cursor numa face acima da relva.

- [ ] **Passo 3: Apagar scratch**

```bash
rm scratch-ghost.html
```

- [ ] **Passo 4: Commit**

```bash
git add src/ghost.js
git commit -m "feat: translucent ghost preview with erase variant"
```

---

## Tarefa 10 · `index.html` + `styles.css` (layout novo)

**Files:**
- Modify: `index.html` (substitui `<body>` inteiro)
- Modify: `styles.css` (substitui)

- [ ] **Passo 1: Reescrever `index.html`**

Substituir o `<body>` actual por:

```html
<body>
  <header class="topbar">
    <div class="brand">
      <span class="brand-mark">🧱</span>
      <span class="brand-name">Cubinhos 3D</span>
    </div>
    <div class="topbar-actions">
      <button id="loadLocal" type="button">Abrir</button>
      <button id="saveLocal" type="button">Guardar</button>
      <label class="file-button">Abrir .mcstructure
        <input id="openProject" type="file" accept=".mcstructure,application/octet-stream">
      </label>
      <button id="downloadProject" type="button">Descarregar .mcstructure</button>
      <button id="exportStructure" class="primary" type="button">Usar no Minecraft</button>
    </div>
  </header>

  <div class="workspace">
    <aside class="left-rail" aria-label="Ferramentas">
      <button class="tool active" data-tool="build" aria-label="Construir (1)" title="Construir (1)">🧱</button>
      <button class="tool" data-tool="erase" aria-label="Apagar (2)" title="Apagar (2)">🧽</button>
      <button class="tool" data-tool="paint" aria-label="Pintar (3)" title="Pintar (3)">💧</button>
      <button class="tool" data-tool="fill"  aria-label="Encher camada (4)" title="Encher camada (4)">🪣</button>
      <div class="rail-divider"></div>
      <button class="tool" id="undoBtn" aria-label="Desfazer (Ctrl+Z)" title="Desfazer">↶</button>
      <button class="tool" id="redoBtn" aria-label="Refazer (Ctrl+Shift+Z)" title="Refazer">↷</button>
    </aside>

    <main class="canvas-host">
      <canvas id="canvas3d" aria-label="Cena 3D de construção"></canvas>
      <div id="viewcubeHost"></div>
      <div class="palette-drawer" id="paletteDrawer" data-state="open">
        <button class="palette-toggle" id="paletteToggle" aria-label="Mostrar/esconder paleta">▾</button>
        <div class="palette-strip" id="paletteStrip" role="list"></div>
        <button class="palette-more" id="paletteMore" aria-label="Mostrar todos os blocos">▾ mais</button>
      </div>
      <div class="palette-full hidden" id="paletteFull" role="dialog" aria-label="Todos os blocos"></div>
    </main>
  </div>

  <p id="status" class="status" role="status" aria-live="polite"></p>

  <script type="module" src="./src/app.js"></script>
</body>
```

- [ ] **Passo 2: Reescrever `styles.css`**

Substituir o conteúdo de `styles.css` por:

```css
:root {
  --bg: #f4f6fb;
  --panel: #ffffff;
  --ink: #1d1d1d;
  --muted: #5a6470;
  --accent: #ffd66e;
  --primary: #ff8a3d;
  --line: #e6e9ef;
  --shadow: 0 6px 18px rgba(0,0,0,.08);
  --rounded: 12px;
  --rail: 64px;
}

* { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--ink);
  background: var(--bg);
  display: flex;
  flex-direction: column;
}

h1, h2, h3, .brand-name { font-family: "Fredoka", system-ui, sans-serif; font-weight: 600; }

.topbar {
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: var(--panel);
  border-bottom: 1px solid var(--line);
  gap: 12px;
}
.brand { display: flex; align-items: center; gap: 8px; font-size: 16px; }
.brand-mark { font-size: 22px; }
.topbar-actions { margin-left: auto; display: flex; gap: 6px; align-items: center; }
.topbar-actions button, .file-button {
  font: inherit; font-size: 13px;
  padding: 6px 12px; border-radius: 8px;
  border: 1px solid var(--line); background: #fafafa; color: var(--ink);
  cursor: pointer;
}
.topbar-actions .primary { background: var(--primary); color: #fff; border-color: transparent; font-weight: 600; }
.file-button input { display: none; }

.workspace { flex: 1; display: flex; min-height: 0; }
.left-rail {
  width: var(--rail);
  background: var(--panel);
  border-right: 1px solid var(--line);
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 0; gap: 8px;
}
.left-rail .tool {
  width: 48px; height: 48px;
  border-radius: 12px; border: none;
  background: #f3f3f3; font-size: 22px; cursor: pointer;
  display: grid; place-items: center;
  transition: transform .15s, background .15s;
}
.left-rail .tool:hover { background: #ececec; }
.left-rail .tool.active { background: var(--accent); transform: scale(1.04); box-shadow: var(--shadow); }
.rail-divider { width: 32px; height: 1px; background: var(--line); margin: 6px 0; }

.canvas-host { flex: 1; position: relative; overflow: hidden; }
#canvas3d { width: 100%; height: 100%; display: block; touch-action: none; }

#viewcubeHost { position: absolute; top: 10px; right: 10px; z-index: 5; }
.viewcube { display: flex; flex-direction: column; align-items: center; gap: 4px; user-select: none; }
.viewcube button {
  font: inherit; font-size: 11px; font-weight: 600;
  width: 60px; padding: 6px 0;
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 8px; cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,.08);
}
.viewcube .viewcube-row { display: flex; gap: 4px; }
.viewcube .viewcube-row button { width: 56px; }
.viewcube-arrows { display: flex; gap: 4px; margin-top: 4px; }
.viewcube-arrows button { width: 30px; font-size: 14px; }
.viewcube .home { width: 42px; height: 42px; border-radius: 50%; font-size: 20px; padding: 0; }

.palette-drawer {
  position: absolute; left: 50%; transform: translateX(-50%);
  bottom: 12px; z-index: 4;
  background: var(--panel); border-radius: var(--rounded);
  padding: 8px 10px; box-shadow: var(--shadow);
  display: flex; align-items: center; gap: 6px;
  max-width: calc(100% - 24px);
}
.palette-drawer[data-state="closed"] .palette-strip,
.palette-drawer[data-state="closed"] .palette-more { display: none; }
.palette-drawer[data-state="closed"] .palette-toggle { transform: rotate(180deg); }
.palette-toggle {
  width: 28px; height: 28px; border: none; background: transparent; cursor: pointer; font-size: 14px;
}
.palette-strip { display: flex; gap: 6px; overflow-x: auto; max-width: 70vw; }
.palette-strip .swatch {
  width: 44px; height: 44px; border-radius: 8px; border: none; cursor: pointer;
  background-size: cover; image-rendering: pixelated;
  position: relative;
}
.palette-strip .swatch.active { outline: 3px solid var(--accent); outline-offset: 2px; }
.palette-more { font: inherit; font-size: 12px; padding: 6px 10px; border-radius: 8px; border: 1px dashed #ccc; background: #fafafa; cursor: pointer; }

.palette-full {
  position: absolute; left: 12px; right: 12px; bottom: 80px; z-index: 6;
  background: var(--panel); border-radius: var(--rounded); box-shadow: var(--shadow);
  max-height: 60vh; overflow: auto; padding: 14px;
}
.palette-full.hidden { display: none; }
.palette-full h3 { margin: 12px 0 6px; font-size: 14px; color: var(--muted); }
.palette-full .grid { display: grid; grid-template-columns: repeat(auto-fill, 44px); gap: 6px; }
.palette-full .swatch { width: 44px; height: 44px; border-radius: 8px; border: none; cursor: pointer; image-rendering: pixelated; background-size: cover; }
.palette-full .swatch.active { outline: 3px solid var(--accent); outline-offset: 2px; }

.status {
  position: absolute; bottom: 6px; right: 12px;
  margin: 0; font-size: 12px; color: var(--muted);
  background: rgba(255,255,255,.85); padding: 4px 10px; border-radius: 6px;
}

@keyframes pop { 0% { transform: scale(.92);} 100% { transform: scale(1);} }
.left-rail .tool.active { animation: pop .15s; }
```

- [ ] **Passo 3: Verificação visual rápida (estará vazio sem app.js a ligar)**

Saltar para a Tarefa 11 — só faz sentido testar com `app.js` a orquestrar.

- [ ] **Passo 4: Commit**

```bash
git add index.html styles.css
git commit -m "feat: new layout with thin topbar, left rail, palette drawer"
```

---

## Tarefa 11 · `app.js` orquestrador

**Files:**
- Rewrite: `src/app.js`

`app.js` agora é fino: cria scene, voxel-mesh, controls, ghost, tools; liga input do canvas → raycaster → tools; liga botões da UI → tools; liga botões de ficheiro → mcstructure (mantendo lógica original).

- [ ] **Passo 1: Substituir `src/app.js`**

```javascript
import * as THREE from 'three';
import { createScene } from './scene.js';
import { createVoxelMeshes } from './voxel-mesh.js';
import { createControls, attachViewCube } from './controls.js';
import { createGhost } from './ghost.js';
import { castRay } from './raycaster.js';
import { createTools } from './tools.js';
import { createModel, createHistory, copyCells, deserializeModel, serializeModel } from './model.js';
import { encodeMcStructure, decodeMcStructure } from './mcstructure.js';
import { paletteBlocks, BLOCK_BY_ID } from './blocks.js';
import { buildThreeTexture } from './textures.js';

const STORAGE_KEY = 'cubinhos3d:project';

const canvas = document.getElementById('canvas3d');
const model = createModel();
const history = createHistory(model);

const sceneCtx = createScene(canvas);
const meshes = createVoxelMeshes(sceneCtx.scene);
const ghost = createGhost(sceneCtx.scene);
const controls = createControls(sceneCtx.camera, canvas);
attachViewCube(controls, document.getElementById('viewcubeHost'));

const tools = createTools(model, (changes) => {
  for (const c of changes) meshes.setVoxel(c.prevId, c.nextId, c.x, c.y, c.z);
});

let activeBlockId = 'minecraft:grass_block';
tools.setBlock(activeBlockId);

renderPalette();
meshes.rebuild(model);

// ----- Input do canvas -----
const ndc = new THREE.Vector2();
const ray = new THREE.Raycaster();

function pointerToTarget(e) {
  const rect = canvas.getBoundingClientRect();
  ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  ray.setFromCamera(ndc, sceneCtx.camera);
  return castRay(model, { origin: ray.ray.origin.toArray(), dir: ray.ray.direction.toArray() });
}

canvas.addEventListener('pointermove', (e) => {
  const target = pointerToTarget(e);
  if (!target) return ghost.hide();
  if (tools.getTool() === 'erase' && target.kind === 'voxel') ghost.showErase(target.voxel);
  else if (target.ghostVoxel) ghost.showBuild(activeBlockId, target.ghostVoxel);
  else ghost.hide();
});

let painting = false;
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return; // só esquerdo constrói
  painting = true;
  tools.startStroke();
  const target = pointerToTarget(e);
  if (target) {
    tools.applyAt(target);
    saveLocal();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!painting) return;
  const target = pointerToTarget(e);
  if (target) tools.applyAt(target);
});
canvas.addEventListener('pointerup', (e) => {
  if (e.button !== 0 || !painting) return;
  painting = false;
  const changes = tools.endStroke();
  if (changes.length) { history.commit(model); saveLocal(); }
});

// ----- Botões de ferramenta -----
document.querySelectorAll('.left-rail .tool[data-tool]').forEach((btn) => {
  btn.addEventListener('click', () => activateTool(btn.dataset.tool));
});
window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea')) return;
  if (e.key === '1') activateTool('build');
  else if (e.key === '2') activateTool('erase');
  else if (e.key === '3') activateTool('paint');
  else if (e.key === '4') activateTool('fill');
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { undo(); e.preventDefault(); }
  else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key.toLowerCase() === 'z')) { redo(); e.preventDefault(); }
});
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);

function activateTool(name) {
  tools.setTool(name);
  document.querySelectorAll('.left-rail .tool[data-tool]').forEach((b) => {
    b.classList.toggle('active', b.dataset.tool === name);
  });
}

function undo() { if (history.undo(model)) { meshes.rebuild(model); saveLocal(); } }
function redo() { if (history.redo(model)) { meshes.rebuild(model); saveLocal(); } }

// ----- Paleta -----
function renderPalette() {
  const strip = document.getElementById('paletteStrip');
  const popular = ['minecraft:grass_block','minecraft:dirt','minecraft:stone','minecraft:oak_planks',
                   'minecraft:cobblestone','minecraft:sand','minecraft:white_concrete','minecraft:gold_block'];
  strip.innerHTML = '';
  for (const id of popular) strip.appendChild(makeSwatch(id));

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
    for (const block of list) grid.appendChild(makeSwatch(block.id));
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

function makeSwatch(blockId) {
  const block = BLOCK_BY_ID[blockId];
  const btn = document.createElement('button');
  btn.className = 'swatch';
  btn.dataset.blockId = blockId;
  btn.title = block.name;
  btn.style.background = block.color; // fallback
  btn.style.backgroundImage = swatchDataUrl(block.color);
  if (blockId === activeBlockId) btn.classList.add('active');
  btn.addEventListener('click', () => {
    activeBlockId = blockId;
    tools.setBlock(blockId);
    document.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('active', s.dataset.blockId === blockId));
  });
  return btn;
}

const swatchCache = new Map();
function swatchDataUrl(hex) {
  if (swatchCache.has(hex)) return swatchCache.get(hex);
  const tex = buildThreeTexture(THREE, hex);
  const c = document.createElement('canvas'); c.width = 16; c.height = 16;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(16, 16);
  img.data.set(tex.image.data);
  ctx.putImageData(img, 0, 0);
  const url = `url("${c.toDataURL()}")`;
  swatchCache.set(hex, url);
  return url;
}

// ----- Ficheiro -----
function saveLocal() {
  try { localStorage.setItem(STORAGE_KEY, serializeModel(model)); } catch {}
}
function loadLocal() {
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
document.getElementById('saveLocal').addEventListener('click', saveLocal);
document.getElementById('loadLocal').addEventListener('click', () => {
  if (loadLocal()) status('Projecto carregado do browser.');
});
document.getElementById('downloadProject').addEventListener('click', () => {
  downloadBlob(encodeMcStructure(model), 'cubinhos-3d.mcstructure');
});
document.getElementById('exportStructure').addEventListener('click', () => {
  downloadBlob(encodeMcStructure(model), 'cubinhos-3d.mcstructure');
  status('Ficheiro pronto. Abre o Structure Block no Minecraft Education.');
});
document.getElementById('openProject').addEventListener('change', async (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  const buf = await file.arrayBuffer();
  try {
    const { model: imported } = decodeMcStructure(new Uint8Array(buf));
    model.cells = imported.cells; model.size = imported.size;
    history.reset(model);
    meshes.rebuild(model);
    saveLocal();
    status('Importado.');
  } catch (err) {
    status('Falha ao importar: ' + err.message);
  }
  e.target.value = '';
});

function downloadBlob(bytes, name) {
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
function status(msg) {
  const el = document.getElementById('status');
  el.textContent = msg;
  setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 3500);
}

// Carregamento inicial
loadLocal();
```

> **Nota sobre `mcstructure.js`:** este plano assume que `encodeMcStructure(model)` e `decodeMcStructure(bytes)` existem com estas assinaturas. Se as actuais forem ligeiramente diferentes (ver `src/mcstructure.js`), ajustar a chamada — mas não tocar na lógica do módulo.

- [ ] **Passo 2: Smoke-test integrado no browser**

```bash
npm start
```

Abrir `http://localhost:8000`. Verificar manualmente, marcando cada uma:
- [ ] Vê o canvas grande, plataforma azul-pastel, caixa tracejada.
- [ ] Botão direito + arrastar roda a câmara.
- [ ] Roda do rato faz zoom.
- [ ] ViewCube no canto: clicar "CIMA" salta para vista de cima; ⟲ ⟳ rodam 45°; 🏠 repõe.
- [ ] Tecla Espaço repõe vista.
- [ ] Paleta em baixo mostra 8 blocos populares; ▾ "mais" abre painel completo organizado por categorias.
- [ ] Selecionar um bloco destaca-o a amarelo.
- [ ] Cubinho fantasma aparece sobre faces ao mover o rato.
- [ ] Clique esquerdo coloca bloco; arrastar pinta fila.
- [ ] Trocar para 🧽 e clicar apaga; o ghost passa a aro vermelho.
- [ ] Trocar para 💧 e clicar substitui o tipo do bloco.
- [ ] Trocar para 🪣 e clicar preenche fila contígua na mesma camada.
- [ ] Atalhos `1` `2` `3` `4` mudam ferramenta.
- [ ] Ctrl+Z desfaz, Ctrl+Shift+Z refaz; ↶ ↷ na lateral fazem o mesmo.
- [ ] Guardar/Abrir no browser preserva a maquete.
- [ ] Descarregar `.mcstructure` produz ficheiro; reabrir o mesmo carrega de volta.

- [ ] **Passo 3: Commit**

```bash
git add src/app.js
git commit -m "feat: app.js as orchestrator wiring scene/tools/UI/file IO"
```

---

## Tarefa 12 · Limpar restos

**Files:**
- Delete: `src/isometric.js`

- [ ] **Passo 1: Verificar que ninguém importa `isometric.js`**

```bash
grep -rn "isometric" src/ index.html
```

Esperado: nenhum resultado (ou só comentários).

- [ ] **Passo 2: Apagar**

```bash
rm src/isometric.js
```

- [ ] **Passo 3: Correr testes**

```bash
npm test
```

Esperado: todos passam.

- [ ] **Passo 4: Commit**

```bash
git add -A
git commit -m "chore: remove legacy isometric 2d renderer"
```

---

## Tarefa 13 · README + verificação final

**Files:**
- Modify: `README.md`

- [ ] **Passo 1: Actualizar `README.md`**

Substituir as secções "Como usar" e "Escopo atual" por:

```markdown
## Como usar

1. Abre `index.html` ou publica este repositório no GitHub Pages.
2. Escolhe uma ferramenta na lateral esquerda: 🧱 Construir · 🧽 Apagar · 💧 Pintar · 🪣 Encher (atalhos `1` `2` `3` `4`).
3. Escolhe um bloco na paleta em baixo. ▾ "mais" mostra todos por categoria.
4. **Botão esquerdo** numa face do canvas aplica a ferramenta. Arrastar pinta em fila.
5. **Botão direito + arrastar** roda a câmara à volta da maquete. **Roda do rato** faz zoom.
6. ViewCube no canto direito salta para vistas alinhadas. ⟲ ⟳ rodam 45°. 🏠 (ou Espaço) repõe.
7. **Guardar / Abrir** mantém o projecto no browser. **Descarregar .mcstructure** exporta para Minecraft Education.

## Escopo actual

Incluído:
- editor 3D real (Three.js) com câmara orbital tipo Tinkercad;
- ferramentas activas tipo Minecraft Education (clique único + drag-paint);
- ViewCube + setas + 🏠 + bússola na plataforma + caixa de limites tracejada;
- texturas pixel-art procedurais por cor de bloco (16×16 com NearestFilter);
- paleta organizada por famílias, com 8 populares sempre visíveis e gaveta para todos;
- guardar/abrir no browser e como `.mcstructure`.

Fora de escopo (sem alterações desde versão anterior):
- multiplayer, contas, base de dados;
- inventário completo, redstone, entidades, mobs, NBT avançado;
- WASD, física, gravidade, andar dentro do mundo;
- texturas Minecraft oficiais (copyright — usamos procedurais);
- tablets/toque (próxima fase).
```

- [ ] **Passo 2: Correr `npm test` final**

```bash
npm test
```

Esperado: todos os testes passam.

- [ ] **Passo 3: Verificação visual final completa**

`npm start` → repetir checklist da Tarefa 11 Passo 2 num ecrã 1366×768 (resize a janela do browser para confirmar que o canvas continua >75% da altura útil).

- [ ] **Passo 4: Commit final**

```bash
git add README.md
git commit -m "docs: update README for new 3D editor"
```

---

## Auto-revisão (cobertura do spec)

| Requisito do spec | Tarefa(s) | Notas |
|---|---|---|
| Three.js via ESM/CDN, sem build | T1 | Importmap fixo em 0.164.0 |
| Modelo de dados intacto | — | `model.js` não é tocado |
| Câmara orbital botão direito + roda | T6 | Em `controls.js` |
| Pan Shift+RMB | T6 | **Lacuna**: não implementado neste plano. Ver nota abaixo. |
| ViewCube com 6 faces + arestas | T7 | Arestas (vistas isométricas entre 2 faces) **não** estão como botões clicáveis no overlay HTML; só temos as 5 vistas Frente/Atrás/Cima/Esq/Dir. Aceitável para 1.º ciclo; arestas cobertas pelas setas ⟲⟳. |
| Setas ⟲⟳ rodam 45° | T7 | ✓ |
| Botão 🏠 + atalho Espaço | T7 | ✓ |
| Plataforma azul-pastel + grelha + bússola N/S/E/O | T3 | **Lacuna**: bússola N/S/E/O nas margens não está. Ver nota. |
| Caixa de limites 32³ tracejada | T3 | ✓ |
| Ferramentas 🧱🧽💧🪣 com atalhos 1-4 | T8, T11 | ✓ |
| Click esquerdo aplica + drag-paint | T8, T11 | ✓ |
| Cubinho fantasma + variante apagar | T9 | ✓ |
| Texturas 16×16 pixel-art | T2 | Procedurais, com hook documentado |
| Plataforma de chão para primeiro bloco | T5, T8 | Hit "floor" devolve ghostVoxel em y=0 |
| Cabeçalho fino 44px | T10 | ✓ |
| Lateral 64px + 48×48 botões | T10 | ✓ |
| Paleta gaveta + ▾ mais | T10, T11 | ✓ |
| Animação pop ao seleccionar | T10 | CSS keyframe `pop` |
| Tipografia Fredoka | T1, T10 | ✓ |
| `aria-label` em todos os botões | T7, T10 | ✓ |
| Atalhos teclado 1-4, Espaço, Ctrl+Z | T7, T11 | ✓ |
| Toggle "modo cores chapadas" | — | **Lacuna**: não implementado. Ver nota. |
| Remover `isometric.js` | T12 | ✓ |
| `app.js` ≤200 linhas | T11 | Plano aproxima ~210 linhas, aceitável |
| Performance 32K instâncias | T4 | InstancedMesh + raycaster próprio |
| Migração `.mcstructure` | T11 | Mesma camada de dados |
| Testes existentes continuam | T12 | Verificado final |
| Novos testes raycaster + tools | T5, T8 | ✓ |

**Lacunas conscientes (3):**

1. **Pan Shift+RMB** — fora do escopo principal (era marcado "avançado/não documentado"). Adicionar mais tarde como follow-up curto.
2. **Letras N/S/E/O nas margens da plataforma** — visualmente desejável mas custo HTML/SVG não trivial. Deferred: o ViewCube já dá orientação, nesta primeira entrega chega.
3. **Toggle "modo cores chapadas"** — ficou no spec como acessibilidade. Adicionar como tarefa-extra (T14) se houver tempo, com switch em `localStorage` que troca o material `MeshLambertMaterial` para `MeshBasicMaterial` com a cor sólida.

Estas três lacunas estão documentadas para ficarem na lista de follow-ups do projecto, não bloqueiam a entrega.

**Verificação de consistência de tipos/assinaturas:**
- `castRay(model, {origin, dir}) → {kind, voxel?, normal?, ghostVoxel, distance} | null` — usado igual em T5, T9, T11 ✓
- `tools.applyAt(target)` aceita target do raycaster — assinatura igual em T8 e T11 ✓
- `meshes.setVoxel(prevId, nextId, x, y, z)` — assinatura igual em T4 e T11 ✓
- `controls.{home, rotateBy, setView, state, apply}` — usado em T6, T7, T11 ✓
- Constantes (`AIR`, `WORLD=32`) consistentes entre módulos ✓

Plano sem placeholders TBD. Todos os passos têm comando, código ou critério de verificação concreto.
