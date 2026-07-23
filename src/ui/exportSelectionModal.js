// Modal de exportación (sustituye al prompt() del nombre de fichero, change
// 00065): campo de nombre de fichero + selección de qué componentes/
// recursos/mazos incluir, agrupados en tres bloques (ui/elementSelectionModal.js).

import { createElementSelectionGroups } from './elementSelectionModal.js';

export function openExportSelectionModal({ components, resources, decks, defaultFilename, onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal element-selection-modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Exportar';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const nameField = document.createElement('div');
  nameField.className = 'modal__field';
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Nombre de fichero';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = defaultFilename;
  nameField.appendChild(nameLabel);
  nameField.appendChild(nameInput);
  content.appendChild(nameField);

  const groupsContainer = document.createElement('div');
  groupsContainer.className = 'element-selection-modal__groups';
  content.appendChild(groupsContainer);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn-accept';
  exportBtn.textContent = 'Exportar';
  footer.appendChild(exportBtn);

  const { getSelection } = createElementSelectionGroups(groupsContainer, { components, resources, decks }, {
    onSelectionChange: (selection) => {
      const hasSelection = selection.componentIds.length > 0 || selection.resourceIds.length > 0 || selection.deckIds.length > 0;
      exportBtn.disabled = !hasSelection;
    },
  });

  exportBtn.addEventListener('click', () => {
    if (exportBtn.disabled) return;
    const filename = nameInput.value.trim();
    if (!filename) return;
    if (onAccept) onAccept({ filename, ...getSelection() });
    overlay.remove();
  });

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
