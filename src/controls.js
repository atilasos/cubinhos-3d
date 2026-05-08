import * as THREE from 'three';

const WORLD = 32;
const PITCH_MIN = 0.15;            // não permitir olhar de baixo
const PITCH_MAX = Math.PI / 2 - 0.05;
const DIST_MIN = 12;
const DIST_MAX = 90;
const ROT_SPEED = 0.005;
const ZOOM_SPEED = 0.12;

export function createControls(camera, canvas) {
  const target = new THREE.Vector3(WORLD / 2, WORLD / 2 - 4, WORLD / 2);
  // Estado em coordenadas esféricas em torno de target
  const state = {
    yaw: -Math.PI / 4,       // orientação inicial (vista isométrica)
    pitch: Math.PI / 5,
    distance: 56,
  };
  apply();

  let dragging = false;
  let lastX = 0, lastY = 0;

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 2) return;             // só botão direito
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    state.yaw -= dx * ROT_SPEED;
    state.pitch = clamp(state.pitch - dy * ROT_SPEED, PITCH_MIN, PITCH_MAX);
    apply();
  });

  canvas.addEventListener('pointerup', (e) => {
    if (e.button !== 2) return;
    dragging = false;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const dir = Math.sign(e.deltaY);
    state.distance = clamp(state.distance * (1 + dir * ZOOM_SPEED), DIST_MIN, DIST_MAX);
    apply();
  }, { passive: false });

  function apply() {
    const r = state.distance;
    const cy = Math.cos(state.pitch);
    camera.position.set(
      target.x + r * cy * Math.sin(state.yaw),
      target.y + r * Math.sin(state.pitch),
      target.z + r * cy * Math.cos(state.yaw),
    );
    camera.lookAt(target);
  }

  function home() {
    state.yaw = -Math.PI / 4;
    state.pitch = Math.PI / 5;
    state.distance = 56;
    apply();
  }

  function rotateBy(deltaYawRadians) {
    state.yaw += deltaYawRadians;
    apply();
  }

  function setView(yaw, pitch) {
    state.yaw = yaw; state.pitch = pitch; apply();
  }

  return { home, rotateBy, setView, state, apply };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
