// Lista de selección agrupada en tres bloques (Componentes/Recursos/Grupos),
// reutilizada por ui/exportSelectionModal.js y ui/importSelectionModal.js.
// Cada bloque tiene su propio checkbox "seleccionar todo el bloque" (marca/
// desmarca de golpe los checks de ese bloque) y la lista de checks
// individuales debajo, todos marcados por defecto.

import { formatComponentIdentifier } from './componentRenderer.js';

// Pinta los tres bloques dentro de `container` y devuelve `getSelection()`
// con los ids marcados en cada bloque. `onSelectionChange(selection)` se
// invoca cada vez que cambia algún check (incluido el pintado inicial), para
// que el caller pueda habilitar/deshabilitar su botón de confirmar.
export function createElementSelectionGroups(container, { components = [], resources = [], groups = [] }, { onSelectionChange } = {}) {
  container.innerHTML = '';

  const selected = {
    componentIds: new Set(components.map((c) => c.id)),
    resourceIds: new Set(resources.map((r) => r.id)),
    groupIds: new Set(groups.map((g) => g.id)),
  };

  const blocks = [
    { key: 'componentIds', title: 'Componentes', items: components, label: formatComponentIdentifier },
    { key: 'resourceIds', title: 'Recursos', items: resources, label: (r) => r.name },
    { key: 'groupIds', title: 'Grupos', items: groups, label: (g) => g.name },
  ];

  function getSelection() {
    return {
      componentIds: Array.from(selected.componentIds),
      resourceIds: Array.from(selected.resourceIds),
      groupIds: Array.from(selected.groupIds),
    };
  }

  function notifyChange() {
    if (onSelectionChange) onSelectionChange(getSelection());
  }

  for (const block of blocks) {
    if (block.items.length === 0) continue;

    const groupEl = document.createElement('div');
    groupEl.className = 'element-selection-group';

    const header = document.createElement('label');
    header.className = 'element-selection-group__select-all';
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.checked = true;
    header.appendChild(selectAllCheckbox);
    const title = document.createElement('span');
    title.className = 'element-selection-group__title';
    title.textContent = block.title;
    header.appendChild(title);
    groupEl.appendChild(header);

    const list = document.createElement('div');
    list.className = 'element-selection-group__list';
    groupEl.appendChild(list);

    const itemCheckboxes = [];
    for (const item of block.items) {
      const itemLabel = document.createElement('label');
      itemLabel.className = 'element-selection-group__item';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) selected[block.key].add(item.id);
        else selected[block.key].delete(item.id);
        selectAllCheckbox.checked = itemCheckboxes.every((c) => c.checked);
        notifyChange();
      });
      itemCheckboxes.push(checkbox);
      itemLabel.appendChild(checkbox);
      const text = document.createElement('span');
      text.textContent = block.label(item);
      itemLabel.appendChild(text);
      list.appendChild(itemLabel);
    }

    selectAllCheckbox.addEventListener('change', () => {
      for (const checkbox of itemCheckboxes) checkbox.checked = selectAllCheckbox.checked;
      selected[block.key] = new Set(selectAllCheckbox.checked ? block.items.map((i) => i.id) : []);
      notifyChange();
    });

    container.appendChild(groupEl);
  }

  notifyChange();

  return { getSelection };
}
