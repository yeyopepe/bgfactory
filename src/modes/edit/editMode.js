// Modo edición: mesa infinita con los componentes renderizados sobre ella (seleccionables
// para editar) + panel flotante con listado de componentes y acciones de edición/borrado.

import {
  getComponents, addComponent, replaceComponent, removeComponent, reorderComponent, getPanelState, setPanelState,
  getResources, addResource, replaceResource, removeResource, getResourcePanelState, setResourcePanelState,
  getGroups, addGroup, replaceGroup, removeGroup, getGroupPanelState, setGroupPanelState, sacarCartaDeMazo,
} from '../../core/state.js';
import { updateComponent, cloneComponent, createCopy } from '../../core/component.js';
import { createResource, resourceTypeForFileName, getComponentsUsingResource } from '../../core/resource.js';
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

// Selección de la sesión de edición en curso. `renderEditMode` se vuelve a invocar por
// completo (desde main.js) ante cualquier `components:changed`, así que este estado
// vive fuera de la función para no perderse cada vez que se mueve/redimensiona/edita
// un componente cualquiera. El colapso/posición/ancho del panel y el ancho de sus
// columnas, en cambio, viven en `core/state.js` (`panelState`) porque sí se
// persisten en el autoguardado.
// Selección múltiple (cambio 00108): conjunto de ids, en vez de un único id — Ctrl+clic
// añade/quita un elemento sin tocar el resto; clic normal reemplaza la selección
// completa por ese único elemento (o la vacía si ya era el único seleccionado, mismo
// toggle que existía antes de este cambio con un solo elemento).
let selectedComponentIds = new Set();

// Orden de apilado (z-index) de los paneles flotantes del modo edición, de abajo a
// arriba — cambio 00101. Vive fuera de `renderEditMode` por el mismo motivo que
// `selectedComponentIds`: sobrevive a los remontados completos que disparan
// `components:changed`/`resources:changed`/`groups:changed`. No se persiste en
// `core/state.js`: es transitorio, se resetea al recargar la página.
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

// Borra uno o varios componentes, con la confirmación que corresponda (cambio 00108):
// un único elemento mantiene el `confirm()` nativo de siempre; dos o más abren
// `ui/bulkDeleteConfirmModal.js`, que enumera todos los afectados antes de confirmar.
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

// Arrastrar cartas seleccionadas sobre un mazo (cambio 00106): si todo el grupo
// arrastrado (la selección múltiple si el componente soltado forma parte de
// ella, o solo él si no) son cartas, y su rectángulo final solapa con el de
// algún mazo, se pregunta si se quieren añadir todas al mazo. "El cursor está
// sobre un mazo al soltar" se interpreta como solape de rectángulos (posición
// final de la carta soltada), no como un test de punto exacto del ratón.
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

// Atajo de teclado SUPR (`ui/globalShortcuts.js`) sin ninguna modal abierta: reutiliza
// el mismo camino de borrado que ya usa la fila de `ui/componentList.js` (confirmación
// con el mismo texto para un único elemento, o la modal de borrado en bloque si hay
// más de uno seleccionado), aplicado a toda la selección múltiple actual.
export function deleteSelectedComponent() {
  const components = getComponents().filter((c) => selectedComponentIds.has(c.id));
  attemptDeleteComponents(components);
}

// Atajo de teclado flechas (`ui/globalShortcuts.js`, cambio 00145): desplaza toda la
// selección múltiple actual el mismo delta (manteniendo las distancias relativas entre
// ellos sin necesidad de calcular un ancla, a diferencia del arrastre con ratón),
// respetando la misma restricción de movimiento que ya usa `canMove` en `renderTable()`.
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

  // Infinite table with components rendered directly on it
  const tableContainer = document.createElement('div');
  tableContainer.style.flex = '1';
  tableContainer.style.position = 'relative';
  const table = createInfiniteTable(tableContainer);
  layout.appendChild(tableContainer);

  // Floating panel with component list, anchored top-right over the table
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

  // Floating panel with the resource gallery, independent position/width/collapse
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

  // Floating panel with the group list, independent position/width/collapse
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

  // Traer al frente la ventana flotante interactuada (cambio 00101): captura para no
  // depender de que ningún listener interno haga o no `stopPropagation`, y sin
  // `preventDefault` para no interferir con el arrastre (`mousedown` en la cabecera,
  // ver `ui/componentList.js`/`ui/resourceList.js`/`ui/groupList.js`) ni con clicks
  // normales de botones/filas/campos.
  const panelsByKey = { component: listContainer, resource: resourceListContainer, group: groupListContainer };
  listContainer.addEventListener('mousedown', () => bringPanelToFront('component', panelsByKey), true);
  resourceListContainer.addEventListener('mousedown', () => bringPanelToFront('resource', panelsByKey), true);
  groupListContainer.addEventListener('mousedown', () => bringPanelToFront('group', panelsByKey), true);
  applyPanelStackOrder(panelsByKey);

  const RESOURCE_ACCEPT = '.png,.jpg,.jpeg,.gif,.svg,.webp,.ttf,.otf,.woff,.woff2';

  // Valida y da de alta un recurso a partir de un `File`. Reutilizada por las
  // tres vías de subida (única, varios ficheros, carpeta). Devuelve `{ ok: true }`
  // si se añadió, o `{ ok: false }` si el formato no está soportado (sin avisar
  // aquí — cada vía decide cómo comunicar los omitidos).
  async function loadResourceFromFile(file) {
    const type = resourceTypeForFileName(file.name);
    if (!type) return { ok: false };
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const name = file.name.replace(/\.[^.]+$/, '');
    const converted = await convertImageToWebP(file, dataUrl);
    addResource(createResource({ name, type, dataUrl: converted.dataUrl, fileName: converted.fileName, mimeType: converted.mimeType }));
    return { ok: true };
  }

  const resourceFileInput = document.createElement('input');
  resourceFileInput.type = 'file';
  resourceFileInput.accept = RESOURCE_ACCEPT;
  resourceFileInput.hidden = true;
  resourceFileInput.addEventListener('change', async () => {
    const file = resourceFileInput.files[0];
    resourceFileInput.value = '';
    if (!file) return;
    const result = await loadResourceFromFile(file);
    if (!result.ok) {
      showErrorModal('Error', 'Formato de fichero no soportado.');
    }
  });
  tableContainer.appendChild(resourceFileInput);

  const resourceFilesInput = document.createElement('input');
  resourceFilesInput.type = 'file';
  resourceFilesInput.accept = RESOURCE_ACCEPT;
  resourceFilesInput.multiple = true;
  resourceFilesInput.hidden = true;
  resourceFilesInput.addEventListener('change', async () => {
    const files = Array.from(resourceFilesInput.files);
    resourceFilesInput.value = '';
    if (files.length === 0) return;

    let added = 0;
    const skippedFormat = [];
    const results = await Promise.all(files.map((file) => loadResourceFromFile(file)));
    results.forEach((result, i) => {
      if (result.ok) added++;
      else skippedFormat.push({ name: files[i].name });
    });

    openBatchUploadSummaryModal({ added, skippedFormat });
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

    let added = 0;
    const skippedFormat = [];
    const results = await Promise.all(topLevelFiles.map((file) => loadResourceFromFile(file)));
    results.forEach((result, i) => {
      if (result.ok) added++;
      else skippedFormat.push({ name: topLevelFiles[i].name });
    });

    if (added === 0) {
      showErrorModal('Aviso', 'No se ha encontrado ningún recurso válido en la carpeta seleccionada.');
      return;
    }

    openBatchUploadSummaryModal({ added, skippedFormat, skippedSubfolderCount });
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

  // Selección de grupo desde el panel de Grupos (cambio 00130): reemplaza siempre
  // la selección completa por los miembros del grupo, sin toggle ni modo aditivo
  // (a diferencia de `toggleSelect`, pensada para clic/Ctrl+clic sobre un componente).
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

  function renderTable() {
    const cartasEnMazo = getCartaIdsEnAlgunMazo(getComponents());
    renderComponentsOnTable(table.worldEl, getComponents().filter((c) => !cartasEnMazo.has(c.id)), {
      identifyMode: 'label',
      showLockIndicator: true,
      showHiddenIndicator: true,
      onSelect: openEditModalFor,
      onToggleSelect: toggleSelect,
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
    });
  }

  container.appendChild(layout);

  renderTable();
  renderList();
  renderResourcePanel();
  renderGroupPanel();
}
