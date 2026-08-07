// Modal de selección al pulsar "Copiar estilo" sobre una carta: checklist de
// un único grupo fijo de 4 elementos (Generales, Proporción, Cara frontal,
// Cara trasera), todos marcados por defecto. No reutiliza
// ui/elementSelectionModal.js (pensada para colecciones dinámicas con
// id/label) — construye su propio marcado reutilizando las mismas clases BEM
// `.element-selection-group*` (design/docs/style/02-componentes-layout.md)
// para heredar el mismo lenguaje visual sin duplicar CSS.

import { CARD_PROPORTIONS } from '../core/cardProportions.js';

const ITEMS = [
  { key: 'generales', label: 'Generales', hint: 'Bloqueado, tooltip, subir al interactuar, etiqueta' },
  { key: 'proporcion', label: 'Proporción' },
  { key: 'caraFrontal', label: 'Cara frontal' },
  { key: 'caraTrasera', label: 'Cara trasera' },
];

function hintFor(key, component) {
  const props = component.properties;
  if (key === 'proporcion') {
    const entry = CARD_PROPORTIONS.find((p) => p.value === props.proporcion);
    return entry ? entry.label : props.proporcion;
  }
  return null;
}

export function openStyleClipboardSelectionModal({ component, onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Copiar estilo';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';

  const hint = document.createElement('p');
  hint.className = 'modal__hint';
  hint.textContent = 'Elige qué copiar. "Cara frontal" y "Cara trasera" incluyen todo su diseño (imagen, borde, transparencia y cuadros de texto).';
  content.appendChild(hint);

  const group = document.createElement('div');
  group.className = 'element-selection-group';

  const selectAllRow = document.createElement('label');
  selectAllRow.className = 'element-selection-group__select-all';
  const selectAllCheckbox = document.createElement('input');
  selectAllCheckbox.type = 'checkbox';
  selectAllCheckbox.checked = true;
  const selectAllTitle = document.createElement('span');
  selectAllTitle.className = 'element-selection-group__title';
  selectAllTitle.textContent = 'Elementos de la carta';
  selectAllRow.appendChild(selectAllCheckbox);
  selectAllRow.appendChild(selectAllTitle);
  group.appendChild(selectAllRow);

  const list = document.createElement('div');
  list.className = 'element-selection-group__list';
  group.appendChild(list);

  const itemCheckboxes = [];
  for (const item of ITEMS) {
    const itemLabel = document.createElement('label');
    itemLabel.className = 'element-selection-group__item';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.dataset.key = item.key;
    itemLabel.appendChild(checkbox);
    const text = document.createElement('span');
    text.textContent = item.label;
    itemLabel.appendChild(text);
    const hintText = hintFor(item.key, component) ?? item.hint;
    if (hintText) {
      const hintSpan = document.createElement('span');
      hintSpan.className = 'element-selection-group__item-hint';
      hintSpan.textContent = hintText;
      itemLabel.appendChild(hintSpan);
    }
    checkbox.addEventListener('change', () => {
      selectAllCheckbox.checked = itemCheckboxes.every((c) => c.checked);
      updateAcceptButton();
    });
    itemCheckboxes.push(checkbox);
    list.appendChild(itemLabel);
  }

  selectAllCheckbox.addEventListener('change', () => {
    for (const checkbox of itemCheckboxes) checkbox.checked = selectAllCheckbox.checked;
    updateAcceptButton();
  });

  content.appendChild(group);
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Copiar';
  acceptBtn.addEventListener('click', () => {
    const selection = {};
    for (const checkbox of itemCheckboxes) {
      selection[checkbox.dataset.key] = checkbox.checked;
    }
    overlay.remove();
    onAccept(selection);
  });
  footer.appendChild(acceptBtn);
  modal.appendChild(footer);

  function updateAcceptButton() {
    acceptBtn.disabled = itemCheckboxes.every((c) => !c.checked);
  }
  updateAcceptButton();

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
