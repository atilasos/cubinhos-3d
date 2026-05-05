import { BLOCKS, blockColor, blockName } from './blocks.js';
import { createModel, setVoxel, getVoxel, fillLayer, serializeModel, deserializeModel, createHistory } from './model.js';
import { downloadMcStructure } from './mcstructure.js';
import { projectIsoCell, screenToIsoCell, rotationLabel } from './isometric.js';

const STORAGE_KEY = 'voxelcraft.project.v1';
const AIR = 'minecraft:air';
let model = createModel();
let history = createHistory(model);
let selectedBlock = BLOCKS.find((block) => !block.empty)?.id ?? 'minecraft:stone';
let tool = 'paint';
let layer = 0;
let view = 'iso';
let buildMode = 'layer';
let isoRotation = 0;
let isoZoom = 1;
let isoCursor = null;
let dragging = false;

const el = {
  palette: document.querySelector('#palette'),
  grid: document.querySelector('#grid'),
  layer: document.querySelector('#layer'),
  layerValue: document.querySelector('#layerValue'),
  preview: document.querySelector('#preview'),
  status: document.querySelector('#status'),
  modeLayer: document.querySelector('#modeLayer'),
  modeIso: document.querySelector('#modeIso'),
  layerWorkspace: document.querySelector('#layerWorkspace'),
  isoWorkspace: document.querySelector('#isoWorkspace'),
  isoBuilder: document.querySelector('#isoBuilder'),
  layerMap: document.querySelector('#layerMap'),
  isoZoom: document.querySelector('#isoZoom'),
  rotateLeft: document.querySelector('#rotateLeft'),
  rotateRight: document.querySelector('#rotateRight'),
  toolPaint: document.querySelector('#toolPaint'),
  toolErase: document.querySelector('#toolErase'),
  fillLayer: document.querySelector('#fillLayer'),
  clearLayer: document.querySelector('#clearLayer'),
  undo: document.querySelector('#undo'),
  redo: document.querySelector('#redo'),
  saveLocal: document.querySelector('#saveLocal'),
  loadLocal: document.querySelector('#loadLocal'),
  downloadProject: document.querySelector('#downloadProject'),
  openProject: document.querySelector('#openProject'),
  exportStructure: document.querySelector('#exportStructure'),
};

function setStatus(message) {
  el.status.textContent = message;
}

function renderPalette() {
  el.palette.replaceChildren(...BLOCKS.filter((block) => !block.empty).map((block) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `swatch${block.id === selectedBlock ? ' active' : ''}`;
    const chip = document.createElement('span');
    chip.className = 'color-chip';
    chip.style.background = block.color;
    const label = document.createElement('span');
    label.textContent = block.name;
    button.append(chip, label);
    button.title = block.id;
    button.addEventListener('click', () => {
      selectedBlock = block.id;
      renderPalette();
      setStatus(`Bloco escolhido: ${block.name}.`);
    });
    return button;
  }));
}

function renderGrid() {
  el.layerValue.textContent = String(layer);
  el.layer.value = String(layer);
  const cells = [];
  for (let z = 0; z < model.size.z; z += 1) {
    for (let x = 0; x < model.size.x; x += 1) {
      const block = getVoxel(model, x, layer, z);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cell';
      button.dataset.x = String(x);
      button.dataset.z = String(z);
      button.style.background = block === AIR ? '#f8fafc' : blockColor(block);
      button.title = `x ${x}, y ${layer}, z ${z}: ${blockName(block)}`;
      button.addEventListener('pointerdown', (event) => {
        dragging = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        editCell(x, z, true);
      });
      button.addEventListener('pointerenter', () => {
        if (dragging) editCell(x, z, false);
      });
      button.addEventListener('pointerup', () => { dragging = false; });
      cells.push(button);
    }
  }
  el.grid.replaceChildren(...cells);
}

function editCell(x, z, commit) {
  const block = tool === 'erase' ? AIR : selectedBlock;
  if (getVoxel(model, x, layer, z) === block) return;
  setVoxel(model, x, layer, z, block);
  if (commit) history.commit(model);
  renderEditedViews();
}

function setTool(nextTool) {
  tool = nextTool;
  el.toolPaint.classList.toggle('active', tool === 'paint');
  el.toolErase.classList.toggle('active', tool === 'erase');
  setStatus(tool === 'paint' ? 'Ferramenta: colocar blocos.' : 'Ferramenta: apagar blocos.');
}

function setBuildMode(nextMode) {
  buildMode = nextMode;
  el.modeLayer.classList.toggle('active', buildMode === 'layer');
  el.modeIso.classList.toggle('active', buildMode === 'iso');
  el.layerWorkspace.classList.toggle('hidden', buildMode !== 'layer');
  el.isoWorkspace.classList.toggle('hidden', buildMode !== 'iso');
  renderAllViews();
  setStatus(buildMode === 'iso'
    ? 'Modo isométrico: constrói na camada atual com rotação e zoom.'
    : 'Modo camadas: constrói na grelha 2D da camada atual.');
}

function projectionOptions(canvas) {
  return {
    size: { x: model.size.x, z: model.size.z },
    rotation: isoRotation,
    zoom: isoZoom,
    originX: canvas.width / 2,
    originY: 48,
    cellWidth: 18,
    cellHeight: 10,
  };
}

function renderIsoBuilder() {
  if (!el.isoBuilder) return;
  const canvas = el.isoBuilder;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawIsoLayerGrid(ctx, canvas);
  drawIsoBlocks(ctx, canvas, { focusLayer: true });
  ctx.fillStyle = '#334155';
  ctx.font = '16px system-ui';
  ctx.fillText(`Modo isométrico • camada ${layer} • vista ${rotationLabel(isoRotation)} • zoom ${isoZoom.toFixed(1)}×`, 18, canvas.height - 18);
}

function drawIsoLayerGrid(ctx, canvas) {
  const options = projectionOptions(canvas);
  for (let x = 0; x < model.size.x; x += 1) {
    for (let z = 0; z < model.size.z; z += 1) {
      const point = projectIsoCell(x, z, options);
      drawDiamond(ctx, point.cx, point.cy + layer * -1.5 * isoZoom, 9 * isoZoom, 5 * isoZoom, '#ffffff', 'rgba(37,99,235,.14)');
    }
  }
  if (isoCursor) {
    const point = projectIsoCell(isoCursor.x, isoCursor.z, options);
    drawDiamond(ctx, point.cx, point.cy + layer * -1.5 * isoZoom, 10 * isoZoom, 6 * isoZoom, 'rgba(251,191,36,.42)', '#f59e0b');
  }
}

function drawIsoBlocks(ctx, canvas, { focusLayer = false } = {}) {
  const options = projectionOptions(canvas);
  const cubes = [];
  for (let x = 0; x < model.size.x; x += 1) {
    for (let y = 0; y < model.size.y; y += 1) {
      for (let z = 0; z < model.size.z; z += 1) {
        const block = getVoxel(model, x, y, z);
        if (block !== AIR) cubes.push({ x, y, z, block });
      }
    }
  }
  cubes.sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z));
  for (const cube of cubes) {
    const point = projectIsoCell(cube.x, cube.z, options);
    const alpha = focusLayer && cube.y !== layer ? 0.28 : 1;
    drawIsoBlock(ctx, point.cx, point.cy - cube.y * 7 * isoZoom, cube.block, alpha);
  }
}

function drawDiamond(ctx, cx, cy, halfW, halfH, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - halfH);
  ctx.lineTo(cx + halfW, cy);
  ctx.lineTo(cx, cy + halfH);
  ctx.lineTo(cx - halfW, cy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawIsoBlock(ctx, cx, cy, block, alpha = 1) {
  const w = 9 * isoZoom;
  const h = 5 * isoZoom;
  const height = 8 * isoZoom;
  ctx.save();
  ctx.globalAlpha = alpha;
  drawDiamond(ctx, cx, cy, w, h, blockColor(block), 'rgba(15,23,42,.35)');
  ctx.fillStyle = shade(blockColor(block), -18);
  ctx.beginPath();
  ctx.moveTo(cx - w, cy);
  ctx.lineTo(cx, cy + h);
  ctx.lineTo(cx, cy + h + height);
  ctx.lineTo(cx - w, cy + height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = shade(blockColor(block), -32);
  ctx.beginPath();
  ctx.moveTo(cx + w, cy);
  ctx.lineTo(cx, cy + h);
  ctx.lineTo(cx, cy + h + height);
  ctx.lineTo(cx + w, cy + height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function shade(hex, amount) {
  const clean = hex.replace('#', '');
  const value = Number.parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (value & 0xff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function renderLayerMap() {
  if (!el.layerMap) return;
  const canvas = el.layerMap;
  const ctx = canvas.getContext('2d');
  const cell = canvas.width / model.size.x;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let x = 0; x < model.size.x; x += 1) {
    for (let z = 0; z < model.size.z; z += 1) {
      const block = getVoxel(model, x, layer, z);
      if (block !== AIR) {
        ctx.fillStyle = blockColor(block);
        ctx.fillRect(x * cell, z * cell, cell, cell);
      }
    }
  }
  ctx.strokeStyle = '#cbd5e1';
  for (let i = 0; i <= model.size.x; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, canvas.height);
    ctx.moveTo(0, i * cell);
    ctx.lineTo(canvas.width, i * cell);
    ctx.stroke();
  }
  if (isoCursor) {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(isoCursor.x * cell, isoCursor.z * cell, cell, cell);
    ctx.lineWidth = 1;
  }
  ctx.fillStyle = '#0f172a';
  ctx.font = '14px system-ui';
  ctx.fillText(`Camada ${layer}`, 8, canvas.height - 10);
}

function renderPreview() {
  const canvas = el.preview;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (view === 'iso') {
    drawIsoBlocks(ctx, canvas);
  } else {
    drawFlatPreview(ctx);
  }
  ctx.fillStyle = '#475569';
  ctx.font = '16px system-ui';
  ctx.fillText(`vista ${view} • rotação ${rotationLabel(isoRotation)} • zoom ${isoZoom.toFixed(1)}×`, 18, canvas.height - 18);
}

function drawFlatPreview(ctx) {
  const cubes = [];
  for (let x = 0; x < model.size.x; x += 1) {
    for (let y = 0; y < model.size.y; y += 1) {
      for (let z = 0; z < model.size.z; z += 1) {
        const block = getVoxel(model, x, y, z);
        if (block !== AIR) cubes.push({ x, y, z, block });
      }
    }
  }
  const scale = (view === 'top' ? 10 : 8) * isoZoom;
  for (const cube of cubes) {
    let sx;
    let sy;
    if (view === 'front') {
      sx = (cube.x - 16) * scale + el.preview.width / 2;
      sy = 330 - cube.y * scale;
    } else if (view === 'side') {
      sx = (cube.z - 16) * scale + el.preview.width / 2;
      sy = 330 - cube.y * scale;
    } else {
      sx = (cube.x - 16) * scale + el.preview.width / 2;
      sy = 20 + cube.z * scale;
    }
    ctx.fillStyle = blockColor(cube.block);
    ctx.strokeStyle = 'rgba(15,23,42,.25)';
    ctx.fillRect(sx, sy, scale, scale);
    ctx.strokeRect(sx, sy, scale, scale);
  }
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function loadProjectText(text) {
  model = deserializeModel(text);
  history = createHistory(model);
  layer = 0;
  isoCursor = null;
  renderAll();
  setStatus('Projeto aberto com sucesso.');
}

function renderEditedViews() {
  if (buildMode === 'layer') renderGrid();
  else renderIsoBuilder();
  renderLayerMap();
  renderPreview();
}

function renderAllViews() {
  renderGrid();
  renderIsoBuilder();
  renderLayerMap();
  renderPreview();
}

function renderAll() {
  renderPalette();
  renderAllViews();
}

function canvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function editIsoFromEvent(event, commit) {
  const point = canvasPoint(event, el.isoBuilder);
  const cell = screenToIsoCell(point.x, point.y + layer * 1.5 * isoZoom, projectionOptions(el.isoBuilder));
  if (!cell) {
    isoCursor = null;
    renderIsoBuilder();
    renderLayerMap();
    return;
  }
  isoCursor = cell;
  editCell(cell.x, cell.z, commit);
}

el.layer.addEventListener('input', (event) => {
  layer = Number(event.target.value);
  renderAllViews();
});
el.modeLayer.addEventListener('click', () => setBuildMode('layer'));
el.modeIso.addEventListener('click', () => setBuildMode('iso'));
el.toolPaint.addEventListener('click', () => setTool('paint'));
el.toolErase.addEventListener('click', () => setTool('erase'));
el.fillLayer.addEventListener('click', () => {
  fillLayer(model, layer, selectedBlock);
  history.commit(model);
  renderAllViews();
  setStatus(`Camada ${layer} preenchida com ${blockName(selectedBlock)}.`);
});
el.clearLayer.addEventListener('click', () => {
  fillLayer(model, layer, AIR);
  history.commit(model);
  renderAllViews();
  setStatus(`Camada ${layer} limpa.`);
});
el.undo.addEventListener('click', () => {
  if (history.undo(model)) renderAllViews();
  setStatus('Desfazer aplicado.');
});
el.redo.addEventListener('click', () => {
  if (history.redo(model)) renderAllViews();
  setStatus('Refazer aplicado.');
});
el.saveLocal.addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEY, serializeModel(model));
  setStatus('Projeto guardado neste browser.');
});
el.loadLocal.addEventListener('click', () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return setStatus('Ainda não há projeto guardado neste browser.');
  loadProjectText(saved);
});
el.downloadProject.addEventListener('click', () => {
  downloadText('cubinhos-3d-project.json', serializeModel(model), 'application/json');
  setStatus('Projeto descarregado em JSON.');
});
el.openProject.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  try {
    loadProjectText(await file.text());
  } catch {
    setStatus('Não consegui abrir esse projeto. Confirma se é um ficheiro do Cubinhos 3D.');
  }
  event.target.value = '';
});
el.exportStructure.addEventListener('click', () => {
  downloadMcStructure(model, 'cubinhos-3d.mcstructure');
  setStatus('Ficheiro .mcstructure exportado. Importa-o com Structure Block num ambiente suportado.');
});
el.rotateLeft.addEventListener('click', () => {
  isoRotation = (isoRotation + 3) % 4;
  renderAllViews();
});
el.rotateRight.addEventListener('click', () => {
  isoRotation = (isoRotation + 1) % 4;
  renderAllViews();
});
el.isoZoom.addEventListener('input', (event) => {
  isoZoom = Number(event.target.value);
  renderAllViews();
});
el.isoBuilder.addEventListener('pointerdown', (event) => {
  dragging = true;
  el.isoBuilder.setPointerCapture(event.pointerId);
  editIsoFromEvent(event, true);
});
el.isoBuilder.addEventListener('pointermove', (event) => {
  const point = canvasPoint(event, el.isoBuilder);
  const cell = screenToIsoCell(point.x, point.y + layer * 1.5 * isoZoom, projectionOptions(el.isoBuilder));
  isoCursor = cell;
  if (dragging && cell) editIsoFromEvent(event, false);
  else {
    renderIsoBuilder();
    renderLayerMap();
  }
});
el.isoBuilder.addEventListener('pointerup', () => { dragging = false; });
for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => {
    view = button.dataset.view;
    renderPreview();
  });
}
window.addEventListener('pointerup', () => { dragging = false; });
renderAll();
