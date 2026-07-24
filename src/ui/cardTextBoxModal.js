// Sub-modal de edición de un cuadro de texto de una cara de carta, abierta
// con doble click desde ui/cardEditorModal.js. Sin tabs, mismo patrón visual
// que el resto de sub-modales del proyecto (overlay + modal).

import { openDiceFontModal } from './diceFontModal.js';
import { getResources } from '../core/state.js';

export function openCardTextBoxModal({ textBox, onAccept, onDelete }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Editar cuadro de texto';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const working = { ...textBox };

  // Contenido
  const contentField = document.createElement('div');
  contentField.className = 'modal__field';
  const contentLabel = document.createElement('label');
  contentLabel.textContent = 'Contenido';
  const contentInput = document.createElement('textarea');
  contentInput.rows = 3;
  contentInput.value = working.contenido || '';
  contentInput.addEventListener('input', () => {
    working.contenido = contentInput.value;
  });
  contentField.appendChild(contentLabel);
  contentField.appendChild(contentInput);
  content.appendChild(contentField);

  // Tipografía
  const fontField = document.createElement('div');
  fontField.className = 'modal__field';
  const fontLabel = document.createElement('label');
  fontLabel.textContent = 'Tipografía';
  const fontRow = document.createElement('div');
  fontRow.style.display = 'flex';
  fontRow.style.gap = '0.5rem';
  fontRow.style.alignItems = 'center';

  const fontCurrentName = document.createElement('span');
  fontCurrentName.style.color = 'var(--text-muted)';
  function updateFontCurrentName() {
    const resource = getResources().find((r) => r.id === working.fuenteResourceId);
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
      currentResourceId: working.fuenteResourceId,
      onAccept: (resourceId) => {
        working.fuenteResourceId = resourceId;
        updateFontCurrentName();
      },
    });
  });

  fontRow.appendChild(fontBtn);
  fontRow.appendChild(fontCurrentName);
  fontField.appendChild(fontLabel);
  fontField.appendChild(fontRow);
  content.appendChild(fontField);

  // Tamaño (unidades de diseño)
  const sizeField = document.createElement('div');
  sizeField.className = 'modal__field';
  const sizeLabel = document.createElement('label');
  sizeLabel.textContent = 'Tamaño de fuente';
  const sizeInput = document.createElement('input');
  sizeInput.type = 'number';
  sizeInput.min = 4;
  sizeInput.max = 200;
  sizeInput.value = working.tamañoFuente || 16;
  sizeInput.addEventListener('input', () => {
    const parsed = parseInt(sizeInput.value, 10);
    working.tamañoFuente = Number.isNaN(parsed) ? 16 : Math.min(Math.max(parsed, 4), 200);
  });
  sizeField.appendChild(sizeLabel);
  sizeField.appendChild(sizeInput);
  content.appendChild(sizeField);

  // Color
  const colorField = document.createElement('div');
  colorField.className = 'modal__field';
  const colorLabel = document.createElement('label');
  colorLabel.textContent = 'Color';
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = working.color || '#000000';
  colorInput.addEventListener('input', () => {
    working.color = colorInput.value;
  });
  colorField.appendChild(colorLabel);
  colorField.appendChild(colorInput);
  content.appendChild(colorField);

  // Borde
  const borderSection = document.createElement('fieldset');
  borderSection.className = 'modal__section';

  const borderLegend = document.createElement('legend');
  borderLegend.className = 'modal__section-title modal__section-title--toggle';
  const borderActiveCheckbox = document.createElement('input');
  borderActiveCheckbox.type = 'checkbox';
  borderActiveCheckbox.checked = working.bordeActivo ?? false;
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
  borderColorInput.value = working.bordeColor || '#000000';
  borderColorInput.addEventListener('input', () => {
    working.bordeColor = borderColorInput.value;
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
  borderWidthInput.value = working.bordeGrosor ?? 2;
  borderWidthInput.addEventListener('input', () => {
    const parsed = parseInt(borderWidthInput.value, 10);
    working.bordeGrosor = Number.isNaN(parsed) ? 2 : Math.min(Math.max(parsed, 1), 20);
  });
  borderWidthField.appendChild(borderWidthLabel);
  borderWidthField.appendChild(borderWidthInput);

  borderRowInner.appendChild(borderColorField);
  borderRowInner.appendChild(borderWidthField);
  borderRow.appendChild(borderRowInner);
  borderSection.appendChild(borderRow);

  const borderTypeField = document.createElement('div');
  borderTypeField.className = 'modal__field';
  const borderTypeLabel = document.createElement('label');
  borderTypeLabel.textContent = 'Tipo de línea';
  const borderTypeSelect = document.createElement('select');
  const borderTypeOptions = [
    { value: 'continua', label: 'Continua' },
    { value: 'punteada', label: 'Punteada' },
  ];
  for (const { value, label } of borderTypeOptions) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    if (value === (working.bordeTipo || 'continua')) option.selected = true;
    borderTypeSelect.appendChild(option);
  }
  borderTypeSelect.addEventListener('change', () => {
    working.bordeTipo = borderTypeSelect.value;
  });
  borderTypeField.appendChild(borderTypeLabel);
  borderTypeField.appendChild(borderTypeSelect);
  borderSection.appendChild(borderTypeField);

  function updateBorderSectionDisabled() {
    const active = borderActiveCheckbox.checked;
    borderSection.classList.toggle('modal__section--disabled', !active);
    borderColorInput.disabled = !active;
    borderWidthInput.disabled = !active;
    borderTypeSelect.disabled = !active;
  }
  borderActiveCheckbox.addEventListener('change', () => {
    working.bordeActivo = borderActiveCheckbox.checked;
    updateBorderSectionDisabled();
  });
  updateBorderSectionDisabled();

  content.appendChild(borderSection);

  // Fondo
  const bgSection = document.createElement('fieldset');
  bgSection.className = 'modal__section';
  const bgLegend = document.createElement('legend');
  bgLegend.className = 'modal__section-title';
  bgLegend.textContent = 'Fondo';
  bgSection.appendChild(bgLegend);

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
  bgColorInput.value = working.colorFondo || '#ffffff';

  const bgTransparentCheckbox = document.createElement('input');
  bgTransparentCheckbox.type = 'checkbox';
  bgTransparentCheckbox.checked = !working.colorFondo;

  const bgTransparentLabel = document.createElement('label');
  bgTransparentLabel.textContent = 'Transparente';
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
  bgSection.appendChild(bgColorField);

  content.appendChild(bgSection);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-eliminar';
  deleteBtn.textContent = 'Eliminar';
  deleteBtn.addEventListener('click', () => {
    if (onDelete) onDelete();
    overlay.remove();
  });
  footer.appendChild(deleteBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';
  acceptBtn.addEventListener('click', () => {
    if (onAccept) onAccept(working);
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
