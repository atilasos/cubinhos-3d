import * as THREE from 'three';

const WORLD = 32;

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = makeSkyTexture();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  setHomeView(camera);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(40, 60, 30);
  scene.add(ambient, sun);

  scene.add(makeFloorPlane());
  scene.add(makeWorldBoundsLines());

  resize(renderer, camera, canvas);
  window.addEventListener('resize', () => resize(renderer, camera, canvas));

  function render() { renderer.render(scene, camera); }
  function loop() { render(); requestAnimationFrame(loop); }
  loop();

  return { scene, camera, renderer, render };
}

function setHomeView(camera) {
  const center = new THREE.Vector3(WORLD / 2, 0, WORLD / 2);
  camera.position.set(center.x + 36, 36, center.z + 36);
  camera.lookAt(center);
}

function makeSkyTexture() {
  const c = document.createElement('canvas');
  c.width = 2; c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#bfe3ff');
  grad.addColorStop(1, '#dff3ff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeFloorPlane() {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(WORLD, WORLD);
  const mat = new THREE.MeshLambertMaterial({ color: 0xcfeaff });
  const plane = new THREE.Mesh(geo, mat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(WORLD / 2, 0, WORLD / 2);
  group.add(plane);
  // Grid 1×1 ligeiramente visível
  const grid = new THREE.GridHelper(WORLD, WORLD, 0x99c2e5, 0x99c2e5);
  grid.position.set(WORLD / 2, 0.001, WORLD / 2);
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  group.add(grid);
  return group;
}

function makeWorldBoundsLines() {
  const geo = new THREE.BoxGeometry(WORLD, WORLD, WORLD);
  const edges = new THREE.EdgesGeometry(geo);
  const mat = new THREE.LineDashedMaterial({ color: 0x88aacc, dashSize: 0.6, gapSize: 0.4, opacity: 0.55, transparent: true });
  const line = new THREE.LineSegments(edges, mat);
  line.computeLineDistances();
  line.position.set(WORLD / 2, WORLD / 2, WORLD / 2);
  return line;
}

function resize(renderer, camera, canvas) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
