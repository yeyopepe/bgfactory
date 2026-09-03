// Editor visual: modal grande (overlay + modal, mismo patrón que el resto de
// la app, pero con más superficie de trabajo) para diseñar una o varias caras
// de un componente a la vez — imagen de fondo, formas geométricas y cuadros
// de texto. Abierta desde la pestaña "Específicas" de ui/componentModal.js
// tanto para 'carta' (dos caras, frontal/trasera, con proporción
// configurable y borde simple) como para 'tableroPersonalizado' (una única
// cara, sin proporción configurable — se redimensiona libremente en la
// mesa — y borde con bisel, igual que 'tableroSimple'/'dado').

import { getResources } from '../core/state.js';
import { CARD_PROPORTIONS, getProporcionRatio, getCartaShapeCss, getHexInnerClipPath, getTriangleInnerClipPath, isRectShape } from '../core/cardProportions.js';
import { getTextBoxLayoutStyle } from '../core/textBoxLayout.js';
import { hexToRgba, shadeColor } from '../core/colorUtils.js';
import { applyImageAdjustStyle, openImageAdjustModal } from './imageAdjustModal.js';
import { openBoardImageModal } from './boardImageModal.js';
import { openCardBackgroundColorModal } from './cardBackgroundColorModal.js';
import { openCardTextBoxModal } from './cardTextBoxModal.js';
import { openCardShapeModal } from './cardShapeModal.js';
import { attachResizeHandle } from './resizeHandle.js';
import { fontFamilyFor } from './fontFaceRegistry.js';
import { createHelpIcon } from './helpIcon.js';
import { openContextMenu } from './contextMenu.js';
import { getOrderedFaceElements, bringElementToFront, sendElementToBack } from '../core/cardFaceElements.js';

const CANVAS_MAX_SIDE = 380;
// Suelo del lado de lienzo cuando la modal se encoge al mínimo con los
// manejadores de esquina (cambio 00225): getEffectiveCanvasMaxSide() nunca
// devuelve menos que esto en la rama de tamaño manual.
const CANVAS_MIN_SIDE = 140;
// Tamaño mínimo de la modal del editor al redimensionarla a mano (cambio
// 00225): el necesario para seguir mostrando cabecera, toolbar y al menos un
// lienzo a un tamaño utilizable, sin ocultar el pie con "Aceptar/Cancelar".
const MIN_EDITOR_MODAL_WIDTH = 420;
const MIN_EDITOR_MODAL_HEIGHT = 360;
// Alto aproximado del "cromo" vertical de la modal (cabecera + toolbar + fila
// de acciones + pie + gaps) que no es lienzo, para derivar el lado de lienzo
// disponible a partir del alto manual sin depender de medidas de layout
// frágiles durante el arrastre.
const EDITOR_CHROME_V = 210;
// Holgura (px) para que el lienzo no toque los bordes del hueco interior de
// trabajo de `.modal__content` ni fuerce scroll por redondeos de medida
// (cambio 00235). Se resta del alto y del ancho disponibles calculados en
// runtime por getEditorWorkArea().
const EDITOR_WORK_MARGIN = 24;
// Fallback defensivo si el componente no tuviera aún `width`/`height`
// (no debería ocurrir: 'carta'/'tableroPersonalizado' siempre nacen con
// tamaño fijo) para no dividir por 0 al calcular el lienzo de diseño.
const DEFAULT_DESIGN_WIDTH_FALLBACK = 180;
const SHAPE_BORDER_RADIUS = { circular: '50%', redondeada: '8px' };
const MIN_TEXT_BOX_DESIGN_SIZE = 20;
const MIN_SHAPE_DESIGN_SIZE = 20;
const DUPLICATE_TEXT_BOX_OFFSET = 20;
const DUPLICATE_SHAPE_OFFSET = 20;
const NON_RECT_PROPORTIONS = ['circular', 'hex-vertical', 'hex-horizontal', 'triangulo', 'triangulo-invertido'];

// Portapapeles de "Copiar/Pegar" de un elemento de cara (forma o texto).
// Variable de módulo, no local a openVisualEditorModal, para que sobreviva a
// cerrar y reabrir el editor sobre un componente distinto (otra carta, otro
// tablero personalizado) — mismo patrón de estado transitorio a nivel de
// módulo que selectedComponentId/panelStackOrder en modes/edit/editMode.js.
// No se persiste en core/state.js: se pierde al recargar la página.
let copiedElement = null;

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
      <li><b>Redimensionar</b> la ventana del editor arrastrando el manejador de su esquina inferior derecha o superior izquierda.</li>
      <li><b>Maximizar</b> o restaurar el tamaño del editor con el botón de la cabecera.</li>
      <li><b>Aceptar</b> o <b>cancelar</b> los cambios hechos en el editor.</li>
    </ul>
  `;
}

// Iconos del menú contextual de elemento: mismo patrón de funciones locales
// que createLockIcon/createShuffleIcon en modes/play/playMode.js — no hay
// módulo de iconos compartido.
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

function createRotateIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v5h5"/>';
  return svg;
}

// Envuelve al extremo opuesto del rango -360..360 (720 = tamaño del rango) en vez de
// cortar, para preservar el carácter cíclico del atajo "Girar 90°" con el rango ampliado.
function wrapRotation(value) {
  if (value > 360) return value - 720;
  if (value < -360) return value + 720;
  return value;
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

function createAddElementMenu({ onAddImage, onAddColor, onAddTextBox, onAddShape }) {
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
  addItem('Color de fondo…', onAddColor);
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
    // 'imagen'/ausente se comportan igual (pinta imagenResourceId si existe):
    // solo 'color' activa el camino nuevo, para no romper caras guardadas
    // sin este campo.
    fondoTipo: cara?.fondoTipo,
    colorFondo: cara?.colorFondo ?? '#ffffff',
  };
}

// `faces`: [{ key: string, label: string | null }] — 2 entradas
// (caraFrontal/caraTrasera) para 'carta', 1 (cara) para
// 'tableroPersonalizado'. `showProporcionSelector` oculta el desplegable de
// proporción/forma y el checkbox de esquinas redondeadas cuando el tipo no
// tiene proporción configurable (se redimensiona libremente en la mesa).
// `borderStyle` ('simple' | 'bisel') decide cómo se pinta el borde de cada
// cara — 'bisel' reutiliza el mismo criterio de dos tonos que
// 'tableroSimple'/'dado' (ui/componentRenderer.js). `bevelEnabled` (cambio
// 00154, solo relevante con `borderStyle === 'bisel'`) refleja el checkbox
// "Biselado en el borde" de las propiedades específicas de
// 'tableroPersonalizado' en el momento de abrir el editor — no reactivo
// mientras está abierto, ese checkbox no es editable desde aquí.
export function openVisualEditorModal({ component, title, faces, showProporcionSelector = true, borderStyle = 'simple', bevelEnabled = true, onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal card-editor-modal';

  // Maximizar/restaurar: variable local (no de módulo) a openVisualEditorModal,
  // para que cada apertura arranque en tamaño normal, sin persistencia entre
  // usos. Declarada antes de la
  // cabecera porque el botón de maximizar la usa de inmediato.
  let maximized = false;

  // Tamaño "normal" fijado a mano con los manejadores de esquina de la modal
  // (cambio 00225). `null` = tamaño normal por defecto (comportamiento de
  // siempre, `width: fit-content` centrado por flexbox); `{ width, height }`
  // en px = tamaño elegido por el usuario arrastrando un manejador. `maximizar`
  // lo ignora temporalmente y "Restaurar" lo descarta (vuelve siempre al tamaño
  // por defecto, cambio 00233). No se persiste entre aperturas, igual que
  // `maximized`.
  let manualSize = null;

  // Tamaño efectivo del lienzo de cada cara (escalar: "lado máximo"; sus dos
  // llamadores lo dividen por Math.max(designWidth, designHeight) para sacar
  // `previewScale`). Dos ramas:
  // - estado por defecto (ni maximizado ni tamaño manual): constante fija.
  // - maximizado o con tamaño manual: el lienzo se escala para caber a la vez
  //   en el ancho por cara Y el alto del hueco interior REAL de
  //   `.modal__content` (medido por getEditorWorkArea()), manteniendo la
  //   proporción del diseño — topa contra la primera de las dos restricciones,
  //   único suelo CANVAS_MIN_SIDE, sin techo. El sobrante en la otra dimensión
  //   lo centra el CSS scoped a `.card-editor-modal`, sin scroll.
  // Doc de referencia completa (capas, convergencia, gotchas):
  // previo-sdd/design/docs/architecture/006-ui-layer.md § "Window sizing".
  function getEffectiveCanvasMaxSide() {
    if (maximized || manualSize) {
      const { width: dW, height: dH } = getFaceDesignSize();
      const longSide = Math.max(dW, dH);
      const { availWidthPerFace, availHeight } = getEditorWorkArea();
      // "lado" tal que canvasWidth = dW * (lado / longSide) <= availWidthPerFace
      const sideFromWidth = availWidthPerFace * longSide / dW;
      // "lado" tal que canvasHeight = dH * (lado / longSide) <= availHeight
      const sideFromHeight = availHeight * longSide / dH;
      return Math.max(
        CANVAS_MIN_SIDE,
        Math.min(sideFromWidth, sideFromHeight),
      );
    }
    return CANVAS_MAX_SIDE;
  }

  // Mide en runtime el hueco interior de trabajo real de `.modal__content`
  // (cambio 00235). Devuelve `{ availWidthPerFace, availHeight }` en px: el
  // ancho que le toca a cada cara y el alto disponibles para el/los lienzo(s)
  // una vez descontado el "cromo" (toolbar, etiqueta y fila de acciones por
  // cara, gaps, padding) y un margen de respiro EDITOR_WORK_MARGIN.
  // [gotcha] Sólo se invoca desde las ramas `maximized`/`manualSize` de
  // getEffectiveCanvasMaxSide(), que siempre corren tras un gesto del usuario
  // con `overlay` ya en el DOM; nunca desde el primer render (la rama por
  // defecto no mide). Mide la etiqueta y la fila de acciones del render
  // anterior aún montado; si no hay ninguna cara montada todavía, cae a la
  // estimación constante EDITOR_CHROME_V para todo el cromo vertical junto.
  function getEditorWorkArea() {
    const cs = getComputedStyle(content);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

    // `clientHeight`/`clientWidth` excluyen scrollbar pero incluyen padding:
    // se resta explícitamente.
    const inner = content.clientHeight - padY;
    const rowW = content.clientWidth - padX;

    const toolbarH = toolbar.offsetHeight; // 0 si showProporcionSelector es false
    const facesGap = 16; // gap 0.5rem × 2 dentro de `.card-editor-modal__face`

    const sampleFace = facesRow.querySelector('.card-editor-modal__face');
    let availHeight;
    if (sampleFace) {
      const faceLabelH = sampleFace.querySelector('.card-editor-modal__face-label')?.offsetHeight ?? 0;
      const actionsH = sampleFace.querySelector('.card-editor-modal__face-actions')?.offsetHeight ?? 0;
      availHeight = Math.max(
        CANVAS_MIN_SIDE,
        inner - toolbarH - faceLabelH - actionsH - facesGap - EDITOR_WORK_MARGIN,
      );
    } else {
      // Sin cara del render anterior que medir: estimación constante conjunta.
      availHeight = Math.max(CANVAS_MIN_SIDE, inner - EDITOR_CHROME_V - EDITOR_WORK_MARGIN);
    }

    // El botón "Ajustar imagen…" va intercalado sólo con 2 caras; con 1 cara
    // va debajo y no roba ancho a la fila. Los gaps de `.card-editor-modal__faces`
    // son 0.5rem entre cada par de hijos (caras + botón intercalado).
    const GAP = 8; // 0.5rem
    const adjustBtnSpace = faces.length === 2 ? adjustImageBtn.offsetWidth + GAP : 0;
    const facesRowGaps = GAP * (faces.length - 1 + (faces.length === 2 ? 1 : 0));
    const availWidthPerFace = Math.max(
      CANVAS_MIN_SIDE,
      (rowW - adjustBtnSpace - facesRowGaps) / faces.length,
    );

    return { availWidthPerFace, availHeight };
  }

  // Congela la modal a posición absoluta con su geometría actual, sacándola del
  // centrado flexbox de `.modal-overlay` sin moverla (cambio 00225). Necesario
  // para que el manejador de esquina superior izquierda tenga una esquina
  // inferior derecha estable que anclar — mismo ajuste que hace
  // ui/componentList.js al iniciar el arrastre de su cabecera.
  function freezeModalGeometry() {
    if (modal.style.position === 'fixed') return;
    const rect = modal.getBoundingClientRect();
    modal.style.position = 'fixed';
    modal.style.margin = '0';
    modal.style.left = `${rect.left}px`;
    modal.style.top = `${rect.top}px`;
    modal.style.width = `${rect.width}px`;
    modal.style.height = `${rect.height}px`;
    // Anular el `max-height: 80vh` de `.modal` y el `max-width` de la clase:
    // el tamaño manual ya se acota contra el viewport en clampModalSize, y si
    // no se anulan aquí la modal no crecería más allá de esos topes aunque el
    // manejador lo pida, desajustando el escalado del lienzo.
    modal.style.maxWidth = 'none';
    modal.style.maxHeight = 'none';
  }

  // Acota un tamaño propuesto para la modal (cambio 00225): mínimo utilizable
  // por constante, máximo el que cabe en el área visible del navegador desde la
  // esquina fija del manejador que arrastra (cada caller pasa sus dos topes,
  // que dependen de qué esquina quede anclada).
  function clampModalSize({ width, height }, { maxWidth, maxHeight }) {
    return {
      width: Math.min(Math.max(width, MIN_EDITOR_MODAL_WIDTH), maxWidth),
      height: Math.min(Math.max(height, MIN_EDITOR_MODAL_HEIGHT), maxHeight),
    };
  }

  const header = document.createElement('div');
  header.className = 'modal__header';
  const headerTitle = document.createElement('span');
  headerTitle.textContent = title;
  header.appendChild(headerTitle);

  // Maximizar/restaurar: interruptor entre tamaño normal y ocupar
  // prácticamente toda la ventana. No cierra el editor (sigue siendo cosa
  // de "Cancelar"/"Aceptar" en el pie).
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

  // Limpia los estilos inline de geometría que fija el redimensionado manual
  // (cambio 00225), para que vuelva a mandar el CSS de la clase correspondiente.
  function clearModalInlineGeometry() {
    modal.style.position = '';
    modal.style.margin = '';
    modal.style.left = '';
    modal.style.top = '';
    modal.style.width = '';
    modal.style.height = '';
    modal.style.maxWidth = '';
    modal.style.maxHeight = '';
  }

  maximizeBtn.addEventListener('click', () => {
    maximized = !maximized;
    modal.classList.toggle('card-editor-modal--maximized', maximized);
    updateMaximizeButton();
    // Maximizar y Restaurar limpian ambos los estilos inline de geometría del
    // redimensionado manual (cambio 00225) para que mande el CSS de la clase
    // (`.card-editor-modal--maximized` centrado por flexbox al maximizar,
    // `fit-content` centrado al restaurar). Al restaurar además se descarta el
    // tamaño manual (`manualSize = null`): "Restaurar" vuelve siempre al tamaño
    // por defecto, no al tamaño manual que se hubiera fijado con los
    // manejadores. getEffectiveCanvasMaxSide() cae entonces a su rama por
    // defecto (`CANVAS_MAX_SIDE`).
    clearModalInlineGeometry();
    if (!maximized) manualSize = null;
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
  const working = {
    proporcion: props.proporcion || '5:7',
    esquinasRedondeadas: props.esquinasRedondeadas !== false,
    // Tamaño de diseño del lienzo: siempre el tamaño real del componente al
    // abrir el editor, nunca un lienzo lógico fijo — el contenido se pinta siempre en
    // píxeles reales (sin ningún factor de escala), así que lo que se ve al
    // diseñar debe coincidir con el tamaño real en la mesa. Cambiar el
    // desplegable "Proporción" dentro del editor sí recalcula `designHeight`
    // (ver más abajo) para previsualizar la forma elegida.
    designWidth: component.width || DEFAULT_DESIGN_WIDTH_FALLBACK,
    designHeight: component.height || (component.width || DEFAULT_DESIGN_WIDTH_FALLBACK) / getProporcionRatio(props.proporcion || '5:7'),
  };
  for (const { key } of faces) {
    working[key] = cloneCara(props[key]);
  }

  function getFaceDesignSize() {
    return { width: working.designWidth, height: working.designHeight };
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
  // la acción "Eliminar" del menú contextual y la tecla SUPR.
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

  // Recalcula el tamaño del lienzo si la ventana cambia de tamaño estando
  // maximizado; y, con un tamaño manual fijado (cambio 00225), reajusta la
  // modal para que no quede fuera del área visible si la ventana se encoge,
  // anclando su esquina superior izquierda actual.
  function handleWindowResize() {
    if (maximized) {
      renderFaces();
      return;
    }
    if (manualSize) {
      const r = modal.getBoundingClientRect();
      const clamped = clampModalSize(manualSize, {
        maxWidth: window.innerWidth - r.left,
        maxHeight: window.innerHeight - r.top,
      });
      modal.style.width = `${clamped.width}px`;
      modal.style.height = `${clamped.height}px`;
      manualSize = clamped;
      renderFaces();
    }
  }
  window.addEventListener('resize', handleWindowResize);

  function cleanup() {
    document.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', handleWindowResize);
    // Cancela la segunda pasada de convergencia pendiente (cambio 00237) si el
    // editor se cierra entre un render y su rAF de convergencia.
    cancelAnimationFrame(convergeRaf);
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

    // Esquinas redondeadas: solo aplica a proporciones rectangulares/cuadrada
    // — Circular/Hexagonal mantienen su silueta fija.
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
      // El ancho de diseño se mantiene (es el tamaño real de la carta); solo
      // se recalcula el alto según la proporción recién elegida — mismo
      // criterio que usa ui/componentModal.js al cambiar la Proporción desde
      // la pestaña "Específicas", fuera del editor.
      working.designHeight = working.designWidth / getProporcionRatio(working.proporcion);
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

  // "Lado" de lienzo efectivo del render en curso. Se calcula UNA vez por
  // renderFaces() — antes de vaciar `facesRow` — y todas las caras y el margen
  // del botón "Ajustar imagen…" leen este valor (cambio 00235). Calcularlo por
  // cara no valdría: getEditorWorkArea() mide la etiqueta y la fila de acciones
  // de una cara ya montada, y la primera cara del render se calcularía con
  // `facesRow` recién vaciado (sin cara que medir → rama de fallback), dando un
  // tamaño distinto al de la segunda cara.
  let currentCanvasMaxSide = CANVAS_MAX_SIDE;

  // Segunda pasada de convergencia (cambio 00237): guarda si ya hay un
  // re-render de convergencia en curso (corta la recursión) y el id del
  // requestAnimationFrame pendiente (lo cancela cleanup() si se cierra el
  // editor entre el render y su convergencia).
  let convergePending = false;
  let convergeRaf = 0;

  function renderFaces() {
    // Medir el hueco real ANTES de desmontar el render anterior: getEditorWorkArea()
    // necesita una cara montada para medir su cromo vertical.
    currentCanvasMaxSide = getEffectiveCanvasMaxSide();

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
    // Maximizado o con tamaño manual (cambios 00233/00235), el lienzo escala
    // según el hueco interior real y ese valor fijo ya no centra el botón —
    // se calcula en JS a partir del alto real resultante del lienzo
    // (`currentCanvasMaxSide` ya es el "lado" derivado del hueco, así que
    // `designHeight * previewScale` es el alto real). Excepción ya documentada
    // en design/docs/style para valores que dependen de un cálculo numérico en
    // tiempo de ejecución, no expresables como clase.
    if (maximized || manualSize) {
      const { width: designWidth, height: designHeight } = getFaceDesignSize();
      const canvasHeight = designHeight * (currentCanvasMaxSide / Math.max(designWidth, designHeight));
      adjustImageBtn.style.marginTop = `${canvasHeight / 2 - adjustImageBtn.offsetHeight / 2}px`;
    } else {
      adjustImageBtn.style.marginTop = '';
    }

    // Segunda pasada de convergencia (cambio 00237): en estado maximizado o con
    // tamaño manual, getEditorWorkArea() midió la fila de acciones del render
    // anterior, cuya altura (flex-wrap) depende del ancho del lienzo y cambia
    // con el render nuevo — sobre todo en 'tableroPersonalizado' apaisado, donde
    // el lienzo pasa a ocupar casi todo el ancho. Tras pintar, se re-mide el
    // "lado" con la fila ya a su anchura final y, si difiere de forma
    // apreciable, se re-renderiza una sola vez. `convergePending` corta la
    // recursión: el segundo render no vuelve a agendar. [gotcha] no es un bucle
    // de convergencia iterativo (mismo criterio acotado que el doble rAF de
    // ui/progressModal.js, bug 00218): una única pasada extra basta porque ya
    // mide el layout definitivo.
    if ((maximized || manualSize) && !convergePending) {
      const before = currentCanvasMaxSide;
      cancelAnimationFrame(convergeRaf);
      convergeRaf = requestAnimationFrame(() => {
        const after = getEffectiveCanvasMaxSide();
        if (Math.abs(after - before) > 1) {
          convergePending = true;
          renderFaces();
          convergePending = false;
        }
      });
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
  // diseño de una cara, mismo criterio de escala que el arrastre/redimensionado
  // de elementos (previewScale).
  function screenToDesignPoint(canvas, previewScale, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / previewScale,
      y: (clientY - rect.top) / previewScale,
    };
  }

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

  // Menú contextual (click derecho) de una cara: mismo componente
  // reutilizable que el menú contextual de
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
          icon: createRotateIcon(),
          label: 'Girar 90° (horario)',
          onClick: () => {
            const collection = kind === 'forma' ? cara.formas : cara.textBoxes;
            const element = collection.find((item) => item.id === id);
            if (!element) return;
            element.rotation = wrapRotation((element.rotation ?? 0) + 90);
            renderFaces();
          },
        },
        {
          icon: createRotateIcon(),
          label: 'Girar 90° (antihorario)',
          onClick: () => {
            const collection = kind === 'forma' ? cara.formas : cara.textBoxes;
            const element = collection.find((item) => item.id === id);
            if (!element) return;
            element.rotation = wrapRotation((element.rotation ?? 0) - 90);
            renderFaces();
          },
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
    // `currentCanvasMaxSide`, no getEffectiveCanvasMaxSide() directo: se fija una
    // sola vez por renderFaces() para que las dos caras de 'carta' salgan iguales
    // (cambio 00235).
    const previewScale = currentCanvasMaxSide / Math.max(designWidth, designHeight);
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
    // Click derecho en zona vacía del lienzo: los listeners `contextmenu` de
    // cada elemento (renderTextBox/renderShape) hacen
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

    // Proporciones hexagonales y triangulares no pueden usar `border` CSS
    // (dibuja paralelo a la caja rectangular, no a las aristas de la
    // silueta recortada con clip-path) — en su lugar, `canvas` (capa
    // exterior) se rellena del color de borde y `canvasInner` (donde va
    // el contenido) se recorta con una silueta concéntrica más pequeña,
    // dejando visible el anillo entre ambos como borde de grosor uniforme.
    // Con `borderStyle === 'bisel'` ('tableroPersonalizado'), el borde se
    // pinta con el mismo criterio de dos tonos que 'tableroSimple'/'dado'
    // en vez de línea simple — solo aplicable a
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
        if (bevelEnabled) {
          canvas.style.borderTopColor = shadeColor(bordeColor, 0.35);
          canvas.style.borderLeftColor = shadeColor(bordeColor, 0.35);
          canvas.style.borderBottomColor = shadeColor(bordeColor, -0.35);
          canvas.style.borderRightColor = shadeColor(bordeColor, -0.35);
        } else {
          canvas.style.borderColor = bordeColor;
        }
        canvasInner.style.clipPath = 'none';
      } else {
        canvas.style.backgroundColor = '';
        canvas.style.border = bordeGrosor > 0 ? `${bordeGrosor}px solid ${cara.bordeColor || '#000000'}` : '';
        canvasInner.style.clipPath = 'none';
      }
    }
    applyCanvasBorder();

    // 'color' e 'imagen'/ausente son excluyentes: con color activo se pinta
    // el fondo de canvasInner y no se pinta la imagen
    // (aunque siga configurada); en caso contrario, comportamiento de
    // siempre — canvasInner sin fondo propio, imagen si existe.
    let faceImg = null;
    if (cara.fondoTipo === 'color') {
      canvasInner.style.backgroundColor = cara.colorFondo || 'transparent';
    } else {
      canvasInner.style.backgroundColor = '';
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
              cara.fondoTipo = 'imagen';
              renderFaces();
            },
          });
        },
        onAddColor: () => {
          openCardBackgroundColorModal({
            properties: cara,
            onAccept: ({ colorFondo }) => {
              cara.fondoTipo = 'color';
              cara.colorFondo = colorFondo;
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
    // excepción de estilo inline que ya usa componentModal.js (design/docs/style/index.md).
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
    el.style.transform = textBox.rotation ? `rotate(${textBox.rotation}deg)` : '';
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
    el.style.transform = shape.rotation ? `rotate(${shape.rotation}deg)` : '';
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
      shapeImg.style.opacity = String(1 - (shape.imagenTransparencia ?? 0) / 100);
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

  // Redimensionado manual de la ventana del editor (cambio 00225): doble
  // manejador de esquina sobre la propia modal, mismo patrón que el panel
  // flotante "Componentes" (ui/componentList.js). Al empezar a arrastrar se
  // "congela" la modal a posición absoluta (freezeModalGeometry) para que la
  // esquina opuesta quede fija; cada movimiento fija width/height (y left/top
  // en el manejador tl), guarda `manualSize` y re-renderiza las caras para que
  // los lienzos escalen de forma continua.

  // Esquina inferior derecha: ancla la esquina superior izquierda.
  attachResizeHandle(modal, {
    axis: 'both',
    getScale: () => 1,
    getSize: () => {
      freezeModalGeometry();
      const r = modal.getBoundingClientRect();
      return { width: r.width, height: r.height };
    },
    clamp: (proposed) => {
      const r = modal.getBoundingClientRect();
      return clampModalSize(proposed, {
        maxWidth: window.innerWidth - r.left,
        maxHeight: window.innerHeight - r.top,
      });
    },
    onResize: ({ width, height }) => {
      modal.style.width = `${width}px`;
      modal.style.height = `${height}px`;
      manualSize = { width, height };
      renderFaces();
    },
    onResizeEnd: ({ width, height }) => {
      modal.style.width = `${width}px`;
      modal.style.height = `${height}px`;
      manualSize = { width, height };
      renderFaces();
    },
  });

  // Esquina superior izquierda: ancla la esquina inferior derecha, así que
  // además de tamaño hay que desplazar left/top con el dx/dy que devuelve el
  // propio resizeHandle.js para `corner: 'tl'`. tlStart captura la geometría
  // de partida en getSize (una vez por arrastre).
  const modalTlStart = { left: 0, top: 0, width: 0, height: 0 };
  attachResizeHandle(modal, {
    axis: 'both',
    corner: 'tl',
    getScale: () => 1,
    getSize: () => {
      freezeModalGeometry();
      const r = modal.getBoundingClientRect();
      modalTlStart.left = r.left;
      modalTlStart.top = r.top;
      modalTlStart.width = r.width;
      modalTlStart.height = r.height;
      return { width: r.width, height: r.height };
    },
    clamp: (proposed) => clampModalSize(proposed, {
      maxWidth: modalTlStart.left + modalTlStart.width,
      maxHeight: modalTlStart.top + modalTlStart.height,
    }),
    onResize: ({ width, height, dx, dy }) => {
      modal.style.left = `${modalTlStart.left + dx}px`;
      modal.style.top = `${modalTlStart.top + dy}px`;
      modal.style.width = `${width}px`;
      modal.style.height = `${height}px`;
      manualSize = { width, height };
      renderFaces();
    },
    onResizeEnd: ({ width, height, dx, dy }) => {
      modal.style.left = `${modalTlStart.left + dx}px`;
      modal.style.top = `${modalTlStart.top + dy}px`;
      modal.style.width = `${width}px`;
      modal.style.height = `${height}px`;
      manualSize = { width, height };
      renderFaces();
    },
  });

  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) cleanup();
  });
}
