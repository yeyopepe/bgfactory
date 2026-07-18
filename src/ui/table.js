// Infinite table with pan/zoom capabilities.
// Generic UI component, independent of component knowledge.

// Camera state shared across mounts: the table is fully recreated on every
// screen repaint (see main.js `renderAll()`, triggered by `components:changed`/
// `mode:changed`), so keeping cameraX/cameraY/zoom local to `createInfiniteTable`
// would reset the view on every repaint. Only one table is ever active at a
// time (play/edit modes are mutually exclusive), so a single module-level
// camera is enough to survive those remounts within the session. Not persisted
// to storage — resets on page reload, like before.
let cameraX = 0;
let cameraY = 0;
let zoom = 1;

// Referencias a la mesa actualmente montada, para que `fitToBounds` pueda
// aplicar el reencuadre de forma inmediata sin que el caller conozca la
// instancia (mismo razonamiento que cameraX/cameraY/zoom: solo hay una
// mesa activa a la vez).
let activeViewport = null;
let activeUpdateTransform = null;

const minZoom = 0.5;
const maxZoom = 2.5;

export function createInfiniteTable(container = null) {
  const viewport = document.createElement('div');
  viewport.className = 'infinite-table';

  const world = document.createElement('div');
  world.className = 'infinite-table__world';
  viewport.appendChild(world);

  function updateTransform() {
    world.style.transform = `translate(${cameraX}px, ${cameraY}px) scale(${zoom})`;
  }

  activeViewport = viewport;
  activeUpdateTransform = updateTransform;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragCameraX = 0;
  let dragCameraY = 0;

  viewport.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragCameraX = cameraX;
      dragCameraY = cameraY;
      viewport.classList.add('grabbing');
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      cameraX = dragCameraX + deltaX;
      cameraY = dragCameraY + deltaY;
      updateTransform();
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      viewport.classList.remove('grabbing');
    }
  });

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();

    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const oldZoom = zoom;
    const wheelDelta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom = Math.max(minZoom, Math.min(maxZoom, zoom * wheelDelta));

    const zoomRatio = zoom / oldZoom;
    cameraX = mouseX - (mouseX - cameraX) * zoomRatio;
    cameraY = mouseY - (mouseY - cameraY) * zoomRatio;

    updateTransform();
  });

  updateTransform();

  if (container) {
    container.innerHTML = '';
    container.appendChild(viewport);
  }

  return { el: viewport, worldEl: world };
}

// Reencuadra la cámara de forma instantánea (sin transición) para que `bounds`
// quede visible con un margen (`padding`). `bounds` es una caja ya calculada
// por el caller ({ minX, minY, maxX, maxY }) o `null` para volver a la vista
// neutra — esta función no conoce componentes, solo geometría.
export function fitToBounds(bounds, { padding = 60 } = {}) {
  if (!activeViewport) return;

  if (!bounds) {
    cameraX = 0;
    cameraY = 0;
    zoom = 1;
  } else {
    const rect = activeViewport.getBoundingClientRect();
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    const availableWidth = Math.max(rect.width - padding * 2, 1);
    const availableHeight = Math.max(rect.height - padding * 2, 1);
    const scaleX = contentWidth > 0 ? availableWidth / contentWidth : maxZoom;
    const scaleY = contentHeight > 0 ? availableHeight / contentHeight : maxZoom;
    zoom = Math.max(minZoom, Math.min(maxZoom, Math.min(scaleX, scaleY)));

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    cameraX = rect.width / 2 - centerX * zoom;
    cameraY = rect.height / 2 - centerY * zoom;
  }

  activeUpdateTransform();
}
