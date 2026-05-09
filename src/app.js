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
  await loadAtlasImages();

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
