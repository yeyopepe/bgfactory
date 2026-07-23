// Segunda modal del flujo de importar (change 00065): confirmación final con
// el modo de importación y el comportamiento ante id duplicado. Mismo patrón
// sin tabs que ui/boardPatternModal.js.

export function openImportConfirmModal({ onAccept, onCancel }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Importar — confirmar';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const working = { mode: 'add', conflictMode: 'overwrite' };

  const modeField = document.createElement('div');
  modeField.className = 'modal__field';
  const modeLabel = document.createElement('label');
  modeLabel.textContent = 'Modo de importación';
  const modeSelect = document.createElement('select');
  const modeOptions = [
    { value: 'add', label: 'Añadir a lo existente' },
    { value: 'overwrite', label: 'Sobrescribir todo el juego' },
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
  conflictLabel.textContent = 'Comportamiento ante id duplicado';
  const conflictSelect = document.createElement('select');
  const conflictOptions = [
    { value: 'overwrite', label: 'Sobrescribir el existente' },
    { value: 'keepBoth', label: 'Mantener ambos' },
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
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => {
    close();
    if (onCancel) onCancel();
  });
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Importar';
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
