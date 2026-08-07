// Modo edición: mesa infinita con componentes seleccionables/editables + panel flotante
// con listado de componentes y acciones de edición/borrado.

import {
  getComponents, addComponent, replaceComponent, removeComponent, reorderComponent, getPanelState, setPanelState,
  getResources, addResource, replaceResource, removeResource, getResourcePanelState, setResourcePanelState,
  getGroups, addGroup, replaceGroup, removeGroup, getGroupPanelState, setGroupPanelState, sacarCartaDeMazo,
} from '../../core/state.js';
import { updateComponent, cloneComponent, createCopy } from '../../core/component.js';
import { createResource, resourceTypeForFileName, getComponentsUsingResource, findResourceByName } from '../../core/resource.js';
import { getComponentsUsingGroup } from '../../core/group.js';
import { getCartaIdsEnAlgunMazo, rectsOverlap } from '../../core/deck.js';
import { convertImageToWebP } from '../../core/imageConversion.js';
import { createInfiniteTable } from '../../ui/table.js';
import { openComponentModal, createDefaultComponent } from '../../ui/componentModal.js';
import { openCopyComponentModal } from '../../ui/copyComponentModal.js';
import { openComponentTypeModal } from '../../ui/componentTypeModal.js';
import { renderComponentList } from '../../ui/componentList.js';
import { renderComponentsOnTable } from '../../ui/componentRenderer.js';
import { openResourceModal } from '../../ui/resourceModal.js';
import { renderResourceList } from '../../ui/resourceList.js';
import { renderGroupList } from '../../ui/groupList.js';
import { openGroupModal } from '../../ui/groupModal.js';
import { openGroupDeleteConfirmModal } from '../../ui/groupDeleteConfirmModal.js';
import { openBulkDeleteConfirmModal } from '../../ui/bulkDeleteConfirmModal.js';
import { showErrorModal } from '../../ui/errorModal.js';
import { openBatchUploadSummaryModal } from '../../ui/batchUploadSummaryModal.js';
import { openResourceReplaceConfirmModal } from '../../ui/resourceReplaceConfirmModal.js';
import { openContextMenu } from '../../ui/contextMenu.js';
import { showToast } from '../../ui/toast.js';
import { sortByName } from '../../core/textSort.js';

// Iconos del menú contextual de elemento. Mismo patrón que playMode.js: SVGs 24x24
// locales, sin fichero de iconos compartido en el proyecto.
function createCloneIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<rect x="7" y="7" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>';
  return svg;
}

function createCopyIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<rect x="9" y="9" width="11" height="11" rx="2"/><rect x="4" y="4" width="11" height="11" rx="2"/>';
  return svg;
}

function createRemoveIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>';
  return svg;
}

function createHiddenIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3"/><line x1="3" y1="21" x2="21" y2="3" stroke-linecap="round"/>';
  return svg;
}

// Selección de la sesión en curso. Vive fuera de `renderEditMode`: `components:changed`
// remonta todo el modo, así no se pierde al mover/redimensionar/editar un componente.
// Colapso/posición/ancho del panel sí persisten (`core/state.js`, `panelState`) en autoguardado.
// Set de ids: Ctrl+clic añade/quita un elemento sin tocar el resto; clic normal reemplaza
// la selección por ese único elemento (o la vacía si ya era el único seleccionado).
let selectedComponentIds = new Set();

// Orden de apilado (z-index) de los paneles flotantes, de abajo a arriba. Vive fuera de
// `renderEditMode` por el mismo motivo que `selectedComponentIds`. No se persiste:
// transitorio, se resetea al recargar.
let panelStackOrder = ['component', 'resource', 'group'];

function bringPanelToFront(key, panelsByKey) {
  panelStackOrder = panelStackOrder.filter((k) => k !== key);
  panelStackOrder.push(key);
  applyPanelStackOrder(panelsByKey);
}

function applyPanelStackOrder(panelsByKey) {
  panelStackOrder.forEach((key, index) => {
    panelsByKey[key].style.zIndex = String(15 + index);
  });
}

// Borra uno o varios componentes: un único elemento usa `confirm()` nativo; dos o más
// abren `ui/bulkDeleteConfirmModal.js`, que enumera los afectados.
function attemptDeleteComponents(components) {
  if (components.length === 0) return;
  if (components.length === 1) {
    const component = components[0];
    if (confirm(`¿Eliminar el componente "${component.id}"?`)) {
      removeComponent(component.id);
      selectedComponentIds.delete(component.id);
    }
    return;
  }
  openBulkDeleteConfirmModal({
    components,
    onConfirm: () => {
      for (const component of components) removeComponent(component.id);
      selectedComponentIds.clear();
    },
  });
}

// Arrastrar cartas seleccionadas sobre un mazo: si el grupo arrastrado (selección
// múltiple, o solo el componente soltado) son todas cartas y su rectángulo final
// solapa con un mazo, pregunta si añadirlas. Solape de rectángulos, no punto exacto
// del cursor.
function attemptDropOnMazo(groupIds, draggedRect) {
  const groupComponents = groupIds.map((id) => getComponents().find((c) => c.id === id)).filter(Boolean);
  if (groupComponents.length === 0 || !groupComponents.every((c) => c.type === 'carta')) return;

  const mazo = getComponents()
    .filter((c) => c.type === 'mazo')
    .find((m) => rectsOverlap(draggedRect, { x: m.x ?? 100, y: m.y ?? 100, width: m.width ?? 100, height: m.height ?? 100 }));
  if (!mazo) return;

  const pregunta = groupComponents.length > 1
    ? `¿Añadir las ${groupComponents.length} cartas seleccionadas al mazo "${mazo.id}"?`
    : `¿Añadir la carta "${groupComponents[0].id}" al mazo "${mazo.id}"?`;
  if (!confirm(pregunta)) return;

  const cartaIds = [...(mazo.properties?.cartaIds || []), ...groupComponents.map((c) => c.id)];
  replaceComponent(mazo.id, updateComponent(mazo, { properties: { cartaIds } }));
}

// Atajo SUPR (`ui/globalShortcuts.js`) sin modal abierta: mismo camino de borrado que
// `ui/componentList.js`, aplicado a la selección múltiple actual.
export function deleteSelectedComponent() {
  const components = getComponents().filter((c) => selectedComponentIds.has(c.id));
  attemptDeleteComponents(components);
}

// Atajo flechas (`ui/globalShortcuts.js`): desplaza la selección múltiple el mismo
// delta, manteniendo distancias relativas sin ancla. Respeta `canMove` de `renderTable()`.
export function moveSelectedComponent(dx, dy) {
  const components = getComponents()
    .filter((c) => selectedComponentIds.has(c.id) && c.bloqueado !== 'todos');
  for (const c of components) {
    replaceComponent(c.id, updateComponent(c, { x: (c.x ?? 0) + dx, y: (c.y ?? 0) + dy }));
  }
}

export function renderEditMode(container) {
  container.innerHTML = '';

  const { position: panelPosition, width: panelWidth } = getPanelState();
  let collapsed = getPanelState().collapsed;
  const { position: resourcePanelPosition, width: resourcePanelWidth } = getResourcePanelState();
  let resourceCollapsed = getResourcePanelState().collapsed;
  const { position: groupPanelPosition, width: groupPanelWidth } = getGroupPanelState();
  let groupCollapsed = getGroupPanelState().collapsed;

  const layout = document.createElement('div');
  layout.style.display = 'flex';
  layout.style.height = `100%`;
  layout.style.gap = '0';

  const tableContainer = document.createElement('div');
  tableContainer.style.flex = '1';
  tableContainer.style.position = 'relative';
  const table = createInfiniteTable(tableContainer);
  layout.appendChild(tableContainer);

  const listContainer = document.createElement('div');
  listContainer.className = 'component-panel-container';
  if (panelPosition) {
    listContainer.style.left = `${panelPosition.left}px`;
    listContainer.style.top = `${panelPosition.top}px`;
    listContainer.style.right = 'auto';
  }
  if (panelWidth != null) {
    listContainer.style.width = `${panelWidth}px`;
  }
  tableContainer.appendChild(listContainer);

  const resourceListContainer = document.createElement('div');
  resourceListContainer.className = 'resource-panel-container';
  if (resourcePanelPosition) {
    resourceListContainer.style.left = `${resourcePanelPosition.left}px`;
    resourceListContainer.style.top = `${resourcePanelPosition.top}px`;
    resourceListContainer.style.right = 'auto';
  }
  if (resourcePanelWidth != null) {
    resourceListContainer.style.width = `${resourcePanelWidth}px`;
  }
  tableContainer.appendChild(resourceListContainer);

  const groupListContainer = document.createElement('div');
  groupListContainer.className = 'group-panel-container';
  if (groupPanelPosition) {
    groupListContainer.style.left = `${groupPanelPosition.left}px`;
    groupListContainer.style.top = `${groupPanelPosition.top}px`;
    groupListContainer.style.right = 'auto';
  }
  if (groupPanelWidth != null) {
    groupListContainer.style.width = `${groupPanelWidth}px`;
  }
  tableContainer.appendChild(groupListContainer);

  // Trae la ventana flotante interactuada al frente: captura, para no depender de que
  // listeners internos hagan `stopPropagation`; sin `preventDefault`, para no interferir
  // con el arrastre (`mousedown` en cabecera) ni clicks de botones/filas/campos.
  const panelsByKey = { component: listContainer, resource: resourceListContainer, group: groupListContainer };
  listContainer.addEventListener('mousedown', () => bringPanelToFront('component', panelsByKey), true);
  resourceListContainer.addEventListener('mousedown', () => bringPanelToFront('resource', panelsByKey), true);
  groupListContainer.addEventListener('mousedown', () => bringPanelToFront('group', panelsByKey), true);
  applyPanelStackOrder(panelsByKey);

  const RESOURCE_ACCEPT = '.png,.jpg,.jpeg,.gif,.svg,.webp,.ttf,.otf,.woff,.woff2';

  // Lee y da de alta un recurso desde un `File` ya validado. Reutilizada por las tres
  // vías de subida. `replace: true` reemplaza el recurso con ese `id`; sin `replace`,
  // `id` opcional (se genera uno nuevo si no se indica).
  async function loadResourceFromFile(file, { id = null, replace = false } = {}) {
    const type = resourceTypeForFileName(file.name);
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const name = file.name.replace(/\.[^.]+$/, '');
    const converted = await convertImageToWebP(file, dataUrl);
    const resource = createResource({ id, name, type, dataUrl: converted.dataUrl, fileName: converted.fileName, mimeType: converted.mimeType });
    if (replace) replaceResource(id, resource);
    else addResource(resource);
  }

  const resourceFileInput = document.createElement('input');
  resourceFileInput.type = 'file';
  resourceFileInput.accept = RESOURCE_ACCEPT;
  resourceFileInput.hidden = true;
  resourceFileInput.addEventListener('change', async () => {
    const file = resourceFileInput.files[0];
    resourceFileInput.value = '';
    if (!file) return;
    const type = resourceTypeForFileName(file.name);
    if (!type) {
      showErrorModal('Error', 'Formato de fichero no soportado.');
      return;
    }
    const name = file.name.replace(/\.[^.]+$/, '');
    const existing = findResourceByName(name, getResources());
    if (!existing) {
      await loadResourceFromFile(file);
      return;
    }
    openResourceReplaceConfirmModal({
      names: [name],
      onAccept: () => loadResourceFromFile(file, { id: existing.id, replace: true }),
    });
  });
  tableContainer.appendChild(resourceFileInput);

  // Subida en lote (varios ficheros o carpeta): separa válidos sin conflicto de nombre
  // (se cargan en paralelo) de los que colisionan (un único modal de confirmación de
  // reemplazo). Nombre repetido dentro del propio lote cuenta como conflicto desde el
  // segundo fichero en adelante.
  async function loadResourceBatch(files, { skippedSubfolderCount = 0, warnIfNoneValid = false } = {}) {
    const skippedFormat = [];
    const validFiles = [];
    for (const file of files) {
      if (resourceTypeForFileName(file.name)) validFiles.push(file);
      else skippedFormat.push({ name: file.name });
    }

    if (validFiles.length === 0 && warnIfNoneValid) {
      showErrorModal('Aviso', 'No se ha encontrado ningún recurso válido en la carpeta seleccionada.');
      return;
    }

    const namesInBatch = [];
    const withoutConflict = [];
    const withConflict = [];
    for (const file of validFiles) {
      const name = file.name.replace(/\.[^.]+$/, '');
      const existing = findResourceByName(name, getResources()) ?? findResourceByName(name, namesInBatch);
      if (existing) {
        withConflict.push({ file, name, id: existing.id });
      } else {
        const id = crypto.randomUUID();
        namesInBatch.push({ name, id });
        withoutConflict.push({ file, id });
      }
    }

    let added = withoutConflict.length;
    await Promise.all(withoutConflict.map(({ file, id }) => loadResourceFromFile(file, { id })));

    if (withConflict.length > 0) {
      await new Promise((resolve) => {
        openResourceReplaceConfirmModal({
          names: withConflict.map((c) => c.name),
          onAccept: async () => {
            await Promise.all(withConflict.map((c) => loadResourceFromFile(c.file, { id: c.id, replace: true })));
            added += withConflict.length;
            resolve();
          },
          onCancel: resolve,
        });
      });
    }

    openBatchUploadSummaryModal({ added, skippedFormat, skippedSubfolderCount });
  }

  const resourceFilesInput = document.createElement('input');
  resourceFilesInput.type = 'file';
  resourceFilesInput.accept = RESOURCE_ACCEPT;
  resourceFilesInput.multiple = true;
  resourceFilesInput.hidden = true;
  resourceFilesInput.addEventListener('change', async () => {
    const files = Array.from(resourceFilesInput.files);
    resourceFilesInput.value = '';
    if (files.length === 0) return;
    await loadResourceBatch(files);
  });
  tableContainer.appendChild(resourceFilesInput);

  const resourceFolderInput = document.createElement('input');
  resourceFolderInput.type = 'file';
  resourceFolderInput.accept = RESOURCE_ACCEPT;
  resourceFolderInput.multiple = true;
  resourceFolderInput.webkitdirectory = true;
  resourceFolderInput.hidden = true;
  resourceFolderInput.addEventListener('change', async () => {
    const allFiles = Array.from(resourceFolderInput.files);
    resourceFolderInput.value = '';
    if (allFiles.length === 0) return;

    const topLevelFiles = allFiles.filter((file) => file.webkitRelativePath.split('/').length === 2);
    const skippedSubfolderCount = allFiles.length - topLevelFiles.length;

    await loadResourceBatch(topLevelFiles, { skippedSubfolderCount, warnIfNoneValid: true });
  });
  tableContainer.appendChild(resourceFolderInput);

  function attemptDeleteResource(resource) {
    const usedByIds = getComponentsUsingResource(resource.id, getComponents());
    if (usedByIds.length > 0) {
      showErrorModal('Error', `El recurso "${resource.name}" está en uso por: ${usedByIds.join(', ')} y no se puede eliminar.`);
      return false;
    }
    if (!confirm(`¿Eliminar el recurso "${resource.name}"?`)) return false;
    removeResource(resource.id);
    return true;
  }

  function attemptDeleteGroup(group, { onDeleted } = {}) {
    const affectedIds = getComponentsUsingGroup(group.id, getComponents());
    if (affectedIds.length > 0) {
      const affectedComponents = affectedIds
        .map((id) => getComponents().find((c) => c.id === id))
        .filter(Boolean)
        .map((c) => ({ id: c.id, type: c.type }));
      openGroupDeleteConfirmModal({
        groupName: group.name,
        affectedComponents,
        onConfirm: () => {
          for (const componentId of affectedIds) {
            const component = getComponents().find((c) => c.id === componentId);
            if (component) replaceComponent(componentId, updateComponent(component, { grupoIds: component.grupoIds.filter((id) => id !== group.id) }));
          }
          removeGroup(group.id);
          if (onDeleted) onDeleted();
        },
      });
      return false;
    }
    if (!confirm(`¿Eliminar el grupo "${group.name}"?`)) return false;
    removeGroup(group.id);
    return true;
  }

  function openEditModalFor(component) {
    if (component.copyOf) {
      openCopyComponentModal({
        component,
        onAccept: (updated) => {
          replaceComponent(component.id, updated);
        },
        onDelete: (deletedComponent) => {
          selectedComponentIds.delete(deletedComponent.id);
          removeComponent(deletedComponent.id);
        },
      });
      return;
    }
    openComponentModal({
      component,
      onAccept: (updated, isNew) => {
        replaceComponent(component.id, updated);
      },
      onDelete: (deletedComponent) => {
        selectedComponentIds.delete(deletedComponent.id);
        removeComponent(deletedComponent.id);
      },
    });
  }

  function openAddModal() {
    openComponentTypeModal({
      onAccept: (type) => {
        const newComponent = createDefaultComponent(type);
        const n = getComponents().length;
        newComponent.x = 100 + (n % 10) * 30;
        newComponent.y = 100 + (n % 10) * 30;
        addComponent(newComponent);

        openComponentModal({
          component: newComponent,
          onAccept: (updated) => {
            replaceComponent(newComponent.id, updated);
          },
          onDelete: (deletedComponent) => {
            selectedComponentIds.delete(deletedComponent.id);
            removeComponent(deletedComponent.id);
          },
        });
      },
    });
  }

  function toggleSelect(component, event) {
    const ctrl = event && (event.ctrlKey || event.metaKey);
    if (ctrl) {
      if (selectedComponentIds.has(component.id)) {
        selectedComponentIds.delete(component.id);
      } else {
        selectedComponentIds.add(component.id);
      }
    } else if (selectedComponentIds.size === 1 && selectedComponentIds.has(component.id)) {
      selectedComponentIds.clear();
    } else {
      selectedComponentIds.clear();
      selectedComponentIds.add(component.id);
    }
    renderList();
    renderTable();
  }

  // Selección de grupo desde el panel de Grupos: reemplaza siempre la selección
  // completa por los miembros del grupo, sin toggle (a diferencia de `toggleSelect`).
  function selectGroup(group) {
    const ids = getComponentsUsingGroup(group.id, getComponents());
    selectedComponentIds.clear();
    for (const id of ids) selectedComponentIds.add(id);

    const cartasEnMazo = getCartaIdsEnAlgunMazo(getComponents());
    for (const id of ids) {
      if (!cartasEnMazo.has(id)) continue;
      const mazo = getComponents().find((c) => c.type === 'mazo' && c.properties?.cartaIds?.includes(id));
      if (mazo) sacarCartaDeMazo(mazo.id, id);
    }

    renderList();
    renderTable();
  }

  // Menú contextual de clic derecho en modo edición: Clonar/Copiar/Eliminar (igual que
  // el listado de Componentes) y "Añadir a grupo", sobre la selección múltiple vigente.
  function handleComponentContextMenu(component, event) {
    if (!selectedComponentIds.has(component.id)) {
      selectedComponentIds.clear();
      selectedComponentIds.add(component.id);
      renderList();
      renderTable();
    }

    const affectedIds = [...selectedComponentIds];
    const affectedComponents = getComponents().filter((c) => affectedIds.includes(c.id));
    const cloneables = affectedComponents.filter((c) => !c.copyOf);

    const generalItems = [
      {
        icon: createHiddenIcon(),
        label: affectedComponents.every((c) => c.oculto) ? 'Mostrar' : 'Ocultar',
        onClick: () => {
          const newOculto = !affectedComponents.every((c) => c.oculto);
          for (const c of affectedComponents) {
            const changes = { oculto: newOculto };
            if (c.copyOf && c.sincronizado) changes.sincronizado = false;
            replaceComponent(c.id, updateComponent(c, changes));
          }
        },
      },
      {
        icon: createCloneIcon(),
        label: 'Clonar',
        disabled: cloneables.length === 0,
        onClick: () => {
          for (const c of cloneables) {
            addComponent(cloneComponent(c, getComponents()));
          }
        },
      },
      {
        icon: createCopyIcon(),
        label: 'Copiar',
        disabled: cloneables.length === 0,
        onClick: () => {
          for (const c of cloneables) {
            addComponent(createCopy(c, getComponents()));
          }
        },
      },
      {
        icon: createRemoveIcon(),
        label: 'Eliminar',
        onClick: () => attemptDeleteComponents(affectedComponents),
      },
    ];

    const specificItems = [
      {
        label: 'Añadir a grupo',
        select: {
          options: sortByName(getGroups()).map((g) => ({ value: g.id, label: g.name })),
          onChange: (groupId) => {
            for (const c of affectedComponents) {
              if (c.grupoIds.includes(groupId)) continue;
              replaceComponent(c.id, updateComponent(c, { grupoIds: [...c.grupoIds, groupId] }));
            }
            showToast('Grupo añadido');
          },
        },
      },
    ];

    openContextMenu({ x: event.clientX, y: event.clientY, generalItems, specificItems });
  }

  function renderTable() {
    const allComponents = getComponents();
    const cartasEnMazo = getCartaIdsEnAlgunMazo(allComponents);
    renderComponentsOnTable(table.worldEl, allComponents.filter((c) => !cartasEnMazo.has(c.id)), {
      allComponents,
      identifyMode: 'label',
      showLockIndicator: true,
      showHiddenIndicator: true,
      showCopyIndicator: true,
      onSelect: openEditModalFor,
      onToggleSelect: toggleSelect,
      onContextMenu: handleComponentContextMenu,
      selectedIds: selectedComponentIds,
      canMove: (component) => component.bloqueado !== 'todos',
      onMove: (component, x, y) => {
        const group = selectedComponentIds.size > 1 && selectedComponentIds.has(component.id)
          ? [...selectedComponentIds]
          : [component.id];

        if (group.length > 1) {
          const dx = x - (component.x ?? 0);
          const dy = y - (component.y ?? 0);
          for (const id of group) {
            const c = getComponents().find((comp) => comp.id === id);
            if (!c) continue;
            const newX = c.id === component.id ? x : (c.x ?? 0) + dx;
            const newY = c.id === component.id ? y : (c.y ?? 0) + dy;
            replaceComponent(c.id, updateComponent(c, { x: newX, y: newY }));
          }
        } else {
          replaceComponent(component.id, updateComponent(component, { x, y }));
        }

        attemptDropOnMazo(group, { x, y, width: component.width ?? 100, height: component.height ?? 100 });
      },
      onResize: (component, width, height, x, y) => {
        const patch = x != null && y != null ? { width, height, x, y } : { width, height };
        replaceComponent(component.id, updateComponent(component, patch));
      },
    });
  }

  function renderList() {
    renderComponentList(listContainer, getComponents(), {
      onEdit: openEditModalFor,
      onClone: (component) => {
        const clone = cloneComponent(component, getComponents());
        addComponent(clone);
      },
      onCopy: (component) => {
        const copy = createCopy(component, getComponents());
        addComponent(copy);
      },
      onRemove: (component, { bulk } = {}) => {
        if (bulk) {
          attemptDeleteComponents(getComponents().filter((c) => selectedComponentIds.has(c.id)));
          return;
        }
        selectedComponentIds.delete(component.id);
        removeComponent(component.id);
      },
      onAdd: openAddModal,
      onReorder: (component, newOrder) => reorderComponent(component.id, newOrder),
      selectedIds: selectedComponentIds,
      collapsed,
      onSelectRow: toggleSelect,
      onToggleCollapse: () => {
        collapsed = !collapsed;
        setPanelState({ collapsed });
        renderList();
      },
      onPanelMove: (left, top) => {
        setPanelState({ position: { left, top } });
      },
      onPanelResize: (width, height, left, top) => {
        const patch = height ? { width, height } : { width };
        if (left != null) patch.position = { left, top };
        setPanelState(patch);
      },
      bodyHeight: getPanelState().height,
      columnWidths: getPanelState().columnWidths,
      onColumnResize: (columnWidths) => {
        setPanelState({ columnWidths });
      },
    });
  }

  function renderResourcePanel() {
    renderResourceList(resourceListContainer, getResources(), {
      onEdit: (resource) => {
        openResourceModal({
          resource,
          onAccept: (updated) => replaceResource(resource.id, updated),
          onDelete: attemptDeleteResource,
        });
      },
      onRemove: attemptDeleteResource,
      onAddFile: () => resourceFileInput.click(),
      onAddMultiple: () => resourceFilesInput.click(),
      onAddFolder: () => resourceFolderInput.click(),
      collapsed: resourceCollapsed,
      onToggleCollapse: () => {
        resourceCollapsed = !resourceCollapsed;
        setResourcePanelState({ collapsed: resourceCollapsed });
        renderResourcePanel();
      },
      onPanelMove: (left, top) => {
        setResourcePanelState({ position: { left, top } });
      },
      onPanelResize: (width, height, left, top) => {
        const patch = height ? { width, height } : { width };
        if (left != null) patch.position = { left, top };
        setResourcePanelState(patch);
      },
      bodyHeight: getResourcePanelState().height,
      columnWidths: getResourcePanelState().columnWidths,
      onColumnResize: (columnWidths) => {
        setResourcePanelState({ columnWidths });
      },
      components: getComponents(),
    });
  }

  function renderGroupPanel() {
    renderGroupList(groupListContainer, getGroups(), getComponents(), {
      onEdit: (group) => {
        openGroupModal({
          group,
          onAccept: (updated) => replaceGroup(group.id, updated),
          onDelete: (g, closeModal) => attemptDeleteGroup(g, { onDeleted: closeModal }),
          onRemoveFromGroup: (g, componentId) => {
            const component = getComponents().find((c) => c.id === componentId);
            if (component) replaceComponent(componentId, updateComponent(component, { grupoIds: component.grupoIds.filter((id) => id !== g.id) }));
          },
        });
      },
      onRemove: (group) => attemptDeleteGroup(group),
      onAdd: () => {
        openGroupModal({ onAccept: (newGroup) => addGroup(newGroup) });
      },
      onSelectGroup: selectGroup,
      collapsed: groupCollapsed,
      onToggleCollapse: () => {
        groupCollapsed = !groupCollapsed;
        setGroupPanelState({ collapsed: groupCollapsed });
        renderGroupPanel();
      },
      onPanelMove: (left, top) => {
        setGroupPanelState({ position: { left, top } });
      },
      onPanelResize: (width, height, left, top) => {
        const patch = height ? { width, height } : { width };
        if (left != null) patch.position = { left, top };
        setGroupPanelState(patch);
      },
      bodyHeight: getGroupPanelState().height,
      columnWidths: getGroupPanelState().columnWidths,
      onColumnResize: (columnWidths) => {
        setGroupPanelState({ columnWidths });
      },
    });
  }

  container.appendChild(layout);

  renderTable();
  renderList();
  renderResourcePanel();
  renderGroupPanel();
}
