import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('static app shell exposes classroom controls and module entrypoint', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /Construtor Voxel/);
  assert.match(html, /id="palette"/);
  assert.match(html, /id="layer"/);
  assert.match(html, /id="layerMax"/);
  assert.match(html, /src="\.\/src\/app\.js"/);
});

test('README documents Minecraft Education import caveat', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /Structure Block/);
  assert.match(readme, /Windows/i);
  assert.match(readme, /\.mcstructure/);
});


test('isometric build mode shell exposes mode toggle, canvas, map, rotation and zoom controls', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="modeLayer"/);
  assert.match(html, /id="modeIso"/);
  assert.match(html, /id="mode3d"/);
  assert.match(html, /id="isoBuilder"/);
  assert.match(html, /id="layerMap"/);
  assert.match(html, /id="isoZoom"/);
  assert.match(html, /id="rotateLeft"/);
  assert.match(html, /id="rotateRight"/);
});

test('README documents the assisted isometric mode', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /modo isométrico assistido/i);
});


test('project file controls use only mcstructure in the visible workflow', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /Descarregar \.mcstructure/);
  assert.match(html, /Abrir \.mcstructure/);
  assert.match(html, /accept="\.mcstructure,application\/octet-stream"/);
  assert.doesNotMatch(html, /application\/json|\.json|JSON/);
});

test('static app shell documents organized Minecraft material families', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /famílias de cores/);
  assert.match(html, /materiais reais do Minecraft/);
});

test('static app shell documents simple 3D face editing', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /Modo 3D/);
  assert.match(html, /face/);
  assert.match(html, /cubinho fantasma/);
});
