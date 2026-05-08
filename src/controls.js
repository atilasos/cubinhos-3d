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

  canvas.addEventListener('pointercancel', () => { dragging = false; });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    // Normalize deltaY to pixels regardless of deltaMode (line=16px, page=400px).
    const px = e.deltaMode === 2 ? e.deltaY * 400
             : e.deltaMode === 1 ? e.deltaY * 16
             : e.deltaY;
    // 0.001 ≈ 12% per ~120px notch (matches old behaviour for mouse wheels)
    // and stays smooth for trackpad pixel deltas.
    state.distance = clamp(state.distance * (1 + px * 0.001), DIST_MIN, DIST_MAX);
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

const VIEWS = {
  'front':  { yaw: 0,           pitch: 0.001 },
  'back':   { yaw: Math.PI,     pitch: 0.001 },
  'right':  { yaw: -Math.PI/2,  pitch: 0.001 },
  'left':   { yaw: Math.PI/2,   pitch: 0.001 },
  'top':    { yaw: -Math.PI/4,  pitch: PITCH_MAX },
  'iso':    { yaw: -Math.PI/4,  pitch: Math.PI / 5 },
};

export function attachViewCube(controls, container) {
  const wrap = document.createElement('div');
  wrap.className = 'viewcube';
  wrap.innerHTML = `
    <button data-view="top" aria-label="Vista de cima">CIMA</button>
    <div class="viewcube-row">
      <button data-view="left" aria-label="Vista da esquerda">ESQ</button>
      <button data-view="front" aria-label="Vista da frente">FRENTE</button>
      <button data-view="right" aria-label="Vista da direita">DIR</button>
    </div>
    <button data-view="back" aria-label="Vista de trás">ATRÁS</button>
    <div class="viewcube-arrows">
      <button data-rotate="-1" aria-label="Rodar 45° à esquerda">⟲</button>
      <button data-rotate="1" aria-label="Rodar 45° à direita">⟳</button>
    </div>
    <button class="home" data-home aria-label="Vista inicial">🏠</button>
  `;
  container.appendChild(wrap);

  wrap.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.view) {
      const v = VIEWS[t.dataset.view];
      controls.setView(v.yaw, v.pitch);
    } else if (t.dataset.rotate) {
      controls.rotateBy(Number(t.dataset.rotate) * Math.PI / 4);
    } else if (t.dataset.home !== undefined) {
      controls.home();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isTypingTarget(e.target)) {
      e.preventDefault();
      controls.home();
    }
  });
}

function isTypingTarget(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}
