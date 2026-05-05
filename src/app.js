import { BLOCKS, blockColor, blockName } from './blocks.js';
import { createModel, setVoxel, getVoxel, fillLayer, serializeModel, deserializeModel, createHistory } from './model.js';
import { downloadMcStructure } from './mcstructure.js';

const STORAGE_KEY = 'voxelcraft.project.v1';
let model = createModel();
let history = createHistory(model);
let selectedBlock = BLOCKS.find((block) => !block.empty)?.id ?? 'minecraft:stone';
let tool = 'paint';
let layer = 0;
let view = 'iso';
let dragging = false;

const el = {
  palette: document.querySelector('#palette'),
  grid: document.querySelector('#grid'),
  layer: document.querySelector('#layer'),
  layerValue: document.querySelector('#layerValue'),
  preview: document.querySelector('#preview'),
  status: document.querySelector('#status'),
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
    button.innerHTML = `<span class="color-chip" style="background:${block.color}"></span><span>${block.name}</span>`;
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
      button.style.background = block === 'minecraft:air' ? '#f8fafc' : blockColor(block);
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
  const block = tool === 'erase' ? 'minecraft:air' : selectedBlock;
  if (getVoxel(model, x, layer, z) === block) return;
  setVoxel(model, x, layer, z, block);
  if (commit) history.commit(model);
  renderGrid();
  renderPreview();
}

function setTool(nextTool) {
  tool = nextTool;
  el.toolPaint.classList.toggle('active', tool === 'paint');
  el.toolErase.classList.toggle('active', tool === 'erase');
  setStatus(tool === 'paint' ? 'Ferramenta: colocar blocos.' : 'Ferramenta: apagar blocos.');
}

function renderPreview() {
  const canvas = el.preview;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, 44);
  const cubes = [];
  for (let x = 0; x < model.size.x; x += 1) {
    for (let y = 0; y < model.size.y; y += 1) {
      for (let z = 0; z < model.size.z; z += 1) {
        const block = getVoxel(model, x, y, z);
        if (block !== 'minecraft:air') cubes.push({ x, y, z, block });
      }
    }
  }
  cubes.sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z));
  for (const cube of cubes) drawCube(ctx, cube);
  ctx.restore();
  ctx.fillStyle = '#475569';
  ctx.font = '16px system-ui';
  ctx.fillText(`${cubes.length} blocos • vista ${view}`, 18, canvas.height - 18);
}

function drawCube(ctx, { x, y, z, block }) {
  const scale = view === 'top' ? 10 : 8;
  let sx;
  let sy;
  if (view === 'front') {
    sx = (x - 16) * scale;
    sy = 330 - y * scale;
  } else if (view === 'side') {
    sx = (z - 16) * scale;
    sy = 330 - y * scale;
  } else if (view === 'top') {
    sx = (x - 16) * scale;
    sy = 20 + z * scale;
  } else {
    sx = (x - z) * scale;
    sy = 260 + (x + z) * scale * 0.42 - y * scale;
  }
  ctx.fillStyle = blockColor(block);
  ctx.strokeStyle = 'rgba(15,23,42,.25)';
  ctx.lineWidth = 1;
  ctx.fillRect(sx, sy, scale, scale);
  ctx.strokeRect(sx, sy, scale, scale);
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
  renderAll();
  setStatus('Projeto aberto com sucesso.');
}

function renderAll() {
  renderPalette();
  renderGrid();
  renderPreview();
}

el.layer.addEventListener('input', (event) => {
  layer = Number(event.target.value);
  renderGrid();
});
el.toolPaint.addEventListener('click', () => setTool('paint'));
el.toolErase.addEventListener('click', () => setTool('erase'));
el.fillLayer.addEventListener('click', () => {
  fillLayer(model, layer, selectedBlock);
  history.commit(model);
  renderAll();
  setStatus(`Camada ${layer} preenchida com ${blockName(selectedBlock)}.`);
});
el.clearLayer.addEventListener('click', () => {
  fillLayer(model, layer, 'minecraft:air');
  history.commit(model);
  renderAll();
  setStatus(`Camada ${layer} limpa.`);
});
el.undo.addEventListener('click', () => {
  if (history.undo(model)) renderAll();
  setStatus('Desfazer aplicado.');
});
el.redo.addEventListener('click', () => {
  if (history.redo(model)) renderAll();
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
  loadProjectText(await file.text());
  event.target.value = '';
});
el.exportStructure.addEventListener('click', () => {
  downloadMcStructure(model, 'cubinhos-3d.mcstructure');
  setStatus('Ficheiro .mcstructure exportado. Importa-o com Structure Block num ambiente suportado.');
});
for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => {
    view = button.dataset.view;
    renderPreview();
  });
}
window.addEventListener('pointerup', () => { dragging = false; });
renderAll();
