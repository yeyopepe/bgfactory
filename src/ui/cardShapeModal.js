// Sub-modal de edición de una figura geométrica de una cara de carta, abierta
// con doble click desde ui/visualEditorModal.js. Mismo patrón que
// ui/cardTextBoxModal.js (sin tabs, overlay + modal).

import { getResources } from '../core/state.js';
import { openBoardImageModal } from './boardImageModal.js';
import { openImageAdjustModal } from './imageAdjustModal.js';
import { createRotationSliderField } from './rotationSlider.js';

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
  working.colorFondoTransparencia = working.colorFondoTransparencia ?? 0;
  working.imagenTransparencia = working.imagenTransparencia ?? 0;
  working.rotation = working.rotation ?? 0;
  working.bordeColor = working.bordeColor || '#000000';
  working.bordeGrosor = working.bordeGrosor ?? 2;
  working.bordeActivo = working.bordeActivo ?? true;
  working.fondoTipo = working.fondoTipo || 'color';
  working.imagenResourceId = working.imagenResourceId ?? null;
  working.ajusteImagen = { ...(working.ajusteImagen || { zoom: 100, posX: 50, posY: 50 }) };

  // Tipo de figura: mismo patrón .align-group/.align-group__btn de opción única que cardTextBoxModal.js
  // (createAlignGroup), duplicado aquí igual que allí, sin extraer a módulo compartido.
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
    {
      value: 'redondeada',
      label: 'Rectángulo redondeado',
      icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="2.5" width="13" height="13" rx="4"/></svg>',
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
      // Mismo criterio que proporción 'circular' de Carta: al pasar a círculo/elipse con ejes distintos, ajusta a círculo perfecto.
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

  // Fondo: selector Color/Imagen, mismo patrón que fondo de 'tableroSimple' en ui/componentModal.js.
  // Cambiar de uno a otro no borra la configuración del que se deja de usar: ambos conviven en `working`.
  const bgSection = document.createElement('fieldset');
  bgSection.className = 'modal__section';
  const bgLegend = document.createElement('legend');
  bgLegend.className = 'modal__section-title';
  bgLegend.textContent = 'Fondo';
  bgSection.appendChild(bgLegend);

  const bgTypeField = document.createElement('div');
  bgTypeField.className = 'modal__field';
  const bgTypeLabel = document.createElement('label');
  bgTypeLabel.textContent = 'Tipo de fondo';
  const bgTypeRow = document.createElement('div');
  bgTypeRow.style.display = 'flex';
  bgTypeRow.style.gap = '0.5rem';
  bgTypeRow.style.alignItems = 'center';

  const bgTypeSelect = document.createElement('select');
  bgTypeSelect.style.flex = '0 1 auto';
  bgTypeSelect.style.width = '9rem';
  const bgTypeOptions = [
    { value: 'color', label: 'Color' },
    { value: 'imagen', label: 'Imagen' },
  ];
  for (const { value, label } of bgTypeOptions) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    if (value === working.fondoTipo) option.selected = true;
    bgTypeSelect.appendChild(option);
  }
  bgTypeSelect.addEventListener('change', () => {
    working.fondoTipo = bgTypeSelect.value;
    updateBgTypeVisibility();
  });
  bgTypeRow.appendChild(bgTypeSelect);
  bgTypeField.appendChild(bgTypeLabel);
  bgTypeField.appendChild(bgTypeRow);
  bgSection.appendChild(bgTypeField);

  const bgColorBlock = document.createElement('div');

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
  bgColorBlock.appendChild(bgColorField);
  bgColorBlock.appendChild(bgOpacityField);
  bgSection.appendChild(bgColorBlock);

  // Bloque "Imagen": galería de recursos ya subidos (mismo mecanismo que fondo de cara de carta) +
  // ajuste zoom/posición recortado a la forma de la figura (ui/imageAdjustModal.js, modo de un único stage).
  const bgImageBlock = document.createElement('div');

  const bgImagePreview = document.createElement('div');
  bgImagePreview.style.display = 'flex';
  bgImagePreview.style.alignItems = 'center';
  bgImagePreview.style.gap = '0.75rem';
  bgImagePreview.style.marginBottom = '0.75rem';

  const bgImageThumb = document.createElement('img');
  bgImageThumb.style.width = '40px';
  bgImageThumb.style.height = '40px';
  bgImageThumb.style.objectFit = 'cover';
  bgImageThumb.style.borderRadius = 'var(--radius-sm)';
  bgImageThumb.style.border = '1px solid var(--border-neutral)';

  const bgImageName = document.createElement('span');
  bgImageName.style.fontSize = '0.8125rem';
  bgImageName.style.color = 'var(--text-primary)';

  bgImagePreview.appendChild(bgImageThumb);
  bgImagePreview.appendChild(bgImageName);

  function refreshImagePreview() {
    const resource = working.imagenResourceId ? getResources().find((r) => r.id === working.imagenResourceId) : null;
    bgImagePreview.style.display = resource ? 'flex' : 'none';
    if (resource) {
      bgImageThumb.src = resource.dataUrl;
      bgImageName.textContent = resource.name;
    }
    adjustImageBtn.disabled = !resource;
  }

  const bgImageButtons = document.createElement('div');
  bgImageButtons.style.display = 'flex';
  bgImageButtons.style.gap = '0.5rem';

  const chooseImageBtn = document.createElement('button');
  chooseImageBtn.type = 'button';
  chooseImageBtn.className = 'btn-cancel';
  chooseImageBtn.textContent = 'Elegir imagen…';
  chooseImageBtn.addEventListener('click', () => {
    openBoardImageModal({
      properties: working,
      resources: getResources(),
      title: 'Elegir imagen',
      onAccept: (resourceId) => {
        working.imagenResourceId = resourceId;
        working.ajusteImagen = { zoom: 100, posX: 50, posY: 50 };
        working.imagenTransparencia = 0;
        refreshImagePreview();
      },
    });
  });

  const adjustImageBtn = document.createElement('button');
  adjustImageBtn.type = 'button';
  adjustImageBtn.className = 'btn-cancel';
  adjustImageBtn.textContent = 'Ajustar imagen…';
  adjustImageBtn.addEventListener('click', () => {
    const resource = working.imagenResourceId ? getResources().find((r) => r.id === working.imagenResourceId) : null;
    if (!resource) return;
    openImageAdjustModal({
      shape: working.tipo,
      width: working.width,
      height: working.height,
      resource,
      adjustment: working.ajusteImagen,
      transparencia: working.imagenTransparencia,
      onAccept: (adjustment) => {
        working.ajusteImagen = { zoom: adjustment.zoom, posX: adjustment.posX, posY: adjustment.posY, rotation: adjustment.rotation };
        working.imagenTransparencia = adjustment.transparencia;
      },
    });
  });

  bgImageButtons.appendChild(chooseImageBtn);
  bgImageButtons.appendChild(adjustImageBtn);

  bgImageBlock.appendChild(bgImagePreview);
  bgImageBlock.appendChild(bgImageButtons);
  bgSection.appendChild(bgImageBlock);

  function updateBgTypeVisibility() {
    const isImage = working.fondoTipo === 'imagen';
    bgColorBlock.style.display = isImage ? 'none' : '';
    bgImageBlock.style.display = isImage ? '' : 'none';
  }
  refreshImagePreview();
  updateBgTypeVisibility();

  content.appendChild(bgSection);

  const rotationSlider = createRotationSliderField({
    value: working.rotation,
    onChange: (v) => {
      working.rotation = v;
    },
  });
  content.appendChild(rotationSlider.field);

  // Borde: línea simple (sin bisel), mismo patrón de checkbox activador que ui/cardTextBoxModal.js.
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
