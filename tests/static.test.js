import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ── index.html ────────────────────────────────────────────────────────────────

test('title contains "Construtor Voxel"', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /Construtor Voxel/);
});

test('Three.js importmap is pinned at 0.164.0', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /three@0\.164\.0/);
});

test('Fredoka Google Font link is present', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /Fredoka/);
});

test('canvas with id "canvas3d" is present', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="canvas3d"/);
});

test('top bar shows brand "Cubinhos 3D"', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /Cubinhos 3D/);
});

test('left rail has data-tool buttons for build, erase, paint, fill', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /data-tool="build"/);
  assert.match(html, /data-tool="erase"/);
  assert.match(html, /data-tool="paint"/);
  assert.match(html, /data-tool="fill"/);
});

test('undo and redo buttons are present', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="undoBtn"/);
  assert.match(html, /id="redoBtn"/);
});

test('file control buttons are present', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="loadLocal"/);
  assert.match(html, /id="saveLocal"/);
  assert.match(html, /id="openProject"/);
  assert.match(html, /id="downloadProject"/);
  assert.match(html, /id="exportStructure"/);
});

test('palette drawer ids are present', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="paletteDrawer"/);
  assert.match(html, /id="paletteToggle"/);
  assert.match(html, /id="paletteStrip"/);
  assert.match(html, /id="paletteMore"/);
  assert.match(html, /id="paletteFull"/);
});

test('viewcubeHost element is present', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="viewcubeHost"/);
});

test('file input accepts .mcstructure', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /accept="\.mcstructure,application\/octet-stream"/);
});

test('HTML does not reference any JSON project format', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /application\/json|\.json|JSON/);
});

test('module script entry point src/app.js is present', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<script type="module" src="\.\/src\/app\.js">/);
});

// ── src/app.js ────────────────────────────────────────────────────────────────

test('app.js imports from "three" (importmap key)', async () => {
  const src = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(src, /from 'three'/);
});

test('app.js calls createScene, createVoxelMeshes, createControls, attachViewCube, createGhost, createTools, castRay', async () => {
  const src = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(src, /createScene/);
  assert.match(src, /createVoxelMeshes/);
  assert.match(src, /createControls/);
  assert.match(src, /attachViewCube/);
  assert.match(src, /createGhost/);
  assert.match(src, /createTools/);
  assert.match(src, /castRay/);
});

test('app.js wires pointermove, pointerdown, pointerup on the canvas', async () => {
  const src = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(src, /addEventListener\('pointermove'/);
  assert.match(src, /addEventListener\('pointerdown'/);
  assert.match(src, /addEventListener\('pointerup'/);
});

test('app.js imports exportMcStructure, importMcStructure, downloadMcStructure from mcstructure', async () => {
  const src = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(src, /exportMcStructure/);
  assert.match(src, /importMcStructure/);
  assert.match(src, /downloadMcStructure/);
  assert.match(src, /mcstructure/);
});

test('app.js has keyboard shortcuts for tools 1, 2, 3, 4', async () => {
  const src = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(src, /'1'/);
  assert.match(src, /'2'/);
  assert.match(src, /'3'/);
  assert.match(src, /'4'/);
});

// ── README.md ────────────────────────────────────────────────────────────────

test('README mentions Structure Block', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /Structure Block/);
});

test('README mentions Windows (case-insensitive)', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /Windows/i);
});

test('README mentions .mcstructure', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /\.mcstructure/);
});

// ── assets/blocks/ atlas PNGs ─────────────────────────────────────────────────

test('atlas PNGs exist in assets/blocks/', async () => {
  for (const name of ['atlas-natural.png', 'atlas-cor.png', 'atlas-especial.png']) {
    const path = new URL(`../assets/blocks/${name}`, import.meta.url);
    const st = await stat(path);
    assert.ok(st.isFile(), `${name} missing`);
    assert.ok(st.size > 0, `${name} is empty`);
  }
});

test('atlas PNGs are tracked in git (will deploy to Pages)', () => {
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
  const tracked = execFileSync('git', ['ls-files', 'assets/blocks/'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n').filter(Boolean);
  for (const name of ['atlas-natural.png', 'atlas-cor.png', 'atlas-especial.png']) {
    assert.ok(
      tracked.includes(`assets/blocks/${name}`),
      `${name} exists on disk but is not git-tracked — won't ship to GitHub Pages`,
    );
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
