// Infinite table with pan/zoom capabilities.
// Generic UI component, independent of component knowledge.

export function createInfiniteTable(container = null) {
  const viewport = document.createElement('div');
  viewport.className = 'infinite-table';

  const world = document.createElement('div');
  world.className = 'infinite-table__world';
  viewport.appendChild(world);

  let cameraX = 0;
  let cameraY = 0;
  let zoom = 1;

  const minZoom = 0.5;
  const maxZoom = 2.5;

  function updateTransform() {
    world.style.transform = `translate(${cameraX}px, ${cameraY}px) scale(${zoom})`;
  }

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
