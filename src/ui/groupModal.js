// Modal mínima de alta/edición de un grupo, misma estructura visual que
// ui/resourceModal.js (overlay/modal/header/content/footer) pero única para
// ambos casos: sin `group`, alta (sin botón "Eliminar"); con `group`, edición.

import { createGroup, updateGroup, isGroupNameTaken, getComponentsUsingGroup } from '../core/group.js';
import { getGroups, getComponents } from '../core/state.js';
import { getComponentTypeLabel } from './componentTypeModal.js';

export function openGroupModal({ group = null, onAccept, onDelete, onRemoveFromGroup }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = group ? `Grupo: ${group.name}` : 'Nuevo grupo';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const nameField = document.createElement('div');
  nameField.className = 'modal__field';
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Nombre';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = group?.name ?? '';
  const nameError = document.createElement('div');
  nameError.className = 'modal__error';
  nameError.style.display = 'none';
  nameField.appendChild(nameLabel);
  nameField.appendChild(nameInput);
  nameField.appendChild(nameError);
  content.appendChild(nameField);

  if (group) {
    const elementsField = document.createElement('div');
    elementsField.className = 'modal__field';
    content.appendChild(elementsField);

    const elementsLabel = document.createElement('label');
    elementsLabel.className = 'group-modal__elements-label';
    elementsField.appendChild(elementsLabel);

    const elementsBody = document.createElement('div');
    elementsField.appendChild(elementsBody);

    function renderElements() {
      const componentIds = getComponentsUsingGroup(group.id, getComponents());
      const components = componentIds
        .map((id) => getComponents().find((c) => c.id === id))
        .filter(Boolean)
        .sort((a, b) => a.id.localeCompare(b.id));

      elementsLabel.textContent = `Elementos del grupo (${components.length})`;
      elementsBody.innerHTML = '';

      if (components.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'group-modal__elements-empty';
        empty.textContent = 'No hay elementos en este grupo.';
        elementsBody.appendChild(empty);
        return;
      }

      const list = document.createElement('div');
      list.className = 'group-modal__elements-list';

      for (const component of components) {
        const item = document.createElement('div');
        item.className = 'group-modal__element-item';

        const idEl = document.createElement('span');
        idEl.className = 'group-modal__element-id';
        const typeEl = document.createElement('span');
        typeEl.className = 'type';
        typeEl.textContent = `${getComponentTypeLabel(component.type)}:`;
        idEl.appendChild(typeEl);
        idEl.appendChild(document.createTextNode(` ${component.id}`));
        item.appendChild(idEl);

        const sacarBtn = document.createElement('button');
        sacarBtn.type = 'button';
        sacarBtn.className = 'btn-sacar';
        sacarBtn.textContent = 'Sacar';
        sacarBtn.addEventListener('click', () => {
          onRemoveFromGroup(group, component.id);
          renderElements();
        });
        item.appendChild(sacarBtn);

        list.appendChild(item);
      }

      elementsBody.appendChild(list);
    }

    renderElements();
  }

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  if (group) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-eliminar';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.addEventListener('click', () => {
      onDelete(group, () => overlay.remove());
    });
    footer.appendChild(deleteBtn);
  }

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';
  footer.appendChild(acceptBtn);

  function validateName() {
    const name = nameInput.value.trim();
    if (!name) {
      nameError.textContent = 'El nombre no puede estar vacío';
      nameError.style.display = 'block';
      return false;
    }
    if (isGroupNameTaken(name, getGroups(), group?.id ?? null)) {
      nameError.textContent = 'Ya existe un grupo con este nombre';
      nameError.style.display = 'block';
      return false;
    }
    nameError.style.display = 'none';
    return true;
  }

  function updateAcceptState() {
    acceptBtn.disabled = !validateName();
  }
  nameInput.addEventListener('input', updateAcceptState);
  updateAcceptState();

  acceptBtn.addEventListener('click', () => {
    if (!validateName()) return;
    const name = nameInput.value.trim();
    onAccept(group ? updateGroup(group, { name }) : createGroup({ name }));
    overlay.remove();
  });

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
