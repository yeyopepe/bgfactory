// Modal for creating/editing components with tabs.
// Generically handles different component types via type-specific tab content.

import { getComponents, getResources, getDecks, addDeck } from '../core/state.js';
import { createComponent, updateComponent } from '../core/component.js';
import { createDeck } from '../core/deck.js';
import { createHelpIcon } from './helpIcon.js';
import { openBoardPatternModal } from './boardPatternModal.js';
import { openBoardImageModal } from './boardImageModal.js';
import { openDiceFontModal } from './diceFontModal.js';
import { openImageAdjustModal } from './imageAdjustModal.js';
import { openCardEditorModal } from './cardEditorModal.js';
import { CARD_PROPORTIONS, getProporcionRatio } from '../core/cardProportions.js';
import { isListaValoresValida, esResultadoValido, getResultadoInicial } from '../core/dice.js';

const DEFAULT_BOARD_SIZE = 200;
const DEFAULT_DADO_SIZE = 100;
const DEFAULT_DOCUMENTO_WIDTH = 240;
const DEFAULT_DOCUMENTO_HEIGHT = 320;
const DEFAULT_FICHA_SIZE = 60;
const DEFAULT_CARTA_WIDTH = 180;

export const DEFAULT_BOARD_PROPERTIES = {
  bordeColor: '#000000',
  bordeGrosor: 2,
  fondoTipo: 'colorPatron',
  patronColor: '#000000',
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

export const DEFAULT_FICHA_PROPERTIES = {
  forma: 'circular',
  bordeColor: '#000000',
  bordeGrosor: 2,
  fondoTipo: 'color',
  colorFondo: '',
  texto: '',
  imagenResourceId: null,
  ajusteImagen: { zoom: 100, posX: 50, posY: 50 },
};

export const DEFAULT_CARTA_PROPERTIES = {
  proporcion: '5:7',
  deckId: null,
  caraActual: 'trasera',
  caraFrontal: { imagenResourceId: null, ajusteImagen: { zoom: 100, posX: 50, posY: 50 }, textBoxes: [] },
  caraTrasera: { imagenResourceId: null, ajusteImagen: { zoom: 100, posX: 50, posY: 50 }, textBoxes: [] },
};

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
    component.properties = { ...DEFAULT_DADO_PROPERTIES };
  } else if (type === 'documento') {
    component.width = DEFAULT_DOCUMENTO_WIDTH;
    component.height = DEFAULT_DOCUMENTO_HEIGHT;
    component.properties = { ...DEFAULT_DOCUMENTO_PROPERTIES };
  } else if (type === 'ficha') {
    component.width = DEFAULT_FICHA_SIZE;
    component.height = DEFAULT_FICHA_SIZE;
    component.bloqueado = false;
    component.properties = { ...DEFAULT_FICHA_PROPERTIES, ajusteImagen: { ...DEFAULT_FICHA_PROPERTIES.ajusteImagen } };
  } else if (type === 'carta') {
    component.width = DEFAULT_CARTA_WIDTH;
    component.height = DEFAULT_CARTA_WIDTH / getProporcionRatio(DEFAULT_CARTA_PROPERTIES.proporcion);
    component.bloqueado = false;
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
    } else if (workingComponent.type === 'ficha') {
      renderFichaSpecificFields(specificContent);
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

    // Border color
    const borderColorField = document.createElement('div');
    borderColorField.className = 'modal__field';
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
    container.appendChild(borderColorField);

    // Border thickness
    const borderWidthField = document.createElement('div');
    borderWidthField.className = 'modal__field';
    const borderWidthLabel = document.createElement('label');
    borderWidthLabel.textContent = 'Grosor del borde (px)';
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
    container.appendChild(borderWidthField);

    // Background type + configure button
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
          onAccept: ({ patronColor, patronForma, patronFilas, patronColumnas }) => {
            props.patronColor = patronColor;
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
    container.appendChild(bgField);
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

  function renderFichaSpecificFields(container) {
    const props = workingComponent.properties;

    // Forma
    const shapeField = document.createElement('div');
    shapeField.className = 'modal__field';
    const shapeLabel = document.createElement('label');
    shapeLabel.textContent = 'Forma';
    const shapeSelect = document.createElement('select');
    const shapeOptions = [
      { value: 'cuadrada', label: 'Cuadrada' },
      { value: 'circular', label: 'Circular' },
    ];
    for (const { value, label } of shapeOptions) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === (props.forma || DEFAULT_FICHA_PROPERTIES.forma)) option.selected = true;
      shapeSelect.appendChild(option);
    }
    shapeSelect.addEventListener('change', () => {
      props.forma = shapeSelect.value;
    });
    shapeField.appendChild(shapeLabel);
    shapeField.appendChild(shapeSelect);
    container.appendChild(shapeField);

    // Fondo: color / texto / imagen (excluyentes, cada uno conserva su configuración)
    const bgTypeField = document.createElement('div');
    bgTypeField.className = 'modal__field';
    const bgTypeLabel = document.createElement('label');
    bgTypeLabel.textContent = 'Fondo';
    const bgTypeSelect = document.createElement('select');
    const bgTypeOptions = [
      { value: 'color', label: 'Color sólido' },
      { value: 'texto', label: 'Texto' },
      { value: 'imagen', label: 'Imagen' },
    ];
    for (const { value, label } of bgTypeOptions) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === (props.fondoTipo || DEFAULT_FICHA_PROPERTIES.fondoTipo)) option.selected = true;
      bgTypeSelect.appendChild(option);
    }
    bgTypeField.appendChild(bgTypeLabel);
    bgTypeField.appendChild(bgTypeSelect);
    container.appendChild(bgTypeField);

    // Color de fondo: siempre visible y aplicado sea cual sea el tipo de fondo
    // elegido (detrás del texto o de la imagen). Vacío = transparente (por defecto).
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
    bgColorInput.value = props.colorFondo || '#ffffff';

    const bgTransparentCheckbox = document.createElement('input');
    bgTransparentCheckbox.type = 'checkbox';
    bgTransparentCheckbox.checked = !props.colorFondo;

    const bgTransparentLabel = document.createElement('label');
    bgTransparentLabel.textContent = 'Transparente';
    bgTransparentLabel.style.margin = 0;

    bgColorInput.disabled = bgTransparentCheckbox.checked;

    bgTransparentCheckbox.addEventListener('change', () => {
      bgColorInput.disabled = bgTransparentCheckbox.checked;
      props.colorFondo = bgTransparentCheckbox.checked ? '' : bgColorInput.value;
    });

    bgColorInput.addEventListener('input', () => {
      props.colorFondo = bgColorInput.value;
    });

    bgColorContainer.appendChild(bgColorInput);
    bgColorContainer.appendChild(bgTransparentCheckbox);
    bgColorContainer.appendChild(bgTransparentLabel);
    bgColorField.appendChild(bgColorLabel);
    bgColorField.appendChild(bgColorContainer);
    container.appendChild(bgColorField);

    // Borde: color y grosor juntos en la misma fila (a diferencia del tablero, 0 es válido = sin borde)
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
    borderColorInput.value = props.bordeColor || DEFAULT_FICHA_PROPERTIES.bordeColor;
    borderColorInput.addEventListener('input', () => {
      props.bordeColor = borderColorInput.value;
    });
    borderColorField.appendChild(borderColorLabel);
    borderColorField.appendChild(borderColorInput);

    const borderWidthField = document.createElement('div');
    borderWidthField.style.flex = '1';
    const borderWidthLabel = document.createElement('label');
    borderWidthLabel.textContent = 'Grosor del borde (px, 0 = sin borde)';
    const borderWidthInput = document.createElement('input');
    borderWidthInput.type = 'number';
    borderWidthInput.min = 0;
    borderWidthInput.max = 20;
    borderWidthInput.value = props.bordeGrosor ?? DEFAULT_FICHA_PROPERTIES.bordeGrosor;
    borderWidthInput.addEventListener('input', () => {
      const parsed = parseInt(borderWidthInput.value, 10);
      props.bordeGrosor = Number.isNaN(parsed) ? DEFAULT_FICHA_PROPERTIES.bordeGrosor : Math.min(Math.max(parsed, 0), 20);
    });
    borderWidthField.appendChild(borderWidthLabel);
    borderWidthField.appendChild(borderWidthInput);

    borderRowInner.appendChild(borderColorField);
    borderRowInner.appendChild(borderWidthField);
    borderRow.appendChild(borderRowInner);
    container.appendChild(borderRow);

    // Bloque "Texto" (tamaño de fuente siempre automático, sin campo manual)
    const textBlock = document.createElement('div');
    const textField = document.createElement('div');
    textField.className = 'modal__field';
    const textLabel = document.createElement('label');
    textLabel.textContent = 'Texto';
    const textInput = document.createElement('textarea');
    textInput.rows = 2;
    textInput.value = props.texto || '';
    textInput.addEventListener('input', () => {
      props.texto = textInput.value;
    });
    textField.appendChild(textLabel);
    textField.appendChild(textInput);
    textBlock.appendChild(textField);
    container.appendChild(textBlock);

    // Bloque "Imagen"
    const imageBlock = document.createElement('div');
    const imageField = document.createElement('div');
    imageField.className = 'modal__field';
    const imageLabel = document.createElement('label');
    imageLabel.textContent = 'Imagen';
    const imageRow = document.createElement('div');
    imageRow.style.display = 'flex';
    imageRow.style.gap = '0.5rem';
    imageRow.style.alignItems = 'center';

    const chooseImageBtn = document.createElement('button');
    chooseImageBtn.type = 'button';
    chooseImageBtn.className = 'btn-cancel';
    chooseImageBtn.textContent = 'Elegir imagen';

    const adjustImageBtn = document.createElement('button');
    adjustImageBtn.type = 'button';
    adjustImageBtn.className = 'btn-cancel';
    adjustImageBtn.textContent = 'Ajustar imagen…';

    function currentImageResource() {
      return getResources().find((r) => r.id === props.imagenResourceId) || null;
    }

    function updateAdjustButtonState() {
      adjustImageBtn.disabled = !currentImageResource();
    }

    function openAdjustModal() {
      const resource = currentImageResource();
      if (!resource) return;
      openImageAdjustModal({
        shape: props.forma || DEFAULT_FICHA_PROPERTIES.forma,
        width: workingComponent.width || DEFAULT_FICHA_SIZE,
        height: workingComponent.height || DEFAULT_FICHA_SIZE,
        resource,
        adjustment: props.ajusteImagen || DEFAULT_FICHA_PROPERTIES.ajusteImagen,
        onAccept: (adjustment) => {
          props.ajusteImagen = adjustment;
        },
      });
    }

    chooseImageBtn.addEventListener('click', () => {
      openBoardImageModal({
        properties: props,
        resources: getResources(),
        title: 'Elegir imagen',
        onAccept: (resourceId) => {
          props.imagenResourceId = resourceId;
          props.ajusteImagen = { ...DEFAULT_FICHA_PROPERTIES.ajusteImagen };
          updateAdjustButtonState();
          openAdjustModal();
        },
      });
    });

    adjustImageBtn.addEventListener('click', openAdjustModal);

    updateAdjustButtonState();

    imageRow.appendChild(chooseImageBtn);
    imageRow.appendChild(adjustImageBtn);
    imageField.appendChild(imageLabel);
    imageField.appendChild(imageRow);
    imageBlock.appendChild(imageField);
    container.appendChild(imageBlock);

    function updateBgFieldsVisibility() {
      const tipo = props.fondoTipo || DEFAULT_FICHA_PROPERTIES.fondoTipo;
      textBlock.style.display = tipo === 'texto' ? '' : 'none';
      imageBlock.style.display = tipo === 'imagen' ? '' : 'none';
    }
    updateBgFieldsVisibility();

    bgTypeSelect.addEventListener('change', () => {
      props.fondoTipo = bgTypeSelect.value;
      updateBgFieldsVisibility();
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

    // Mazo
    const deckField = document.createElement('div');
    deckField.className = 'modal__field';
    const deckLabel = document.createElement('label');
    deckLabel.textContent = 'Mazo';
    const deckSelect = document.createElement('select');
    const NEW_DECK_VALUE = '__new__';

    const newDeckRow = document.createElement('div');
    newDeckRow.style.display = 'none';
    newDeckRow.style.gap = '0.5rem';
    newDeckRow.style.marginTop = '0.5rem';
    const newDeckInput = document.createElement('input');
    newDeckInput.type = 'text';
    newDeckInput.placeholder = 'Nombre del mazo nuevo';
    const newDeckCreateBtn = document.createElement('button');
    newDeckCreateBtn.type = 'button';
    newDeckCreateBtn.className = 'btn-cancel';
    newDeckCreateBtn.textContent = 'Crear';
    newDeckRow.appendChild(newDeckInput);
    newDeckRow.appendChild(newDeckCreateBtn);

    function populateDeckSelect() {
      deckSelect.innerHTML = '';
      const noneOption = document.createElement('option');
      noneOption.value = '';
      noneOption.textContent = 'Sin mazo';
      if (!props.deckId) noneOption.selected = true;
      deckSelect.appendChild(noneOption);

      for (const deck of getDecks()) {
        const option = document.createElement('option');
        option.value = deck.id;
        option.textContent = deck.name;
        if (deck.id === props.deckId) option.selected = true;
        deckSelect.appendChild(option);
      }

      const newOption = document.createElement('option');
      newOption.value = NEW_DECK_VALUE;
      newOption.textContent = '+ Crear nuevo mazo…';
      deckSelect.appendChild(newOption);
    }
    populateDeckSelect();

    deckSelect.addEventListener('change', () => {
      if (deckSelect.value === NEW_DECK_VALUE) {
        newDeckRow.style.display = 'flex';
        newDeckInput.focus();
        return;
      }
      newDeckRow.style.display = 'none';
      props.deckId = deckSelect.value || null;
    });

    newDeckCreateBtn.addEventListener('click', () => {
      const name = newDeckInput.value.trim();
      if (!name) return;
      const deck = createDeck({ name });
      addDeck(deck);
      props.deckId = deck.id;
      newDeckRow.style.display = 'none';
      newDeckInput.value = '';
      populateDeckSelect();
    });

    deckField.appendChild(deckLabel);
    deckField.appendChild(deckSelect);
    deckField.appendChild(newDeckRow);
    container.appendChild(deckField);

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
