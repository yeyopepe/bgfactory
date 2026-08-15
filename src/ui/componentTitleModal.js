// Sub-modal "Editar título de componente", abierta desde la sección "Ayuda jugador" de
// componentModal.js. Mismo patrón estructural que ui/boardPatternModal.js: sin tabs, opera
// sobre copia de trabajo, aplica solo al Aceptar.

import { createHelpIcon } from './helpIcon.js';

export function openComponentTitleModal({ titulo, onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Editar título de componente';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const working = {
    texto: titulo.texto ?? '',
    colorTexto: titulo.colorTexto || '#000000',
    colorFondo: titulo.colorFondo || '#ffffff',
    fondoTransparencia: titulo.fondoTransparencia ?? 0,
  };

  // Contenido
  const contentField = document.createElement('div');
  contentField.className = 'modal__field';
  const contentLabelRow = document.createElement('div');
  contentLabelRow.style.display = 'flex';
  contentLabelRow.style.alignItems = 'center';
  contentLabelRow.style.gap = '0.35rem';
  const contentLabel = document.createElement('label');
  contentLabel.textContent = 'Contenido';
  contentLabel.style.marginBottom = '0';
  contentLabelRow.appendChild(contentLabel);
  contentLabelRow.appendChild(createHelpIcon({
    text: 'Texto de la etiqueta. Admite varias líneas y formato básico (negrita, cursiva, listas). Admite variables como {cards_current} (nº de cartas actual, solo en "Mazo") — en otros tipos se muestra literal.',
  }));
  const contentTextarea = document.createElement('textarea');
  contentTextarea.value = working.texto;
  contentTextarea.rows = 4;
  contentTextarea.addEventListener('input', () => {
    working.texto = contentTextarea.value;
  });
  contentField.appendChild(contentLabelRow);
  contentField.appendChild(contentTextarea);
  content.appendChild(contentField);

  // Color del texto / Color de fondo, misma fila
  const colorRow = document.createElement('div');
  colorRow.className = 'modal__field';
  const colorRowInner = document.createElement('div');
  colorRowInner.style.display = 'flex';
  colorRowInner.style.gap = '0.5rem';

  const textColorField = document.createElement('div');
  textColorField.style.flex = '1';
  const textColorLabel = document.createElement('label');
  textColorLabel.textContent = 'Color del texto';
  const textColorInput = document.createElement('input');
  textColorInput.type = 'color';
  textColorInput.value = working.colorTexto;
  textColorInput.addEventListener('input', () => {
    working.colorTexto = textColorInput.value;
  });
  textColorField.appendChild(textColorLabel);
  textColorField.appendChild(textColorInput);

  const bgColorField = document.createElement('div');
  bgColorField.style.flex = '1';
  const bgColorLabel = document.createElement('label');
  bgColorLabel.textContent = 'Color de fondo';
  const bgColorInput = document.createElement('input');
  bgColorInput.type = 'color';
  bgColorInput.value = working.colorFondo;
  bgColorInput.addEventListener('input', () => {
    working.colorFondo = bgColorInput.value;
  });
  bgColorField.appendChild(bgColorLabel);
  bgColorField.appendChild(bgColorInput);

  colorRowInner.appendChild(textColorField);
  colorRowInner.appendChild(bgColorField);
  colorRow.appendChild(colorRowInner);
  content.appendChild(colorRow);

  // Transparencia del fondo: slider + campo numérico sincronizado, mismo patrón que
  // ui/cardShapeModal.js (bgOpacitySlider/bgOpacityTextInput).
  const opacityField = document.createElement('div');
  opacityField.className = 'modal__field';
  const opacityLabel = document.createElement('label');
  opacityLabel.textContent = 'Transparencia del fondo';

  const opacitySlider = document.createElement('input');
  opacitySlider.type = 'range';
  opacitySlider.min = 0;
  opacitySlider.max = 100;
  opacitySlider.value = working.fondoTransparencia;

  const opacityValue = document.createElement('div');
  opacityValue.className = 'modal__opacity-value';
  const opacityTextInput = document.createElement('input');
  opacityTextInput.type = 'text';
  opacityTextInput.value = opacitySlider.value;
  const opacityUnit = document.createElement('span');
  opacityUnit.textContent = '%';
  opacityValue.appendChild(opacityTextInput);
  opacityValue.appendChild(opacityUnit);

  opacitySlider.addEventListener('input', () => {
    working.fondoTransparencia = parseInt(opacitySlider.value, 10);
    opacityTextInput.value = working.fondoTransparencia;
  });

  function commitOpacityTextInput() {
    const parsed = parseInt(opacityTextInput.value, 10);
    if (Number.isNaN(parsed)) {
      opacityTextInput.value = working.fondoTransparencia;
      return;
    }
    working.fondoTransparencia = Math.min(Math.max(parsed, 0), 100);
    opacityTextInput.value = working.fondoTransparencia;
    opacitySlider.value = working.fondoTransparencia;
  }
  opacityTextInput.addEventListener('change', commitOpacityTextInput);
  opacityTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') opacityTextInput.blur();
  });

  opacityField.appendChild(opacityLabel);
  opacityField.appendChild(opacitySlider);
  opacityField.appendChild(opacityValue);
  content.appendChild(opacityField);

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
