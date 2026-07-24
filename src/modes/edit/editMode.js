// Modo edición: mesa infinita con los componentes renderizados sobre ella (seleccionables
// para editar) + panel flotante con listado de componentes y acciones de edición/borrado.

import {
  getComponents, addComponent, replaceComponent, removeComponent, reorderComponent, getPanelState, setPanelState,
  getResources, addResource, replaceResource, removeResource, getResourcePanelState, setResourcePanelState,
  getDecks, addDeck, replaceDeck, removeDeck, getDeckPanelState, setDeckPanelState,
} from '../../core/state.js';
import { updateComponent, cloneComponent } from '../../core/component.js';
import { createResource, resourceTypeForFileName, getComponentsUsingResource } from '../../core/resource.js';
import { getComponentsUsingDeck } from '../../core/deck.js';
import { convertImageToWebP } from '../../core/imageConversion.js';
import { createInfiniteTable } from '../../ui/table.js';
import { openComponentModal, createDefaultComponent } from '../../ui/componentModal.js';
import { openComponentTypeModal } from '../../ui/componentTypeModal.js';
import { renderComponentList } from '../../ui/componentList.js';
import { renderComponentsOnTable } from '../../ui/componentRenderer.js';
import { openResourceModal } from '../../ui/resourceModal.js';
import { renderResourceList } from '../../ui/resourceList.js';
import { renderDeckList } from '../../ui/deckList.js';
import { openDeckModal } from '../../ui/deckModal.js';
import { openDeckDeleteConfirmModal } from '../../ui/deckDeleteConfirmModal.js';
import { showErrorModal } from '../../ui/errorModal.js';
import { openBatchUploadSummaryModal } from '../../ui/batchUploadSummaryModal.js';

// Selección de la sesión de edición en curso. `renderEditMode` se vuelve a invocar por
// completo (desde main.js) ante cualquier `components:changed`, así que este estado
// vive fuera de la función para no perderse cada vez que se mueve/redimensiona/edita
// un componente cualquiera. El colapso/posición/ancho del panel y el ancho de sus
// columnas, en cambio, viven en `core/state.js` (`panelState`) porque sí se
// persisten en el autoguardado.
let selectedComponentId = null;

export function renderEditMode(container) {
  container.innerHTML = '';

  const { position: panelPosition, width: panelWidth, height: panelHeight, columnWidths: panelColumnWidths } = getPanelState();
  let collapsed = getPanelState().collapsed;
  const { position: resourcePanelPosition, width: resourcePanelWidth, height: resourcePanelHeight, columnWidths: resourcePanelColumnWidths } = getResourcePanelState();
  let resourceCollapsed = getResourcePanelState().collapsed;
  const { position: deckPanelPosition, width: deckPanelWidth, height: deckPanelHeight } = getDeckPanelState();
  let deckCollapsed = getDeckPanelState().collapsed;

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

  // Floating panel with the deck list, independent position/width/collapse
  const deckListContainer = document.createElement('div');
  deckListContainer.className = 'deck-panel-container';
  if (deckPanelPosition) {
    deckListContainer.style.left = `${deckPanelPosition.left}px`;
    deckListContainer.style.top = `${deckPanelPosition.top}px`;
    deckListContainer.style.right = 'auto';
  }
  if (deckPanelWidth != null) {
    deckListContainer.style.width = `${deckPanelWidth}px`;
  }
  tableContainer.appendChild(deckListContainer);

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

  function attemptDeleteDeck(deck, { onDeleted } = {}) {
    const affectedIds = getComponentsUsingDeck(deck.id, getComponents());
    if (affectedIds.length > 0) {
      openDeckDeleteConfirmModal({
        deckName: deck.name,
        cardIds: affectedIds,
        onConfirm: () => {
          for (const cardId of affectedIds) {
            const card = getComponents().find((c) => c.id === cardId);
            if (card) replaceComponent(cardId, updateComponent(card, { properties: { ...card.properties, deckId: null } }));
          }
          removeDeck(deck.id);
          if (onDeleted) onDeleted();
        },
      });
      return false;
    }
    if (!confirm(`¿Eliminar el mazo "${deck.name}"?`)) return false;
    removeDeck(deck.id);
    return true;
  }

  function openEditModalFor(component) {
    openComponentModal({
      component,
      onAccept: (updated, isNew) => {
        replaceComponent(component.id, updated);
      },
      onDelete: (deletedComponent) => {
        if (selectedComponentId === deletedComponent.id) {
          selectedComponentId = null;
        }
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
            if (selectedComponentId === deletedComponent.id) {
              selectedComponentId = null;
            }
            removeComponent(deletedComponent.id);
          },
        });
      },
    });
  }

  function toggleSelect(component) {
    selectedComponentId = selectedComponentId === component.id ? null : component.id;
    renderList();
    renderTable();
  }

  function renderTable() {
    renderComponentsOnTable(table.worldEl, getComponents(), {
      identifyMode: 'label',
      onSelect: openEditModalFor,
      onToggleSelect: toggleSelect,
      selectedId: selectedComponentId,
      onMove: (component, x, y) => {
        replaceComponent(component.id, updateComponent(component, { x, y }));
      },
      onResize: (component, width, height) => {
        replaceComponent(component.id, updateComponent(component, { width, height }));
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
      onRemove: (component) => {
        removeComponent(component.id);
      },
      onAdd: openAddModal,
      onReorder: (component, newOrder) => reorderComponent(component.id, newOrder),
      selectedId: selectedComponentId,
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
      onPanelResize: (width, height) => {
        setPanelState(height ? { width, height } : { width });
      },
      bodyHeight: panelHeight,
      columnWidths: panelColumnWidths,
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
      onPanelResize: (width, height) => {
        setResourcePanelState(height ? { width, height } : { width });
      },
      bodyHeight: resourcePanelHeight,
      columnWidths: resourcePanelColumnWidths,
      onColumnResize: (columnWidths) => {
        setResourcePanelState({ columnWidths });
      },
    });
  }

  function renderDeckPanel() {
    renderDeckList(deckListContainer, getDecks(), {
      onEdit: (deck) => {
        openDeckModal({
          deck,
          onAccept: (updated) => replaceDeck(deck.id, updated),
          onDelete: (d, closeModal) => attemptDeleteDeck(d, { onDeleted: closeModal }),
        });
      },
      onRemove: (deck) => attemptDeleteDeck(deck),
      onAdd: () => {
        openDeckModal({ onAccept: (newDeck) => addDeck(newDeck) });
      },
      collapsed: deckCollapsed,
      onToggleCollapse: () => {
        deckCollapsed = !deckCollapsed;
        setDeckPanelState({ collapsed: deckCollapsed });
        renderDeckPanel();
      },
      onPanelMove: (left, top) => {
        setDeckPanelState({ position: { left, top } });
      },
      onPanelResize: (width, height) => {
        setDeckPanelState(height ? { width, height } : { width });
      },
      bodyHeight: deckPanelHeight,
    });
  }

  container.appendChild(layout);

  renderTable();
  renderList();
  renderResourcePanel();
  renderDeckPanel();
}
