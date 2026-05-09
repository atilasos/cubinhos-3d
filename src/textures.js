import * as THREE from 'three';
import { ATLASES, getAtlasTransform } from './atlas.js';

// Carrega os 3 atlas PNG uma vez. Cada textura fica com NearestFilter
// (pixel-art preservado), SRGBColorSpace e mipmaps desligados.
export async function loadBlockAtlases(loader = new THREE.TextureLoader()) {
  const entries = await Promise.all(
    Object.entries(ATLASES).map(async ([key, meta]) => {
      const tex = await loader.loadAsync(meta.path);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      return [key, tex];
    })
  );
  return Object.fromEntries(entries);
}

// Clona uma textura de atlas e aplica offset/repeat para mostrar apenas
// a célula (col, row) do bloco. O atlas original NÃO é modificado.
export function createBlockTexture(block, atlasTexture, atlasMeta) {
  const t = atlasTexture.clone();
  const { offsetX, offsetY, repeatX, repeatY } = getAtlasTransform({
    cols: atlasMeta.cols,
    rows: atlasMeta.rows,
    col: block.col,
    row: block.row,
  });
  t.offset.set(offsetX, offsetY);
  t.repeat.set(repeatX, repeatY);
  t.needsUpdate = true;
  return t;
}

// Cria um MeshLambertMaterial pronto a usar para um bloco.
export function createBlockMaterial(block, atlases) {
  const atlasTex = atlases[block.atlas];
  const atlasMeta = ATLASES[block.atlas];
  const map = createBlockTexture(block, atlasTex, atlasMeta);
  return new THREE.MeshLambertMaterial({ map });
}
