// Sub-modal "Color de fondo" de una cara del editor visual (ui/visualEditorModal.js), abierta
// desde opción "Color de fondo…" del menú "Añadir elemento". Misma estructura visual que el resto
// de sub-modales de fondo (overlay/modal/header/content/footer, sin tabs, campo único sin fieldset).
// Mismo patrón color + checkbox "Transparente" que ui/boardPatternModal.js.

export function openCardBackgroundColorModal({ properties, onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Configurar color de fondo';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  // '' explícito (checkbox "Transparente" marcado) se distingue con '??', no '||'. Mismo criterio que ui/boardPatternModal.js.
  const working = {
    colorFondo: properties.colorFondo ?? '#ffffff',
  };

  const colorField = document.createElement('div');
  colorField.className = 'modal__field';
  const colorLabel = document.createElement('label');
  colorLabel.textContent = 'Color de fondo';
  const colorContainer = document.createElement('div');
  colorContainer.style.display = 'flex';
  colorContainer.style.gap = '0.5rem';
  colorContainer.style.alignItems = 'center';

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = working.colorFondo || '#ffffff';

  const transparentCheckbox = document.createElement('input');
  transparentCheckbox.type = 'checkbox';
  transparentCheckbox.checked = !working.colorFondo;

  const transparentLabel = document.createElement('label');
  transparentLabel.textContent = 'Transparente';
  transparentLabel.style.margin = 0;

  colorInput.disabled = transparentCheckbox.checked;

  transparentCheckbox.addEventListener('change', () => {
    colorInput.disabled = transparentCheckbox.checked;
    working.colorFondo = transparentCheckbox.checked ? '' : colorInput.value;
  });

  colorInput.addEventListener('input', () => {
    working.colorFondo = colorInput.value;
  });

  colorContainer.appendChild(colorInput);
  colorContainer.appendChild(transparentCheckbox);
  colorContainer.appendChild(transparentLabel);
  colorField.appendChild(colorLabel);
  colorField.appendChild(colorContainer);
  content.appendChild(colorField);

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
