import * as THREE from 'three';
import { createBlockTexture } from './textures.js';
import { ATLASES } from './atlas.js';
import { BLOCK_BY_ID } from './blocks.js';

export function createGhost(scene, atlases) {
  const geo = new THREE.BoxGeometry(1.001, 1.001, 1.001);
  const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  scene.add(mesh);

  const eraseGeo = new THREE.BoxGeometry(1.06, 1.06, 1.06);
  const eraseMat = new THREE.MeshBasicMaterial({ color: 0xff4444, wireframe: true, transparent: true, opacity: 0.85 });
  const eraseMesh = new THREE.Mesh(eraseGeo, eraseMat);
  eraseMesh.visible = false;
  scene.add(eraseMesh);

  let currentTextureKey = null;

  function showBuild(blockId, voxel) {
    const block = BLOCK_BY_ID[blockId];
    if (!block || block.empty || block.atlas == null) { mesh.visible = false; return; }
    if (currentTextureKey !== blockId) {
      mat.map?.dispose();
      mat.map = createBlockTexture(block, atlases[block.atlas], ATLASES[block.atlas]);
      mat.needsUpdate = true;
      currentTextureKey = blockId;
    }
    mesh.position.set(voxel[0] + 0.5, voxel[1] + 0.5, voxel[2] + 0.5);
    mesh.visible = true;
    eraseMesh.visible = false;
  }

  function showErase(voxel) {
    eraseMesh.position.set(voxel[0] + 0.5, voxel[1] + 0.5, voxel[2] + 0.5);
    eraseMesh.visible = true;
    mesh.visible = false;
  }

  function hide() {
    mesh.visible = false;
    eraseMesh.visible = false;
  }

  return { showBuild, showErase, hide };
}
