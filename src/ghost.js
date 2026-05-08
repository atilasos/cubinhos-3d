import * as THREE from 'three';
import { buildThreeTexture } from './textures.js';
import { BLOCK_BY_ID } from './blocks.js';

export function createGhost(scene) {
  const geo = new THREE.BoxGeometry(1.001, 1.001, 1.001); // ligeiramente maior para evitar z-fighting
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
    if (!block) { mesh.visible = false; return; }
    if (currentTextureKey !== blockId) {
      mat.map?.dispose();
      mat.map = buildThreeTexture(THREE, block.color);
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
