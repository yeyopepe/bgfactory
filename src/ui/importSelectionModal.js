// Primera modal del flujo de importar: elementos del fichero leído,
// agrupados en tres bloques (ui/elementSelectionModal.js), todos marcados por
// defecto, para elegir cuáles se importan de verdad.

import { createElementSelectionGroups } from './elementSelectionModal.js';
import { t } from '../core/i18n.js';

export function openImportSelectionModal({ components, resources, tags, onAccept, onCancel }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal element-selection-modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = t('import.selection.title');
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'element-selection-modal__tags';
  content.appendChild(tagsContainer);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  function close() {
    overlay.remove();
  }

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = t('common.cancel');
  cancelBtn.addEventListener('click', () => {
    close();
    if (onCancel) onCancel();
  });
  footer.appendChild(cancelBtn);

  const continueBtn = document.createElement('button');
  continueBtn.className = 'btn-accept';
  continueBtn.textContent = t('import.selection.continue');
  footer.appendChild(continueBtn);

  const { getSelection } = createElementSelectionGroups(tagsContainer, { components, resources, tags }, {
    onSelectionChange: (selection) => {
      const hasSelection = selection.componentIds.length > 0 || selection.resourceIds.length > 0 || selection.tagIds.length > 0;
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
