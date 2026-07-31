// Modal for creating/editing components with tabs.
// Generically handles different component types via type-specific tab content.

import { getComponents, getResources, getGroups, addGroup } from '../core/state.js';
import { createComponent, updateComponent } from '../core/component.js';
import { createGroup, isGroupNameTaken } from '../core/group.js';
import { createHelpIcon } from './helpIcon.js';
import { openBoardPatternModal } from './boardPatternModal.js';
import { openBoardImageModal } from './boardImageModal.js';
import { openDiceFontModal } from './diceFontModal.js';
import { openCardEditorModal } from './cardEditorModal.js';
import { CARD_PROPORTIONS, getProporcionRatio } from '../core/cardProportions.js';
import { isListaValoresValida, esResultadoValido, getResultadoInicial } from '../core/dice.js';
import { setStyleClipboard, getStyleClipboard, hasStyleClipboard, validateStyleClipboardForPaste } from '../core/styleClipboard.js';
import { openStyleClipboardSelectionModal } from './styleClipboardSelectionModal.js';
import { openStyleClipboardPasteErrorModal } from './styleClipboardErrorModal.js';
import { showToast } from './toast.js';

const DEFAULT_BOARD_SIZE = 200;
const DEFAULT_DADO_SIZE = 100;
const DEFAULT_DOCUMENTO_WIDTH = 240;
const DEFAULT_DOCUMENTO_HEIGHT = 320;
const DEFAULT_CARTA_WIDTH = 180;

export const DEFAULT_BOARD_PROPERTIES = {
  bordeColor: '#000000',
  bordeGrosor: 2,
  fondoTipo: 'colorPatron',
  patronColor: '#000000',
  patronGrosor: 1,
  patronForma: 'cuadrada',
  patronFilas: 8,
  patronColumnas: 8,
  imagenResourceId: null,
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
  caraActual: 'trasera',
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

function cloneFace(face) {
  return {
    ...face,
    ajusteImagen: { ...face.ajusteImagen },
    textBoxes: face.textBoxes.map((tb) => ({ ...tb })),
  };
}

function cloneCartaProperties(properties) {
  return {
    ...properties,
    caraFrontal: {
      ...properties.caraFrontal,
      ajusteImagen: { ...properties.caraFrontal.ajusteImagen },
      textBoxes: properties.caraFrontal.textBoxes.map((tb) => ({ ...tb })),
    },
    caraTrasera: {
      ...properties.caraTrasera,
      ajusteImagen: { ...properties.caraTrasera.ajusteImagen },
      textBoxes: properties.caraTrasera.textBoxes.map((tb) => ({ ...tb })),
    },
  };
}

// Crea un componente nuevo ya con los valores por defecto de su tipo (tamaño y
// properties), para el flujo de alta: elegir tipo (ui/componentTypeModal.js) →
// crear con defaults → abrir esta modal para configurarlo.
export function createDefaultComponent(type) {
  const component = createComponent({ type });
  if (type === 'tablero') {
    component.width = DEFAULT_BOARD_SIZE;
    component.height = DEFAULT_BOARD_SIZE;
    component.properties = { ...DEFAULT_BOARD_PROPERTIES };
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
    component.bloqueado = false;
    component.subirAlMoverInteractuar = true;
    component.properties = cloneCartaProperties(DEFAULT_CARTA_PROPERTIES);
  }
  return component;
}

export function openComponentModal({ component = null, onAccept, onDelete }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

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

  const moveField = document.createElement('div');
  moveField.className = 'modal__field modal__field--checkbox';
  const moveCheckbox = document.createElement('input');
  moveCheckbox.type = 'checkbox';
  moveCheckbox.checked = workingComponent.bloqueado ?? true;
  const moveLabel = document.createElement('label');
  moveLabel.textContent = 'Bloqueado';

  moveCheckbox.addEventListener('change', () => {
    workingComponent.bloqueado = moveCheckbox.checked;
  });

  moveField.appendChild(moveCheckbox);
  moveField.appendChild(moveLabel);
  moveField.appendChild(createHelpIcon({
    text: 'Si está marcado (por defecto), este componente no se puede mover en Modo Juego. Desmárcalo para poder arrastrarlo libremente por la mesa mientras se juega.',
  }));
  generalContent.appendChild(moveField);

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
  generalContent.appendChild(hiddenField);

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
  generalContent.appendChild(tooltipField);

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
  generalContent.appendChild(upOnMoveField);

  // Grupo (cambio 00105): propiedad general de cualquier tipo de componente,
  // antes exclusiva de "Carta/Ficha" bajo el nombre "Mazo".
  const groupField = document.createElement('div');
  groupField.className = 'modal__field';
  const groupLabel = document.createElement('label');
  groupLabel.textContent = 'Grupo';
  const groupSelect = document.createElement('select');
  const NEW_GROUP_VALUE = '__new__';

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

  function populateGroupSelect() {
    groupSelect.innerHTML = '';
    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = 'Sin grupo';
    if (!workingComponent.grupoId) noneOption.selected = true;
    groupSelect.appendChild(noneOption);

    for (const group of getGroups()) {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.name;
      if (group.id === workingComponent.grupoId) option.selected = true;
      groupSelect.appendChild(option);
    }

    const newOption = document.createElement('option');
    newOption.value = NEW_GROUP_VALUE;
    newOption.textContent = '+ Crear nuevo grupo…';
    groupSelect.appendChild(newOption);
  }
  populateGroupSelect();

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

  groupSelect.addEventListener('change', () => {
    if (groupSelect.value === NEW_GROUP_VALUE) {
      newGroupRow.style.display = 'block';
      newGroupInput.focus();
      return;
    }
    newGroupRow.style.display = 'none';
    workingComponent.grupoId = groupSelect.value || null;
  });

  newGroupInput.addEventListener('input', validateNewGroupName);

  newGroupCreateBtn.addEventListener('click', () => {
    if (!validateNewGroupName()) return;
    const name = newGroupInput.value.trim();
    const group = createGroup({ name });
    addGroup(group);
    workingComponent.grupoId = group.id;
    newGroupRow.style.display = 'none';
    newGroupInput.value = '';
    populateGroupSelect();
  });

  groupField.appendChild(groupLabel);
  groupField.appendChild(groupSelect);
  groupField.appendChild(newGroupRow);
  generalContent.appendChild(groupField);

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
    } else if (workingComponent.type === 'tablero') {
      renderBoardSpecificFields(specificContent);
    } else if (workingComponent.type === 'dado') {
      renderDadoSpecificFields(specificContent);
    } else if (workingComponent.type === 'documento') {
      renderDocumentoSpecificFields(specificContent);
    } else if (workingComponent.type === 'carta') {
      renderCartaSpecificFields(specificContent);
    } else {
      const empty = document.createElement('p');
      empty.textContent = 'Sin propiedades específicas';
      empty.style.color = 'var(--text-muted)';
      specificContent.appendChild(empty);
    }
  }

  function renderBoardSpecificFields(container) {
    const props = workingComponent.properties;

    // Borde: color y grosor juntos en la misma fila
    const borderSection = document.createElement('fieldset');
    borderSection.className = 'modal__section';
    const borderLegend = document.createElement('legend');
    borderLegend.className = 'modal__section-title';
    borderLegend.textContent = 'Borde';
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
      } else {
        openBoardPatternModal({
          properties: props,
          onAccept: ({ patronColor, patronGrosor, patronForma, patronFilas, patronColumnas }) => {
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
    listError.textContent = 'La lista necesita al menos 2 valores no vacíos';
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

  function renderCartaSpecificFields(container) {
    const props = workingComponent.properties;

    // Proporción
    const proporcionField = document.createElement('div');
    proporcionField.className = 'modal__field';
    const proporcionLabel = document.createElement('label');
    proporcionLabel.textContent = 'Proporción';
    const proporcionSelect = document.createElement('select');
    for (const { value, label } of CARD_PROPORTIONS) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === (props.proporcion || DEFAULT_CARTA_PROPERTIES.proporcion)) option.selected = true;
      proporcionSelect.appendChild(option);
    }
    proporcionSelect.addEventListener('change', () => {
      props.proporcion = proporcionSelect.value;
      const width = workingComponent.width || DEFAULT_CARTA_WIDTH;
      workingComponent.width = width;
      workingComponent.height = width / getProporcionRatio(props.proporcion);
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
      openCardEditorModal({
        component: workingComponent,
        onAccept: ({ proporcion, caraFrontal, caraTrasera }) => {
          props.proporcion = proporcion;
          props.caraFrontal = caraFrontal;
          props.caraTrasera = caraTrasera;
          proporcionSelect.value = proporcion;
          const width = workingComponent.width || DEFAULT_CARTA_WIDTH;
          workingComponent.width = width;
          workingComponent.height = width / getProporcionRatio(proporcion);
        },
      });
    });
    editField.appendChild(editBtn);
    container.appendChild(editField);

    // Estilo de la carta — Copiar/Pegar estilo (change 00085)
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
            const grupo = workingComponent.grupoId ? getGroups().find((g) => g.id === workingComponent.grupoId) : null;
            data.generales = {
              bloqueado: workingComponent.bloqueado,
              oculto: workingComponent.oculto,
              mostrarTooltip: workingComponent.mostrarTooltip,
              subirAlMoverInteractuar: workingComponent.subirAlMoverInteractuar,
              grupoId: workingComponent.grupoId,
              grupoName: grupo ? grupo.name : null,
            };
          }
          if (selection.proporcion) data.proporcion = props.proporcion;
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
        workingComponent.grupoId = clip.generales.grupoId;
        moveCheckbox.checked = workingComponent.bloqueado;
        hiddenCheckbox.checked = workingComponent.oculto;
        tooltipCheckbox.checked = workingComponent.mostrarTooltip;
        upOnMoveCheckbox.checked = workingComponent.subirAlMoverInteractuar;
        populateGroupSelect();
      }
      if (clip.caraFrontal) props.caraFrontal = cloneFace(clip.caraFrontal);
      if (clip.caraTrasera) props.caraTrasera = cloneFace(clip.caraTrasera);
      if (clip.proporcion) {
        props.proporcion = clip.proporcion;
        proporcionSelect.value = clip.proporcion;
        const width = workingComponent.width || DEFAULT_CARTA_WIDTH;
        workingComponent.width = width;
        workingComponent.height = width / getProporcionRatio(props.proporcion);
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
