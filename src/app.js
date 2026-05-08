import * as THREE from 'three';
import { createScene } from './scene.js';
import { createVoxelMeshes } from './voxel-mesh.js';
import { createControls, attachViewCube } from './controls.js';
import { createGhost } from './ghost.js';
import { castRay } from './raycaster.js';
import { createTools } from './tools.js';
import { createModel, createHistory, deserializeModel, serializeModel } from './model.js';
import { exportMcStructure, importMcStructure, downloadMcStructure } from './mcstructure.js';
import { paletteBlocks, BLOCK_BY_ID } from './blocks.js';
import { buildTextureCanvasData } from './textures.js';

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

const swatchCache = new Map();

renderPalette();
meshes.rebuild(model);

// ----- Canvas input → raycaster → tools/ghost -----
const ndc = new THREE.Vector2();
const ray = new THREE.Raycaster();

function pointerToTarget(e) {
  const rect = canvas.getBoundingClientRect();
  ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  ray.setFromCamera(ndc, sceneCtx.camera);
  return castRay(model, { origin: ray.ray.origin.toArray(), dir: ray.ray.direction.toArray() });
}

let painting = false;

canvas.addEventListener('pointermove', (e) => {
  const target = pointerToTarget(e);
  if (!target) { ghost.hide(); return; }
  if (tools.getTool() === 'erase' && target.kind === 'voxel') ghost.showErase(target.voxel);
  else if (target.ghostVoxel) ghost.showBuild(activeBlockId, target.ghostVoxel);
  else ghost.hide();
  if (painting) {
    if (target) tools.applyAt(target);
  }
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

// ----- Tool buttons -----
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
  else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') { redo(); e.preventDefault(); }
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

// ----- Palette -----
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
  btn.style.background = block.color;
  btn.style.backgroundImage = swatchDataUrl(block.color);
  if (blockId === activeBlockId) btn.classList.add('active');
  btn.addEventListener('click', () => {
    activeBlockId = blockId;
    tools.setBlock(blockId);
    document.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('active', s.dataset.blockId === blockId));
  });
  return btn;
}

function swatchDataUrl(hex) {
  if (swatchCache.has(hex)) return swatchCache.get(hex);
  const data = buildTextureCanvasData(hex); // Uint8ClampedArray length 1024
  const c = document.createElement('canvas'); c.width = 16; c.height = 16;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(16, 16);
  img.data.set(data);
  ctx.putImageData(img, 0, 0);
  const url = `url("${c.toDataURL()}")`;
  swatchCache.set(hex, url);
  return url;
}

// ----- File / storage -----
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

document.getElementById('saveLocal').addEventListener('click', () => {
  saveLocal();
  status('Projecto guardado no browser.');
});
document.getElementById('loadLocal').addEventListener('click', () => {
  if (loadLocal()) status('Projecto carregado do browser.');
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
    model.cells = imported.cells; model.size = imported.size;
    history.reset(model);
    meshes.rebuild(model);
    saveLocal();
    status(warnings && warnings.length ? `Importado com avisos: ${warnings[0]}` : 'Importado.');
  } catch (err) {
    status('Falha ao importar: ' + err.message);
  }
  e.target.value = '';
});

function status(msg) {
  const el = document.getElementById('status');
  el.textContent = msg;
  setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 3500);
}

// Initial load
loadLocal();
