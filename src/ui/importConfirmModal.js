// Segunda modal del flujo de importar: confirmación final con modo de
// importación y comportamiento ante id duplicado. Mismo patrón sin tabs que
// ui/boardPatternModal.js.

import { t } from '../core/i18n.js';
export function openImportConfirmModal({ onAccept, onCancel }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = t('import.confirm.title');
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const working = { mode: 'overwrite', conflictMode: 'overwrite' };

  const modeField = document.createElement('div');
  modeField.className = 'modal__field';
  const modeLabel = document.createElement('label');
  modeLabel.textContent = t('import.confirm.modeLabel');
  const modeSelect = document.createElement('select');
  const modeOptions = [
    { value: 'add', label: t('import.confirm.mode.add') },
    { value: 'overwrite', label: t('import.confirm.mode.overwrite') },
  ];
  for (const { value, label } of modeOptions) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    if (value === working.mode) option.selected = true;
    modeSelect.appendChild(option);
  }
  modeSelect.addEventListener('change', () => {
    working.mode = modeSelect.value;
  });
  modeField.appendChild(modeLabel);
  modeField.appendChild(modeSelect);
  content.appendChild(modeField);

  const conflictField = document.createElement('div');
  conflictField.className = 'modal__field';
  const conflictLabel = document.createElement('label');
  conflictLabel.textContent = t('import.confirm.conflictLabel');
  const conflictSelect = document.createElement('select');
  const conflictOptions = [
    { value: 'overwrite', label: t('import.confirm.conflict.overwrite') },
    { value: 'keepBoth', label: t('import.confirm.conflict.keepBoth') },
  ];
  for (const { value, label } of conflictOptions) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    if (value === working.conflictMode) option.selected = true;
    conflictSelect.appendChild(option);
  }
  conflictSelect.addEventListener('change', () => {
    working.conflictMode = conflictSelect.value;
  });
  conflictField.appendChild(conflictLabel);
  conflictField.appendChild(conflictSelect);
  content.appendChild(conflictField);

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

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = t('import.confirm.accept');
  acceptBtn.addEventListener('click', () => {
    close();
    if (onAccept) onAccept({ ...working });
  });
  footer.appendChild(acceptBtn);

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
