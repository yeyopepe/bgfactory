// Panel flotante y colapsable con el listado de componentes, usado en modo edición.
// Tabla de tres columnas (Id, Tipo, Acciones) con selección de fila.

export function renderComponentList(
  container,
  components,
  { onEdit, onRemove, onSelectRow, onAdd, selectedId = null, collapsed = false, onToggleCollapse } = {}
) {
  container.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'component-panel';

  const header = document.createElement('div');
  header.className = 'component-panel__header';

  const title = document.createElement('strong');
  title.textContent = 'Componentes';
  header.appendChild(title);

  const toggleButton = document.createElement('button');
  toggleButton.type = 'button';
  toggleButton.textContent = collapsed ? '▸' : '▾';
  toggleButton.addEventListener('click', () => {
    if (onToggleCollapse) onToggleCollapse();
  });
  header.appendChild(toggleButton);

  panel.appendChild(header);

  if (!collapsed) {
    const body = document.createElement('div');
    body.className = 'component-panel__body';

    if (components.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'component-list__empty';
      empty.textContent = 'No hay componentes todavía.';
      body.appendChild(empty);
    } else {
      const table = document.createElement('table');
      table.className = 'component-list';

      const thead = document.createElement('thead');
      thead.innerHTML = '<tr><th>Id</th><th>Tipo</th><th>Acciones</th></tr>';
      table.appendChild(thead);

      const tbody = document.createElement('tbody');

      for (const component of components) {
        const row = document.createElement('tr');
        row.className = 'component-list__row';
        if (component.id === selectedId) {
          row.classList.add('component-list__row--selected');
        }

        const idCell = document.createElement('td');
        idCell.className = 'component-list__id-cell';
        idCell.textContent = component.id;
        row.appendChild(idCell);

        const typeCell = document.createElement('td');
        typeCell.textContent = component.type;
        row.appendChild(typeCell);

        const actionsCell = document.createElement('td');
        actionsCell.className = 'component-list__actions-cell';

        if (onEdit) {
          const editButton = document.createElement('button');
          editButton.type = 'button';
          editButton.textContent = 'Editar';
          editButton.addEventListener('click', (event) => {
            event.stopPropagation();
            onEdit(component);
          });
          actionsCell.appendChild(editButton);
        }

        if (onRemove) {
          const removeButton = document.createElement('button');
          removeButton.type = 'button';
          removeButton.textContent = 'Eliminar';
          removeButton.addEventListener('click', (event) => {
            event.stopPropagation();
            if (confirm(`¿Eliminar el componente "${component.id}"?`)) {
              onRemove(component);
            }
          });
          actionsCell.appendChild(removeButton);
        }

        row.appendChild(actionsCell);

        if (onSelectRow) {
          row.addEventListener('click', () => onSelectRow(component));
        }

        tbody.appendChild(row);
      }

      table.appendChild(tbody);
      body.appendChild(table);
    }

    panel.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'component-panel__footer';

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = '+ Añadir componente';
    addButton.addEventListener('click', () => {
      if (onAdd) onAdd();
    });
    footer.appendChild(addButton);

    panel.appendChild(footer);
  }

  container.appendChild(panel);
}
