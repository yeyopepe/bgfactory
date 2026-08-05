// Editor visual (cambio 00143, generalizado desde el antiguo "editor de
// cartas"): modal grande (overlay + modal, mismo patrón que el resto de la
// app, pero con más superficie de trabajo) para diseñar una o varias caras
// de un componente a la vez — imagen de fondo, formas geométricas y cuadros
// de texto. Abierta desde la pestaña "Específicas" de ui/componentModal.js
// tanto para 'carta' (dos caras, frontal/trasera, con proporción
// configurable y borde simple) como para 'tableroPersonalizado' (una única
// cara, sin proporción configurable — se redimensiona libremente en la
// mesa — y borde con bisel, igual que 'tableroSimple'/'dado').

import { getResources } from '../core/state.js';
import { CARD_PROPORTIONS, getProporcionRatio, getDesignSize, getCartaShapeCss, getHexInnerClipPath, getTriangleInnerClipPath, isRectShape } from '../core/cardProportions.js';
import { getTextBoxLayoutStyle } from '../core/textBoxLayout.js';
import { hexToRgba, shadeColor } from '../core/colorUtils.js';
import { applyImageAdjustStyle, openImageAdjustModal } from './imageAdjustModal.js';
import { openBoardImageModal } from './boardImageModal.js';
import { openCardTextBoxModal } from './cardTextBoxModal.js';
import { openCardShapeModal } from './cardShapeModal.js';
import { attachResizeHandle } from './resizeHandle.js';
import { fontFamilyFor } from './fontFaceRegistry.js';
import { createHelpIcon } from './helpIcon.js';
import { openContextMenu } from './contextMenu.js';
import { getOrderedFaceElements, bringElementToFront, sendElementToBack } from '../core/cardFaceElements.js';

const CANVAS_MAX_SIDE = 380;
const SHAPE_BORDER_RADIUS = { circular: '50%', redondeada: '8px' };
const MIN_TEXT_BOX_DESIGN_SIZE = 20;
const MIN_SHAPE_DESIGN_SIZE = 20;
const DUPLICATE_TEXT_BOX_OFFSET = 20;
const DUPLICATE_SHAPE_OFFSET = 20;
const NON_RECT_PROPORTIONS = ['circular', 'hex-vertical', 'hex-horizontal', 'triangulo', 'triangulo-invertido'];

function buildHelpHtml(showProporcionSelector) {
  return `
    <ul>
      ${showProporcionSelector ? '<li>Elegir la <b>proporción/forma</b> de la carta.</li>' : ''}
      <li>Elegir una <b>imagen</b> para cada cara${showProporcionSelector ? ' (frontal/trasera)' : ''} y ajustarla (zoom, posición, transparencia).</li>
      <li>Configurar el <b>borde</b> (color y grosor)${showProporcionSelector ? ', de forma independiente por cara' : ''}.</li>
      <li><b>Añadir</b> un cuadro de texto o una figura geométrica (círculo/elipse o cuadrado) nuevos, desde el botón "Añadir elemento".</li>
      <li><b>Mover</b> un cuadro de texto o figura arrastrándolo con el ratón.</li>
      <li><b>Redimensionar</b> un cuadro de texto o figura arrastrando su esquina (con Shift, una figura circular/elíptica mantiene proporción 1:1).</li>
      <li><b>Editar</b> el contenido y el estilo de un cuadro de texto o figura (haciendo doble clic sobre él).</li>
      <li><b>Seleccionar</b> un cuadro de texto o figura con un clic y moverlo con precisión usando las flechas del teclado (1px, o 10px con Shift).</li>
      <li><b>Maximizar</b> o restaurar el tamaño del editor con el botón de la cabecera.</li>
      <li><b>Aceptar</b> o <b>cancelar</b> los cambios hechos en el editor.</li>
    </ul>
  `;
}

// Iconos del menú contextual de elemento (cambio 00124): mismo patrón de
// funciones locales que createLockIcon/createShuffleIcon en
// modes/play/playMode.js — no hay ningún módulo de iconos compartido.
function createDeleteIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/>';
  return svg;
}

function createBringToFrontIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<rect x="7" y="7" width="12" height="12" rx="1"/><path d="M5 15V5a2 2 0 0 1 2-2h10" opacity="0.5"/>';
  return svg;
}

function createSendToBackIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<rect x="5" y="5" width="12" height="12" rx="1" opacity="0.5"/><path d="M9 19h8a2 2 0 0 0 2-2V9"/>';
  return svg;
}

function createCopyIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>';
  return svg;
}

function createPasteIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>';
  return svg;
}

function createMaximizeIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>';
  return svg;
}

function createRestoreIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5"/>';
  return svg;
}

function isTextEditableElement(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

function createAddElementMenu({ onAddImage, onAddTextBox, onAddShape }) {
  const wrap = document.createElement('div');
  wrap.className = 'resource-add';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'resource-add__button';
  button.textContent = 'Añadir elemento ▾';
  wrap.appendChild(button);

  const menu = document.createElement('div');
  menu.className = 'resource-add__menu';
  menu.hidden = true;

  function addItem(label, onClick) {
    const item = document.createElement('div');
    item.className = 'resource-add__item';

    const itemLabel = document.createElement('div');
    itemLabel.className = 'resource-add__item-label';
    itemLabel.textContent = label;
    item.appendChild(itemLabel);

    item.addEventListener('click', () => {
      closeMenu();
      if (onClick) onClick();
    });
    menu.appendChild(item);
  }

  addItem('Imagen de fondo…', onAddImage);
  addItem('Cuadro de texto', onAddTextBox);
  addItem('Figura geométrica', onAddShape);

  wrap.appendChild(menu);

  function closeMenu() {
    menu.hidden = true;
    document.removeEventListener('mousedown', handleOutsideClick);
  }

  function handleOutsideClick(e) {
    if (!wrap.contains(e.target)) closeMenu();
  }

  button.addEventListener('click', () => {
    if (menu.hidden) {
      menu.hidden = false;
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      closeMenu();
    }
  });

  return wrap;
}

function cloneCara(cara) {
  return {
    imagenResourceId: cara?.imagenResourceId ?? null,
    ajusteImagen: { ...(cara?.ajusteImagen || { zoom: 100, posX: 50, posY: 50 }) },
    textBoxes: (cara?.textBoxes || []).map((tb) => ({ ...tb })),
    formas: (cara?.formas || []).map((f) => ({ ...f })),
    bordeColor: cara?.bordeColor ?? '#000000',
    bordeGrosor: cara?.bordeGrosor ?? 0,
    transparenciaImagen: cara?.transparenciaImagen ?? 0,
  };
}

// `faces`: [{ key: string, label: string | null }] — 2 entradas
// (caraFrontal/caraTrasera) para 'carta', 1 (cara) para
// 'tableroPersonalizado'. `showProporcionSelector` oculta el desplegable de
// proporción/forma y el checkbox de esquinas redondeadas cuando el tipo no
// tiene proporción configurable (se redimensiona libremente en la mesa).
// `borderStyle` ('simple' | 'bisel') decide cómo se pinta el borde de cada
// cara — 'bisel' reutiliza el mismo criterio de dos tonos que
// 'tableroSimple'/'dado' (ui/componentRenderer.js).
export function openVisualEditorModal({ component, title, faces, showProporcionSelector = true, borderStyle = 'simple', onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal card-editor-modal';

  // Maximizar/restaurar (cambio 00132): variable local (no de módulo) a
  // openVisualEditorModal, para que cada apertura del editor arranque siempre
  // en tamaño normal, sin persistencia entre usos. Declarada antes de la
  // cabecera porque el botón de maximizar la usa de inmediato.
  let maximized = false;

  // Tamaño efectivo del lienzo de cada cara: en estado normal, la constante
  // fija de siempre (CANVAS_MAX_SIDE); maximizado, el hueco real disponible
  // en la ventana — dos lienzos + toolbar caben en el ancho, así que el alto
  // es el límite real.
  function getEffectiveCanvasMaxSide() {
    if (!maximized) return CANVAS_MAX_SIDE;
    return Math.min(window.innerHeight * 0.7, window.innerWidth * 0.42);
  }

  const header = document.createElement('div');
  header.className = 'modal__header';
  const headerTitle = document.createElement('span');
  headerTitle.textContent = title;
  header.appendChild(headerTitle);

  // Maximizar/restaurar (cambio 00132): interruptor entre tamaño normal y
  // ocupar prácticamente toda la ventana. No cierra el editor (eso sigue
  // siendo cosa de "Cancelar"/"Aceptar" en el pie).
  const maximizeBtn = document.createElement('button');
  maximizeBtn.type = 'button';
  maximizeBtn.className = 'card-editor-modal__maximize-btn';

  function updateMaximizeButton() {
    maximizeBtn.innerHTML = '';
    maximizeBtn.appendChild(maximized ? createRestoreIcon() : createMaximizeIcon());
    const label = maximized ? 'Restaurar tamaño' : 'Maximizar';
    maximizeBtn.title = label;
    maximizeBtn.setAttribute('aria-label', label);
  }
  updateMaximizeButton();

  maximizeBtn.addEventListener('click', () => {
    maximized = !maximized;
    modal.classList.toggle('card-editor-modal--maximized', maximized);
    updateMaximizeButton();
    renderFaces();
  });
  header.appendChild(maximizeBtn);

  header.appendChild(createHelpIcon({ html: buildHelpHtml(showProporcionSelector) }));
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const props = component.properties || {};
  const working = { proporcion: props.proporcion || '5:7', esquinasRedondeadas: props.esquinasRedondeadas !== false };
  for (const { key } of faces) {
    working[key] = cloneCara(props[key]);
  }

  // Tamaño de diseño del lienzo de cada cara: para 'carta' depende de la
  // proporción elegida (core/cardProportions.js). Para tipos sin proporción
  // configurable (cambio 00152, corrige el 00143), el lienzo es el tamaño
  // real que tiene el componente en este momento — el contenido se pinta
  // siempre en píxeles reales (sin ningún factor de escala), así que lo que
  // se ve al diseñar debe coincidir con el tamaño real del componente en la
  // mesa, no con un lienzo lógico fijo ajeno a ese tamaño.
  function getFaceDesignSize() {
    return showProporcionSelector
      ? getDesignSize(working.proporcion)
      : { width: component.width, height: component.height };
  }

  // Forma/recorte del lienzo: 'carta' recorta según su proporción (rectángulo
  // con esquinas opcionalmente redondeadas, círculo, hexágono o triángulo);
  // sin proporción configurable, el lienzo es siempre un rectángulo simple
  // (mismo criterio visual que 'tableroSimple', sin esquinas redondeadas).
  function getCanvasShape() {
    return showProporcionSelector
      ? getCartaShapeCss(working.proporcion, working.esquinasRedondeadas)
      : { borderRadius: '0', clipPath: 'none' };
  }

  let selected = null;

  function selectTextBox(caraKey, id) {
    selected = { caraKey, id, kind: 'texto' };
    renderFaces();
  }

  function selectShape(caraKey, id) {
    selected = { caraKey, id, kind: 'forma' };
    renderFaces();
  }

  function deselectTextBox() {
    if (!selected) return;
    selected = null;
    renderFaces();
  }

  // Elimina un elemento (texto o figura) de la cara indicada, compartida entre
  // la acción "Eliminar" del menú contextual y la tecla SUPR (cambio 00127).
  function removeElement(caraKey, kind, id) {
    const cara = working[caraKey];
    if (kind === 'forma') {
      cara.formas = cara.formas.filter((f) => f.id !== id);
    } else {
      cara.textBoxes = cara.textBoxes.filter((tb) => tb.id !== id);
    }
    selected = null;
    renderFaces();
  }

  function handleKeyDown(e) {
    if (!selected) return;
    if (isTextEditableElement(document.activeElement)) return;
    if (e.key === 'Delete') {
      e.preventDefault();
      removeElement(selected.caraKey, selected.kind, selected.id);
      return;
    }
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const cara = working[selected.caraKey];
    const collection = selected.kind === 'forma' ? cara.formas : cara.textBoxes;
    const element = collection.find((item) => item.id === selected.id);
    if (!element) return;
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowUp') element.y -= step;
    if (e.key === 'ArrowDown') element.y += step;
    if (e.key === 'ArrowLeft') element.x -= step;
    if (e.key === 'ArrowRight') element.x += step;
    renderFaces();
  }

  document.addEventListener('keydown', handleKeyDown);

  // Recalcular el tamaño del lienzo si la ventana cambia de tamaño estando
  // maximizado (cambio 00132, primer listener de `resize` del proyecto).
  function handleWindowResize() {
    if (!maximized) return;
    renderFaces();
  }
  window.addEventListener('resize', handleWindowResize);

  function cleanup() {
    document.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', handleWindowResize);
    overlay.remove();
  }

  // Toolbar: proporción — solo para tipos con proporción configurable
  // (hoy únicamente 'carta'; 'tableroPersonalizado' se redimensiona
  // libremente en la mesa, como 'tableroSimple', y no tiene este control).
  const toolbar = document.createElement('div');
  toolbar.className = 'card-editor-modal__toolbar';
  let redondeoField = null;

  if (showProporcionSelector) {
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
    proporcionField.appendChild(proporcionLabel);
    proporcionField.appendChild(proporcionSelect);
    toolbar.appendChild(proporcionField);

    // Esquinas redondeadas (cambio 00117): solo aplica a las proporciones
    // rectangulares/cuadrada — Circular/Hexagonal mantienen su silueta fija.
    redondeoField = document.createElement('div');
    redondeoField.className = 'modal__field modal__field--checkbox';
    const redondeoCheckbox = document.createElement('input');
    redondeoCheckbox.type = 'checkbox';
    redondeoCheckbox.id = 'card-editor-esquinas-redondeadas';
    redondeoCheckbox.checked = working.esquinasRedondeadas;
    const redondeoLabel = document.createElement('label');
    redondeoLabel.textContent = 'Esquinas redondeadas';
    redondeoLabel.setAttribute('for', redondeoCheckbox.id);
    redondeoCheckbox.addEventListener('change', () => {
      working.esquinasRedondeadas = redondeoCheckbox.checked;
      renderFaces();
    });
    redondeoField.appendChild(redondeoCheckbox);
    redondeoField.appendChild(redondeoLabel);
    toolbar.appendChild(redondeoField);

    function updateRedondeoFieldVisibility() {
      redondeoField.style.display = isRectShape(working.proporcion) ? '' : 'none';
    }
    updateRedondeoFieldVisibility();

    proporcionSelect.addEventListener('change', () => {
      working.proporcion = proporcionSelect.value;
      updateRedondeoFieldVisibility();
      renderFaces();
    });
  }

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
    faces.forEach(({ key, label }, index) => {
      facesRow.appendChild(renderFace(key, label));
      // El botón "Ajustar imagen…" va entre las dos caras cuando hay dos
      // (comportamiento original de 'carta'); con una única cara, al final.
      if (index < faces.length - 1) facesRow.appendChild(adjustImageBtn);
    });
    if (faces.length === 1) facesRow.appendChild(adjustImageBtn);
    adjustImageBtn.disabled = faces.every(({ key }) => !working[key].imagenResourceId);

    // El margen fijo de la hoja de estilos (8.75rem) asume el alto de
    // lienzo del tamaño normal, para quedar centrado junto a las caras.
    // Maximizado, el lienzo crece y ese valor fijo ya no centra el botón —
    // se calcula en JS (excepción ya documentada en STYLE_BIBLE sección 8
    // para valores que dependen de un cálculo numérico en tiempo de
    // ejecución, no expresables como clase).
    if (maximized) {
      const { width: designWidth, height: designHeight } = getFaceDesignSize();
      const canvasHeight = designHeight * (getEffectiveCanvasMaxSide() / Math.max(designWidth, designHeight));
      adjustImageBtn.style.marginTop = `${canvasHeight / 2 - adjustImageBtn.offsetHeight / 2}px`;
    } else {
      adjustImageBtn.style.marginTop = '';
    }
  }

  function openAdjustSession() {
    const initialFace = faces.find(({ key }) => working[key].imagenResourceId);
    if (!initialFace) return;

    const { width: designWidth, height: designHeight } = getFaceDesignSize();
    const faceShape = showProporcionSelector && NON_RECT_PROPORTIONS.includes(working.proporcion)
      ? working.proporcion
      : 'cuadrada';

    openImageAdjustModal({
      faces: faces.map(({ key, label }) => {
        const cara = working[key];
        const resource = cara.imagenResourceId ? getResources().find((r) => r.id === cara.imagenResourceId) : null;
        return {
          key,
          label: label || 'Diseño',
          shape: faceShape,
          width: designWidth,
          height: designHeight,
          resource,
          adjustment: cara.ajusteImagen,
          transparencia: cara.transparenciaImagen,
        };
      }),
      initialFocusKey: initialFace.key,
      onAccept: (adjustments) => {
        faces.forEach(({ key }) => {
          const adjustment = adjustments[key];
          working[key].ajusteImagen = {
            zoom: adjustment.zoom,
            posX: adjustment.posX,
            posY: adjustment.posY,
            rotation: adjustment.rotation,
          };
          working[key].transparenciaImagen = adjustment.transparencia;
        });
        renderFaces();
      },
    });
  }

  // Convierte una posición de pantalla (clientX/clientY) a coordenadas de
  // diseño de una cara (cambio 00127), usando el mismo criterio de escala que
  // el arrastre/redimensionado de elementos (previewScale).
  function screenToDesignPoint(canvas, previewScale, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / previewScale,
      y: (clientY - rect.top) / previewScale,
    };
  }

  let copiedElement = null;

  function pasteElementAt(caraKey, point) {
    if (!copiedElement) return;
    const cara = working[caraKey];
    const newId = crypto.randomUUID();
    const newElement = { ...copiedElement.data, id: newId, x: point.x, y: point.y };
    if (copiedElement.kind === 'forma') {
      cara.formas.push(newElement);
    } else {
      cara.textBoxes.push(newElement);
    }
    bringElementToFront(cara, copiedElement.kind, newId);
    if (copiedElement.kind === 'forma') {
      selectShape(caraKey, newId);
    } else {
      selectTextBox(caraKey, newId);
    }
  }

  // Menú contextual (click derecho) de una cara (cambio 00124, ampliado en el
  // 00127): mismo componente reutilizable que el menú contextual de
  // componentes en la mesa (modes/play/playMode.js), sin secciones de
  // descripción/específicas/interacciones. `kind`/`id` solo están presentes
  // si el click derecho fue sobre un elemento existente — si fue sobre una
  // zona vacía del lienzo, el menú se reduce a "Pegar".
  function openElementContextMenu({ x, y, caraKey, kind, id, pastePoint }) {
    const cara = working[caraKey];
    const generalItems = [];

    if (kind && id) {
      generalItems.push({
        icon: createCopyIcon(),
        label: 'Copiar',
        onClick: () => {
          const collection = kind === 'forma' ? cara.formas : cara.textBoxes;
          const element = collection.find((item) => item.id === id);
          if (!element) return;
          const { id: _omit, ...data } = element;
          copiedElement = { kind, data };
        },
      });
    }

    generalItems.push({
      icon: createPasteIcon(),
      label: 'Pegar',
      disabled: !copiedElement,
      onClick: () => pasteElementAt(caraKey, pastePoint),
    });

    if (kind && id) {
      generalItems.push(
        {
          icon: createDeleteIcon(),
          label: 'Eliminar',
          onClick: () => removeElement(caraKey, kind, id),
        },
        {
          icon: createBringToFrontIcon(),
          label: 'Colocar arriba',
          onClick: () => {
            bringElementToFront(cara, kind, id);
            renderFaces();
          },
        },
        {
          icon: createSendToBackIcon(),
          label: 'Colocar abajo',
          onClick: () => {
            sendElementToBack(cara, kind, id);
            renderFaces();
          },
        },
      );
    }

    openContextMenu({ x, y, generalItems });
  }

  function renderFace(caraKey, label) {
    const cara = working[caraKey];
    const { width: designWidth, height: designHeight } = getFaceDesignSize();
    const previewScale = getEffectiveCanvasMaxSide() / Math.max(designWidth, designHeight);
    const canvasWidth = designWidth * previewScale;
    const canvasHeight = designHeight * previewScale;

    const faceCol = document.createElement('div');
    faceCol.className = 'card-editor-modal__face';
    faceCol.style.width = `${canvasWidth}px`;

    if (label) {
      const faceLabel = document.createElement('div');
      faceLabel.className = 'card-editor-modal__face-label';
      faceLabel.textContent = label;
      faceCol.appendChild(faceLabel);
    }

    const canvas = document.createElement('div');
    canvas.className = 'card-editor-modal__canvas';
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvas.style.boxSizing = 'border-box';
    canvas.style.overflow = 'hidden';
    const canvasShape = getCanvasShape();
    canvas.style.borderRadius = canvasShape.borderRadius;
    canvas.style.clipPath = canvasShape.clipPath;
    faceCol.appendChild(canvas);

    const isHexCanvas = showProporcionSelector && (working.proporcion === 'hex-vertical' || working.proporcion === 'hex-horizontal');
    const isTriangleCanvas = showProporcionSelector && (working.proporcion === 'triangulo' || working.proporcion === 'triangulo-invertido');

    const canvasInner = document.createElement('div');
    canvasInner.style.position = 'absolute';
    canvasInner.style.inset = '0';
    canvasInner.style.boxSizing = 'border-box';
    canvasInner.style.overflow = 'hidden';
    canvasInner.addEventListener('click', (e) => {
      if (e.target === canvasInner) deselectTextBox();
    });
    // Click derecho en zona vacía del lienzo (cambio 00127): los listeners
    // `contextmenu` de cada elemento (renderTextBox/renderShape) hacen
    // stopPropagation, así que este solo se dispara cuando el click fue
    // fuera de cualquier elemento.
    canvasInner.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // El punto de pegado se calcula antes de deseleccionar: deselectTextBox()
      // puede disparar renderFaces() y reconstruir el DOM, dejando `canvas`
      // desmontado (getBoundingClientRect() devolvería ceros).
      const pastePoint = screenToDesignPoint(canvas, previewScale, e.clientX, e.clientY);
      deselectTextBox();
      openElementContextMenu({ x: e.clientX, y: e.clientY, caraKey, pastePoint });
    });
    canvas.appendChild(canvasInner);

    // Ver fix 00096 (extendido a triángulo en el cambio 00134): las
    // proporciones hexagonales y triangulares no pueden usar `border` CSS
    // (dibuja paralelo a la caja rectangular, no a las aristas de la
    // silueta recortada con clip-path) — en su lugar, `canvas` (capa
    // exterior) se rellena del color de borde y `canvasInner` (donde va
    // el contenido) se recorta con una silueta concéntrica más pequeña,
    // dejando visible el anillo entre ambos como borde de grosor uniforme.
    // Con `borderStyle === 'bisel'` (cambio 00143, 'tableroPersonalizado'),
    // el borde se pinta con el mismo criterio de dos tonos que
    // 'tableroSimple'/'dado' en vez de una línea simple — solo aplicable a
    // tipos sin proporción no rectangular, así que nunca convive con la rama
    // hex/triángulo de arriba.
    function applyCanvasBorder() {
      const bordeGrosor = cara.bordeGrosor ?? 0;
      if (isHexCanvas || isTriangleCanvas) {
        const innerClipPath = isHexCanvas
          ? getHexInnerClipPath(working.proporcion, canvasWidth, canvasHeight, bordeGrosor)
          : getTriangleInnerClipPath(working.proporcion, canvasWidth, canvasHeight, bordeGrosor);
        canvas.style.border = 'none';
        canvas.style.backgroundColor = innerClipPath ? (cara.bordeColor || '#000000') : '';
        canvasInner.style.clipPath = innerClipPath || 'none';
      } else if (borderStyle === 'bisel') {
        const bordeColor = cara.bordeColor || '#000000';
        canvas.style.backgroundColor = '';
        canvas.style.border = 'none';
        canvas.style.borderStyle = 'solid';
        canvas.style.borderWidth = `${bordeGrosor}px`;
        canvas.style.borderTopColor = shadeColor(bordeColor, 0.35);
        canvas.style.borderLeftColor = shadeColor(bordeColor, 0.35);
        canvas.style.borderBottomColor = shadeColor(bordeColor, -0.35);
        canvas.style.borderRightColor = shadeColor(bordeColor, -0.35);
        canvasInner.style.clipPath = 'none';
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
      applyImageAdjustStyle(faceImg, cara.ajusteImagen, canvasWidth, canvasHeight);
      canvasInner.appendChild(faceImg);
    }

    for (const { kind, element } of getOrderedFaceElements(cara)) {
      if (kind === 'forma') {
        canvasInner.appendChild(renderShape(caraKey, element, previewScale, canvas));
      } else {
        canvasInner.appendChild(renderTextBox(caraKey, element, previewScale, canvas));
      }
    }

    const actionsRow = document.createElement('div');
    actionsRow.className = 'card-editor-modal__face-actions';

    actionsRow.appendChild(
      createAddElementMenu({
        onAddImage: () => {
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
        },
        onAddTextBox: () => {
          const w = designWidth * 0.5;
          const h = designHeight * 0.15;
          const id = crypto.randomUUID();
          cara.textBoxes.push({
            id,
            contenido: '',
            fuenteResourceId: null,
            tamañoFuente: 16,
            color: '#000000',
            x: (designWidth - w) / 2,
            y: (designHeight - h) / 2,
            width: w,
            height: h,
          });
          bringElementToFront(cara, 'texto', id);
          renderFaces();
        },
        onAddShape: () => {
          const side = designWidth * 0.3;
          const id = crypto.randomUUID();
          cara.formas.push({
            id,
            tipo: 'circular',
            colorFondo: '',
            bordeColor: '#000000',
            bordeGrosor: 2,
            bordeActivo: true,
            x: (designWidth - side) / 2,
            y: (designHeight - side) / 2,
            width: side,
            height: side,
          });
          bringElementToFront(cara, 'forma', id);
          renderFaces();
        },
      }),
    );

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

  function renderTextBox(caraKey, textBox, previewScale, canvas) {
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
    el.style.backgroundColor = hexToRgba(textBox.colorFondo, textBox.colorFondoTransparencia ?? 0);
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
          selected = null;
          renderFaces();
        },
        onDuplicate: (workingTextBox) => {
          Object.assign(textBox, workingTextBox);
          const cara = working[caraKey];
          const duplicateId = crypto.randomUUID();
          cara.textBoxes.push({
            ...workingTextBox,
            id: duplicateId,
            x: workingTextBox.x + DUPLICATE_TEXT_BOX_OFFSET,
            y: workingTextBox.y + DUPLICATE_TEXT_BOX_OFFSET,
          });
          bringElementToFront(cara, 'texto', duplicateId);
          renderFaces();
        },
      });
    });

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Igual que en canvasInner: calcular el punto de pegado antes de
      // seleccionar, que reconstruye el DOM vía renderFaces().
      const pastePoint = screenToDesignPoint(canvas, previewScale, e.clientX, e.clientY);
      selectTextBox(caraKey, textBox.id);
      openElementContextMenu({ x: e.clientX, y: e.clientY, caraKey, kind: 'texto', id: textBox.id, pastePoint });
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

    const clampTextBoxSize = ({ width, height }) => ({
      width: Math.max(width, MIN_TEXT_BOX_DESIGN_SIZE),
      height: Math.max(height, MIN_TEXT_BOX_DESIGN_SIZE),
    });

    attachResizeHandle(el, {
      axis: 'both',
      getScale: () => previewScale,
      getSize: () => ({ width: textBox.width, height: textBox.height }),
      clamp: clampTextBoxSize,
      onResize: ({ width, height }) => {
        el.style.width = `${width * previewScale}px`;
        el.style.height = `${height * previewScale}px`;
      },
      onResizeEnd: ({ width, height }) => {
        textBox.width = width;
        textBox.height = height;
      },
    });

    const tlStart = { x: 0, y: 0 };
    attachResizeHandle(el, {
      axis: 'both',
      corner: 'tl',
      getScale: () => previewScale,
      getSize: () => {
        tlStart.x = textBox.x;
        tlStart.y = textBox.y;
        return { width: textBox.width, height: textBox.height };
      },
      clamp: clampTextBoxSize,
      onResize: ({ width, height, dx, dy }) => {
        textBox.x = tlStart.x + dx;
        textBox.y = tlStart.y + dy;
        el.style.left = `${textBox.x * previewScale}px`;
        el.style.top = `${textBox.y * previewScale}px`;
        el.style.width = `${width * previewScale}px`;
        el.style.height = `${height * previewScale}px`;
      },
      onResizeEnd: ({ width, height, dx, dy }) => {
        textBox.x = tlStart.x + dx;
        textBox.y = tlStart.y + dy;
        textBox.width = width;
        textBox.height = height;
      },
    });

    return el;
  }

  function renderShape(caraKey, shape, previewScale, canvas) {
    const el = document.createElement('div');
    el.className = 'card-editor-modal__shape';
    if (selected?.kind === 'forma' && selected?.caraKey === caraKey && selected?.id === shape.id) {
      el.classList.add('card-editor-modal__shape--selected');
    }
    el.style.position = 'absolute';
    el.style.left = `${shape.x * previewScale}px`;
    el.style.top = `${shape.y * previewScale}px`;
    el.style.width = `${shape.width * previewScale}px`;
    el.style.height = `${shape.height * previewScale}px`;
    el.style.borderRadius = SHAPE_BORDER_RADIUS[shape.tipo] || '0';
    el.style.border = shape.bordeActivo !== false ? `${shape.bordeGrosor}px solid ${shape.bordeColor || '#000000'}` : 'none';
    el.style.boxSizing = 'border-box';

    const shapeResource = shape.fondoTipo === 'imagen' && shape.imagenResourceId
      ? getResources().find((r) => r.id === shape.imagenResourceId)
      : null;
    if (shapeResource) {
      const imgWrapper = document.createElement('div');
      imgWrapper.style.position = 'absolute';
      imgWrapper.style.inset = '0';
      imgWrapper.style.overflow = 'hidden';
      imgWrapper.style.borderRadius = SHAPE_BORDER_RADIUS[shape.tipo] || '0';
      const shapeImg = document.createElement('img');
      shapeImg.src = shapeResource.dataUrl;
      shapeImg.draggable = false;
      shapeImg.style.position = 'absolute';
      shapeImg.style.top = '0';
      shapeImg.style.left = '0';
      applyImageAdjustStyle(shapeImg, shape.ajusteImagen, shape.width * previewScale, shape.height * previewScale);
      imgWrapper.appendChild(shapeImg);
      el.appendChild(imgWrapper);
    } else {
      el.style.backgroundColor = hexToRgba(shape.colorFondo, shape.colorFondoTransparencia ?? 0);
    }

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectShape(caraKey, shape.id);
    });

    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      deselectTextBox();
      openCardShapeModal({
        shape,
        onAccept: (updated) => {
          Object.assign(shape, updated);
          renderFaces();
        },
        onDelete: () => {
          const cara = working[caraKey];
          cara.formas = cara.formas.filter((f) => f.id !== shape.id);
          selected = null;
          renderFaces();
        },
        onDuplicate: (workingShape) => {
          Object.assign(shape, workingShape);
          const cara = working[caraKey];
          const duplicateId = crypto.randomUUID();
          cara.formas.push({
            ...workingShape,
            id: duplicateId,
            x: workingShape.x + DUPLICATE_SHAPE_OFFSET,
            y: workingShape.y + DUPLICATE_SHAPE_OFFSET,
          });
          bringElementToFront(cara, 'forma', duplicateId);
          renderFaces();
        },
      });
    });

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Igual que en canvasInner: calcular el punto de pegado antes de
      // seleccionar, que reconstruye el DOM vía renderFaces().
      const pastePoint = screenToDesignPoint(canvas, previewScale, e.clientX, e.clientY);
      selectShape(caraKey, shape.id);
      openElementContextMenu({ x: e.clientX, y: e.clientY, caraKey, kind: 'forma', id: shape.id, pastePoint });
    });

    let startMouseX = 0;
    let startMouseY = 0;
    let startX = shape.x;
    let startY = shape.y;

    function handleMouseMove(e) {
      shape.x = startX + (e.clientX - startMouseX) / previewScale;
      shape.y = startY + (e.clientY - startMouseY) / previewScale;
      el.style.left = `${shape.x * previewScale}px`;
      el.style.top = `${shape.y * previewScale}px`;
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
      startX = shape.x;
      startY = shape.y;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });

    const clampShapeSize = ({ width, height }) => ({
      width: Math.max(width, MIN_SHAPE_DESIGN_SIZE),
      height: Math.max(height, MIN_SHAPE_DESIGN_SIZE),
    });

    attachResizeHandle(el, {
      axis: 'both',
      getScale: () => previewScale,
      getSize: () => ({ width: shape.width, height: shape.height }),
      clamp: clampShapeSize,
      onResize: ({ width, height }) => {
        el.style.width = `${width * previewScale}px`;
        el.style.height = `${height * previewScale}px`;
      },
      onResizeEnd: ({ width, height }) => {
        shape.width = width;
        shape.height = height;
      },
    });

    const tlStart = { x: 0, y: 0 };
    attachResizeHandle(el, {
      axis: 'both',
      corner: 'tl',
      getScale: () => previewScale,
      getSize: () => {
        tlStart.x = shape.x;
        tlStart.y = shape.y;
        return { width: shape.width, height: shape.height };
      },
      clamp: clampShapeSize,
      onResize: ({ width, height, dx, dy }) => {
        shape.x = tlStart.x + dx;
        shape.y = tlStart.y + dy;
        el.style.left = `${shape.x * previewScale}px`;
        el.style.top = `${shape.y * previewScale}px`;
        el.style.width = `${width * previewScale}px`;
        el.style.height = `${height * previewScale}px`;
      },
      onResizeEnd: ({ width, height, dx, dy }) => {
        shape.x = tlStart.x + dx;
        shape.y = tlStart.y + dy;
        shape.width = width;
        shape.height = height;
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
      const result = {};
      if (showProporcionSelector) {
        result.proporcion = working.proporcion;
        result.esquinasRedondeadas = working.esquinasRedondeadas;
      }
      for (const { key } of faces) {
        result[key] = working[key];
      }
      onAccept(result);
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
