// Primera modal del flujo de importar (change 00065): muestra los elementos
// que trae el fichero leído, agrupados en tres bloques
// (ui/elementSelectionModal.js), todos marcados por defecto, para elegir
// cuáles se importan de verdad.

import { createElementSelectionGroups } from './elementSelectionModal.js';

export function openImportSelectionModal({ components, resources, groups, onAccept, onCancel }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal element-selection-modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Importar — elegir elementos';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const groupsContainer = document.createElement('div');
  groupsContainer.className = 'element-selection-modal__groups';
  content.appendChild(groupsContainer);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  function close() {
    overlay.remove();
  }

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => {
    close();
    if (onCancel) onCancel();
  });
  footer.appendChild(cancelBtn);

  const continueBtn = document.createElement('button');
  continueBtn.className = 'btn-accept';
  continueBtn.textContent = 'Continuar';
  footer.appendChild(continueBtn);

  const { getSelection } = createElementSelectionGroups(groupsContainer, { components, resources, groups }, {
    onSelectionChange: (selection) => {
      const hasSelection = selection.componentIds.length > 0 || selection.resourceIds.length > 0 || selection.groupIds.length > 0;
      continueBtn.disabled = !hasSelection;
    },
  });

  continueBtn.addEventListener('click', () => {
    if (continueBtn.disabled) return;
    const selection = getSelection();
    close();
    if (onAccept) onAccept(selection);
  });

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) {
      close();
      if (onCancel) onCancel();
    }
  });
}
