const DEFAULT_CELL_WIDTH = 18;
const DEFAULT_CELL_HEIGHT = 10;
const DEFAULT_BLOCK_HEIGHT = 8;

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

export function projectIsoBlock(x, y, z, options = {}) {
  const {
    zoom = 1,
    blockHeight = DEFAULT_BLOCK_HEIGHT,
  } = options;
  const point = projectIsoCell(x, z, options);
  return {
    ...point,
    topX: point.cx,
    topY: point.cy - y * blockHeight * zoom,
  };
}

export function projectIsoBlockFaces(x, y, z, options = {}) {
  const {
    zoom = 1,
    cellWidth = DEFAULT_CELL_WIDTH,
    cellHeight = DEFAULT_CELL_HEIGHT,
    blockHeight = DEFAULT_BLOCK_HEIGHT,
  } = options;
  const block = projectIsoBlock(x, y, z, options);
  const w = (cellWidth / 2) * zoom;
  const h = (cellHeight / 2) * zoom;
  const height = blockHeight * zoom;
  const top = [
    { x: block.topX, y: block.topY - h },
    { x: block.topX + w, y: block.topY },
    { x: block.topX, y: block.topY + h },
    { x: block.topX - w, y: block.topY },
  ];
  const left = [
    { x: block.topX - w, y: block.topY },
    { x: block.topX, y: block.topY + h },
    { x: block.topX, y: block.topY + h + height },
    { x: block.topX - w, y: block.topY + height },
  ];
  const right = [
    { x: block.topX + w, y: block.topY },
    { x: block.topX, y: block.topY + h },
    { x: block.topX, y: block.topY + h + height },
    { x: block.topX + w, y: block.topY + height },
  ];
  return { top, left, right, center: block };
}

export function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const intersects = ((a.y > point.y) !== (b.y > point.y))
      && (point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x);
    if (intersects) inside = !inside;
  }
  return inside;
}

function rotationDelta(face, rotation = 0) {
  const turns = normalizeRotation(rotation);
  if (face === 'top') return { dx: 0, dy: 1, dz: 0 };
  if (face === 'right') {
    return [
      { dx: 1, dy: 0, dz: 0 },
      { dx: 0, dy: 0, dz: -1 },
      { dx: -1, dy: 0, dz: 0 },
      { dx: 0, dy: 0, dz: 1 },
    ][turns];
  }
  return [
    { dx: 0, dy: 0, dz: 1 },
    { dx: 1, dy: 0, dz: 0 },
    { dx: 0, dy: 0, dz: -1 },
    { dx: -1, dy: 0, dz: 0 },
  ][turns];
}

function inBounds(target, size) {
  return target.x >= 0 && target.y >= 0 && target.z >= 0
    && target.x < size.x && target.y < size.y && target.z < size.z;
}

export function adjacentTargetForFace(cube, face, options = {}) {
  const { size = { x: 32, y: 32, z: 32 }, rotation = 0 } = options;
  const delta = rotationDelta(face, rotation);
  const target = {
    x: cube.x + delta.dx,
    y: cube.y + delta.dy,
    z: cube.z + delta.dz,
  };
  return {
    face,
    cube,
    target,
    placeable: inBounds(target, size),
  };
}

export function findIsoFaceTarget(screenX, screenY, cubes, options = {}) {
  const ordered = [...cubes].sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z));
  const point = { x: screenX, y: screenY };
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const cube = ordered[index];
    const faces = projectIsoBlockFaces(cube.x, cube.y, cube.z, options);
    for (const face of ['top', 'right', 'left']) {
      if (pointInPolygon(point, faces[face])) {
        return adjacentTargetForFace(cube, face, options);
      }
    }
  }
  return null;
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
