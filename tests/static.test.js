import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('static app shell exposes classroom controls and module entrypoint', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /Construtor Voxel/);
  assert.match(html, /id="palette"/);
  assert.match(html, /id="layer"/);
  assert.match(html, /src="\.\/src\/app\.js"/);
});

test('README documents Minecraft Education import caveat', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /Structure Block/);
  assert.match(readme, /Windows/i);
  assert.match(readme, /\.mcstructure/);
});
