// Sub-modal "Color y patrón" del fondo de un tablero, abierta desde la pestaña
// "Específicas" de componentModal.js. Misma estructura visual que
// resourceModal.js (overlay/modal/header/content/footer, sin tabs).

const MIN_CELLS = 1;
const MAX_CELLS = 50;

export function openBoardPatternModal({ properties, onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Configurar fondo — Color y patrón';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const working = {
    patronColor: properties.patronColor || '#000000',
    patronForma: properties.patronForma || 'cuadrada',
    patronFilas: properties.patronFilas || 8,
    patronColumnas: properties.patronColumnas || 8,
  };

  const colorField = document.createElement('div');
  colorField.className = 'modal__field';
  const colorLabel = document.createElement('label');
  colorLabel.textContent = 'Color del patrón';
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = working.patronColor;
  colorInput.addEventListener('input', () => {
    working.patronColor = colorInput.value;
  });
  colorField.appendChild(colorLabel);
  colorField.appendChild(colorInput);
  content.appendChild(colorField);

  const shapeField = document.createElement('div');
  shapeField.className = 'modal__field';
  const shapeLabel = document.createElement('label');
  shapeLabel.textContent = 'Forma de casilla';
  const shapeSelect = document.createElement('select');
  const shapeOptions = [
    { value: 'cuadrada', label: 'Cuadrada' },
    { value: 'hexagonal', label: 'Hexagonal' },
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
  content.appendChild(shapeField);

  const rowsField = document.createElement('div');
  rowsField.className = 'modal__field';
  const rowsLabel = document.createElement('label');
  rowsLabel.textContent = 'Filas';
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
  content.appendChild(rowsField);

  const colsField = document.createElement('div');
  colsField.className = 'modal__field';
  const colsLabel = document.createElement('label');
  colsLabel.textContent = 'Columnas';
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
  content.appendChild(colsField);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';
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
