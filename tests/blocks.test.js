import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCKS, blockColor, blockName } from '../src/blocks.js';

test('expanded palette is organized by simple categories', () => {
  const usableBlocks = BLOCKS.filter((block) => !block.empty);
  const categories = new Set(usableBlocks.map((block) => block.category));
  assert.ok(usableBlocks.length >= 60);
  for (const category of ['Cores fortes', 'Lãs suaves', 'Vidro e luz', 'Natureza', 'Madeiras', 'Pedra e construção']) {
    assert.ok(categories.has(category), `missing ${category}`);
  }
});

test('fallback labels and colors keep externally imported simple blocks usable', () => {
  assert.equal(blockColor('minecraft:unknown_school_block'), '#94a3b8');
  assert.equal(blockName('minecraft:unknown_school_block'), 'unknown school block');
});
