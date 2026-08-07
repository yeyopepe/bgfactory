// Modal for creating/editing components with tabs.
// Generically handles different component types via type-specific tab content.

import { getComponents, getResources, getGroups, addGroup, sacarCartaDeMazo } from '../core/state.js';
import { createComponent, updateComponent } from '../core/component.js';
import { createGroup, isGroupNameTaken } from '../core/group.js';
import { createHelpIcon } from './helpIcon.js';
import { openBoardPatternModal } from './boardPatternModal.js';
import { openBoardImageModal } from './boardImageModal.js';
import { openBoardColorModal } from './boardColorModal.js';
import { openDiceFontModal } from './diceFontModal.js';
import { openVisualEditorModal } from './visualEditorModal.js';
import { CARD_PROPORTIONS, getProporcionRatio } from '../core/cardProportions.js';
import { isListaValoresValida, esResultadoValido, getResultadoInicial } from '../core/dice.js';
import { setStyleClipboard, getStyleClipboard, hasStyleClipboard, validateStyleClipboardForPaste } from '../core/styleClipboard.js';
import { openStyleClipboardSelectionModal } from './styleClipboardSelectionModal.js';
import { openStyleClipboardPasteErrorModal } from './styleClipboardErrorModal.js';
import { showToast } from './toast.js';
import { openMazoContentModal } from './mazoContentModal.js';
import { getInteractionsForType, isInteractionActive } from '../core/interactions.js';
import { sortByName } from '../core/textSort.js';

const DEFAULT_BOARD_SIZE = 200;
const DEFAULT_TABLERO_PERSONALIZADO_WIDTH = 300;
const DEFAULT_TABLERO_PERSONALIZADO_HEIGHT = 200;
const DEFAULT_DADO_SIZE = 100;
const DEFAULT_DOCUMENTO_WIDTH = 240;
const DEFAULT_DOCUMENTO_HEIGHT = 320;
const DEFAULT_CARTA_WIDTH = 180;
const DEFAULT_MAZO_WIDTH = 180;
const DEFAULT_MAZO_HEIGHT = DEFAULT_MAZO_WIDTH / getProporcionRatio('5:7');
const DEFAULT_SIZE_FALLBACK = 100;

// Mide el tamaño natural (shrink-to-fit) que ocupa un componente 'texto' sin
// width/height fijados, replicando en un nodo oculto el mismo estilo con el
// que ui/componentRenderer.js pinta ese tipo (padding/font-size/white-space/
// word-break) para que el resultado coincida con lo que se ve en la mesa.
function measureTextoNaturalSize(component) {
  const measurer = document.createElement('div');
  measurer.style.position = 'absolute';
  measurer.style.visibility = 'hidden';
  measurer.style.pointerEvents = 'none';
  measurer.style.padding = '0.5rem';
  measurer.style.fontSize = `${component.properties.tamañoFuente || 16}px`;
  measurer.style.whiteSpace = 'pre-wrap';
  measurer.style.wordBreak = 'break-word';
  measurer.textContent = component.properties.contenido || '';
  document.body.appendChild(measurer);
  const size = { width: measurer.offsetWidth, height: measurer.offsetHeight };
  document.body.removeChild(measurer);
  return size;
}

// Tamaño a mostrar en la sección "Tamaño" cuando width/height todavía no están fijados en el modelo
// (tamaño automático según contenido).
function getEffectiveSize(component) {
  let { width, height } = component;
  if (width == null || height == null) {
    if (component.type === 'texto') {
      const measured = measureTextoNaturalSize(component);
      if (width == null) width = measured.width;
      if (height == null) height = measured.height;
    } else {
      if (width == null) width = DEFAULT_SIZE_FALLBACK;
      if (height == null) height = DEFAULT_SIZE_FALLBACK;
    }
  }
  return { width: Math.round(width), height: Math.round(height) };
}

export const MAZO_ORIENTACIONES = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' },
];

export const MAZO_FORMAS = [
  { value: 'rectangular', label: 'Rectangular' },
  { value: 'circular', label: 'Circular' },
];

export const DEFAULT_BOARD_PROPERTIES = {
  bordeColor: '#000000',
  bordeGrosor: 2,
  bordeActivo: true,
  biselado: true,
  sombra: true,
  fondoTipo: 'colorPatron',
  colorFondo: '#ffffff',
  patronColor: '#000000',
  patronGrosor: 1,
  patronForma: 'cuadrada',
  patronFilas: 8,
  patronColumnas: 8,
  imagenResourceId: null,
  colorSolido: '#ffffff',
};

export const DEFAULT_DADO_PROPERTIES = {
  colorCuerpo: '#888888',
  colorNumeros: '#000000',
  modoCaras: 'numeroMaximo',
  numeroMaximoCaras: 6,
  listaValores: '',
  fuenteResourceId: null,
  resultadoActual: '1',
};

export const DEFAULT_DOCUMENTO_PROPERTIES = {
  tipoContenido: 'texto',
  contenido: '',
  formato: 'markdown',
  url: '',
};

export const DEFAULT_CARTA_PROPERTIES = {
  proporcion: '5:7',
  esquinasRedondeadas: true,
  caraActual: 'trasera',
  // Contenido siempre en píxeles reales desde su creación: no necesita migración de core/state.js.
  medidasReales: true,
  caraFrontal: {
    imagenResourceId: null,
    ajusteImagen: { zoom: 100, posX: 50, posY: 50 },
    textBoxes: [],
    bordeColor: '#000000',
    bordeGrosor: 0,
    transparenciaImagen: 0,
  },
  caraTrasera: {
    imagenResourceId: null,
    ajusteImagen: { zoom: 100, posX: 50, posY: 50 },
    textBoxes: [],
    bordeColor: '#000000',
    bordeGrosor: 0,
    transparenciaImagen: 0,
  },
};

export const DEFAULT_MAZO_PROPERTIES = {
  cartaIds: [],
  orientacion: 'vertical',
  forma: 'rectangular',
};

// 'tableroPersonalizado': una única cara, mismo shape que caraFrontal/caraTrasera de 'carta' salvo
// nombre distinto — reutiliza el shape completo (formas incluidas) para compartir el editor visual
// generalizado sin condicionales.
export const DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES = {
  biselado: true,
  sombra: true,
  cara: {
    imagenResourceId: null,
    ajusteImagen: { zoom: 100, posX: 50, posY: 50, rotation: 0 },
    formas: [],
    textBoxes: [],
    bordeColor: '#000000',
    bordeGrosor: 2,
    transparenciaImagen: 0,
  },
};

function cloneFace(face) {
  return {
    ...face,
    ajusteImagen: { ...face.ajusteImagen },
    formas: (face.formas || []).map((f) => ({ ...f, ajusteImagen: f.ajusteImagen ? { ...f.ajusteImagen } : f.ajusteImagen })),
    textBoxes: face.textBoxes.map((tb) => ({ ...tb })),
  };
}

function cloneCartaProperties(properties) {
  return {
    ...properties,
    caraFrontal: cloneFace(properties.caraFrontal),
    caraTrasera: cloneFace(properties.caraTrasera),
  };
}

function cloneTableroPersonalizadoProperties(properties) {
  return {
    ...properties,
    cara: cloneFace(properties.cara),
  };
}

// Crea un componente nuevo ya con los valores por defecto de su tipo (tamaño y
// properties), para el flujo de alta: elegir tipo (ui/componentTypeModal.js) →
// crear con defaults → abrir esta modal para configurarlo.
export function createDefaultComponent(type) {
  const component = createComponent({ type });
  if (type === 'tableroSimple') {
    component.width = DEFAULT_BOARD_SIZE;
    component.height = DEFAULT_BOARD_SIZE;
    component.properties = { ...DEFAULT_BOARD_PROPERTIES };
  } else if (type === 'tableroPersonalizado') {
    component.width = DEFAULT_TABLERO_PERSONALIZADO_WIDTH;
    component.height = DEFAULT_TABLERO_PERSONALIZADO_HEIGHT;
    component.properties = cloneTableroPersonalizadoProperties(DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES);
  } else if (type === 'dado') {
    component.width = DEFAULT_DADO_SIZE;
    component.height = DEFAULT_DADO_SIZE;
    component.subirAlMoverInteractuar = true;
    component.properties = { ...DEFAULT_DADO_PROPERTIES };
  } else if (type === 'documento') {
    component.width = DEFAULT_DOCUMENTO_WIDTH;
    component.height = DEFAULT_DOCUMENTO_HEIGHT;
    component.properties = { ...DEFAULT_DOCUMENTO_PROPERTIES };
  } else if (type === 'carta') {
    component.width = DEFAULT_CARTA_WIDTH;
    component.height = DEFAULT_CARTA_WIDTH / getProporcionRatio(DEFAULT_CARTA_PROPERTIES.proporcion);
    component.subirAlMoverInteractuar = true;
    component.properties = cloneCartaProperties(DEFAULT_CARTA_PROPERTIES);
  } else if (type === 'mazo') {
    component.width = DEFAULT_MAZO_WIDTH;
    component.height = DEFAULT_MAZO_HEIGHT;
    component.subirAlMoverInteractuar = true;
    component.properties = { ...DEFAULT_MAZO_PROPERTIES };
  }
  return component;
}

export function openComponentModal({ component = null, onAccept, onDelete }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal component-editor-modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = component ? 'Editar propiedades del componente' : 'Crear componente';
  modal.appendChild(header);

  const tabs = document.createElement('div');
  tabs.className = 'modal__tabs';
  modal.appendChild(tabs);

  const contentArea = document.createElement('div');
  contentArea.className = 'modal__content';
  modal.appendChild(contentArea);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  // Initialize component if creating new
  const isNew = !component;
  const workingComponent = isNew
    ? createComponent({ type: 'texto' })
    : { ...component };

  // Tab management
  const tabContents = new Map();
  let activeTab = 'general';

  function createTab(name, label) {
    const tab = document.createElement('button');
    tab.className = 'modal__tab';
    if (name === activeTab) tab.classList.add('active');
    tab.textContent = label;
    tab.addEventListener('click', () => switchTab(name));
    tabs.appendChild(tab);

    const content = document.createElement('div');
    content.style.display = name === activeTab ? 'block' : 'none';
    contentArea.appendChild(content);
    tabContents.set(name, { tab, content });
  }

  function switchTab(name) {
    tabContents.forEach((data) => {
      data.tab.classList.remove('active');
      data.content.style.display = 'none';
    });
    tabContents.get(name).tab.classList.add('active');
    tabContents.get(name).content.style.display = 'block';
    activeTab = name;
  }

  // General tab: id field with validation
  createTab('general', 'Generales');
  const generalContent = tabContents.get('general').content;

  const idField = document.createElement('div');
  idField.className = 'modal__field';
  const idLabel = document.createElement('label');
  idLabel.textContent = 'ID del componente';
  const idInput = document.createElement('input');
  idInput.type = 'text';
  idInput.value = workingComponent.id;
  const idError = document.createElement('div');
  idError.className = 'modal__error';
  idError.style.display = 'none';

  idField.appendChild(idLabel);
  idField.appendChild(idInput);
  idField.appendChild(idError);
  generalContent.appendChild(idField);

  // General: sección informativa (design/docs/style/03-modales-menus.md, sin checkbox de activación
  // entera) que agrupa Bloqueado, Oculto, Mostrar tooltip y Subir al mover/interactuar.
  const infoSection = document.createElement('fieldset');
  infoSection.className = 'modal__section';
  const infoLegend = document.createElement('legend');
  infoLegend.className = 'modal__section-title';
  infoLegend.textContent = 'General';
  infoSection.appendChild(infoLegend);

  // Tamaño: alto/ancho editables directamente, con checkbox "Mantener proporción". No se escribe en
  // workingComponent.width/height hasta que el usuario edite alguno de los dos campos, para que aceptar
  // la modal sin tocarlos no fije un tamaño que antes era automático.
  // `cartaProporcionSelect` lo rellena renderCartaSpecificFields cuando el componente es carta, para que
  // el listener de más abajo pueda sincronizar el desplegable "Proporción" al desmarcar esta casilla.
  let cartaProporcionSelect = null;
  const sizeSection = document.createElement('fieldset');
  sizeSection.className = 'modal__section';
  const sizeLegend = document.createElement('legend');
  sizeLegend.className = 'modal__section-title';
  sizeLegend.textContent = 'Tamaño';
  sizeSection.appendChild(sizeLegend);

  const sizeRow = document.createElement('div');
  sizeRow.style.display = 'flex';
  sizeRow.style.gap = '0.5rem';

  const heightField = document.createElement('div');
  heightField.className = 'modal__field';
  heightField.style.flex = '1';
  const heightLabel = document.createElement('label');
  heightLabel.textContent = 'Alto (px)';
  const heightInput = document.createElement('input');
  heightInput.type = 'number';
  heightInput.min = '1';
  heightInput.step = '1';
  heightField.appendChild(heightLabel);
  heightField.appendChild(heightInput);

  const widthField = document.createElement('div');
  widthField.className = 'modal__field';
  widthField.style.flex = '1';
  const widthLabel = document.createElement('label');
  widthLabel.textContent = 'Ancho (px)';
  const widthInput = document.createElement('input');
  widthInput.type = 'number';
  widthInput.min = '1';
  widthInput.step = '1';
  widthField.appendChild(widthLabel);
  widthField.appendChild(widthInput);

  sizeRow.appendChild(heightField);
  sizeRow.appendChild(widthField);
  sizeSection.appendChild(sizeRow);

  const initialSize = getEffectiveSize(workingComponent);
  heightInput.value = initialSize.height;
  widthInput.value = initialSize.width;

  const keepRatioField = document.createElement('div');
  keepRatioField.className = 'modal__field modal__field--checkbox';
  const keepRatioCheckbox = document.createElement('input');
  keepRatioCheckbox.type = 'checkbox';
  keepRatioCheckbox.checked = true;
  const keepRatioLabel = document.createElement('label');
  keepRatioLabel.textContent = 'Mantener proporción';
  keepRatioField.appendChild(keepRatioCheckbox);
  keepRatioField.appendChild(keepRatioLabel);
  sizeSection.appendChild(keepRatioField);

  // Al desmarcarla en una carta, su proporción pasa a 'libre' para dejar de forzarse aquí y en el
  // redimensionado por arrastre (resizeHandle.js, que respeta getProporcionRatio(proporcion)).
  keepRatioCheckbox.addEventListener('change', () => {
    if (keepRatioCheckbox.checked || !cartaProporcionSelect) return;
    workingComponent.properties.proporcion = 'libre';
    cartaProporcionSelect.value = 'libre';
  });

  heightInput.addEventListener('input', () => {
    const newHeight = parseInt(heightInput.value, 10);
    if (!Number.isFinite(newHeight) || newHeight < 1) return;
    const prev = getEffectiveSize(workingComponent);
    workingComponent.height = newHeight;
    if (keepRatioCheckbox.checked && prev.height > 0) {
      const newWidth = Math.max(1, Math.round((newHeight * prev.width) / prev.height));
      workingComponent.width = newWidth;
      widthInput.value = newWidth;
    }
  });

  widthInput.addEventListener('input', () => {
    const newWidth = parseInt(widthInput.value, 10);
    if (!Number.isFinite(newWidth) || newWidth < 1) return;
    const prev = getEffectiveSize(workingComponent);
    workingComponent.width = newWidth;
    if (keepRatioCheckbox.checked && prev.width > 0) {
      const newHeight = Math.max(1, Math.round((newWidth * prev.height) / prev.width));
      workingComponent.height = newHeight;
      heightInput.value = newHeight;
    }
  });

  const moveField = document.createElement('div');
  moveField.className = 'modal__field';
  const moveLabelRow = document.createElement('div');
  moveLabelRow.style.display = 'flex';
  moveLabelRow.style.alignItems = 'center';
  moveLabelRow.style.gap = '0.35rem';
  moveLabelRow.style.marginBottom = '0.25rem';
  const moveLabel = document.createElement('label');
  moveLabel.textContent = 'Bloqueado';
  moveLabel.style.marginBottom = '0';
  const moveSelect = document.createElement('select');

  const BLOQUEADO_OPTIONS = [
    { value: 'ninguno', label: 'Ninguno' },
    { value: 'juego', label: 'Solo modo juego' },
    { value: 'todos', label: 'Todos los modos' },
  ];
  for (const { value, label } of BLOQUEADO_OPTIONS) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    moveSelect.appendChild(option);
  }
  moveSelect.value = workingComponent.bloqueado ?? 'ninguno';

  moveSelect.addEventListener('change', () => {
    workingComponent.bloqueado = moveSelect.value;
  });

  moveLabelRow.appendChild(moveLabel);
  moveLabelRow.appendChild(createHelpIcon({
    text: 'Indica en qué modo(s) este componente no se puede mover. \'Todos los modos\' lo fija también en Modo Edición; \'Solo modo juego\' lo fija únicamente durante la partida (comportamiento por defecto anterior); \'Ninguno\' permite arrastrarlo libremente en ambos.',
  }));
  moveField.appendChild(moveLabelRow);
  moveField.appendChild(moveSelect);
  infoSection.appendChild(moveField);

  const hiddenField = document.createElement('div');
  hiddenField.className = 'modal__field modal__field--checkbox';
  const hiddenCheckbox = document.createElement('input');
  hiddenCheckbox.type = 'checkbox';
  hiddenCheckbox.checked = workingComponent.oculto ?? false;
  const hiddenLabel = document.createElement('label');
  hiddenLabel.textContent = 'Oculto';

  hiddenCheckbox.addEventListener('change', () => {
    workingComponent.oculto = hiddenCheckbox.checked;
  });

  hiddenField.appendChild(hiddenCheckbox);
  hiddenField.appendChild(hiddenLabel);
  hiddenField.appendChild(createHelpIcon({
    text: 'Si está marcado, este componente deja de aparecer por completo en Modo Juego (no se ve, no ocupa espacio, no es interactuable). En Modo Edición se sigue mostrando con normalidad, con una insignia que indica que no aparecerá en la partida.',
  }));
  infoSection.appendChild(hiddenField);

  const tooltipField = document.createElement('div');
  tooltipField.className = 'modal__field modal__field--checkbox';
  const tooltipCheckbox = document.createElement('input');
  tooltipCheckbox.type = 'checkbox';
  tooltipCheckbox.checked = workingComponent.mostrarTooltip ?? false;
  const tooltipLabel = document.createElement('label');
  tooltipLabel.textContent = 'Mostrar tooltip';

  tooltipCheckbox.addEventListener('change', () => {
    workingComponent.mostrarTooltip = tooltipCheckbox.checked;
  });

  tooltipField.appendChild(tooltipCheckbox);
  tooltipField.appendChild(tooltipLabel);
  tooltipField.appendChild(createHelpIcon({
    text: 'Si está marcado, este componente muestra su identificador como tooltip al pasar el ratón por encima, pero solo en Modo Juego. Desmarcado por defecto.',
  }));
  infoSection.appendChild(tooltipField);

  const upOnMoveField = document.createElement('div');
  upOnMoveField.className = 'modal__field modal__field--checkbox';
  const upOnMoveCheckbox = document.createElement('input');
  upOnMoveCheckbox.type = 'checkbox';
  upOnMoveCheckbox.checked = workingComponent.subirAlMoverInteractuar ?? false;
  const upOnMoveLabel = document.createElement('label');
  upOnMoveLabel.textContent = 'Subir al mover/interactuar';

  upOnMoveCheckbox.addEventListener('change', () => {
    workingComponent.subirAlMoverInteractuar = upOnMoveCheckbox.checked;
  });

  upOnMoveField.appendChild(upOnMoveCheckbox);
  upOnMoveField.appendChild(upOnMoveLabel);
  upOnMoveField.appendChild(createHelpIcon({
    text: 'Si está marcado, este componente se coloca automáticamente encima de todos los demás cada vez que se mueve o se interactúa con él (voltear, lanzar) en Modo Juego.',
  }));
  infoSection.appendChild(upOnMoveField);

  generalContent.appendChild(infoSection);
  generalContent.appendChild(sizeSection);

  // Grupos: propiedad general de cualquier tipo de componente. Sección informativa con borde (sin
  // checkbox de activación entera, ver design/docs/style/03-modales-menus.md), con un checkbox
  // por grupo existente más una fila para crear uno nuevo al vuelo.
  const groupSection = document.createElement('fieldset');
  groupSection.className = 'modal__section';
  const groupLegend = document.createElement('legend');
  groupLegend.className = 'modal__section-title';
  groupLegend.textContent = 'Grupos';
  groupSection.appendChild(groupLegend);

  // Zona con scroll propio: tope de 3 checkboxes visibles a la vez, para que la sección no crezca sin
  // límite con muchos grupos. Fila "+ Crear nuevo grupo…" fuera, en groupSection directamente, para
  // que no scrollee con el resto.
  const groupCheckboxList = document.createElement('div');
  groupCheckboxList.className = 'group-checkbox-list__scroll';
  groupSection.appendChild(groupCheckboxList);

  const createGroupItem = document.createElement('div');
  createGroupItem.className = 'modal__field modal__field--checkbox';
  createGroupItem.style.cursor = 'pointer';
  createGroupItem.textContent = '+ Crear nuevo grupo…';
  createGroupItem.addEventListener('click', () => {
    newGroupRow.style.display = 'block';
    newGroupInput.focus();
  });
  groupSection.appendChild(createGroupItem);

  const newGroupRow = document.createElement('div');
  newGroupRow.style.display = 'none';
  newGroupRow.style.marginTop = '0.5rem';
  const newGroupInputRow = document.createElement('div');
  newGroupInputRow.style.display = 'flex';
  newGroupInputRow.style.gap = '0.5rem';
  const newGroupInput = document.createElement('input');
  newGroupInput.type = 'text';
  newGroupInput.placeholder = 'Nombre del grupo nuevo';
  const newGroupCreateBtn = document.createElement('button');
  newGroupCreateBtn.type = 'button';
  newGroupCreateBtn.className = 'btn-cancel';
  newGroupCreateBtn.textContent = 'Crear';
  newGroupInputRow.appendChild(newGroupInput);
  newGroupInputRow.appendChild(newGroupCreateBtn);
  const newGroupError = document.createElement('div');
  newGroupError.className = 'modal__error';
  newGroupError.style.display = 'none';
  newGroupError.style.marginTop = '0.25rem';
  newGroupRow.appendChild(newGroupInputRow);
  newGroupRow.appendChild(newGroupError);
  groupSection.appendChild(newGroupRow);

  function populateGroupCheckboxes() {
    groupCheckboxList.innerHTML = '';

    for (const group of sortByName(getGroups())) {
      const item = document.createElement('div');
      item.className = 'modal__field modal__field--checkbox';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = workingComponent.grupoIds.includes(group.id);
      const label = document.createElement('label');
      label.textContent = group.name;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          if (!workingComponent.grupoIds.includes(group.id)) workingComponent.grupoIds = [...workingComponent.grupoIds, group.id];
        } else {
          workingComponent.grupoIds = workingComponent.grupoIds.filter((id) => id !== group.id);
        }
      });
      item.appendChild(checkbox);
      item.appendChild(label);
      groupCheckboxList.appendChild(item);
    }
  }
  populateGroupCheckboxes();

  function validateNewGroupName() {
    const name = newGroupInput.value.trim();
    if (!name) {
      newGroupError.textContent = 'El nombre no puede estar vacío';
      newGroupError.style.display = 'block';
      return false;
    }
    if (isGroupNameTaken(name, getGroups())) {
      newGroupError.textContent = 'Ya existe un grupo con este nombre';
      newGroupError.style.display = 'block';
      return false;
    }
    newGroupError.style.display = 'none';
    return true;
  }

  newGroupInput.addEventListener('input', validateNewGroupName);

  newGroupCreateBtn.addEventListener('click', () => {
    if (!validateNewGroupName()) return;
    const name = newGroupInput.value.trim();
    const group = createGroup({ name });
    addGroup(group);
    workingComponent.grupoIds = [...workingComponent.grupoIds, group.id];
    newGroupRow.style.display = 'none';
    newGroupInput.value = '';
    populateGroupCheckboxes();
  });

  generalContent.appendChild(groupSection);

  // Interacciones programadas: un combo por cada interacción de click izquierdo que el tipo actual
  // tenga programada en Modo Juego (ver core/interactions.js), desactivable eligiendo "Ninguna", más
  // una fila fija de click derecho (ver más abajo) que aplica por igual a los 6 tipos de componente —
  // por eso la sección se muestra siempre, no solo cuando el tipo tiene entradas en TYPE_INTERACTIONS.
  // El tipo no cambia tras crear el componente: esta sección se calcula una sola vez al abrir la modal.
  const typeInteractions = getInteractionsForType(workingComponent.type);
  {
    const interactionsSection = document.createElement('fieldset');
    interactionsSection.className = 'modal__section';
    const interactionsTitle = document.createElement('legend');
    interactionsTitle.className = 'modal__section-title';
    interactionsTitle.textContent = 'Interacciones programadas';
    interactionsSection.appendChild(interactionsTitle);

    for (const interaction of typeInteractions) {
      const interactionField = document.createElement('div');
      interactionField.className = 'modal__field';
      const interactionLabel = document.createElement('label');
      interactionLabel.textContent = typeInteractions.length > 1 ? interaction.label : 'Al hacer click';
      const interactionSelect = document.createElement('select');

      const activeOption = document.createElement('option');
      activeOption.value = 'activa';
      activeOption.textContent = interaction.label;
      const noneOption = document.createElement('option');
      noneOption.value = 'ninguna';
      noneOption.textContent = 'Ninguna';
      interactionSelect.appendChild(activeOption);
      interactionSelect.appendChild(noneOption);
      interactionSelect.value = isInteractionActive(workingComponent, interaction.key) ? 'activa' : 'ninguna';

      interactionSelect.addEventListener('change', () => {
        const disabled = new Set(workingComponent.interaccionesDesactivadas || []);
        if (interactionSelect.value === 'ninguna') {
          disabled.add(interaction.key);
        } else {
          disabled.delete(interaction.key);
        }
        workingComponent.interaccionesDesactivadas = [...disabled];
      });

      interactionField.appendChild(interactionLabel);
      interactionField.appendChild(interactionSelect);
      interactionField.appendChild(createHelpIcon({
        text: `Si eliges "Ninguna", el click sobre este componente deja de "${interaction.label.toLowerCase()}" en Modo Juego. El resto de su comportamiento (arrastre, menú contextual...) no se ve afectado.`,
      }));
      interactionsSection.appendChild(interactionField);
    }

    // Click derecho: a diferencia de las filas anteriores, no depende del tipo — el menú contextual
    // (bloquear/desbloquear + acciones específicas del tipo) existe para los 6 tipos por igual.
    const rightClickField = document.createElement('div');
    rightClickField.className = 'modal__field';
    const rightClickLabel = document.createElement('label');
    rightClickLabel.textContent = 'Click derecho';
    const rightClickSelect = document.createElement('select');

    const noneRightClickOption = document.createElement('option');
    noneRightClickOption.value = 'ninguno';
    noneRightClickOption.textContent = 'Ninguno';
    const contextMenuOption = document.createElement('option');
    contextMenuOption.value = 'menuContextual';
    contextMenuOption.textContent = 'Abrir menú contextual';
    rightClickSelect.appendChild(noneRightClickOption);
    rightClickSelect.appendChild(contextMenuOption);
    rightClickSelect.value = workingComponent.accionClickDerecho;

    rightClickSelect.addEventListener('change', () => {
      workingComponent.accionClickDerecho = rightClickSelect.value;
    });

    rightClickField.appendChild(rightClickLabel);
    rightClickField.appendChild(rightClickSelect);
    rightClickField.appendChild(createHelpIcon({
      text: 'Si eliges "Ninguno", el click derecho sobre este componente no hace nada en Modo Juego (no se puede bloquear/desbloquear ni acceder a sus acciones específicas desde ahí). El resto de interacciones no se ven afectadas.',
    }));
    interactionsSection.appendChild(rightClickField);

    generalContent.appendChild(interactionsSection);
  }

  function validateId() {
    const newId = idInput.value.trim();
    if (!newId) {
      idError.textContent = 'El ID no puede estar vacío';
      idError.style.display = 'block';
      return false;
    }
    const isDuplicate = getComponents().some(
      (c) => c.id === newId && c.id !== (component?.id ?? '')
    );
    if (isDuplicate) {
      idError.textContent = 'Ya existe otro componente con este ID';
      idError.style.display = 'block';
      return false;
    }
    idError.style.display = 'none';
    return true;
  }

  function isDadoConfigValid() {
    if (workingComponent.type !== 'dado') return true;
    const props = workingComponent.properties;
    return props.modoCaras !== 'lista' || isListaValoresValida(props.listaValores);
  }

  idInput.addEventListener('input', () => {
    const sanitized = idInput.value.replace(/\s+/g, '_');
    if (sanitized !== idInput.value) {
      idInput.value = sanitized;
    }
    workingComponent.id = idInput.value.trim();
    validateId();
    updateAcceptButton();
  });

  // Specific tab: type-specific fields
  createTab('specific', 'Específicas');
  const specificContent = tabContents.get('specific').content;

  function renderSpecificTab() {
    specificContent.innerHTML = '';

    if (workingComponent.type === 'texto') {
      // Content field
      const contentField = document.createElement('div');
      contentField.className = 'modal__field';
      const contentLabel = document.createElement('label');
      contentLabel.textContent = 'Contenido';
      const contentInput = document.createElement('textarea');
      contentInput.value = workingComponent.properties.contenido || '';
      contentInput.rows = 3;
      contentField.appendChild(contentLabel);
      contentField.appendChild(contentInput);
      specificContent.appendChild(contentField);

      contentInput.addEventListener('input', () => {
        workingComponent.properties.contenido = contentInput.value;
      });

      // Font size field
      const fontSizeField = document.createElement('div');
      fontSizeField.className = 'modal__field';
      const fontSizeLabel = document.createElement('label');
      fontSizeLabel.textContent = 'Tamaño de fuente (px)';
      const fontSizeInput = document.createElement('input');
      fontSizeInput.type = 'number';
      fontSizeInput.value = workingComponent.properties.tamañoFuente || 16;
      fontSizeInput.min = 8;
      fontSizeInput.max = 72;
      fontSizeField.appendChild(fontSizeLabel);
      fontSizeField.appendChild(fontSizeInput);
      specificContent.appendChild(fontSizeField);

      fontSizeInput.addEventListener('input', () => {
        workingComponent.properties.tamañoFuente = parseInt(fontSizeInput.value) || 16;
      });

      // Text color field
      const textColorField = document.createElement('div');
      textColorField.className = 'modal__field';
      const textColorLabel = document.createElement('label');
      textColorLabel.textContent = 'Color de texto';
      const textColorInput = document.createElement('input');
      textColorInput.type = 'color';
      textColorInput.value = workingComponent.properties.colorTexto || '#000000';
      textColorField.appendChild(textColorLabel);
      textColorField.appendChild(textColorInput);
      specificContent.appendChild(textColorField);

      textColorInput.addEventListener('input', () => {
        workingComponent.properties.colorTexto = textColorInput.value;
      });

      // Background color field with transparency option
      const bgColorField = document.createElement('div');
      bgColorField.className = 'modal__field';
      const bgColorLabel = document.createElement('label');
      bgColorLabel.textContent = 'Color de fondo';
      const bgColorContainer = document.createElement('div');
      bgColorContainer.style.display = 'flex';
      bgColorContainer.style.gap = '0.5rem';
      bgColorContainer.style.alignItems = 'center';

      const bgColorInput = document.createElement('input');
      bgColorInput.type = 'color';
      bgColorInput.value = workingComponent.properties.colorFondo || '#ffffff';

      const bgTransparentCheckbox = document.createElement('input');
      bgTransparentCheckbox.type = 'checkbox';
      bgTransparentCheckbox.checked = !workingComponent.properties.colorFondo;

      const bgTransparentLabel = document.createElement('label');
      bgTransparentLabel.textContent = 'Transparente';
      bgTransparentLabel.style.margin = 0;

      bgColorInput.disabled = bgTransparentCheckbox.checked;

      bgTransparentCheckbox.addEventListener('change', () => {
        bgColorInput.disabled = bgTransparentCheckbox.checked;
        if (bgTransparentCheckbox.checked) {
          workingComponent.properties.colorFondo = '';
        } else {
          workingComponent.properties.colorFondo = bgColorInput.value;
        }
      });

      bgColorInput.addEventListener('input', () => {
        workingComponent.properties.colorFondo = bgColorInput.value;
      });

      bgColorContainer.appendChild(bgColorInput);
      bgColorContainer.appendChild(bgTransparentCheckbox);
      bgColorContainer.appendChild(bgTransparentLabel);
      bgColorField.appendChild(bgColorLabel);
      bgColorField.appendChild(bgColorContainer);
      specificContent.appendChild(bgColorField);
    } else if (workingComponent.type === 'tableroSimple') {
      renderBoardSpecificFields(specificContent);
    } else if (workingComponent.type === 'tableroPersonalizado') {
      renderTableroPersonalizadoSpecificFields(specificContent);
    } else if (workingComponent.type === 'dado') {
      renderDadoSpecificFields(specificContent);
    } else if (workingComponent.type === 'documento') {
      renderDocumentoSpecificFields(specificContent);
    } else if (workingComponent.type === 'carta') {
      renderCartaSpecificFields(specificContent);
    } else if (workingComponent.type === 'mazo') {
      renderMazoSpecificFields(specificContent);
    } else {
      const empty = document.createElement('p');
      empty.textContent = 'Sin propiedades específicas';
      empty.style.color = 'var(--text-muted)';
      specificContent.appendChild(empty);
    }
  }

  function renderBoardSpecificFields(container) {
    const props = workingComponent.properties;

    // Visual: sección informativa (sin des/activador) con checkbox "Biselado en el borde" — decide si
    // el borde (cuando está activo) se pinta con bisel de dos tonos o totalmente plano de un color.
    // Mismo patrón .modal__field--checkbox que "Bloqueado"/"Oculto" (pestaña "Generales") o
    // "Esquinas redondeadas" del Editor visual.
    const visualSection = document.createElement('fieldset');
    visualSection.className = 'modal__section';
    const visualLegend = document.createElement('legend');
    visualLegend.className = 'modal__section-title';
    visualLegend.textContent = 'Visual';
    visualSection.appendChild(visualLegend);

    const biseladoField = document.createElement('div');
    biseladoField.className = 'modal__field modal__field--checkbox';
    const biseladoCheckbox = document.createElement('input');
    biseladoCheckbox.type = 'checkbox';
    biseladoCheckbox.id = 'board-biselado';
    biseladoCheckbox.checked = props.biselado !== false;
    biseladoCheckbox.addEventListener('change', () => {
      props.biselado = biseladoCheckbox.checked;
    });
    const biseladoLabel = document.createElement('label');
    biseladoLabel.htmlFor = 'board-biselado';
    biseladoLabel.textContent = 'Biselado en el borde';
    biseladoField.appendChild(biseladoCheckbox);
    biseladoField.appendChild(biseladoLabel);
    visualSection.appendChild(biseladoField);

    // "Sombra": decide si se aplica la sombra de contacto habitual (.board--sin-sombra,
    // src/styles/main.css) o el componente se dibuja totalmente plano.
    const sombraField = document.createElement('div');
    sombraField.className = 'modal__field modal__field--checkbox';
    const sombraCheckbox = document.createElement('input');
    sombraCheckbox.type = 'checkbox';
    sombraCheckbox.id = 'board-sombra';
    sombraCheckbox.checked = props.sombra !== false;
    sombraCheckbox.addEventListener('change', () => {
      props.sombra = sombraCheckbox.checked;
    });
    const sombraLabel = document.createElement('label');
    sombraLabel.htmlFor = 'board-sombra';
    sombraLabel.textContent = 'Sombra';
    sombraField.appendChild(sombraCheckbox);
    sombraField.appendChild(sombraLabel);
    visualSection.appendChild(sombraField);

    container.appendChild(visualSection);

    // Borde: color y grosor juntos en la misma fila, con checkbox de
    // activación (mismo patrón que ui/cardShapeModal.js, sección "Borde")
    const borderSection = document.createElement('fieldset');
    borderSection.className = 'modal__section';
    const borderLegend = document.createElement('legend');
    borderLegend.className = 'modal__section-title modal__section-title--toggle';
    const borderActiveCheckbox = document.createElement('input');
    borderActiveCheckbox.type = 'checkbox';
    borderActiveCheckbox.checked = props.bordeActivo !== false;
    borderLegend.appendChild(borderActiveCheckbox);
    borderLegend.appendChild(document.createTextNode('Borde'));
    borderSection.appendChild(borderLegend);

    const borderRow = document.createElement('div');
    borderRow.className = 'modal__field';
    const borderRowInner = document.createElement('div');
    borderRowInner.style.display = 'flex';
    borderRowInner.style.gap = '0.5rem';

    const borderColorField = document.createElement('div');
    borderColorField.style.flex = '1';
    const borderColorLabel = document.createElement('label');
    borderColorLabel.textContent = 'Color del borde';
    const borderColorInput = document.createElement('input');
    borderColorInput.type = 'color';
    borderColorInput.value = props.bordeColor || DEFAULT_BOARD_PROPERTIES.bordeColor;
    borderColorInput.addEventListener('input', () => {
      props.bordeColor = borderColorInput.value;
    });
    borderColorField.appendChild(borderColorLabel);
    borderColorField.appendChild(borderColorInput);

    const borderWidthField = document.createElement('div');
    borderWidthField.style.flex = '1';
    const borderWidthLabel = document.createElement('label');
    borderWidthLabel.textContent = 'Grosor';
    const borderWidthInput = document.createElement('input');
    borderWidthInput.type = 'number';
    borderWidthInput.min = 1;
    borderWidthInput.max = 20;
    borderWidthInput.value = props.bordeGrosor ?? DEFAULT_BOARD_PROPERTIES.bordeGrosor;
    borderWidthInput.addEventListener('input', () => {
      const parsed = parseInt(borderWidthInput.value, 10);
      props.bordeGrosor = Number.isNaN(parsed) ? DEFAULT_BOARD_PROPERTIES.bordeGrosor : Math.min(Math.max(parsed, 1), 20);
    });
    borderWidthField.appendChild(borderWidthLabel);
    borderWidthField.appendChild(borderWidthInput);

    borderRowInner.appendChild(borderColorField);
    borderRowInner.appendChild(borderWidthField);
    borderRow.appendChild(borderRowInner);
    borderSection.appendChild(borderRow);
    container.appendChild(borderSection);

    function updateBorderSectionDisabled() {
      const active = borderActiveCheckbox.checked;
      borderSection.classList.toggle('modal__section--disabled', !active);
      borderColorInput.disabled = !active;
      borderWidthInput.disabled = !active;
    }
    borderActiveCheckbox.addEventListener('change', () => {
      props.bordeActivo = borderActiveCheckbox.checked;
      updateBorderSectionDisabled();
    });
    updateBorderSectionDisabled();

    // Background type + configure button
    const bgSection = document.createElement('fieldset');
    bgSection.className = 'modal__section modal__section--untitled';

    const bgField = document.createElement('div');
    bgField.className = 'modal__field';
    const bgLabel = document.createElement('label');
    bgLabel.textContent = 'Fondo';
    const bgRow = document.createElement('div');
    bgRow.style.display = 'flex';
    bgRow.style.gap = '0.5rem';
    bgRow.style.alignItems = 'center';

    const bgTypeSelect = document.createElement('select');
    bgTypeSelect.style.flex = '0 1 auto';
    bgTypeSelect.style.width = '9rem';
    const bgTypeOptions = [
      { value: 'colorPatron', label: 'Color y patrón' },
      { value: 'imagen', label: 'Imagen' },
      { value: 'color', label: 'Color' },
    ];
    for (const { value, label } of bgTypeOptions) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === (props.fondoTipo || DEFAULT_BOARD_PROPERTIES.fondoTipo)) option.selected = true;
      bgTypeSelect.appendChild(option);
    }
    bgTypeSelect.addEventListener('change', () => {
      props.fondoTipo = bgTypeSelect.value;
    });

    const configureBtn = document.createElement('button');
    configureBtn.type = 'button';
    configureBtn.className = 'btn-cancel';
    configureBtn.textContent = 'Configurar fondo';
    configureBtn.addEventListener('click', () => {
      const fondoTipo = props.fondoTipo || DEFAULT_BOARD_PROPERTIES.fondoTipo;
      if (fondoTipo === 'imagen') {
        openBoardImageModal({
          properties: props,
          resources: getResources(),
          onAccept: (resourceId) => {
            props.imagenResourceId = resourceId;
          },
        });
      } else if (fondoTipo === 'color') {
        openBoardColorModal({
          properties: props,
          onAccept: ({ colorSolido }) => {
            props.colorSolido = colorSolido;
          },
        });
      } else {
        openBoardPatternModal({
          properties: props,
          onAccept: ({ colorFondo, patronColor, patronGrosor, patronForma, patronFilas, patronColumnas }) => {
            props.colorFondo = colorFondo;
            props.patronColor = patronColor;
            props.patronGrosor = patronGrosor;
            props.patronForma = patronForma;
            props.patronFilas = patronFilas;
            props.patronColumnas = patronColumnas;
          },
        });
      }
    });

    bgRow.appendChild(bgTypeSelect);
    bgRow.appendChild(configureBtn);
    bgField.appendChild(bgLabel);
    bgField.appendChild(bgRow);
    bgSection.appendChild(bgField);
    container.appendChild(bgSection);
  }

  function renderDadoSpecificFields(container) {
    const props = workingComponent.properties;

    function reconcileResultado() {
      if (!esResultadoValido(props.resultadoActual, props)) {
        props.resultadoActual = getResultadoInicial(props);
      }
      updateAcceptButton();
    }

    // Color del cuerpo
    const bodyColorField = document.createElement('div');
    bodyColorField.className = 'modal__field';
    const bodyColorLabel = document.createElement('label');
    bodyColorLabel.textContent = 'Color del cuerpo';
    const bodyColorInput = document.createElement('input');
    bodyColorInput.type = 'color';
    bodyColorInput.value = props.colorCuerpo || DEFAULT_DADO_PROPERTIES.colorCuerpo;
    bodyColorInput.addEventListener('input', () => {
      props.colorCuerpo = bodyColorInput.value;
    });
    bodyColorField.appendChild(bodyColorLabel);
    bodyColorField.appendChild(bodyColorInput);
    container.appendChild(bodyColorField);

    // Color de los números
    const numColorField = document.createElement('div');
    numColorField.className = 'modal__field';
    const numColorLabel = document.createElement('label');
    numColorLabel.textContent = 'Color de los números';
    const numColorInput = document.createElement('input');
    numColorInput.type = 'color';
    numColorInput.value = props.colorNumeros || DEFAULT_DADO_PROPERTIES.colorNumeros;
    numColorInput.addEventListener('input', () => {
      props.colorNumeros = numColorInput.value;
    });
    numColorField.appendChild(numColorLabel);
    numColorField.appendChild(numColorInput);
    container.appendChild(numColorField);

    // Configuración de caras: modo
    const modeField = document.createElement('div');
    modeField.className = 'modal__field';
    const modeLabel = document.createElement('label');
    modeLabel.textContent = 'Configuración de caras';
    const modeSelect = document.createElement('select');
    const modeOptions = [
      { value: 'numeroMaximo', label: 'Número máximo de caras' },
      { value: 'lista', label: 'Lista de valores' },
    ];
    for (const { value, label } of modeOptions) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === (props.modoCaras || DEFAULT_DADO_PROPERTIES.modoCaras)) option.selected = true;
      modeSelect.appendChild(option);
    }
    modeField.appendChild(modeLabel);
    modeField.appendChild(modeSelect);
    container.appendChild(modeField);

    // Número máximo de caras
    const maxField = document.createElement('div');
    maxField.className = 'modal__field';
    const maxLabel = document.createElement('label');
    maxLabel.textContent = 'Número máximo';
    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.min = 2;
    maxInput.max = 100;
    maxInput.value = props.numeroMaximoCaras ?? DEFAULT_DADO_PROPERTIES.numeroMaximoCaras;
    maxInput.addEventListener('input', () => {
      const parsed = parseInt(maxInput.value, 10);
      props.numeroMaximoCaras = Number.isNaN(parsed)
        ? DEFAULT_DADO_PROPERTIES.numeroMaximoCaras
        : Math.min(Math.max(parsed, 2), 100);
      reconcileResultado();
    });
    maxField.appendChild(maxLabel);
    maxField.appendChild(maxInput);
    container.appendChild(maxField);

    // Lista de valores
    const listField = document.createElement('div');
    listField.className = 'modal__field';
    const listLabel = document.createElement('label');
    listLabel.textContent = 'Lista de valores (separados por comas)';
    const listInput = document.createElement('input');
    listInput.type = 'text';
    listInput.value = props.listaValores || '';
    const listError = document.createElement('div');
    listError.className = 'modal__error';
    listInput.addEventListener('input', () => {
      props.listaValores = listInput.value;
      listError.style.display = isListaValoresValida(props.listaValores) ? 'none' : 'block';
      reconcileResultado();
    });
    listError.textContent = 'La lista necesita al menos 2 valores, y al menos uno no puede estar vacío';
    listError.style.display = isListaValoresValida(props.listaValores) ? 'none' : 'block';
    listField.appendChild(listLabel);
    listField.appendChild(listInput);
    listField.appendChild(listError);
    container.appendChild(listField);

    function updateModeFieldsVisibility() {
      const modo = props.modoCaras || DEFAULT_DADO_PROPERTIES.modoCaras;
      maxField.style.display = modo === 'numeroMaximo' ? '' : 'none';
      listField.style.display = modo === 'lista' ? '' : 'none';
    }
    updateModeFieldsVisibility();

    modeSelect.addEventListener('change', () => {
      props.modoCaras = modeSelect.value;
      updateModeFieldsVisibility();
      reconcileResultado();
    });

    // Tipo de fuente
    const fontField = document.createElement('div');
    fontField.className = 'modal__field';
    const fontLabel = document.createElement('label');
    fontLabel.textContent = 'Tipo de fuente';
    const fontRow = document.createElement('div');
    fontRow.style.display = 'flex';
    fontRow.style.gap = '0.5rem';
    fontRow.style.alignItems = 'center';

    const fontCurrentName = document.createElement('span');
    fontCurrentName.style.color = 'var(--text-muted)';
    function updateFontCurrentName() {
      const resource = getResources().find((r) => r.id === props.fuenteResourceId);
      fontCurrentName.textContent = resource ? resource.name : 'Por defecto';
    }
    updateFontCurrentName();

    const fontBtn = document.createElement('button');
    fontBtn.type = 'button';
    fontBtn.className = 'btn-cancel';
    fontBtn.textContent = 'Elegir tipografía';
    fontBtn.addEventListener('click', () => {
      openDiceFontModal({
        resources: getResources(),
        currentResourceId: props.fuenteResourceId,
        onAccept: (resourceId) => {
          props.fuenteResourceId = resourceId;
          updateFontCurrentName();
        },
      });
    });

    fontRow.appendChild(fontBtn);
    fontRow.appendChild(fontCurrentName);
    fontField.appendChild(fontLabel);
    fontField.appendChild(fontRow);
    container.appendChild(fontField);
  }

  function renderDocumentoSpecificFields(container) {
    const props = workingComponent.properties;

    // Tipo de contenido
    const tipoField = document.createElement('div');
    tipoField.className = 'modal__field';
    const tipoLabel = document.createElement('label');
    tipoLabel.textContent = 'Tipo de contenido';
    const tipoSelect = document.createElement('select');
    const tipoOptions = [
      { value: 'texto', label: 'Texto' },
      { value: 'url', label: 'URL' },
    ];
    for (const { value, label } of tipoOptions) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === (props.tipoContenido || DEFAULT_DOCUMENTO_PROPERTIES.tipoContenido)) option.selected = true;
      tipoSelect.appendChild(option);
    }
    tipoField.appendChild(tipoLabel);
    tipoField.appendChild(tipoSelect);
    container.appendChild(tipoField);

    // Bloque "Texto": contenido + formato
    const textBlock = document.createElement('div');

    const contentField = document.createElement('div');
    contentField.className = 'modal__field';
    const contentLabel = document.createElement('label');
    contentLabel.textContent = 'Contenido';
    const contentInput = document.createElement('textarea');
    contentInput.value = props.contenido || '';
    contentInput.rows = 6;
    contentInput.addEventListener('input', () => {
      props.contenido = contentInput.value;
    });
    contentField.appendChild(contentLabel);
    contentField.appendChild(contentInput);
    textBlock.appendChild(contentField);

    const formatField = document.createElement('div');
    formatField.className = 'modal__field';
    const formatLabel = document.createElement('label');
    formatLabel.textContent = 'Formato';
    const formatSelect = document.createElement('select');
    const formatOptions = [
      { value: 'markdown', label: 'Markdown' },
      { value: 'html', label: 'HTML' },
    ];
    for (const { value, label } of formatOptions) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === (props.formato || DEFAULT_DOCUMENTO_PROPERTIES.formato)) option.selected = true;
      formatSelect.appendChild(option);
    }
    formatSelect.addEventListener('change', () => {
      props.formato = formatSelect.value;
    });
    formatField.appendChild(formatLabel);
    formatField.appendChild(formatSelect);
    textBlock.appendChild(formatField);

    container.appendChild(textBlock);

    // Bloque "URL"
    const urlBlock = document.createElement('div');

    const urlField = document.createElement('div');
    urlField.className = 'modal__field';
    const urlLabel = document.createElement('label');
    urlLabel.textContent = 'URL de la página';
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.value = props.url || '';
    urlInput.addEventListener('input', () => {
      props.url = urlInput.value;
    });
    urlField.appendChild(urlLabel);
    urlField.appendChild(urlInput);
    urlBlock.appendChild(urlField);

    container.appendChild(urlBlock);

    function updateTipoFieldsVisibility() {
      const tipo = props.tipoContenido || DEFAULT_DOCUMENTO_PROPERTIES.tipoContenido;
      textBlock.style.display = tipo === 'texto' ? '' : 'none';
      urlBlock.style.display = tipo === 'url' ? '' : 'none';
    }
    updateTipoFieldsVisibility();

    tipoSelect.addEventListener('change', () => {
      props.tipoContenido = tipoSelect.value;
      updateTipoFieldsVisibility();
    });
  }

  // 'tableroPersonalizado': sin proporción configurable (se redimensiona libremente en la mesa,
  // igual que 'tableroSimple') ni bloque "Estilo" (Copiar/Pegar estilo queda fuera de alcance de esta
  // versión) — un único botón que abre el Editor visual generalizado sobre
  // su única cara.
  function renderTableroPersonalizadoSpecificFields(container) {
    const props = workingComponent.properties;

    // Visual: misma sección informativa que 'tableroSimple', primera de la pestaña, antes del
    // botón de edición del diseño.
    const visualSection = document.createElement('fieldset');
    visualSection.className = 'modal__section';
    const visualLegend = document.createElement('legend');
    visualLegend.className = 'modal__section-title';
    visualLegend.textContent = 'Visual';
    visualSection.appendChild(visualLegend);

    const biseladoField = document.createElement('div');
    biseladoField.className = 'modal__field modal__field--checkbox';
    const biseladoCheckbox = document.createElement('input');
    biseladoCheckbox.type = 'checkbox';
    biseladoCheckbox.id = 'tablero-personalizado-biselado';
    biseladoCheckbox.checked = props.biselado !== false;
    biseladoCheckbox.addEventListener('change', () => {
      props.biselado = biseladoCheckbox.checked;
    });
    const biseladoLabel = document.createElement('label');
    biseladoLabel.htmlFor = 'tablero-personalizado-biselado';
    biseladoLabel.textContent = 'Biselado en el borde';
    biseladoField.appendChild(biseladoCheckbox);
    biseladoField.appendChild(biseladoLabel);
    visualSection.appendChild(biseladoField);

    // "Sombra": mismo criterio que 'tableroSimple'.
    const sombraField = document.createElement('div');
    sombraField.className = 'modal__field modal__field--checkbox';
    const sombraCheckbox = document.createElement('input');
    sombraCheckbox.type = 'checkbox';
    sombraCheckbox.id = 'tablero-personalizado-sombra';
    sombraCheckbox.checked = props.sombra !== false;
    sombraCheckbox.addEventListener('change', () => {
      props.sombra = sombraCheckbox.checked;
    });
    const sombraLabel = document.createElement('label');
    sombraLabel.htmlFor = 'tablero-personalizado-sombra';
    sombraLabel.textContent = 'Sombra';
    sombraField.appendChild(sombraCheckbox);
    sombraField.appendChild(sombraLabel);
    visualSection.appendChild(sombraField);

    container.appendChild(visualSection);

    const editField = document.createElement('div');
    editField.className = 'modal__field';
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-cancel';
    editBtn.textContent = 'Editar diseño del tablero';
    editBtn.addEventListener('click', () => {
      openVisualEditorModal({
        component: workingComponent,
        title: 'Diseñar tablero personalizado',
        faces: [{ key: 'cara', label: null }],
        showProporcionSelector: false,
        borderStyle: 'bisel',
        bevelEnabled: props.biselado !== false,
        onAccept: ({ cara }) => {
          props.cara = cara;
        },
      });
    });
    editField.appendChild(editBtn);
    container.appendChild(editField);
  }

  function renderCartaSpecificFields(container) {
    const props = workingComponent.properties;

    // Proporción
    const proporcionField = document.createElement('div');
    proporcionField.className = 'modal__field';
    const proporcionLabel = document.createElement('label');
    proporcionLabel.textContent = 'Proporción';
    const proporcionSelect = document.createElement('select');
    cartaProporcionSelect = proporcionSelect;
    for (const { value, label } of CARD_PROPORTIONS) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === (props.proporcion || DEFAULT_CARTA_PROPERTIES.proporcion)) option.selected = true;
      proporcionSelect.appendChild(option);
    }
    proporcionSelect.addEventListener('change', () => {
      props.proporcion = proporcionSelect.value;
      if (props.proporcion !== 'libre') {
        const width = workingComponent.width || DEFAULT_CARTA_WIDTH;
        workingComponent.width = width;
        workingComponent.height = width / getProporcionRatio(props.proporcion);
      }
    });
    proporcionField.appendChild(proporcionLabel);
    proporcionField.appendChild(proporcionSelect);
    container.appendChild(proporcionField);

    // Editor de diseño
    const editField = document.createElement('div');
    editField.className = 'modal__field';
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-cancel';
    editBtn.textContent = 'Editar diseño de la carta';
    editBtn.addEventListener('click', () => {
      openVisualEditorModal({
        component: workingComponent,
        title: 'Diseñar carta',
        faces: [
          { key: 'caraFrontal', label: 'Cara frontal' },
          { key: 'caraTrasera', label: 'Cara trasera' },
        ],
        showProporcionSelector: true,
        borderStyle: 'simple',
        onAccept: ({ proporcion, esquinasRedondeadas, caraFrontal, caraTrasera }) => {
          props.proporcion = proporcion;
          props.esquinasRedondeadas = esquinasRedondeadas;
          props.caraFrontal = caraFrontal;
          props.caraTrasera = caraTrasera;
          proporcionSelect.value = proporcion;
          if (proporcion !== 'libre') {
            const width = workingComponent.width || DEFAULT_CARTA_WIDTH;
            workingComponent.width = width;
            workingComponent.height = width / getProporcionRatio(proporcion);
          }
        },
      });
    });
    editField.appendChild(editBtn);
    container.appendChild(editField);

    // Estilo de la carta — Copiar/Pegar estilo
    const styleSection = document.createElement('fieldset');
    styleSection.className = 'modal__section';
    const styleLegend = document.createElement('legend');
    styleLegend.className = 'modal__section-title';
    styleLegend.textContent = 'Estilo de la carta';
    styleSection.appendChild(styleLegend);

    const styleActionsRow = document.createElement('div');
    styleActionsRow.className = 'style-actions-row';

    const copyStyleBtn = document.createElement('button');
    copyStyleBtn.type = 'button';
    copyStyleBtn.className = 'btn-cancel';
    copyStyleBtn.textContent = 'Copiar estilo';
    copyStyleBtn.addEventListener('click', () => {
      openStyleClipboardSelectionModal({
        component: workingComponent,
        onAccept: (selection) => {
          const data = {};
          if (selection.generales) {
            data.generales = {
              bloqueado: workingComponent.bloqueado,
              oculto: workingComponent.oculto,
              mostrarTooltip: workingComponent.mostrarTooltip,
              subirAlMoverInteractuar: workingComponent.subirAlMoverInteractuar,
              grupoIds: [...workingComponent.grupoIds],
              grupoNames: workingComponent.grupoIds.map((id) => getGroups().find((g) => g.id === id)?.name ?? id),
            };
          }
          if (selection.proporcion) {
            data.proporcion = props.proporcion;
            data.esquinasRedondeadas = props.esquinasRedondeadas;
          }
          if (selection.caraFrontal) data.caraFrontal = props.caraFrontal;
          if (selection.caraTrasera) data.caraTrasera = props.caraTrasera;
          setStyleClipboard(data);
          showToast('Estilo copiado');
          pasteStyleBtn.disabled = false;
          pasteStyleBtn.title = '';
        },
      });
    });
    styleActionsRow.appendChild(copyStyleBtn);

    const pasteStyleBtn = document.createElement('button');
    pasteStyleBtn.type = 'button';
    pasteStyleBtn.className = 'btn-cancel';
    pasteStyleBtn.textContent = 'Pegar estilo';
    pasteStyleBtn.disabled = !hasStyleClipboard();
    pasteStyleBtn.title = hasStyleClipboard() ? '' : 'Pegar estilo (nada copiado)';
    pasteStyleBtn.addEventListener('click', () => {
      const clip = getStyleClipboard();
      const incidencias = validateStyleClipboardForPaste(clip, { groups: getGroups(), resources: getResources() });
      if (incidencias.length > 0) {
        openStyleClipboardPasteErrorModal(incidencias);
        return;
      }

      if (clip.generales) {
        workingComponent.bloqueado = clip.generales.bloqueado;
        workingComponent.oculto = clip.generales.oculto;
        workingComponent.mostrarTooltip = clip.generales.mostrarTooltip;
        workingComponent.subirAlMoverInteractuar = clip.generales.subirAlMoverInteractuar;
        workingComponent.grupoIds = [...clip.generales.grupoIds];
        moveSelect.value = workingComponent.bloqueado;
        hiddenCheckbox.checked = workingComponent.oculto;
        tooltipCheckbox.checked = workingComponent.mostrarTooltip;
        upOnMoveCheckbox.checked = workingComponent.subirAlMoverInteractuar;
        populateGroupCheckboxes();
      }
      if (clip.caraFrontal) props.caraFrontal = cloneFace(clip.caraFrontal);
      if (clip.caraTrasera) props.caraTrasera = cloneFace(clip.caraTrasera);
      if (clip.proporcion) {
        props.proporcion = clip.proporcion;
        props.esquinasRedondeadas = clip.esquinasRedondeadas ?? true;
        proporcionSelect.value = clip.proporcion;
        if (props.proporcion !== 'libre') {
          const width = workingComponent.width || DEFAULT_CARTA_WIDTH;
          workingComponent.width = width;
          workingComponent.height = width / getProporcionRatio(props.proporcion);
        }
      }
    });
    styleActionsRow.appendChild(pasteStyleBtn);

    styleSection.appendChild(styleActionsRow);

    const styleHint = document.createElement('p');
    styleHint.className = 'modal__hint';
    styleHint.textContent = 'Copia/pega solo los elementos que elijas: generales (incluye el grupo), proporción, cara frontal y/o cara trasera.';
    styleSection.appendChild(styleHint);

    container.appendChild(styleSection);
  }

  function renderMazoSpecificFields(container) {
    const props = workingComponent.properties;

    const countHint = document.createElement('p');
    countHint.className = 'modal__hint';
    countHint.textContent = `${(props.cartaIds || []).length} cartas`;
    container.appendChild(countHint);

    // Forma: rectangular (por defecto) o circular. Al cambiar a circular se
    // iguala ancho y alto (círculo perfecto) tomando el mayor de los dos
    // valores actuales, mismo criterio que "Carta" al cambiar a su
    // proporción circular. La orientación no tiene sentido para un círculo,
    // así que ese selector se oculta mientras la forma sea circular.
    const formaField = document.createElement('div');
    formaField.className = 'modal__field';
    const formaLabel = document.createElement('label');
    formaLabel.textContent = 'Forma';
    const formaSelect = document.createElement('select');
    for (const { value, label } of MAZO_FORMAS) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === (props.forma || DEFAULT_MAZO_PROPERTIES.forma)) option.selected = true;
      formaSelect.appendChild(option);
    }
    formaSelect.addEventListener('change', () => {
      props.forma = formaSelect.value;
      if (props.forma === 'circular') {
        const side = Math.max(workingComponent.width, workingComponent.height);
        workingComponent.width = side;
        workingComponent.height = side;
      }
      orientacionField.style.display = props.forma === 'circular' ? 'none' : '';
    });
    formaField.appendChild(formaLabel);
    formaField.appendChild(formaSelect);
    container.appendChild(formaField);

    // Orientación: intercambia width/height al cambiar, para transponer la
    // caja del mazo conservando cualquier redimensionado manual ya hecho.
    // Oculta mientras la forma sea circular (ver más arriba).
    const orientacionField = document.createElement('div');
    orientacionField.className = 'modal__field';
    orientacionField.style.display = (props.forma || DEFAULT_MAZO_PROPERTIES.forma) === 'circular' ? 'none' : '';
    const orientacionLabel = document.createElement('label');
    orientacionLabel.textContent = 'Orientación';
    const orientacionSelect = document.createElement('select');
    for (const { value, label } of MAZO_ORIENTACIONES) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === (props.orientacion || DEFAULT_MAZO_PROPERTIES.orientacion)) option.selected = true;
      orientacionSelect.appendChild(option);
    }
    orientacionSelect.addEventListener('change', () => {
      if (orientacionSelect.value !== props.orientacion) {
        const width = workingComponent.width;
        const height = workingComponent.height;
        workingComponent.width = height;
        workingComponent.height = width;
      }
      props.orientacion = orientacionSelect.value;
    });
    orientacionField.appendChild(orientacionLabel);
    orientacionField.appendChild(orientacionSelect);
    container.appendChild(orientacionField);

    // Ver contenido del mazo: opera siempre sobre el componente ya guardado en
    // el estado (mazoId), no sobre workingComponent, para que "Sacar" refleje
    // siempre los datos reales aunque esta modal de propiedades siga abierta.
    const contentField = document.createElement('div');
    contentField.className = 'modal__field';
    const contentBtn = document.createElement('button');
    contentBtn.type = 'button';
    contentBtn.className = 'btn-cancel';
    contentBtn.textContent = 'Ver contenido del mazo';
    contentBtn.addEventListener('click', () => {
      openMazoContentModal({
        mazoId: workingComponent.id,
        onSacar: (cartaId) => {
          sacarCartaDeMazo(workingComponent.id, cartaId);
          const mazoActual = getComponents().find((c) => c.id === workingComponent.id);
          workingComponent.properties.cartaIds = mazoActual?.properties?.cartaIds ?? [];
        },
      });
    });
    contentField.appendChild(contentBtn);
    container.appendChild(contentField);
  }

  renderSpecificTab();

  // Footer buttons
  if (!isNew && onDelete) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-eliminar';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.addEventListener('click', () => {
      if (confirm(`¿Eliminar el componente "${workingComponent.id}"?`)) {
        onDelete(component);
        overlay.remove();
      }
    });
    footer.appendChild(deleteBtn);
  }

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => {
    overlay.remove();
  });
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';
  acceptBtn.addEventListener('click', () => {
    if (validateId() && isDadoConfigValid()) {
      if (onAccept) {
        onAccept(workingComponent, isNew);
      }
      overlay.remove();
    }
  });
  footer.appendChild(acceptBtn);

  function updateAcceptButton() {
    acceptBtn.disabled = !validateId() || !isDadoConfigValid();
  }

  updateAcceptButton();

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on overlay click (outside modal), but not if the drag started inside
  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) {
      overlay.remove();
    }
  });
}
