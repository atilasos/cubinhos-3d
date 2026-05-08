import { getVoxel, setVoxel, assertInBounds } from './model.js';

const AIR = 'minecraft:air';

export function createTools(model, onChange = () => {}) {
  let activeTool = 'build';
  let activeBlock = 'minecraft:stone';
  let strokeOpen = false;
  let strokeChanges = [];
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
      queue.push([x + 1, y, z], [x - 1, y, z], [x, y, z + 1], [x, y, z - 1]);
    }
  }

  return { setTool, getTool, setBlock, getBlock, applyAt, startStroke, endStroke };
}
