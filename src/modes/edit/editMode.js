// Modo edición: alta y edición de componentes de juego (cartas, tokens, tablero...).
// El formulario es genérico porque todavía no hay tipos de componente definidos.

import { createComponent, updateComponent } from '../../core/component.js';
import { addComponent, getComponents, removeComponent, replaceComponent } from '../../core/state.js';
import { renderComponentList } from '../../ui/componentList.js';

let editingId = null;

export function renderEditMode(container) {
  container.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = 'Editor de componentes';
  container.appendChild(title);

  container.appendChild(buildForm());

  const listContainer = document.createElement('div');
  container.appendChild(listContainer);

  renderComponentList(listContainer, getComponents(), {
    onEdit: (component) => startEditing(component, container),
    onRemove: (component) => removeComponent(component.id),
  });
}

function buildForm() {
  const form = document.createElement('form');
  form.className = 'edit-form';

  form.innerHTML = `
    <label>Tipo <input name="type" required placeholder="carta, token, tablero..." /></label>
    <label>Nombre <input name="name" required /></label>
    <label>Propiedades (JSON) <textarea name="properties">{}</textarea></label>
    <button type="submit">Guardar</button>
  `;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const type = formData.get('type').trim();
    const name = formData.get('name').trim();
    let properties = {};
    try {
      properties = JSON.parse(formData.get('properties') || '{}');
    } catch {
      alert('Las propiedades deben ser JSON válido.');
      return;
    }

    if (editingId) {
      const existing = getComponents().find((c) => c.id === editingId);
      replaceComponent(editingId, updateComponent(existing, { type, name, properties }));
      editingId = null;
    } else {
      addComponent(createComponent({ type, name, properties }));
    }

    form.reset();
    form.querySelector('[name="properties"]').value = '{}';
  });

  return form;
}

function startEditing(component, container) {
  editingId = component.id;
  renderEditMode(container);
  const form = container.querySelector('.edit-form');
  form.querySelector('[name="type"]').value = component.type;
  form.querySelector('[name="name"]').value = component.name;
  form.querySelector('[name="properties"]').value = JSON.stringify(component.properties, null, 2);
}
