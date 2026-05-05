const DEFAULT_CELL_WIDTH = 18;
const DEFAULT_CELL_HEIGHT = 10;

function normalizeRotation(rotation = 0) {
  return ((Math.round(rotation) % 4) + 4) % 4;
}

export function rotatePointXZ(x, z, size, rotation = 0) {
  const turns = normalizeRotation(rotation);
  if (turns === 0) return { x, z };
  if (turns === 1) return { x: size.z - 1 - z, z: x };
  if (turns === 2) return { x: size.x - 1 - x, z: size.z - 1 - z };
  return { x: z, z: size.x - 1 - x };
}

export function unrotatePointXZ(x, z, size, rotation = 0) {
  return rotatePointXZ(x, z, size, 4 - normalizeRotation(rotation));
}

export function projectIsoCell(x, z, options = {}) {
  const {
    size = { x: 32, z: 32 },
    rotation = 0,
    zoom = 1,
    originX = 0,
    originY = 0,
    cellWidth = DEFAULT_CELL_WIDTH,
    cellHeight = DEFAULT_CELL_HEIGHT,
  } = options;
  const rotated = rotatePointXZ(x, z, size, rotation);
  const baseX = (rotated.x - rotated.z) * (cellWidth / 2);
  const baseY = (rotated.x + rotated.z) * (cellHeight / 2);
  return {
    cx: originX + baseX * zoom,
    cy: originY + baseY * zoom,
    rx: rotated.x,
    rz: rotated.z,
  };
}

export function screenToIsoCell(screenX, screenY, options = {}) {
  const {
    size = { x: 32, z: 32 },
    rotation = 0,
    zoom = 1,
    originX = 0,
    originY = 0,
    cellWidth = DEFAULT_CELL_WIDTH,
    cellHeight = DEFAULT_CELL_HEIGHT,
  } = options;
  const dx = (screenX - originX) / zoom;
  const dy = (screenY - originY) / zoom;
  const rx = Math.round((dy / (cellHeight / 2) + dx / (cellWidth / 2)) / 2);
  const rz = Math.round((dy / (cellHeight / 2) - dx / (cellWidth / 2)) / 2);
  const cell = unrotatePointXZ(rx, rz, size, rotation);
  if (cell.x < 0 || cell.z < 0 || cell.x >= size.x || cell.z >= size.z) return null;
  return cell;
}

export function rotationLabel(rotation = 0) {
  return ['frente', 'direita', 'trás', 'esquerda'][normalizeRotation(rotation)];
}
