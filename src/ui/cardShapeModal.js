// Sub-modal de edición de una figura geométrica de una cara de carta, abierta
// con doble click desde ui/cardEditorModal.js. Mismo patrón que
// ui/cardTextBoxModal.js (sin tabs, overlay + modal).

export function openCardShapeModal({ shape, onAccept, onDelete, onDuplicate }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Editar figura';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const working = { ...shape };
  working.tipo = working.tipo || 'circular';
  working.colorFondo = working.colorFondo ?? '';
  working.bordeColor = working.bordeColor || '#000000';
  working.bordeGrosor = working.bordeGrosor ?? 2;
  working.bordeActivo = working.bordeActivo ?? true;

  // Tipo de figura: mismo patrón .align-group/.align-group__btn de opción
  // única que ya usa cardTextBoxModal.js (createAlignGroup), duplicado
  // localmente aquí igual que allí — no se extrae a un módulo compartido.
  const SHAPE_TYPE_OPTIONS = [
    {
      value: 'circular',
      label: 'Círculo / elipse',
      icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="7"/></svg>',
    },
    {
      value: 'cuadrada',
      label: 'Cuadrado',
      icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="2.5" width="13" height="13"/></svg>',
    },
  ];

  const typeField = document.createElement('div');
  typeField.className = 'modal__field';
  const typeLabel = document.createElement('label');
  typeLabel.textContent = 'Tipo de figura';
  typeField.appendChild(typeLabel);

  const typeGroup = document.createElement('div');
  typeGroup.className = 'align-group';
  const typeButtons = SHAPE_TYPE_OPTIONS.map(({ value, label, icon }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'align-group__btn';
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.innerHTML = icon;
    btn.classList.toggle('active', value === working.tipo);
    btn.addEventListener('click', () => {
      working.tipo = value;
      typeButtons.forEach((b, i) => b.classList.toggle('active', SHAPE_TYPE_OPTIONS[i].value === value));
      // Mismo criterio que la proporción 'circular' de Carta: al pasar a
      // círculo/elipse con ejes distintos, se ajusta a un círculo perfecto.
      if (value === 'circular' && working.width !== working.height) {
        const side = Math.max(working.width, working.height);
        working.width = side;
        working.height = side;
      }
    });
    typeGroup.appendChild(btn);
    return btn;
  });
  typeField.appendChild(typeGroup);
  content.appendChild(typeField);

  // Fondo (informativo: color + checkbox "Transparente", mismo patrón que la
  // sección "Fondo" de cardTextBoxModal.js).
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

  // Borde: línea simple (sin bisel), mismo patrón de checkbox activador que
  // ui/cardTextBoxModal.js.
  const borderSection = document.createElement('fieldset');
  borderSection.className = 'modal__section';
  const borderLegend = document.createElement('legend');
  borderLegend.className = 'modal__section-title modal__section-title--toggle';
  const borderActiveCheckbox = document.createElement('input');
  borderActiveCheckbox.type = 'checkbox';
  borderActiveCheckbox.checked = working.bordeActivo;
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
  borderColorInput.value = working.bordeColor;
  borderColorInput.addEventListener('input', () => {
    working.bordeColor = borderColorInput.value;
  });
  borderColorField.appendChild(borderColorLabel);
  borderColorField.appendChild(borderColorInput);

  const borderWidthField = document.createElement('div');
  borderWidthField.style.flex = '1';
  const borderWidthLabel = document.createElement('label');
  borderWidthLabel.textContent = 'Grosor (px)';
  const borderWidthInput = document.createElement('input');
  borderWidthInput.type = 'number';
  borderWidthInput.min = 1;
  borderWidthInput.max = 20;
  borderWidthInput.value = working.bordeGrosor;
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

  function updateBorderSectionDisabled() {
    const active = borderActiveCheckbox.checked;
    borderSection.classList.toggle('modal__section--disabled', !active);
    borderColorInput.disabled = !active;
    borderWidthInput.disabled = !active;
  }
  borderActiveCheckbox.addEventListener('change', () => {
    working.bordeActivo = borderActiveCheckbox.checked;
    updateBorderSectionDisabled();
  });
  updateBorderSectionDisabled();

  content.appendChild(borderSection);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-eliminar';
  deleteBtn.textContent = 'Eliminar';
  deleteBtn.addEventListener('click', () => {
    if (onDelete) onDelete();
    overlay.remove();
  });
  footer.appendChild(deleteBtn);

  const duplicateBtn = document.createElement('button');
  duplicateBtn.className = 'btn-duplicate';
  duplicateBtn.textContent = 'Duplicar';
  duplicateBtn.addEventListener('click', () => {
    if (onDuplicate) onDuplicate(working);
    overlay.remove();
  });
  footer.appendChild(duplicateBtn);

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
