import { getVoxel } from './model.js';

const AIR = 'minecraft:air';
const MAX_STEPS = 200;

// Faz DDA na grelha do model. Devolve:
//   { kind: 'voxel', voxel:[x,y,z], normal:[nx,ny,nz], ghostVoxel:[x',y',z'], distance }
//   { kind: 'floor', ghostVoxel:[x,0,z], distance }
//   null
export function castRay(model, ray) {
  const { origin, dir } = ray;
  const sx = model.size.x, sy = model.size.y, sz = model.size.z;

  let [ox, oy, oz] = origin;
  let [dx, dy, dz] = dir;
  const len = Math.hypot(dx, dy, dz) || 1;
  dx /= len; dy /= len; dz /= len;

  const tEntry = enterBox(ox, oy, oz, dx, dy, dz, sx, sy, sz);
  if (tEntry === null) return null;
  ox += dx * tEntry; oy += dy * tEntry; oz += dz * tEntry;
  let distance = tEntry;

  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const stepX = dx > 0 ? 1 : -1;
  const stepY = dy > 0 ? 1 : -1;
  const stepZ = dz > 0 ? 1 : -1;
  const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
  const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
  const tDeltaZ = dz !== 0 ? Math.abs(1 / dz) : Infinity;
  let tMaxX = dx !== 0 ? ((dx > 0 ? Math.floor(ox) + 1 - ox : ox - Math.floor(ox)) * tDeltaX) : Infinity;
  let tMaxY = dy !== 0 ? ((dy > 0 ? Math.floor(oy) + 1 - oy : oy - Math.floor(oy)) * tDeltaY) : Infinity;
  let tMaxZ = dz !== 0 ? ((dz > 0 ? Math.floor(oz) + 1 - oz : oz - Math.floor(oz)) * tDeltaZ) : Infinity;

  let lastNormal = [0, 0, 0];

  for (let step = 0; step < MAX_STEPS; step += 1) {
    if (x < 0 || y < 0 || z < 0 || x >= sx || y >= sy || z >= sz) {
      return null;
    }
    const id = getVoxel(model, x, y, z);
    if (id !== AIR) {
      return {
        kind: 'voxel',
        voxel: [x, y, z],
        normal: lastNormal,
        ghostVoxel: [x + lastNormal[0], y + lastNormal[1], z + lastNormal[2]],
        distance,
      };
    }
    if (dy < 0 && y === 0 && stepY === -1) {
      const tToFloor = ((0 - oy) / dy);
      if (tToFloor > 0 && tToFloor <= tMaxY) {
        const fx = ox + dx * tToFloor;
        const fz = oz + dz * tToFloor;
        const gx = Math.max(0, Math.min(sx - 1, Math.floor(fx)));
        const gz = Math.max(0, Math.min(sz - 1, Math.floor(fz)));
        return { kind: 'floor', ghostVoxel: [gx, 0, gz], distance: distance + tToFloor };
      }
    }
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX; distance += tMaxX; tMaxX += tDeltaX; lastNormal = [-stepX, 0, 0];
    } else if (tMaxY < tMaxZ) {
      y += stepY; distance += tMaxY; tMaxY += tDeltaY; lastNormal = [0, -stepY, 0];
    } else {
      z += stepZ; distance += tMaxZ; tMaxZ += tDeltaZ; lastNormal = [0, 0, -stepZ];
    }
  }
  return null;
}

function enterBox(ox, oy, oz, dx, dy, dz, sx, sy, sz) {
  if (ox >= 0 && ox <= sx && oy >= 0 && oy <= sy && oz >= 0 && oz <= sz) return 0;
  let tMin = 0, tMax = Infinity;
  for (const [o, d, s] of [[ox, dx, sx], [oy, dy, sy], [oz, dz, sz]]) {
    if (Math.abs(d) < 1e-9) {
      if (o < 0 || o > s) return null;
    } else {
      let t1 = (0 - o) / d;
      let t2 = (s - o) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return null;
    }
  }
  return tMin;
}
