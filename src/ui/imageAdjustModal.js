// Editor reutilizable de ajuste de imagen (posición/zoom) sobre la forma de un
// componente. Genérico y agnóstico del tipo de componente — cualquier tipo
// futuro con fondo de imagen puede reutilizarlo sin cambios.
//
// Recorte base vía `object-fit: cover` en <img> (evita calcular a mano las
// dimensiones naturales de la imagen). Dos mecanismos de paneo combinados,
// cada uno cubre un eje distinto:
// - `object-position` (%, variable) recorre el margen que `cover` genera
//   cuando la proporción de la imagen no coincide con la del marco (margen
//   solo existe en el eje que sobra). Si se fijara a 50%/50% constante, ese
//   margen quedaría inalcanzable para siempre en imágenes de proporción muy
//   distinta a la del marco.
// - El zoom crece `width`/`height` de la caja de imagen (no `transform:
//   scale()`); `top`/`left` recorren el desbordamiento resultante, añadiendo
//   margen real en AMBOS ejes por igual, sin depender de la proporción.
// Misma combinación en el renderizado final (`ui/componentRenderer.js`), vía
// `applyImageAdjustStyle`.

import { createRotationSliderField } from './rotationSlider.js';
import { t } from '../core/i18n.js';

const PREVIEW_MAX_SIDE = 390;

// `boxWidth`/`boxHeight`: tamaño real en píxeles del marco (máscara/
// contenedor). Rotación estricta: el tamaño de la imagen (según zoom) es
// siempre el mismo cualquiera que sea `rotation` — solo cambia el ángulo del
// `transform: rotate()`, nunca `width`/`height`. Puede dejar huecos en las
// esquinas al girar (el recorte del marco/máscara sigue ocultando lo que
// sobra fuera de él, no se compensa creciendo la imagen). El giro se aplica
// siempre alrededor del centro del marco REAL, no del centro propio de la
// imagen (que paneo/zoom pueden haber desplazado): `transform-origin` fija
// ese punto en coordenadas locales de la imagen, así el giro nunca desplaza
// el resultado ya ajustado.
export function applyImageAdjustStyle(imgEl, adjustment, boxWidth, boxHeight) {
  const { zoom = 100, posX = 50, posY = 50, rotation = 0 } = adjustment || {};
  const widthPx = (boxWidth * zoom) / 100;
  const heightPx = (boxHeight * zoom) / 100;
  const leftPx = (-(posX / 100) * (zoom - 100) * boxWidth) / 100;
  const topPx = (-(posY / 100) * (zoom - 100) * boxHeight) / 100;

  imgEl.style.objectFit = 'cover';
  imgEl.style.objectPosition = `${posX}% ${posY}%`;
  imgEl.style.width = `${widthPx}px`;
  imgEl.style.height = `${heightPx}px`;
  imgEl.style.left = `${leftPx}px`;
  imgEl.style.top = `${topPx}px`;
  imgEl.style.transform = rotation ? `rotate(${rotation}deg)` : '';
  imgEl.style.transformOrigin = `${boxWidth / 2 - leftPx}px ${boxHeight / 2 - topPx}px`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Recortes de silueta exacta (aristas rectas) para formas hexagonales y
// triangulares, además de 'circular'/'cuadrada'. Mismos polígonos que
// core/cardProportions.js, duplicados a propósito para que este módulo no
// dependa del catálogo de proporciones de carta.
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
  header.textContent = t('imageAdjust.title');
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content image-adjust-modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  // Entradas normalizadas: sin `faces`, un único stage anónimo (tipo futuro
  // con una sola imagen de fondo); con `faces`, N stages en posición fija (el
  // orden del array decide la columna, nunca se reordenan) — usado por
  // ui/visualEditorModal.js para las caras de una carta.
  const entries = faces || [{ key: '__single__', label: null, shape, width, height, resource, adjustment, transparencia }];

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
      rotation: entry.adjustment?.rotation ?? 0,
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
      const { maskWidth, maskHeight } = maskSizes[key];
      applyImageAdjustStyle(imgEls[key], state[key], maskWidth, maskHeight);
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
      rotationSlider.setValue(state[focusedKey].rotation);
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
  zoomLabel.textContent = t('imageAdjust.zoomLabel');
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

  const rotationSlider = createRotationSliderField({
    value: focusedKey ? state[focusedKey].rotation : 0,
    onChange: (v) => {
      if (!focusedKey) return;
      state[focusedKey].rotation = v;
      updatePreview(focusedKey);
    },
  });
  content.appendChild(rotationSlider.field);

  const hasTransparencia = entries.some((entry) => entry.transparencia !== undefined);
  let opacitySlider = null;
  let opacityTextInput = null;

  if (hasTransparencia) {
    const opacityField = document.createElement('div');
    opacityField.className = 'modal__field';
    const opacityLabel = document.createElement('label');
    opacityLabel.textContent = t('imageAdjust.opacityLabel');

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
  cancelBtn.textContent = t('common.cancel');
  cancelBtn.addEventListener('click', () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    overlay.remove();
  });
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = t('common.accept');
  acceptBtn.addEventListener('click', () => {
    if (onAccept) {
      if (faces) {
        const adjustments = {};
        for (const entry of entries) {
          const result = {
            zoom: state[entry.key].zoom,
            posX: state[entry.key].posX,
            posY: state[entry.key].posY,
            rotation: state[entry.key].rotation,
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
