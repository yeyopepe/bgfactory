// Editor reutilizable de ajuste de imagen (posición/zoom) sobre la forma de un
// componente (cuadrada o circular). Genérico y agnóstico del tipo de
// componente que lo use — pensado para que cualquier tipo futuro con fondo de
// imagen pueda reutilizarlo sin cambios.
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

const PREVIEW_MAX_SIDE = 390;

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

// Recortes de silueta exacta (aristas rectas) para las formas hexagonales
// (cambio 00089) y triangulares (cambio 00134), además de 'circular'/'cuadrada'.
// Mismos polígonos que core/cardProportions.js — se mantienen duplicados aquí
// a propósito, para que este módulo siga sin depender del catálogo de
// proporciones de carta.
const HEX_CLIP_PATHS = {
  'hex-vertical': 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  'hex-horizontal': 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  triangulo: 'polygon(50% 0%, 100% 100%, 0% 100%)',
  'triangulo-invertido': 'polygon(0% 0%, 100% 0%, 50% 100%)',
};

export function openImageAdjustModal({ shape, width, height, resource, adjustment, transparencia, onAccept, faces, initialFocusKey }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal image-adjust-modal--large';

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

  // Entradas normalizadas: sin `faces`, un único stage anónimo (un solo
  // recurso, para un tipo futuro con una sola imagen de fondo); con `faces`,
  // N stages en posición fija (el orden del array decide la columna, no se
  // reordenan nunca) — usado por ui/cardEditorModal.js para las dos caras de
  // una carta.
  const entries = faces || [{ key: '__single__', label: null, shape, width, height, resource, adjustment }];

  const stagesRow = document.createElement('div');
  stagesRow.className = 'image-adjust-modal__stages';
  content.appendChild(stagesRow);

  const state = {};
  const stageEls = {};
  const maskEls = {};
  const imgEls = {};
  const maskSizes = {};

  for (const entry of entries) {
    state[entry.key] = {
      zoom: entry.adjustment?.zoom ?? 100,
      posX: entry.adjustment?.posX ?? 50,
      posY: entry.adjustment?.posY ?? 50,
      transparencia: entry.transparencia ?? 0,
    };

    const entryScale = PREVIEW_MAX_SIDE / Math.max(entry.width, entry.height);
    const maskWidth = entry.width * entryScale;
    const maskHeight = entry.height * entryScale;
    maskSizes[entry.key] = { maskWidth, maskHeight };

    const stage = document.createElement('div');
    stage.className = 'image-adjust-modal__stage';
    stagesRow.appendChild(stage);
    stageEls[entry.key] = stage;

    if (entry.label) {
      const title = document.createElement('span');
      title.className = 'image-adjust-modal__stage-title';
      title.textContent = entry.label;
      stage.appendChild(title);
    }

    const mask = document.createElement('div');
    mask.className = 'image-adjust-modal__mask';
    mask.style.width = `${maskWidth}px`;
    mask.style.height = `${maskHeight}px`;
    mask.style.borderRadius = entry.shape === 'circular' ? '50%' : entry.shape === 'redondeada' ? '8px' : '0';
    mask.style.clipPath = HEX_CLIP_PATHS[entry.shape] || 'none';
    stage.appendChild(mask);
    maskEls[entry.key] = mask;

    if (entry.resource) {
      const img = document.createElement('img');
      img.className = 'image-adjust-modal__image';
      img.src = entry.resource.dataUrl;
      img.draggable = false;
      mask.appendChild(img);
      imgEls[entry.key] = img;
    } else {
      mask.style.cursor = 'default';
    }
  }

  function updatePreview(key) {
    if (imgEls[key]) {
      applyImageAdjustStyle(imgEls[key], state[key]);
      imgEls[key].style.opacity = String(1 - state[key].transparencia / 100);
    }
  }
  for (const entry of entries) updatePreview(entry.key);

  let focusedKey = entries.find((entry) => entry.key === initialFocusKey && entry.resource)?.key
    ?? entries.find((entry) => entry.resource)?.key
    ?? null;

  function refreshFocusClasses() {
    for (const entry of entries) {
      const isFocused = entry.key === focusedKey;
      stageEls[entry.key].classList.toggle('image-adjust-modal__stage--focused', isFocused);
      stageEls[entry.key].classList.toggle('image-adjust-modal__stage--dim', Boolean(entry.resource) && !isFocused);
      maskEls[entry.key].classList.toggle('image-adjust-modal__mask--active', isFocused);
      maskEls[entry.key].classList.toggle('image-adjust-modal__mask--clickable', Boolean(entry.resource) && !isFocused);
    }
    if (focusedKey) {
      zoomInput.value = state[focusedKey].zoom;
      zoomTextInput.value = state[focusedKey].zoom;
      if (opacitySlider) {
        opacitySlider.value = state[focusedKey].transparencia;
        opacityTextInput.value = state[focusedKey].transparencia;
      }
    }
  }

  let dragging = false;
  let startMouseX = 0;
  let startMouseY = 0;
  let startPosX = 0;
  let startPosY = 0;

  function handleMouseMove(e) {
    const { maskWidth, maskHeight } = maskSizes[focusedKey];
    const dxPercent = ((e.clientX - startMouseX) / maskWidth) * 100;
    const dyPercent = ((e.clientY - startMouseY) / maskHeight) * 100;
    state[focusedKey].posX = clamp(startPosX - dxPercent, 0, 100);
    state[focusedKey].posY = clamp(startPosY - dyPercent, 0, 100);
    updatePreview(focusedKey);
  }

  function handleMouseUp() {
    dragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  function beginDrag(key, e) {
    if (focusedKey !== key) {
      focusedKey = key;
      refreshFocusClasses();
    }
    dragging = true;
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startPosX = state[key].posX;
    startPosY = state[key].posY;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  for (const entry of entries) {
    if (!entry.resource) continue;
    maskEls[entry.key].addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      beginDrag(entry.key, e);
    });
  }

  const zoomField = document.createElement('div');
  zoomField.className = 'modal__field';
  const zoomLabel = document.createElement('label');
  zoomLabel.textContent = 'Zoom';
  const zoomInput = document.createElement('input');
  zoomInput.type = 'range';
  zoomInput.min = 100;
  zoomInput.max = 300;
  zoomInput.value = focusedKey ? state[focusedKey].zoom : 100;

  const zoomValue = document.createElement('div');
  zoomValue.className = 'image-adjust-modal__zoom-value';
  const zoomTextInput = document.createElement('input');
  zoomTextInput.type = 'text';
  zoomTextInput.value = zoomInput.value;
  const zoomUnit = document.createElement('span');
  zoomUnit.textContent = '%';
  zoomValue.appendChild(zoomTextInput);
  zoomValue.appendChild(zoomUnit);

  zoomInput.addEventListener('input', () => {
    state[focusedKey].zoom = parseInt(zoomInput.value, 10);
    zoomTextInput.value = state[focusedKey].zoom;
    updatePreview(focusedKey);
  });

  function commitZoomTextInput() {
    const parsed = parseInt(zoomTextInput.value, 10);
    if (Number.isNaN(parsed)) {
      zoomTextInput.value = state[focusedKey].zoom;
      return;
    }
    state[focusedKey].zoom = clamp(parsed, 100, 300);
    zoomTextInput.value = state[focusedKey].zoom;
    zoomInput.value = state[focusedKey].zoom;
    updatePreview(focusedKey);
  }
  zoomTextInput.addEventListener('change', commitZoomTextInput);
  zoomTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') zoomTextInput.blur();
  });

  zoomField.appendChild(zoomLabel);
  zoomField.appendChild(zoomInput);
  zoomField.appendChild(zoomValue);
  content.appendChild(zoomField);

  const hasTransparencia = entries.some((entry) => entry.transparencia !== undefined);
  let opacitySlider = null;
  let opacityTextInput = null;

  if (hasTransparencia) {
    const opacityField = document.createElement('div');
    opacityField.className = 'modal__field';
    const opacityLabel = document.createElement('label');
    opacityLabel.textContent = 'Transparencia';

    opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.min = 0;
    opacitySlider.max = 100;
    opacitySlider.value = focusedKey ? state[focusedKey].transparencia : 0;

    const opacityValue = document.createElement('div');
    opacityValue.className = 'image-adjust-modal__opacity-value';
    opacityTextInput = document.createElement('input');
    opacityTextInput.type = 'text';
    opacityTextInput.value = opacitySlider.value;
    const opacityUnit = document.createElement('span');
    opacityUnit.textContent = '%';
    opacityValue.appendChild(opacityTextInput);
    opacityValue.appendChild(opacityUnit);

    opacitySlider.addEventListener('input', () => {
      state[focusedKey].transparencia = parseInt(opacitySlider.value, 10);
      opacityTextInput.value = state[focusedKey].transparencia;
      updatePreview(focusedKey);
    });

    function commitOpacityTextInput() {
      const parsed = parseInt(opacityTextInput.value, 10);
      if (Number.isNaN(parsed)) {
        opacityTextInput.value = state[focusedKey].transparencia;
        return;
      }
      state[focusedKey].transparencia = clamp(parsed, 0, 100);
      opacityTextInput.value = state[focusedKey].transparencia;
      opacitySlider.value = state[focusedKey].transparencia;
      updatePreview(focusedKey);
    }
    opacityTextInput.addEventListener('change', commitOpacityTextInput);
    opacityTextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') opacityTextInput.blur();
    });

    opacityField.appendChild(opacityLabel);
    opacityField.appendChild(opacitySlider);
    opacityField.appendChild(opacityValue);
    content.appendChild(opacityField);
  }

  refreshFocusClasses();

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
    if (onAccept) {
      if (faces) {
        const adjustments = {};
        for (const entry of entries) {
          const result = {
            zoom: state[entry.key].zoom,
            posX: state[entry.key].posX,
            posY: state[entry.key].posY,
          };
          if (hasTransparencia) {
            result.transparencia = state[entry.key].transparencia;
          }
          adjustments[entry.key] = result;
        }
        onAccept(adjustments);
      } else {
        onAccept({ ...state.__single__ });
      }
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    overlay.remove();
  });
  footer.appendChild(acceptBtn);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) overlay.remove();
  });
}
