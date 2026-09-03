// Modo edición: mesa infinita con componentes seleccionables/editables + panel flotante
// con listado de componentes y acciones de edición/borrado.

import {
  getComponents, addComponent, replaceComponent, removeComponent, reorderComponent, reorderGroupBlock, getPanelState, setPanelState,
  getResources, addResource, replaceResource, removeResource, getResourcePanelState, setResourcePanelState,
  getTags, addTag, replaceTag, removeTag, getTagPanelState, setTagPanelState, sacarCartaDeMazo,
  getGroups, addGroup, replaceGroup, removeGroup,
} from '../../core/state.js';
import { updateComponent, cloneComponent, createCopy, nextGroupId } from '../../core/component.js';
import { createResource, resourceTypeForFileName, getComponentsUsingResource, findResourceByName } from '../../core/resource.js';
import { getComponentsUsingTag } from '../../core/tag.js';
import { createGroup, updateGroup, getEffectiveGeneralProps, getGroupsUsingTag } from '../../core/group.js';
import { getCartaIdsEnAlgunMazo, rectsOverlap } from '../../core/deck.js';
import { convertImageToWebP } from '../../core/imageConversion.js';
import { createInfiniteTable } from '../../ui/table.js';
import { openComponentModal, createDefaultComponent } from '../../ui/componentModal.js';
import { openCopyComponentModal } from '../../ui/copyComponentModal.js';
import { openGroupModal } from '../../ui/groupModal.js';
import { openComponentTypeModal } from '../../ui/componentTypeModal.js';
import { renderComponentList } from '../../ui/componentList.js';
import { renderComponentsOnTable } from '../../ui/componentRenderer.js';
import { openResourceModal } from '../../ui/resourceModal.js';
import { renderResourceList } from '../../ui/resourceList.js';
import { renderTagList } from '../../ui/tagList.js';
import { openTagModal } from '../../ui/tagModal.js';
import { openTagDeleteConfirmModal } from '../../ui/tagDeleteConfirmModal.js';
import { openBulkDeleteConfirmModal } from '../../ui/bulkDeleteConfirmModal.js';
import { showErrorModal } from '../../ui/errorModal.js';
import { openBatchUploadSummaryModal } from '../../ui/batchUploadSummaryModal.js';
import { openResourceReplaceConfirmModal } from '../../ui/resourceReplaceConfirmModal.js';
import { openContextMenu } from '../../ui/contextMenu.js';
import { showToast } from '../../ui/toast.js';
import { runWithProgressModal } from '../../ui/progressModal.js';
import { sortByName } from '../../core/textSort.js';
import { t } from '../../core/i18n.js';

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

function createGroupIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M11 7h4a2 2 0 0 1 2 2v4" stroke-dasharray="2 2"/>';
  return svg;
}

function createUngroupIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>';
  return svg;
}

function createFlipIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML = '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M3 9a6 6 0 0 1 4-5" stroke-linecap="round"/><path d="M3 9l0-3.5M3 9l3-1" stroke-linecap="round"/><path d="M21 15a6 6 0 0 1-4 5" stroke-linecap="round"/><path d="M21 15l0 3.5M21 15l-3 1" stroke-linecap="round"/>';
  return svg;
}

// Selección de la sesión en curso. Vive fuera de `renderEditMode`: `components:changed`
// remonta todo el modo, así no se pierde al mover/redimensionar/editar un componente.
// Colapso/posición/ancho del panel sí persisten (`core/state.js`, `panelState`) en autoguardado.
// Set de ids: Ctrl+clic añade/quita un elemento sin tocar el resto; clic normal reemplaza
// la selección por ese único elemento (o la vacía si ya era el único seleccionado).
let selectedComponentIds = new Set();

// Subconjunto de `selectedComponentIds` que fue el objetivo *directo* de un click (no
// arrastrado a la selección por pertenecer al mismo grupo que el clicado). Solo se usa
// para pintar el contorno de la mesa (azul = clicado, gris = resto del grupo) — nunca
// para decidir qué está seleccionado a efectos de acciones, eso lo sigue haciendo en
// exclusiva `selectedComponentIds`.
let primarySelectedIds = new Set();

// Orden de apilado (z-index) de los paneles flotantes, de abajo a arriba. Vive fuera de
// `renderEditMode` por el mismo motivo que `selectedComponentIds`. No se persiste:
// transitorio, se resetea al recargar.
let panelStackOrder = ['component', 'resource', 'tag'];

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
    if (confirm(t('confirm.deleteComponent', { id: component.id }))) {
      removeComponent(component.id);
      selectedComponentIds.delete(component.id);
      primarySelectedIds.delete(component.id);
    }
    return;
  }
  openBulkDeleteConfirmModal({
    components,
    onConfirm: () => {
      for (const component of components) removeComponent(component.id);
      selectedComponentIds.clear();
      primarySelectedIds.clear();
    },
  });
}

// Detecta si el grupo arrastrado (todas cartas) va a caer sobre un mazo al
// soltarlo, sin aplicar ningún cambio todavía — permite decidir si hace falta
// la modal de operación en curso antes de lanzar el trabajo bloqueante.
// Solape de rectángulos, no punto exacto del cursor.
function findMazoDropTarget(groupIds, draggedRect) {
  const groupComponents = groupIds.map((id) => getComponents().find((c) => c.id === id)).filter(Boolean);
  if (groupComponents.length === 0 || !groupComponents.every((c) => c.type === 'carta')) return null;

  const mazo = getComponents()
    .filter((c) => c.type === 'mazo')
    .find((m) => rectsOverlap(draggedRect, { x: m.x ?? 100, y: m.y ?? 100, width: m.width ?? 100, height: m.height ?? 100 }));
  if (!mazo) return null;

  return { mazo, groupComponents };
}

// Mismo criterio que en modo juego: sin confirmación previa.
function insertCardsIntoMazo(mazo, groupComponents) {
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
    .filter((c) => selectedComponentIds.has(c.id) && getEffectiveGeneralProps(c, getGroups()).bloqueado !== 'todos');
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
  const { position: tagPanelPosition, width: tagPanelWidth } = getTagPanelState();
  let tagCollapsed = getTagPanelState().collapsed;

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

  const tagListContainer = document.createElement('div');
  tagListContainer.className = 'tag-panel-container';
  if (tagPanelPosition) {
    tagListContainer.style.left = `${tagPanelPosition.left}px`;
    tagListContainer.style.top = `${tagPanelPosition.top}px`;
    tagListContainer.style.right = 'auto';
  }
  if (tagPanelWidth != null) {
    tagListContainer.style.width = `${tagPanelWidth}px`;
  }
  tableContainer.appendChild(tagListContainer);

  // Trae la ventana flotante interactuada al frente: captura, para no depender de que
  // listeners internos hagan `stopPropagation`; sin `preventDefault`, para no interferir
  // con el arrastre (`mousedown` en cabecera) ni clicks de botones/filas/campos.
  const panelsByKey = { component: listContainer, resource: resourceListContainer, tag: tagListContainer };
  listContainer.addEventListener('mousedown', () => bringPanelToFront('component', panelsByKey), true);
  resourceListContainer.addEventListener('mousedown', () => bringPanelToFront('resource', panelsByKey), true);
  tagListContainer.addEventListener('mousedown', () => bringPanelToFront('tag', panelsByKey), true);
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
      showErrorModal(t('error.generic.title'), t('error.unsupportedFileFormat'));
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
      showErrorModal(t('error.notice.title'), t('error.noValidResourceInFolder'));
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
      showErrorModal(t('error.generic.title'), t('error.resourceInUse', { name: resource.name, ids: usedByIds.join(', ') }));
      return false;
    }
    if (!confirm(t('confirm.deleteResource', { name: resource.name }))) return false;
    removeResource(resource.id);
    return true;
  }

  function attemptDeleteTag(tag, { onDeleted } = {}) {
    const affectedIds = getComponentsUsingTag(tag.id, getComponents());
    const affectedGroupIds = getGroupsUsingTag(tag.id, getGroups());
    if (affectedIds.length > 0 || affectedGroupIds.length > 0) {
      const affectedComponents = [
        ...affectedIds
          .map((id) => getComponents().find((c) => c.id === id))
          .filter(Boolean)
          .map((c) => ({ id: c.id, type: c.type })),
        ...affectedGroupIds.map((id) => ({ id, type: t('componentList.groupRowType') })),
      ];
      openTagDeleteConfirmModal({
        tagName: tag.name,
        affectedComponents,
        onConfirm: () => {
          for (const componentId of affectedIds) {
            const component = getComponents().find((c) => c.id === componentId);
            if (component) replaceComponent(componentId, updateComponent(component, { etiquetaIds: component.etiquetaIds.filter((id) => id !== tag.id) }));
          }
          for (const groupId of affectedGroupIds) {
            const group = getGroups().find((g) => g.id === groupId);
            if (group) replaceGroup(groupId, updateGroup(group, { etiquetaIds: group.etiquetaIds.filter((id) => id !== tag.id) }));
          }
          removeTag(tag.id);
          if (onDeleted) onDeleted();
        },
      });
      return false;
    }
    if (!confirm(t('confirm.deleteTag', { name: tag.name }))) return false;
    removeTag(tag.id);
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
          primarySelectedIds.delete(deletedComponent.id);
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
        primarySelectedIds.delete(deletedComponent.id);
        removeComponent(deletedComponent.id);
      },
    });
  }

  // Abre el modal de propiedades de un grupo (botón "Editar" de su fila en el
  // panel de Componentes). El registro debería existir siempre (alta automática
  // al "Agrupar"); si por lo que sea no está, no hay nada que editar.
  function openEditModalForGroup(groupId) {
    const group = getGroups().find((g) => g.id === groupId);
    if (!group) return;
    openGroupModal({
      group,
      onAccept: (updated) => {
        if (updated.id !== group.id) {
          for (const c of getComponents().filter((c) => c.groupId === group.id)) {
            replaceComponent(c.id, updateComponent(c, { groupId: updated.id }));
          }
        }
        replaceGroup(group.id, updated);
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
            primarySelectedIds.delete(deletedComponent.id);
            removeComponent(deletedComponent.id);
          },
        });
      },
    });
  }

  // Unidad afectada por un click sobre `component`: el grupo completo si pertenece a
  // uno (todos los ids con el mismo `groupId`), o solo su propio id si no. Un grupo
  // siempre entra/sale de la selección como bloque atómico, nunca parcialmente.
  function getSelectionUnit(component) {
    if (component.groupId == null) return [component.id];
    return getComponents().filter((c) => c.groupId === component.groupId).map((c) => c.id);
  }

  function toggleSelect(component, event) {
    const ctrl = event && (event.ctrlKey || event.metaKey);
    const unit = getSelectionUnit(component);
    if (ctrl) {
      if (selectedComponentIds.has(unit[0])) {
        for (const id of unit) {
          selectedComponentIds.delete(id);
          primarySelectedIds.delete(id);
        }
      } else {
        for (const id of unit) selectedComponentIds.add(id);
        primarySelectedIds.add(component.id);
      }
    } else if (selectedComponentIds.size === unit.length && unit.every((id) => selectedComponentIds.has(id))) {
      selectedComponentIds.clear();
      primarySelectedIds.clear();
    } else {
      selectedComponentIds.clear();
      for (const id of unit) selectedComponentIds.add(id);
      primarySelectedIds = new Set([component.id]);
    }
    renderList();
    renderTable();
  }

  // Selección de etiqueta desde el panel de Etiquetas: reemplaza siempre la selección
  // completa por los miembros de la etiqueta, sin toggle (a diferencia de `toggleSelect`).
  function selectTag(tag) {
    const ids = getComponentsUsingTag(tag.id, getComponents());
    selectedComponentIds.clear();
    primarySelectedIds.clear();
    for (const id of ids) {
      const component = getComponents().find((c) => c.id === id);
      const unit = component ? getSelectionUnit(component) : [id];
      for (const unitId of unit) selectedComponentIds.add(unitId);
    }
    // Grupos etiquetados directamente (etiqueta propia del grupo, no de sus
    // miembros): seleccionar el grupo entero, igual que un componente etiquetado.
    for (const groupId of getGroupsUsingTag(tag.id, getGroups())) {
      for (const c of getComponents().filter((c) => c.groupId === groupId)) {
        selectedComponentIds.add(c.id);
      }
    }

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
  // el listado de Componentes) y "Añadir a etiqueta", sobre la selección múltiple vigente.
  function handleComponentContextMenu(component, event) {
    const unit = getSelectionUnit(component);
    if (!unit.every((id) => selectedComponentIds.has(id))) {
      selectedComponentIds.clear();
      for (const id of unit) selectedComponentIds.add(id);
      primarySelectedIds = new Set([component.id]);
      renderList();
      renderTable();
    }

    const affectedIds = [...selectedComponentIds];
    const affectedComponents = getComponents().filter((c) => affectedIds.includes(c.id));
    const cloneables = affectedComponents.filter((c) => !c.copyOf);

    // Unidades de la selección: cada `groupId` distinto cuenta como 1 unidad
    // (grupo completo), cada componente suelto cuenta 1 a 1.
    const groupIdsInSelection = new Set(affectedComponents.filter((c) => c.groupId != null).map((c) => c.groupId));
    const looseCount = affectedComponents.filter((c) => c.groupId == null).length;
    const unitCount = groupIdsInSelection.size + looseCount;
    const hasGroup = groupIdsInSelection.size > 0;

    if (unitCount >= 2 && hasGroup) {
      // 2+ unidades con al menos un grupo entre ellas: sin menú contextual.
      return;
    }

    const canGroup = unitCount >= 2 && !hasGroup;
    const canUngroup = unitCount === 1 && hasGroup;

    // Selección de un único grupo completo: "Ocultar/Mostrar" y "Añadir a etiqueta"
    // operan sobre el registro propio del grupo, no sobre cada miembro (ver
    // description.md/plan.md — propiedades del grupo, no en bloque).
    const selectedGroup = canUngroup ? getGroups().find((g) => g.id === [...groupIdsInSelection][0]) : null;

    const generalItems = [
      {
        icon: createHiddenIcon(),
        label: (selectedGroup ? selectedGroup.oculto : affectedComponents.every((c) => c.oculto)) ? t('menu.show') : t('menu.hide'),
        onClick: () => {
          if (selectedGroup) {
            replaceGroup(selectedGroup.id, updateGroup(selectedGroup, { oculto: !selectedGroup.oculto }));
            return;
          }
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
        label: t('contextMenu.clone'),
        disabled: cloneables.length === 0,
        onClick: () => {
          for (const c of cloneables) {
            addComponent(cloneComponent(c, getComponents()));
          }
        },
      },
      {
        icon: createCopyIcon(),
        label: t('contextMenu.copy'),
        disabled: cloneables.length === 0,
        onClick: () => {
          for (const c of cloneables) {
            addComponent(createCopy(c, getComponents()));
          }
        },
      },
      {
        icon: createRemoveIcon(),
        label: t('contextMenu.delete'),
        onClick: () => attemptDeleteComponents(affectedComponents),
      },
      {
        icon: createGroupIcon(),
        label: t('contextMenu.group'),
        disabled: !canGroup,
        onClick: () => {
          const count = affectedComponents.length;
          const text = t('progress.grouping', { count });
          runWithProgressModal(text, () => {
            const newGroupId = nextGroupId(getComponents());
            const minOrder = Math.min(...affectedComponents.map((c) => c.order));
            for (const c of affectedComponents) {
              replaceComponent(c.id, updateComponent(c, { groupId: newGroupId }));
            }
            addGroup(createGroup({ id: newGroupId }));
            reorderGroupBlock(affectedComponents.map((c) => c.id), minOrder);
          });
        },
      },
      {
        icon: createUngroupIcon(),
        label: t('contextMenu.ungroup'),
        disabled: !canUngroup,
        onClick: () => {
          const groupId = selectedGroup?.id;
          const count = affectedComponents.length;
          const text = t('progress.ungrouping', { count });
          runWithProgressModal(text, () => {
            for (const c of affectedComponents) {
              replaceComponent(c.id, updateComponent(c, { groupId: null }));
            }
            if (groupId != null) removeGroup(groupId);
          });
        },
      },
    ];

    const allCartas = affectedComponents.length > 0 && affectedComponents.every((c) => c.type === 'carta');

    const specificItems = [
      ...(allCartas ? [{
        icon: createFlipIcon(),
        label: t('menu.flipCard'),
        onClick: () => {
          for (const c of affectedComponents) {
            const caraActual = c.properties?.caraActual === 'frontal' ? 'frontal' : 'trasera';
            const nuevaCara = caraActual === 'trasera' ? 'frontal' : 'trasera';
            replaceComponent(c.id, updateComponent(c, { properties: { caraActual: nuevaCara } }));
          }
        },
      }] : []),
      {
        label: t('contextMenu.addToTag'),
        select: {
          options: sortByName(getTags()).map((tag) => ({ value: tag.id, label: tag.name })),
          onChange: (tagId) => {
            if (selectedGroup) {
              if (!selectedGroup.etiquetaIds.includes(tagId)) {
                replaceGroup(selectedGroup.id, updateGroup(selectedGroup, { etiquetaIds: [...selectedGroup.etiquetaIds, tagId] }));
              }
              showToast(t('toast.tagAdded'));
              return;
            }
            for (const c of affectedComponents) {
              if (c.etiquetaIds.includes(tagId)) continue;
              replaceComponent(c.id, updateComponent(c, { etiquetaIds: [...c.etiquetaIds, tagId] }));
            }
            showToast(t('toast.tagAdded'));
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
      groups: getGroups(),
      identifyMode: 'label',
      showLockIndicator: true,
      showHiddenIndicator: true,
      showCopyIndicator: true,
      onSelect: (component) => {
        if (component.groupId != null) return;
        openEditModalFor(component);
      },
      onToggleSelect: toggleSelect,
      onContextMenu: handleComponentContextMenu,
      selectedIds: selectedComponentIds,
      primarySelectedIds,
      canMove: (component) => getEffectiveGeneralProps(component, getGroups()).bloqueado !== 'todos',
      onMove: (component, x, y) => {
        const group = selectedComponentIds.size > 1 && selectedComponentIds.has(component.id)
          ? [...selectedComponentIds]
          : getSelectionUnit(component);

        const dropTarget = findMazoDropTarget(group, { x, y, width: component.width ?? 100, height: component.height ?? 100 });

        const applyPositions = () => {
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
        };

        if (dropTarget) {
          const count = dropTarget.groupComponents.length;
          const text = t('progress.addingToMazo', { count });
          runWithProgressModal(text, () => {
            applyPositions();
            insertCardsIntoMazo(dropTarget.mazo, dropTarget.groupComponents);
          });
        } else {
          applyPositions();
        }
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
        primarySelectedIds.delete(component.id);
        removeComponent(component.id);
      },
      onEditGroup: openEditModalForGroup,
      onUngroup: (memberIds) => {
        const first = getComponents().find((comp) => comp.id === memberIds[0]);
        const groupId = first?.groupId;
        const count = memberIds.length;
        const text = t('progress.ungrouping', { count });
        runWithProgressModal(text, () => {
          for (const id of memberIds) {
            const c = getComponents().find((comp) => comp.id === id);
            if (c) replaceComponent(id, updateComponent(c, { groupId: null }));
          }
          if (groupId != null) removeGroup(groupId);
        });
      },
      onAdd: openAddModal,
      onReorder: (component, newOrder) => reorderComponent(component.id, newOrder),
      onReorderGroup: (groupId, memberIds, newOrder) => reorderGroupBlock(memberIds, newOrder),
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

  function renderTagPanel() {
    renderTagList(tagListContainer, getTags(), getComponents(), getGroups(), {
      onEdit: (tag) => {
        openTagModal({
          tag,
          onAccept: (updated) => replaceTag(tag.id, updated),
          onDelete: (t, closeModal) => attemptDeleteTag(t, { onDeleted: closeModal }),
          onRemoveFromTag: (t, componentId) => {
            const component = getComponents().find((c) => c.id === componentId);
            if (component) replaceComponent(componentId, updateComponent(component, { etiquetaIds: component.etiquetaIds.filter((id) => id !== t.id) }));
          },
          onRemoveGroupFromTag: (t, groupId) => {
            const group = getGroups().find((g) => g.id === groupId);
            if (group) replaceGroup(groupId, updateGroup(group, { etiquetaIds: group.etiquetaIds.filter((id) => id !== t.id) }));
          },
        });
      },
      onRemove: (tag) => attemptDeleteTag(tag),
      onAdd: () => {
        openTagModal({ onAccept: (newTag) => addTag(newTag) });
      },
      onSelectTag: selectTag,
      collapsed: tagCollapsed,
      onToggleCollapse: () => {
        tagCollapsed = !tagCollapsed;
        setTagPanelState({ collapsed: tagCollapsed });
        renderTagPanel();
      },
      onPanelMove: (left, top) => {
        setTagPanelState({ position: { left, top } });
      },
      onPanelResize: (width, height, left, top) => {
        const patch = height ? { width, height } : { width };
        if (left != null) patch.position = { left, top };
        setTagPanelState(patch);
      },
      bodyHeight: getTagPanelState().height,
      columnWidths: getTagPanelState().columnWidths,
      onColumnResize: (columnWidths) => {
        setTagPanelState({ columnWidths });
      },
    });
  }

  container.appendChild(layout);

  renderTable();
  renderList();
  renderResourcePanel();
  renderTagPanel();
}
