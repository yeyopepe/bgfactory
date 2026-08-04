// Sub-modal de edición de un cuadro de texto de una cara de carta, abierta
// con doble click desde ui/cardEditorModal.js. Sin tabs, mismo patrón visual
// que el resto de sub-modales del proyecto (overlay + modal).

import { openDiceFontModal } from './diceFontModal.js';
import { getResources } from '../core/state.js';

export function openCardTextBoxModal({ textBox, onAccept, onDelete, onDuplicate }) {
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
  working.colorFondoTransparencia = working.colorFondoTransparencia ?? 0;

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

  // Posición del texto dentro del cuadro: alineación horizontal/vertical y
  // márgenes por lateral. Bloque único antes de "Tamaño de fuente".
  const HORIZONTAL_ALIGN_OPTIONS = [
    {
      value: 'izquierda',
      label: 'Alinear a la izquierda',
      icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="2" y1="4" x2="16" y2="4"/><line x1="2" y1="9" x2="11" y2="9"/><line x1="2" y1="14" x2="14" y2="14"/></svg>',
    },
    {
      value: 'centro',
      label: 'Centrar horizontalmente',
      icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="2" y1="4" x2="16" y2="4"/><line x1="4.5" y1="9" x2="13.5" y2="9"/><line x1="3" y1="14" x2="15" y2="14"/></svg>',
    },
    {
      value: 'derecha',
      label: 'Alinear a la derecha',
      icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="2" y1="4" x2="16" y2="4"/><line x1="7" y1="9" x2="16" y2="9"/><line x1="4" y1="14" x2="16" y2="14"/></svg>',
    },
  ];

  const VERTICAL_ALIGN_OPTIONS = [
    {
      value: 'arriba',
      label: 'Alinear arriba',
      icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="2" y1="3" x2="16" y2="3"/><line x1="9" y1="3" x2="9" y2="15"/><line x1="5.5" y1="7" x2="9" y2="3"/><line x1="12.5" y1="7" x2="9" y2="3"/></svg>',
    },
    {
      value: 'centro',
      label: 'Centrar verticalmente',
      icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="2" y1="9" x2="16" y2="9"/><line x1="9" y1="3" x2="9" y2="15"/><line x1="5.5" y1="5.5" x2="9" y2="2.5"/><line x1="12.5" y1="5.5" x2="9" y2="2.5"/><line x1="5.5" y1="12.5" x2="9" y2="15.5"/><line x1="12.5" y1="12.5" x2="9" y2="15.5"/></svg>',
    },
    {
      value: 'abajo',
      label: 'Alinear abajo',
      icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="2" y1="15" x2="16" y2="15"/><line x1="9" y1="3" x2="9" y2="15"/><line x1="5.5" y1="11" x2="9" y2="15"/><line x1="12.5" y1="11" x2="9" y2="15"/></svg>',
    },
  ];

  working.alineacionHorizontal = working.alineacionHorizontal || 'izquierda';
  working.alineacionVertical = working.alineacionVertical || 'arriba';

  function createAlignGroup(options, currentValue, onChange) {
    const group = document.createElement('div');
    group.className = 'align-group';
    const buttons = options.map(({ value, label, icon }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'align-group__btn';
      btn.title = label;
      btn.setAttribute('aria-label', label);
      btn.innerHTML = icon;
      btn.classList.toggle('active', value === currentValue);
      btn.addEventListener('click', () => {
        onChange(value);
        buttons.forEach((b, i) => b.classList.toggle('active', options[i].value === value));
      });
      group.appendChild(btn);
      return btn;
    });
    return group;
  }

  const positionField = document.createElement('div');
  positionField.className = 'modal__field';
  const positionLabel = document.createElement('label');
  positionLabel.textContent = 'Posición del texto en el cuadro';
  positionField.appendChild(positionLabel);

  const alignRow = document.createElement('div');
  alignRow.style.display = 'flex';
  alignRow.style.gap = '1rem';

  const horizontalGroupWrapper = document.createElement('div');
  horizontalGroupWrapper.style.flex = '1';
  horizontalGroupWrapper.appendChild(
    createAlignGroup(HORIZONTAL_ALIGN_OPTIONS, working.alineacionHorizontal, (value) => {
      working.alineacionHorizontal = value;
    }),
  );

  const verticalGroupWrapper = document.createElement('div');
  verticalGroupWrapper.style.flex = '1';
  verticalGroupWrapper.appendChild(
    createAlignGroup(VERTICAL_ALIGN_OPTIONS, working.alineacionVertical, (value) => {
      working.alineacionVertical = value;
    }),
  );

  alignRow.appendChild(horizontalGroupWrapper);
  alignRow.appendChild(verticalGroupWrapper);
  positionField.appendChild(alignRow);

  const marginRow = document.createElement('div');
  marginRow.style.display = 'flex';
  marginRow.style.gap = '0.5rem';
  marginRow.style.marginTop = '0.5rem';

  const MARGIN_FIELDS = [
    { prop: 'margenSuperior', label: 'Arriba' },
    { prop: 'margenDerecha', label: 'Derecha' },
    { prop: 'margenInferior', label: 'Abajo' },
    { prop: 'margenIzquierda', label: 'Izquierda' },
  ];
  working.margenSuperior = working.margenSuperior ?? 0;
  working.margenDerecha = working.margenDerecha ?? 0;
  working.margenInferior = working.margenInferior ?? 0;
  working.margenIzquierda = working.margenIzquierda ?? 0;

  for (const { prop, label } of MARGIN_FIELDS) {
    const marginField = document.createElement('div');
    marginField.style.flex = '1';
    const marginLabel = document.createElement('label');
    marginLabel.textContent = label;
    const marginInput = document.createElement('input');
    marginInput.type = 'number';
    marginInput.min = 0;
    marginInput.value = working[prop];
    marginInput.addEventListener('input', () => {
      const parsed = parseInt(marginInput.value, 10);
      working[prop] = Number.isNaN(parsed) ? 0 : Math.max(parsed, 0);
    });
    marginField.appendChild(marginLabel);
    marginField.appendChild(marginInput);
    marginRow.appendChild(marginField);
  }
  positionField.appendChild(marginRow);
  content.appendChild(positionField);

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

  // Estilo de texto: negrita/cursiva/subrayado, interruptores independientes
  // y combinables (a diferencia de createAlignGroup, ninguno excluye a los
  // demás), mismo lenguaje visual .align-group/.align-group__btn.
  const STYLE_TOGGLE_OPTIONS = [
    {
      prop: 'negrita',
      label: 'Negrita',
      icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3.5h5.2a2.8 2.8 0 0 1 0 5.6H5z"/><path d="M5 9.1h5.9a2.9 2.9 0 0 1 0 5.8H5z"/></svg>',
    },
    {
      prop: 'cursiva',
      label: 'Cursiva',
      icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="11" y1="3.5" x2="7" y2="14.5"/><line x1="6" y1="14.5" x2="10" y2="14.5"/><line x1="8" y1="3.5" x2="12" y2="3.5"/></svg>',
    },
    {
      prop: 'subrayado',
      label: 'Subrayado',
      icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 3v5.5a4 4 0 0 0 8 0V3"/><line x1="4" y1="15" x2="14" y2="15"/></svg>',
    },
  ];

  working.negrita = working.negrita || false;
  working.cursiva = working.cursiva || false;
  working.subrayado = working.subrayado || false;

  const styleField = document.createElement('div');
  styleField.className = 'modal__field';
  const styleLabel = document.createElement('label');
  styleLabel.textContent = 'Estilo de texto';
  styleField.appendChild(styleLabel);

  const styleGroup = document.createElement('div');
  styleGroup.className = 'align-group';
  for (const { prop, label, icon } of STYLE_TOGGLE_OPTIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'align-group__btn';
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.innerHTML = icon;
    btn.classList.toggle('active', working[prop]);
    btn.addEventListener('click', () => {
      working[prop] = !working[prop];
      btn.classList.toggle('active', working[prop]);
    });
    styleGroup.appendChild(btn);
  }
  styleField.appendChild(styleGroup);
  content.appendChild(styleField);

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

  const bgOpacityField = document.createElement('div');
  bgOpacityField.className = 'modal__field';
  const bgOpacityLabel = document.createElement('label');
  bgOpacityLabel.textContent = 'Nivel de transparencia';

  const bgOpacitySlider = document.createElement('input');
  bgOpacitySlider.type = 'range';
  bgOpacitySlider.min = 0;
  bgOpacitySlider.max = 100;
  bgOpacitySlider.value = working.colorFondoTransparencia;

  const bgOpacityValue = document.createElement('div');
  bgOpacityValue.className = 'modal__opacity-value';
  const bgOpacityTextInput = document.createElement('input');
  bgOpacityTextInput.type = 'text';
  bgOpacityTextInput.value = bgOpacitySlider.value;
  const bgOpacityUnit = document.createElement('span');
  bgOpacityUnit.textContent = '%';
  bgOpacityValue.appendChild(bgOpacityTextInput);
  bgOpacityValue.appendChild(bgOpacityUnit);

  bgOpacitySlider.disabled = bgTransparentCheckbox.checked;
  bgOpacityTextInput.disabled = bgTransparentCheckbox.checked;

  bgOpacitySlider.addEventListener('input', () => {
    working.colorFondoTransparencia = parseInt(bgOpacitySlider.value, 10);
    bgOpacityTextInput.value = working.colorFondoTransparencia;
  });

  function commitBgOpacityTextInput() {
    const parsed = parseInt(bgOpacityTextInput.value, 10);
    if (Number.isNaN(parsed)) {
      bgOpacityTextInput.value = working.colorFondoTransparencia;
      return;
    }
    working.colorFondoTransparencia = Math.min(Math.max(parsed, 0), 100);
    bgOpacityTextInput.value = working.colorFondoTransparencia;
    bgOpacitySlider.value = working.colorFondoTransparencia;
  }
  bgOpacityTextInput.addEventListener('change', commitBgOpacityTextInput);
  bgOpacityTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') bgOpacityTextInput.blur();
  });

  bgOpacityField.appendChild(bgOpacityLabel);
  bgOpacityField.appendChild(bgOpacitySlider);
  bgOpacityField.appendChild(bgOpacityValue);

  bgColorInput.disabled = bgTransparentCheckbox.checked;

  bgTransparentCheckbox.addEventListener('change', () => {
    bgColorInput.disabled = bgTransparentCheckbox.checked;
    bgOpacitySlider.disabled = bgTransparentCheckbox.checked;
    bgOpacityTextInput.disabled = bgTransparentCheckbox.checked;
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
  bgSection.appendChild(bgOpacityField);

  content.appendChild(bgSection);

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
