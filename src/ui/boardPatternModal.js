// Sub-modal "Color y patrón" del fondo de tablero, abierta desde pestaña "Específicas" de componentModal.js.
// Misma estructura visual que resourceModal.js (overlay/modal/header/content/footer, sin tabs).

import { t } from '../core/i18n.js';
const MIN_CELLS = 1;
const MAX_CELLS = 50;

export function openBoardPatternModal({ properties, onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = t('boardPattern.title');
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const working = {
    // Ausente → blanco opaco. '' explícito (checkbox "Transparente" marcado) se distingue con '??', no '||'.
    colorFondo: properties.colorFondo ?? '#ffffff',
    patronColor: properties.patronColor || '#000000',
    patronGrosor: properties.patronGrosor || 1,
    // 'hexagonal' es valor legado (orientación única): se normaliza a alias 'hex-horizontal' al abrir,
    // así el desplegable muestra opción equivalente y al aceptar queda guardado con valor nuevo.
    patronForma: properties.patronForma === 'hexagonal' ? 'hex-horizontal' : (properties.patronForma || 'cuadrada'),
    patronFilas: properties.patronFilas || 8,
    patronColumnas: properties.patronColumnas || 8,
  };

  // Sección "Configuración" (forma casilla + filas/columnas) y sección "Color": patrón documentado en
  // design/docs/style/03-modales-menus.md (fieldset.modal__section / legend.modal__section-title, sin --toggle).
  const configSection = document.createElement('fieldset');
  configSection.className = 'modal__section';
  const configLegend = document.createElement('legend');
  configLegend.className = 'modal__section-title';
  configLegend.textContent = t('boardPattern.configLegend');
  configSection.appendChild(configLegend);

  const colorSection = document.createElement('fieldset');
  colorSection.className = 'modal__section';
  const colorLegend = document.createElement('legend');
  colorLegend.className = 'modal__section-title';
  colorLegend.textContent = t('boardPattern.colorLegend');
  colorSection.appendChild(colorLegend);

  // Color de fondo (con opción "Transparente"), detrás del patrón. Mismo patrón que el campo
  // "Color de fondo" de propiedades específicas de 'carta' (ui/componentModal.js).
  const bgColorField = document.createElement('div');
  bgColorField.className = 'modal__field';
  const bgColorLabel = document.createElement('label');
  bgColorLabel.textContent = t('boardPattern.bgColorLabel');
  const bgColorContainer = document.createElement('div');
  bgColorContainer.style.display = 'flex';
  bgColorContainer.style.gap = '0.5rem';
  bgColorContainer.style.alignItems = 'center';

  const bgColorInput = document.createElement('input');
  bgColorInput.type = 'color';
  bgColorInput.value = working.colorFondo || '#ffffff';

  const bgTransparentCheckbox = document.createElement('input');
  bgTransparentCheckbox.type = 'checkbox';
  bgTransparentCheckbox.checked = !working.colorFondo;

  const bgTransparentLabel = document.createElement('label');
  bgTransparentLabel.textContent = t('common.transparent');
  bgTransparentLabel.style.margin = 0;

  bgColorInput.disabled = bgTransparentCheckbox.checked;

  bgTransparentCheckbox.addEventListener('change', () => {
    bgColorInput.disabled = bgTransparentCheckbox.checked;
    working.colorFondo = bgTransparentCheckbox.checked ? '' : bgColorInput.value;
  });

  bgColorInput.addEventListener('input', () => {
    working.colorFondo = bgColorInput.value;
  });

  bgColorContainer.appendChild(bgColorInput);
  bgColorContainer.appendChild(bgTransparentCheckbox);
  bgColorContainer.appendChild(bgTransparentLabel);
  bgColorField.appendChild(bgColorLabel);
  bgColorField.appendChild(bgColorContainer);
  colorSection.appendChild(bgColorField);

  // Color y grosor del patrón en la misma fila (design/docs/style/01-tokens-visual.md)
  const colorRow = document.createElement('div');
  colorRow.className = 'modal__field';
  const colorRowInner = document.createElement('div');
  colorRowInner.style.display = 'flex';
  colorRowInner.style.gap = '0.5rem';

  const colorField = document.createElement('div');
  colorField.style.flex = '1';
  const colorLabel = document.createElement('label');
  colorLabel.textContent = t('boardPattern.patternColorLabel');
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = working.patronColor;
  colorInput.addEventListener('input', () => {
    working.patronColor = colorInput.value;
  });
  colorField.appendChild(colorLabel);
  colorField.appendChild(colorInput);

  const grosorField = document.createElement('div');
  grosorField.style.flex = '1';
  const grosorLabel = document.createElement('label');
  grosorLabel.textContent = t('boardPattern.thicknessLabel');
  const grosorInput = document.createElement('input');
  grosorInput.type = 'number';
  grosorInput.min = 1;
  grosorInput.max = 20;
  grosorInput.value = working.patronGrosor;
  grosorInput.addEventListener('input', () => {
    const parsed = parseInt(grosorInput.value, 10);
    working.patronGrosor = Number.isNaN(parsed) ? working.patronGrosor : Math.min(Math.max(parsed, 1), 20);
  });
  grosorField.appendChild(grosorLabel);
  grosorField.appendChild(grosorInput);

  colorRowInner.appendChild(colorField);
  colorRowInner.appendChild(grosorField);
  colorRow.appendChild(colorRowInner);
  colorSection.appendChild(colorRow);

  const shapeField = document.createElement('div');
  shapeField.className = 'modal__field';
  const shapeLabel = document.createElement('label');
  shapeLabel.textContent = t('boardPattern.cellShapeLabel');
  const shapeSelect = document.createElement('select');
  const shapeOptions = [
    { value: 'cuadrada', label: t('option.cellShape.cuadrada') },
    { value: 'hex-vertical', label: t('option.cellShape.hexVertical') },
    { value: 'hex-horizontal', label: t('option.cellShape.hexHorizontal') },
  ];
  for (const { value, label } of shapeOptions) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    if (value === working.patronForma) option.selected = true;
    shapeSelect.appendChild(option);
  }
  shapeSelect.addEventListener('change', () => {
    working.patronForma = shapeSelect.value;
  });
  shapeField.appendChild(shapeLabel);
  shapeField.appendChild(shapeSelect);
  configSection.appendChild(shapeField);

  const cellsRow = document.createElement('div');
  cellsRow.className = 'modal__field';
  const cellsRowInner = document.createElement('div');
  cellsRowInner.style.display = 'flex';
  cellsRowInner.style.gap = '0.5rem';

  const rowsField = document.createElement('div');
  rowsField.style.flex = '1';
  const rowsLabel = document.createElement('label');
  rowsLabel.textContent = t('boardPattern.rowsLabel');
  const rowsInput = document.createElement('input');
  rowsInput.type = 'number';
  rowsInput.min = MIN_CELLS;
  rowsInput.max = MAX_CELLS;
  rowsInput.value = working.patronFilas;
  rowsInput.addEventListener('input', () => {
    const parsed = parseInt(rowsInput.value, 10);
    working.patronFilas = Number.isNaN(parsed) ? working.patronFilas : Math.min(Math.max(parsed, MIN_CELLS), MAX_CELLS);
  });
  rowsField.appendChild(rowsLabel);
  rowsField.appendChild(rowsInput);

  const colsField = document.createElement('div');
  colsField.style.flex = '1';
  const colsLabel = document.createElement('label');
  colsLabel.textContent = t('boardPattern.colsLabel');
  const colsInput = document.createElement('input');
  colsInput.type = 'number';
  colsInput.min = MIN_CELLS;
  colsInput.max = MAX_CELLS;
  colsInput.value = working.patronColumnas;
  colsInput.addEventListener('input', () => {
    const parsed = parseInt(colsInput.value, 10);
    working.patronColumnas = Number.isNaN(parsed) ? working.patronColumnas : Math.min(Math.max(parsed, MIN_CELLS), MAX_CELLS);
  });
  colsField.appendChild(colsLabel);
  colsField.appendChild(colsInput);

  cellsRowInner.appendChild(rowsField);
  cellsRowInner.appendChild(colsField);
  cellsRow.appendChild(cellsRowInner);
  configSection.appendChild(cellsRow);

  content.appendChild(configSection);
  content.appendChild(colorSection);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = t('common.cancel');
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = t('common.accept');
  acceptBtn.addEventListener('click', () => {
    if (onAccept) onAccept({ ...working });
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
