// Listado de componentes, reutilizable en modo juego (solo lectura)
// y en modo edición (con acciones de edición/borrado).

export function renderComponentList(container, components, { onEdit, onRemove } = {}) {
  container.innerHTML = '';

  if (components.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'component-list__empty';
    empty.textContent = 'No hay componentes todavía.';
    container.appendChild(empty);
    return;
  }

  const list = document.createElement('ul');
  list.className = 'component-list';

  for (const component of components) {
    const item = document.createElement('li');
    item.className = 'component-list__item';

    const label = document.createElement('span');
    label.textContent = `[${component.type}] ${component.name || '(sin nombre)'}`;
    item.appendChild(label);

    if (onEdit) {
      const editButton = document.createElement('button');
      editButton.textContent = 'Editar';
      editButton.addEventListener('click', () => onEdit(component));
      item.appendChild(editButton);
    }

    if (onRemove) {
      const removeButton = document.createElement('button');
      removeButton.textContent = 'Eliminar';
      removeButton.addEventListener('click', () => onRemove(component));
      item.appendChild(removeButton);
    }

    list.appendChild(item);
  }

  container.appendChild(list);
}
