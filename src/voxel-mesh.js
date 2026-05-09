import * as THREE from 'three';
import { createBlockMaterial } from './textures.js';
import { paletteBlocks } from './blocks.js';

const AIR = 'minecraft:air';
const MAX_PER_TYPE = 32 * 32 * 32;

export function createVoxelMeshes(scene, atlases) {
  const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
  const meshesById = new Map();

  for (const block of paletteBlocks()) {
    const mat = createBlockMaterial(block, atlases);
    const mesh = new THREE.InstancedMesh(cubeGeo, mat, MAX_PER_TYPE);
    mesh.count = 0;
    mesh.userData.blockId = block.id;
    mesh.frustumCulled = false; // bounding box not auto-recomputed for InstancedMesh
    scene.add(mesh);
    meshesById.set(block.id, { mesh, slots: new Map(), free: [] });
  }

  function rebuild(model) {
    for (const entry of meshesById.values()) {
      entry.mesh.count = 0;
      entry.slots.clear();
      entry.free.length = 0;
    }
    for (let x = 0; x < model.size.x; x += 1) {
      for (let y = 0; y < model.size.y; y += 1) {
        for (let z = 0; z < model.size.z; z += 1) {
          const id = model.cells[x * model.size.y * model.size.z + y * model.size.z + z];
          if (id && id !== AIR) appendInstance(id, x, y, z);
        }
      }
    }
    for (const entry of meshesById.values()) entry.mesh.instanceMatrix.needsUpdate = true;
  }

  function appendInstance(id, x, y, z) {
    const entry = meshesById.get(id);
    if (!entry) return;
    const slot = entry.free.pop() ?? entry.mesh.count++;
    const key = keyOf(x, y, z);
    entry.slots.set(key, slot);
    const m = new THREE.Matrix4().setPosition(x + 0.5, y + 0.5, z + 0.5);
    entry.mesh.setMatrixAt(slot, m);
    entry.mesh.instanceMatrix.needsUpdate = true;
  }

  function removeInstance(id, x, y, z) {
    const entry = meshesById.get(id);
    if (!entry) return;
    const key = keyOf(x, y, z);
    const slot = entry.slots.get(key);
    if (slot === undefined) return;
    const last = entry.mesh.count - 1;
    if (slot !== last) {
      const m = new THREE.Matrix4();
      entry.mesh.getMatrixAt(last, m);
      entry.mesh.setMatrixAt(slot, m);
      for (const [k, s] of entry.slots) if (s === last) { entry.slots.set(k, slot); break; }
    }
    entry.mesh.count -= 1;
    entry.slots.delete(key);
    entry.mesh.instanceMatrix.needsUpdate = true;
  }

  function setVoxel(prevId, nextId, x, y, z) {
    if (prevId && prevId !== AIR) removeInstance(prevId, x, y, z);
    if (nextId && nextId !== AIR) appendInstance(nextId, x, y, z);
  }

  function meshList() {
    return [...meshesById.values()].map((e) => e.mesh);
  }

  return { rebuild, setVoxel, meshList };
}

function keyOf(x, y, z) { return (x << 12) | (y << 6) | z; }
