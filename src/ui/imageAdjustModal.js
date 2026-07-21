// Editor reutilizable de ajuste de imagen (posición/zoom) sobre la forma de un
// componente (cuadrada o circular). Genérico y agnóstico del tipo de
// componente que lo use — pensado para que cualquier tipo futuro con fondo de
// imagen (no solo 'ficha') pueda reutilizarlo sin cambios.
//
// El recorte base lo resuelve el propio navegador (`object-fit: cover` sobre
// un <img>), evitando tener que calcular a mano las dimensiones naturales de
// la imagen. Hacen falta DOS mecanismos de paneo combinados, porque cada uno
// cubre un eje distinto según el caso:
// - `object-position` (variable, en %) recorre el margen que el propio
//   `cover` genera cuando la proporción de la imagen no coincide con la del
//   marco (ese margen solo existe en el eje que sobra tras encajar el otro).
//   Si se fijara a un valor constante, ese margen quedaría descartado para
//   siempre sin importar cuánto se mueva la caja después (fue el bug real de
//   fijarlo a 50%/50%: en imágenes con proporción muy distinta del marco, el
//   eje sin margen propio de object-fit quedaba inalcanzable).
// - El zoom crece el propio tamaño (`width`/`height`) de la caja de la
//   imagen (en vez de un `transform: scale()`) y `top`/`left` recorren el
//   desbordamiento resultante frente al marco, añadiendo margen real en
//   AMBOS ejes por igual en cuanto se aplica zoom, sin depender de la
//   proporción de la imagen.
// La misma combinación se usa tanto aquí como en el renderizado final
// (`ui/componentRenderer.js`), vía `applyImageAdjustStyle`.

const PREVIEW_MAX_SIDE = 220;

export function applyImageAdjustStyle(imgEl, adjustment) {
  const { zoom = 100, posX = 50, posY = 50 } = adjustment || {};
  imgEl.style.objectFit = 'cover';
  imgEl.style.objectPosition = `${posX}% ${posY}%`;
  imgEl.style.width = `${zoom}%`;
  imgEl.style.height = `${zoom}%`;
  imgEl.style.left = `${-((posX / 100) * (zoom - 100))}%`;
  imgEl.style.top = `${-((posY / 100) * (zoom - 100))}%`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function openImageAdjustModal({ shape, width, height, resource, adjustment, onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Ajustar imagen';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content image-adjust-modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  let posX = adjustment?.posX ?? 50;
  let posY = adjustment?.posY ?? 50;
  let zoom = adjustment?.zoom ?? 100;

  const scale = PREVIEW_MAX_SIDE / Math.max(width, height);
  const maskWidth = width * scale;
  const maskHeight = height * scale;

  const stage = document.createElement('div');
  stage.className = 'image-adjust-modal__stage';
  content.appendChild(stage);

  const mask = document.createElement('div');
  mask.className = 'image-adjust-modal__mask';
  mask.style.width = `${maskWidth}px`;
  mask.style.height = `${maskHeight}px`;
  mask.style.borderRadius = shape === 'circular' ? '50%' : '0';
  stage.appendChild(mask);

  const img = document.createElement('img');
  img.className = 'image-adjust-modal__image';
  img.src = resource.dataUrl;
  img.draggable = false;
  mask.appendChild(img);

  function updatePreview() {
    applyImageAdjustStyle(img, { zoom, posX, posY });
  }
  updatePreview();

  let dragging = false;
  let startMouseX = 0;
  let startMouseY = 0;
  let startPosX = posX;
  let startPosY = posY;

  function handleMouseMove(e) {
    const dxPercent = ((e.clientX - startMouseX) / maskWidth) * 100;
    const dyPercent = ((e.clientY - startMouseY) / maskHeight) * 100;
    posX = clamp(startPosX - dxPercent, 0, 100);
    posY = clamp(startPosY - dyPercent, 0, 100);
    updatePreview();
  }

  function handleMouseUp() {
    dragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  mask.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startPosX = posX;
    startPosY = posY;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  const zoomField = document.createElement('div');
  zoomField.className = 'modal__field';
  const zoomLabel = document.createElement('label');
  zoomLabel.textContent = 'Zoom';
  const zoomInput = document.createElement('input');
  zoomInput.type = 'range';
  zoomInput.min = 100;
  zoomInput.max = 300;
  zoomInput.value = zoom;
  zoomInput.addEventListener('input', () => {
    zoom = parseInt(zoomInput.value, 10);
    updatePreview();
  });
  zoomField.appendChild(zoomLabel);
  zoomField.appendChild(zoomInput);
  content.appendChild(zoomField);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    overlay.remove();
  });
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';
  acceptBtn.addEventListener('click', () => {
    if (onAccept) onAccept({ zoom, posX, posY });
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    overlay.remove();
  });
  footer.appendChild(acceptBtn);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
