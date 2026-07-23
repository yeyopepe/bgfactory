// Editor de cartas: modal grande (overlay + modal, mismo patrón que el resto
// de la app, pero con más superficie de trabajo) para diseñar las dos caras
// de una carta a la vez. Abierta desde la pestaña "Específicas" de
// ui/componentModal.js cuando el componente es de tipo 'carta'.

import { getResources } from '../core/state.js';
import { CARD_PROPORTIONS, getProporcionRatio, getDesignSize } from '../core/cardProportions.js';
import { applyImageAdjustStyle, openImageAdjustModal } from './imageAdjustModal.js';
import { openBoardImageModal } from './boardImageModal.js';
import { openCardTextBoxModal } from './cardTextBoxModal.js';
import { attachResizeHandle } from './resizeHandle.js';

const CANVAS_MAX_SIDE = 260;
const MIN_TEXT_BOX_DESIGN_SIZE = 20;

function cloneCara(cara) {
  return {
    imagenResourceId: cara?.imagenResourceId ?? null,
    ajusteImagen: { ...(cara?.ajusteImagen || { zoom: 100, posX: 50, posY: 50 }) },
    textBoxes: (cara?.textBoxes || []).map((tb) => ({ ...tb })),
  };
}

export function openCardEditorModal({ component, onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal card-editor-modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Editor de cartas';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const props = component.properties || {};
  const working = {
    proporcion: props.proporcion || '5:7',
    caraFrontal: cloneCara(props.caraFrontal),
    caraTrasera: cloneCara(props.caraTrasera),
  };

  // Toolbar: proporción
  const toolbar = document.createElement('div');
  toolbar.className = 'card-editor-modal__toolbar';
  const proporcionField = document.createElement('div');
  proporcionField.className = 'modal__field';
  const proporcionLabel = document.createElement('label');
  proporcionLabel.textContent = 'Proporción';
  const proporcionSelect = document.createElement('select');
  for (const { value, label } of CARD_PROPORTIONS) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    if (value === working.proporcion) option.selected = true;
    proporcionSelect.appendChild(option);
  }
  proporcionSelect.addEventListener('change', () => {
    working.proporcion = proporcionSelect.value;
    renderFaces();
  });
  proporcionField.appendChild(proporcionLabel);
  proporcionField.appendChild(proporcionSelect);
  toolbar.appendChild(proporcionField);
  content.appendChild(toolbar);

  const facesRow = document.createElement('div');
  facesRow.className = 'card-editor-modal__faces';
  content.appendChild(facesRow);

  const adjustImageBtn = document.createElement('button');
  adjustImageBtn.type = 'button';
  adjustImageBtn.className = 'btn-cancel card-editor-modal__adjust-image';
  adjustImageBtn.textContent = 'Ajustar imagen…';
  adjustImageBtn.addEventListener('click', () => openAdjustSession());
  content.appendChild(adjustImageBtn);

  function renderFaces() {
    facesRow.innerHTML = '';
    facesRow.appendChild(renderFace('caraFrontal', 'Cara frontal'));
    facesRow.appendChild(renderFace('caraTrasera', 'Cara trasera'));
    adjustImageBtn.disabled = !working.caraFrontal.imagenResourceId && !working.caraTrasera.imagenResourceId;
  }

  function openAdjustSession() {
    const initialKey = working.caraFrontal.imagenResourceId
      ? 'caraFrontal'
      : working.caraTrasera.imagenResourceId
        ? 'caraTrasera'
        : null;
    if (!initialKey) return;

    const { width: designWidth, height: designHeight } = getDesignSize(working.proporcion);
    const frontalResource = working.caraFrontal.imagenResourceId
      ? getResources().find((r) => r.id === working.caraFrontal.imagenResourceId)
      : null;
    const traseraResource = working.caraTrasera.imagenResourceId
      ? getResources().find((r) => r.id === working.caraTrasera.imagenResourceId)
      : null;

    const faceShape = working.proporcion === 'circular' ? 'circular' : 'cuadrada';

    openImageAdjustModal({
      faces: [
        {
          key: 'caraFrontal',
          label: 'Frontal',
          shape: faceShape,
          width: designWidth,
          height: designHeight,
          resource: frontalResource,
          adjustment: working.caraFrontal.ajusteImagen,
        },
        {
          key: 'caraTrasera',
          label: 'Trasera',
          shape: faceShape,
          width: designWidth,
          height: designHeight,
          resource: traseraResource,
          adjustment: working.caraTrasera.ajusteImagen,
        },
      ],
      initialFocusKey: initialKey,
      onAccept: (adjustments) => {
        working.caraFrontal.ajusteImagen = adjustments.caraFrontal;
        working.caraTrasera.ajusteImagen = adjustments.caraTrasera;
        renderFaces();
      },
    });
  }

  function renderFace(caraKey, label) {
    const cara = working[caraKey];
    const { width: designWidth, height: designHeight } = getDesignSize(working.proporcion);
    const previewScale = CANVAS_MAX_SIDE / Math.max(designWidth, designHeight);
    const canvasWidth = designWidth * previewScale;
    const canvasHeight = designHeight * previewScale;

    const faceCol = document.createElement('div');
    faceCol.className = 'card-editor-modal__face';

    const faceLabel = document.createElement('div');
    faceLabel.className = 'card-editor-modal__face-label';
    faceLabel.textContent = label;
    faceCol.appendChild(faceLabel);

    const canvas = document.createElement('div');
    canvas.className = 'card-editor-modal__canvas';
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvas.style.borderRadius = working.proporcion === 'circular' ? '50%' : '8px';
    faceCol.appendChild(canvas);

    const resource = cara.imagenResourceId ? getResources().find((r) => r.id === cara.imagenResourceId) : null;
    if (resource) {
      const img = document.createElement('img');
      img.src = resource.dataUrl;
      img.draggable = false;
      img.style.position = 'absolute';
      img.style.top = '0';
      img.style.left = '0';
      img.style.pointerEvents = 'none';
      applyImageAdjustStyle(img, cara.ajusteImagen);
      canvas.appendChild(img);
    }

    for (const textBox of cara.textBoxes) {
      canvas.appendChild(renderTextBox(caraKey, textBox, previewScale));
    }

    const actionsRow = document.createElement('div');
    actionsRow.className = 'card-editor-modal__face-actions';

    const chooseImageBtn = document.createElement('button');
    chooseImageBtn.type = 'button';
    chooseImageBtn.className = 'btn-cancel';
    chooseImageBtn.textContent = 'Elegir imagen…';
    chooseImageBtn.addEventListener('click', () => {
      openBoardImageModal({
        properties: cara,
        resources: getResources(),
        title: 'Elegir imagen',
        onAccept: (resourceId) => {
          cara.imagenResourceId = resourceId;
          cara.ajusteImagen = { zoom: 100, posX: 50, posY: 50 };
          renderFaces();
        },
      });
    });
    actionsRow.appendChild(chooseImageBtn);

    const addTextBoxBtn = document.createElement('button');
    addTextBoxBtn.type = 'button';
    addTextBoxBtn.className = 'btn-cancel';
    addTextBoxBtn.textContent = '+ Cuadro de texto';
    addTextBoxBtn.addEventListener('click', () => {
      const w = designWidth * 0.5;
      const h = designHeight * 0.15;
      cara.textBoxes.push({
        id: crypto.randomUUID(),
        contenido: '',
        fuenteResourceId: null,
        tamañoFuente: 16,
        color: '#000000',
        x: (designWidth - w) / 2,
        y: (designHeight - h) / 2,
        width: w,
        height: h,
      });
      renderFaces();
    });
    actionsRow.appendChild(addTextBoxBtn);

    faceCol.appendChild(actionsRow);

    return faceCol;
  }

  function renderTextBox(caraKey, textBox, previewScale) {
    const el = document.createElement('div');
    el.className = 'card-editor-modal__textbox';
    el.style.position = 'absolute';
    el.style.left = `${textBox.x * previewScale}px`;
    el.style.top = `${textBox.y * previewScale}px`;
    el.style.width = `${textBox.width * previewScale}px`;
    el.style.height = `${textBox.height * previewScale}px`;
    el.style.fontSize = `${textBox.tamañoFuente * previewScale}px`;
    el.style.color = textBox.color || '#000000';
    el.textContent = textBox.contenido || '';

    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openCardTextBoxModal({
        textBox,
        onAccept: (updated) => {
          Object.assign(textBox, updated);
          renderFaces();
        },
        onDelete: () => {
          const cara = working[caraKey];
          cara.textBoxes = cara.textBoxes.filter((tb) => tb.id !== textBox.id);
          renderFaces();
        },
      });
    });

    let startMouseX = 0;
    let startMouseY = 0;
    let startX = textBox.x;
    let startY = textBox.y;

    function handleMouseMove(e) {
      textBox.x = startX + (e.clientX - startMouseX) / previewScale;
      textBox.y = startY + (e.clientY - startMouseY) / previewScale;
      el.style.left = `${textBox.x * previewScale}px`;
      el.style.top = `${textBox.y * previewScale}px`;
    }

    function handleMouseUp() {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startX = textBox.x;
      startY = textBox.y;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });

    attachResizeHandle(el, {
      axis: 'both',
      getScale: () => previewScale,
      getSize: () => ({ width: textBox.width, height: textBox.height }),
      clamp: ({ width, height }) => ({
        width: Math.max(width, MIN_TEXT_BOX_DESIGN_SIZE),
        height: Math.max(height, MIN_TEXT_BOX_DESIGN_SIZE),
      }),
      onResize: ({ width, height }) => {
        el.style.width = `${width * previewScale}px`;
        el.style.height = `${height * previewScale}px`;
      },
      onResizeEnd: ({ width, height }) => {
        textBox.width = width;
        textBox.height = height;
      },
    });

    return el;
  }

  renderFaces();

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';
  acceptBtn.addEventListener('click', () => {
    if (onAccept) {
      onAccept({
        proporcion: working.proporcion,
        caraFrontal: working.caraFrontal,
        caraTrasera: working.caraTrasera,
      });
    }
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
