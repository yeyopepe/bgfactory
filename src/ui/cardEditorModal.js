// Editor de cartas: modal grande (overlay + modal, mismo patrón que el resto
// de la app, pero con más superficie de trabajo) para diseñar las dos caras
// de una carta a la vez. Abierta desde la pestaña "Específicas" de
// ui/componentModal.js cuando el componente es de tipo 'carta'.

import { getResources } from '../core/state.js';
import { CARD_PROPORTIONS, getProporcionRatio, getDesignSize, getCartaShapeCss, getHexInnerClipPath } from '../core/cardProportions.js';
import { getTextBoxLayoutStyle } from '../core/textBoxLayout.js';
import { applyImageAdjustStyle, openImageAdjustModal } from './imageAdjustModal.js';
import { openBoardImageModal } from './boardImageModal.js';
import { openCardTextBoxModal } from './cardTextBoxModal.js';
import { attachResizeHandle } from './resizeHandle.js';
import { fontFamilyFor } from './fontFaceRegistry.js';
import { createHelpIcon } from './helpIcon.js';

const CANVAS_MAX_SIDE = 380;
const MIN_TEXT_BOX_DESIGN_SIZE = 20;
const DUPLICATE_TEXT_BOX_OFFSET = 20;

const HELP_HTML = `
  <ul>
    <li>Elegir la <b>proporción/forma</b> de la carta.</li>
    <li>Elegir una <b>imagen</b> para cada cara (frontal/trasera) y ajustarla (zoom, posición, transparencia).</li>
    <li>Configurar el <b>borde</b> de la carta (color y grosor), de forma independiente por cara.</li>
    <li><b>Añadir</b> un cuadro de texto nuevo a una cara.</li>
    <li><b>Mover</b> un cuadro de texto arrastrándolo con el ratón.</li>
    <li><b>Redimensionar</b> un cuadro de texto arrastrando su esquina.</li>
    <li><b>Editar</b> el contenido y el estilo de un cuadro de texto (haciendo doble clic sobre él).</li>
    <li><b>Seleccionar</b> un cuadro de texto con un clic y moverlo con precisión usando las flechas del teclado (1px, o 10px con Shift).</li>
    <li><b>Aceptar</b> o <b>cancelar</b> los cambios hechos en el editor.</li>
  </ul>
`;

function isTextEditableElement(el) {
  return el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement;
}

function cloneCara(cara) {
  return {
    imagenResourceId: cara?.imagenResourceId ?? null,
    ajusteImagen: { ...(cara?.ajusteImagen || { zoom: 100, posX: 50, posY: 50 }) },
    textBoxes: (cara?.textBoxes || []).map((tb) => ({ ...tb })),
    bordeColor: cara?.bordeColor ?? '#000000',
    bordeGrosor: cara?.bordeGrosor ?? 0,
    transparenciaImagen: cara?.transparenciaImagen ?? 0,
  };
}

export function openCardEditorModal({ component, onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal card-editor-modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  const headerTitle = document.createElement('span');
  headerTitle.textContent = 'Editor de cartas';
  header.appendChild(headerTitle);
  header.appendChild(createHelpIcon({ html: HELP_HTML }));
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

  let selected = null;

  function selectTextBox(caraKey, id) {
    selected = { caraKey, id };
    renderFaces();
  }

  function deselectTextBox() {
    if (!selected) return;
    selected = null;
    renderFaces();
  }

  function handleKeyDown(e) {
    if (!selected) return;
    if (isTextEditableElement(document.activeElement)) return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const cara = working[selected.caraKey];
    const textBox = cara.textBoxes.find((tb) => tb.id === selected.id);
    if (!textBox) return;
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowUp') textBox.y -= step;
    if (e.key === 'ArrowDown') textBox.y += step;
    if (e.key === 'ArrowLeft') textBox.x -= step;
    if (e.key === 'ArrowRight') textBox.x += step;
    renderFaces();
  }

  document.addEventListener('keydown', handleKeyDown);

  function cleanup() {
    document.removeEventListener('keydown', handleKeyDown);
    overlay.remove();
  }

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

  function renderFaces() {
    facesRow.innerHTML = '';
    facesRow.appendChild(renderFace('caraFrontal', 'Cara frontal'));
    facesRow.appendChild(adjustImageBtn);
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

    const faceShape =
      working.proporcion === 'circular' ||
      working.proporcion === 'hex-vertical' ||
      working.proporcion === 'hex-horizontal'
        ? working.proporcion
        : 'cuadrada';

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
          transparencia: working.caraFrontal.transparenciaImagen,
        },
        {
          key: 'caraTrasera',
          label: 'Trasera',
          shape: faceShape,
          width: designWidth,
          height: designHeight,
          resource: traseraResource,
          adjustment: working.caraTrasera.ajusteImagen,
          transparencia: working.caraTrasera.transparenciaImagen,
        },
      ],
      initialFocusKey: initialKey,
      onAccept: (adjustments) => {
        working.caraFrontal.ajusteImagen = {
          zoom: adjustments.caraFrontal.zoom,
          posX: adjustments.caraFrontal.posX,
          posY: adjustments.caraFrontal.posY,
        };
        working.caraFrontal.transparenciaImagen = adjustments.caraFrontal.transparencia;
        working.caraTrasera.ajusteImagen = {
          zoom: adjustments.caraTrasera.zoom,
          posX: adjustments.caraTrasera.posX,
          posY: adjustments.caraTrasera.posY,
        };
        working.caraTrasera.transparenciaImagen = adjustments.caraTrasera.transparencia;
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
    faceCol.style.width = `${canvasWidth}px`;

    const faceLabel = document.createElement('div');
    faceLabel.className = 'card-editor-modal__face-label';
    faceLabel.textContent = label;
    faceCol.appendChild(faceLabel);

    const canvas = document.createElement('div');
    canvas.className = 'card-editor-modal__canvas';
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvas.style.boxSizing = 'border-box';
    canvas.style.overflow = 'hidden';
    const canvasShape = getCartaShapeCss(working.proporcion);
    canvas.style.borderRadius = canvasShape.borderRadius;
    canvas.style.clipPath = canvasShape.clipPath;
    faceCol.appendChild(canvas);

    const isHexCanvas = working.proporcion === 'hex-vertical' || working.proporcion === 'hex-horizontal';

    const canvasInner = document.createElement('div');
    canvasInner.style.position = 'absolute';
    canvasInner.style.inset = '0';
    canvasInner.style.boxSizing = 'border-box';
    canvasInner.style.overflow = 'hidden';
    canvasInner.addEventListener('click', (e) => {
      if (e.target === canvasInner) deselectTextBox();
    });
    canvas.appendChild(canvasInner);

    // Ver fix 00096: las proporciones hexagonales no pueden usar `border`
    // CSS (dibuja paralelo a la caja rectangular, no a las aristas del
    // hexágono recortado con clip-path) — en su lugar, `canvas` (capa
    // exterior) se rellena del color de borde y `canvasInner` (donde va
    // el contenido) se recorta con un hexágono concéntrico más pequeño,
    // dejando visible el anillo entre ambos como borde de grosor uniforme.
    function applyCanvasBorder() {
      const bordeGrosor = cara.bordeGrosor ?? 0;
      if (isHexCanvas) {
        const hexInnerClipPath = getHexInnerClipPath(working.proporcion, canvasWidth, canvasHeight, bordeGrosor);
        canvas.style.border = 'none';
        canvas.style.backgroundColor = hexInnerClipPath ? (cara.bordeColor || '#000000') : '';
        canvasInner.style.clipPath = hexInnerClipPath || 'none';
      } else {
        canvas.style.backgroundColor = '';
        canvas.style.border = bordeGrosor > 0 ? `${bordeGrosor}px solid ${cara.bordeColor || '#000000'}` : '';
        canvasInner.style.clipPath = 'none';
      }
    }
    applyCanvasBorder();

    let faceImg = null;
    const resource = cara.imagenResourceId ? getResources().find((r) => r.id === cara.imagenResourceId) : null;
    if (resource) {
      faceImg = document.createElement('img');
      faceImg.src = resource.dataUrl;
      faceImg.draggable = false;
      faceImg.style.position = 'absolute';
      faceImg.style.top = '0';
      faceImg.style.left = '0';
      faceImg.style.pointerEvents = 'none';
      faceImg.style.opacity = String(1 - (cara.transparenciaImagen ?? 0) / 100);
      applyImageAdjustStyle(faceImg, cara.ajusteImagen);
      canvasInner.appendChild(faceImg);
    }

    for (const textBox of cara.textBoxes) {
      canvasInner.appendChild(renderTextBox(caraKey, textBox, previewScale));
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
          cara.transparenciaImagen = 0;
          renderFaces();
        },
      });
    });
    actionsRow.appendChild(chooseImageBtn);

    const addTextBoxBtn = document.createElement('button');
    addTextBoxBtn.type = 'button';
    addTextBoxBtn.className = 'btn-cancel';
    addTextBoxBtn.textContent = '+ Texto';
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

    // Borde de la carta completa (por cara). Fila color+grosor con la misma
    // excepción de estilo inline que ya usa componentModal.js (STYLE_BIBLE sección 8).
    const borderTitle = document.createElement('p');
    borderTitle.className = 'card-editor-modal__border-title';
    borderTitle.textContent = 'Borde';
    actionsRow.appendChild(borderTitle);

    const borderField = document.createElement('div');
    borderField.className = 'modal__field';
    borderField.style.width = '100%';
    const borderRowInner = document.createElement('div');
    borderRowInner.style.display = 'flex';
    borderRowInner.style.gap = '0.5rem';

    const borderColorField = document.createElement('div');
    borderColorField.style.flex = '1';
    const borderColorLabel = document.createElement('label');
    borderColorLabel.textContent = 'Color';
    const borderColorInput = document.createElement('input');
    borderColorInput.type = 'color';
    borderColorInput.value = cara.bordeColor || '#000000';
    borderColorInput.addEventListener('input', () => {
      cara.bordeColor = borderColorInput.value;
      applyCanvasBorder();
    });
    borderColorField.appendChild(borderColorLabel);
    borderColorField.appendChild(borderColorInput);

    const borderWidthField = document.createElement('div');
    borderWidthField.style.flex = '1';
    const borderWidthLabel = document.createElement('label');
    borderWidthLabel.textContent = 'Grosor (px)';
    const borderWidthInput = document.createElement('input');
    borderWidthInput.type = 'number';
    borderWidthInput.min = 0;
    borderWidthInput.max = 20;
    borderWidthInput.value = cara.bordeGrosor ?? 0;
    borderWidthInput.addEventListener('input', () => {
      const parsed = parseInt(borderWidthInput.value, 10);
      cara.bordeGrosor = Number.isNaN(parsed) ? 0 : Math.min(Math.max(parsed, 0), 20);
      applyCanvasBorder();
    });
    borderWidthField.appendChild(borderWidthLabel);
    borderWidthField.appendChild(borderWidthInput);

    borderRowInner.appendChild(borderColorField);
    borderRowInner.appendChild(borderWidthField);
    borderField.appendChild(borderRowInner);
    actionsRow.appendChild(borderField);

    faceCol.appendChild(actionsRow);

    return faceCol;
  }

  function renderTextBox(caraKey, textBox, previewScale) {
    const el = document.createElement('div');
    el.className = 'card-editor-modal__textbox';
    if (selected?.caraKey === caraKey && selected?.id === textBox.id) {
      el.classList.add('card-editor-modal__textbox--selected');
    }
    el.style.position = 'absolute';
    el.style.left = `${textBox.x * previewScale}px`;
    el.style.top = `${textBox.y * previewScale}px`;
    el.style.width = `${textBox.width * previewScale}px`;
    el.style.height = `${textBox.height * previewScale}px`;
    el.style.fontSize = `${textBox.tamañoFuente * previewScale}px`;
    el.style.color = textBox.color || '#000000';
    const fontResource = textBox.fuenteResourceId ? getResources().find((r) => r.id === textBox.fuenteResourceId) : null;
    if (fontResource) {
      el.style.fontFamily = fontFamilyFor(fontResource.id);
    }
    el.style.fontWeight = textBox.negrita ? 'bold' : 'normal';
    el.style.fontStyle = textBox.cursiva ? 'italic' : 'normal';
    el.style.textDecoration = textBox.subrayado ? 'underline' : 'none';
    el.style.border = textBox.bordeActivo
      ? `${textBox.bordeGrosor ?? 2}px ${textBox.bordeTipo === 'punteada' ? 'dashed' : 'solid'} ${textBox.bordeColor || '#000000'}`
      : 'none';
    el.style.backgroundColor = textBox.colorFondo || 'transparent';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    Object.assign(el.style, getTextBoxLayoutStyle(textBox, previewScale));
    el.textContent = textBox.contenido || '';

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectTextBox(caraKey, textBox.id);
    });

    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      deselectTextBox();
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
        onDuplicate: (workingTextBox) => {
          Object.assign(textBox, workingTextBox);
          const cara = working[caraKey];
          cara.textBoxes.push({
            ...workingTextBox,
            id: crypto.randomUUID(),
            x: workingTextBox.x + DUPLICATE_TEXT_BOX_OFFSET,
            y: workingTextBox.y + DUPLICATE_TEXT_BOX_OFFSET,
          });
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
  cancelBtn.addEventListener('click', () => cleanup());
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
    cleanup();
  });
  footer.appendChild(acceptBtn);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) cleanup();
  });
}
