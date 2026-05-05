const DEFAULT_SIZE = Object.freeze({ x: 32, y: 32, z: 32 });
const AIR = 'minecraft:air';

export function createModel(size = DEFAULT_SIZE) {
  const normalized = normalizeSize(size);
  return {
    size: normalized,
    cells: Array(normalized.x * normalized.y * normalized.z).fill(AIR),
  };
}

function normalizeSize(size) {
  const normalized = {
    x: Number(size.x),
    y: Number(size.y),
    z: Number(size.z),
  };
  for (const [axis, value] of Object.entries(normalized)) {
    if (!Number.isInteger(value) || value <= 0 || value > 64) {
      throw new RangeError(`invalid ${axis} size: ${value}`);
    }
  }
  return normalized;
}

export function indexOf(model, x, y, z) {
  assertInBounds(model, x, y, z);
  return x * model.size.y * model.size.z + y * model.size.z + z;
}

export function assertInBounds(model, x, y, z) {
  if (![x, y, z].every(Number.isInteger) || x < 0 || y < 0 || z < 0 || x >= model.size.x || y >= model.size.y || z >= model.size.z) {
    throw new RangeError(`voxel coordinate out of bounds: ${x},${y},${z}`);
  }
}

export function getVoxel(model, x, y, z) {
  return model.cells[indexOf(model, x, y, z)];
}

export function setVoxel(model, x, y, z, blockId) {
  model.cells[indexOf(model, x, y, z)] = blockId || AIR;
  return model;
}

export function fillLayer(model, y, blockId) {
  if (!Number.isInteger(y) || y < 0 || y >= model.size.y) {
    throw new RangeError(`layer out of bounds: ${y}`);
  }
  for (let x = 0; x < model.size.x; x += 1) {
    for (let z = 0; z < model.size.z; z += 1) {
      model.cells[indexOf(model, x, y, z)] = blockId || AIR;
    }
  }
  return model;
}

export function clearModel(model) {
  model.cells.fill(AIR);
  return model;
}

export function serializeModel(model) {
  return JSON.stringify({
    version: 1,
    size: model.size,
    cells: model.cells,
  });
}

export function deserializeModel(json) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  const model = createModel(parsed.size);
  if (!Array.isArray(parsed.cells) || parsed.cells.length !== model.cells.length) {
    throw new Error('project file does not match model dimensions');
  }
  model.cells = parsed.cells.map((cell) => typeof cell === 'string' ? cell : AIR);
  return model;
}

export function copyCells(model) {
  return model.cells.slice();
}

export function createHistory(model, limit = 50) {
  const undoStack = [copyCells(model)];
  const redoStack = [];
  return {
    commit(current) {
      undoStack.push(copyCells(current));
      if (undoStack.length > limit) undoStack.shift();
      redoStack.length = 0;
    },
    undo(current) {
      if (undoStack.length <= 1) return false;
      redoStack.push(undoStack.pop());
      current.cells = copyCells({ cells: undoStack.at(-1) });
      return true;
    },
    redo(current) {
      if (redoStack.length === 0) return false;
      const next = redoStack.pop();
      undoStack.push(next.slice());
      current.cells = next.slice();
      return true;
    },
    reset(current) {
      undoStack.length = 0;
      redoStack.length = 0;
      undoStack.push(copyCells(current));
    },
  };
}
