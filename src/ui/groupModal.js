// Modal de propiedades de un grupo: pestaña única "General" (id del grupo +
// sección "General" + "Etiquetas"), mismo patrón visual/estructural que
// ui/componentModal.js pero sin pestañas de tamaño ni específicas de tipo —
// un grupo puede mezclar componentes de tipos distintos.

import { getGroups, getTags, addTag } from '../core/state.js';
import { isGroupIdTaken } from '../core/group.js';
import { createTag, isTagNameTaken } from '../core/tag.js';
import { sortByName } from '../core/textSort.js';
import { createHelpIcon } from './helpIcon.js';
import { t } from '../core/i18n.js';

const BLOQUEADO_OPTIONS = [
  { value: 'ninguno', label: t('option.bloqueado.ninguno') },
  { value: 'juego', label: t('option.bloqueado.juego') },
  { value: 'todos', label: t('option.bloqueado.todos') },
];

export function openGroupModal({ group, onAccept, onCancel }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal component-editor-modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = t('groupModal.title');
  modal.appendChild(header);

  const tabs = document.createElement('div');
  tabs.className = 'modal__tabs';
  modal.appendChild(tabs);

  const contentArea = document.createElement('div');
  contentArea.className = 'modal__content';
  modal.appendChild(contentArea);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const workingGroup = { ...group, etiquetaIds: [...group.etiquetaIds] };

  const tab = document.createElement('button');
  tab.className = 'modal__tab active';
  tab.textContent = t('common.general');
  tabs.appendChild(tab);

  const idField = document.createElement('div');
  idField.className = 'modal__field';
  const idLabel = document.createElement('label');
  idLabel.textContent = t('groupModal.idLabel');
  const idInput = document.createElement('input');
  idInput.type = 'text';
  idInput.value = workingGroup.id;
  const idError = document.createElement('div');
  idError.className = 'modal__error';
  idError.style.display = 'none';

  idField.appendChild(idLabel);
  idField.appendChild(idInput);
  idField.appendChild(idError);
  contentArea.appendChild(idField);

  function validateId() {
    const newId = idInput.value.trim();
    if (!newId) {
      idError.textContent = t('groupModal.idEmpty');
      idError.style.display = 'block';
      return false;
    }
    if (isGroupIdTaken(newId, getGroups(), group.id)) {
      idError.textContent = t('groupModal.idTaken');
      idError.style.display = 'block';
      return false;
    }
    idError.style.display = 'none';
    return true;
  }

  idInput.addEventListener('input', () => {
    const sanitized = idInput.value.replace(/\s+/g, '_');
    if (sanitized !== idInput.value) {
      idInput.value = sanitized;
    }
    workingGroup.id = idInput.value.trim();
    validateId();
    updateAcceptButton();
  });

  // Sección "General": mismos campos/opciones/textos de ayuda que la pestaña
  // "Generales" de ui/componentModal.js, aplicados aquí al registro del grupo.
  const infoSection = document.createElement('fieldset');
  infoSection.className = 'modal__section';
  const infoLegend = document.createElement('legend');
  infoLegend.className = 'modal__section-title';
  infoLegend.textContent = t('common.general');
  infoSection.appendChild(infoLegend);

  const moveField = document.createElement('div');
  moveField.className = 'modal__field';
  const moveLabelRow = document.createElement('div');
  moveLabelRow.style.display = 'flex';
  moveLabelRow.style.alignItems = 'center';
  moveLabelRow.style.gap = '0.35rem';
  moveLabelRow.style.marginBottom = '0.25rem';
  const moveLabel = document.createElement('label');
  moveLabel.textContent = t('componentModal.locked');
  moveLabel.style.marginBottom = '0';
  const moveSelect = document.createElement('select');

  for (const { value, label } of BLOQUEADO_OPTIONS) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    moveSelect.appendChild(option);
  }
  moveSelect.value = workingGroup.bloqueado ?? 'ninguno';

  moveSelect.addEventListener('change', () => {
    workingGroup.bloqueado = moveSelect.value;
  });

  moveLabelRow.appendChild(moveLabel);
  moveLabelRow.appendChild(createHelpIcon({
    text: t('help.group.lockedField'),  }));
  moveField.appendChild(moveLabelRow);
  moveField.appendChild(moveSelect);
  infoSection.appendChild(moveField);

  const hiddenField = document.createElement('div');
  hiddenField.className = 'modal__field modal__field--checkbox';
  const hiddenCheckbox = document.createElement('input');
  hiddenCheckbox.type = 'checkbox';
  hiddenCheckbox.checked = workingGroup.oculto ?? false;
  const hiddenLabel = document.createElement('label');
  hiddenLabel.textContent = t('componentModal.hidden');

  hiddenCheckbox.addEventListener('change', () => {
    workingGroup.oculto = hiddenCheckbox.checked;
  });

  hiddenField.appendChild(hiddenCheckbox);
  hiddenField.appendChild(hiddenLabel);
  hiddenField.appendChild(createHelpIcon({
    text: t('help.group.hiddenField'),  }));
  infoSection.appendChild(hiddenField);

  const tooltipField = document.createElement('div');
  tooltipField.className = 'modal__field modal__field--checkbox';
  const tooltipCheckbox = document.createElement('input');
  tooltipCheckbox.type = 'checkbox';
  tooltipCheckbox.checked = workingGroup.mostrarTooltip ?? false;
  const tooltipLabel = document.createElement('label');
  tooltipLabel.textContent = t('groupModal.showTooltip');

  tooltipCheckbox.addEventListener('change', () => {
    workingGroup.mostrarTooltip = tooltipCheckbox.checked;
  });

  tooltipField.appendChild(tooltipCheckbox);
  tooltipField.appendChild(tooltipLabel);
  tooltipField.appendChild(createHelpIcon({
    text: t('help.group.showTooltip'),  }));
  infoSection.appendChild(tooltipField);

  const titleField = document.createElement('div');
  titleField.className = 'modal__field modal__field--checkbox';
  const titleCheckbox = document.createElement('input');
  titleCheckbox.type = 'checkbox';
  titleCheckbox.checked = workingGroup.mostrarTitulo ?? false;
  const titleLabel = document.createElement('label');
  titleLabel.textContent = t('componentModal.showTitle');

  titleCheckbox.addEventListener('change', () => {
    workingGroup.mostrarTitulo = titleCheckbox.checked;
  });

  titleField.appendChild(titleCheckbox);
  titleField.appendChild(titleLabel);
  titleField.appendChild(createHelpIcon({
    text: t('help.group.showTitle'),  }));
  infoSection.appendChild(titleField);

  const upOnMoveField = document.createElement('div');
  upOnMoveField.className = 'modal__field modal__field--checkbox';
  const upOnMoveCheckbox = document.createElement('input');
  upOnMoveCheckbox.type = 'checkbox';
  upOnMoveCheckbox.checked = workingGroup.subirAlMoverInteractuar ?? false;
  const upOnMoveLabel = document.createElement('label');
  upOnMoveLabel.textContent = t('componentModal.raiseOnMove');

  upOnMoveCheckbox.addEventListener('change', () => {
    workingGroup.subirAlMoverInteractuar = upOnMoveCheckbox.checked;
  });

  upOnMoveField.appendChild(upOnMoveCheckbox);
  upOnMoveField.appendChild(upOnMoveLabel);
  upOnMoveField.appendChild(createHelpIcon({
    text: t('help.group.raiseOnMove'),  }));
  infoSection.appendChild(upOnMoveField);

  contentArea.appendChild(infoSection);

  // Sección "Etiquetas": mismo patrón que ui/componentModal.js (checkbox por
  // etiqueta existente + alta rápida), aplicado a workingGroup.etiquetaIds —
  // lista propia del grupo, independiente de las de sus miembros.
  const tagSection = document.createElement('fieldset');
  tagSection.className = 'modal__section';
  const tagLegend = document.createElement('legend');
  tagLegend.className = 'modal__section-title';
  tagLegend.textContent = t('componentModal.tagsLegend');
  tagSection.appendChild(tagLegend);

  const tagCheckboxList = document.createElement('div');
  tagCheckboxList.className = 'tag-checkbox-list__scroll';
  tagSection.appendChild(tagCheckboxList);

  const createTagItem = document.createElement('div');
  createTagItem.className = 'modal__field modal__field--checkbox';
  createTagItem.style.cursor = 'pointer';
  createTagItem.textContent = t('componentModal.createNewTag');
  createTagItem.addEventListener('click', () => {
    newTagRow.style.display = 'block';
    newTagInput.focus();
  });
  tagSection.appendChild(createTagItem);

  const newTagRow = document.createElement('div');
  newTagRow.style.display = 'none';
  newTagRow.style.marginTop = '0.5rem';
  const newTagInputRow = document.createElement('div');
  newTagInputRow.style.display = 'flex';
  newTagInputRow.style.gap = '0.5rem';
  const newTagInput = document.createElement('input');
  newTagInput.type = 'text';
  newTagInput.placeholder = t('componentModal.tagNamePlaceholder');
  const newTagCreateBtn = document.createElement('button');
  newTagCreateBtn.type = 'button';
  newTagCreateBtn.className = 'btn-cancel';
  newTagCreateBtn.textContent = t('common.create');
  newTagInputRow.appendChild(newTagInput);
  newTagInputRow.appendChild(newTagCreateBtn);
  const newTagError = document.createElement('div');
  newTagError.className = 'modal__error';
  newTagError.style.display = 'none';
  newTagError.style.marginTop = '0.25rem';
  newTagRow.appendChild(newTagInputRow);
  newTagRow.appendChild(newTagError);
  tagSection.appendChild(newTagRow);

  function populateTagCheckboxes() {
    tagCheckboxList.innerHTML = '';

    for (const tag of sortByName(getTags())) {
      const item = document.createElement('div');
      item.className = 'modal__field modal__field--checkbox';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = workingGroup.etiquetaIds.includes(tag.id);
      const label = document.createElement('label');
      label.textContent = tag.name;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          if (!workingGroup.etiquetaIds.includes(tag.id)) workingGroup.etiquetaIds = [...workingGroup.etiquetaIds, tag.id];
        } else {
          workingGroup.etiquetaIds = workingGroup.etiquetaIds.filter((id) => id !== tag.id);
        }
      });
      item.appendChild(checkbox);
      item.appendChild(label);
      tagCheckboxList.appendChild(item);
    }
  }
  populateTagCheckboxes();

  function validateNewTagName() {
    const name = newTagInput.value.trim();
    if (!name) {
      newTagError.textContent = t('componentModal.tagNameEmpty');
      newTagError.style.display = 'block';
      return false;
    }
    if (isTagNameTaken(name, getTags())) {
      newTagError.textContent = t('componentModal.tagNameTaken');
      newTagError.style.display = 'block';
      return false;
    }
    newTagError.style.display = 'none';
    return true;
  }

  newTagInput.addEventListener('input', validateNewTagName);

  newTagCreateBtn.addEventListener('click', () => {
    if (!validateNewTagName()) return;
    const name = newTagInput.value.trim();
    const tag = createTag({ name });
    addTag(tag);
    workingGroup.etiquetaIds = [...workingGroup.etiquetaIds, tag.id];
    newTagRow.style.display = 'none';
    newTagInput.value = '';
    populateTagCheckboxes();
  });

  contentArea.appendChild(tagSection);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = t('common.cancel');
  cancelBtn.addEventListener('click', () => {
    overlay.remove();
    if (onCancel) onCancel();
  });
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = t('common.save');
  acceptBtn.addEventListener('click', () => {
    if (validateId()) {
      if (onAccept) onAccept(workingGroup);
      overlay.remove();
    }
  });
  footer.appendChild(acceptBtn);

  function updateAcceptButton() {
    acceptBtn.disabled = !validateId();
  }

  updateAcceptButton();

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) {
      overlay.remove();
      if (onCancel) onCancel();
    }
  });
}
