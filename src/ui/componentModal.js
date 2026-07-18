// Modal for creating/editing components with tabs.
// Generically handles different component types via type-specific tab content.

import { getComponents } from '../core/state.js';
import { createComponent, updateComponent } from '../core/component.js';
import { createHelpIcon } from './helpIcon.js';

export function openComponentModal({ component = null, onAccept, onDelete }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = component ? 'Editar propiedades del componente' : 'Crear componente';
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

  // Initialize component if creating new
  const isNew = !component;
  const workingComponent = isNew
    ? createComponent({ type: 'texto' })
    : { ...component };

  // Tab management
  const tabContents = new Map();
  let activeTab = 'general';

  function createTab(name, label) {
    const tab = document.createElement('button');
    tab.className = 'modal__tab';
    if (name === activeTab) tab.classList.add('active');
    tab.textContent = label;
    tab.addEventListener('click', () => switchTab(name));
    tabs.appendChild(tab);

    const content = document.createElement('div');
    content.style.display = name === activeTab ? 'block' : 'none';
    contentArea.appendChild(content);
    tabContents.set(name, { tab, content });
  }

  function switchTab(name) {
    tabContents.forEach((data) => {
      data.tab.classList.remove('active');
      data.content.style.display = 'none';
    });
    tabContents.get(name).tab.classList.add('active');
    tabContents.get(name).content.style.display = 'block';
    activeTab = name;
  }

  // General tab: id field with validation
  createTab('general', 'Generales');
  const generalContent = tabContents.get('general').content;

  const idField = document.createElement('div');
  idField.className = 'modal__field';
  const idLabel = document.createElement('label');
  idLabel.textContent = 'ID del componente';
  const idInput = document.createElement('input');
  idInput.type = 'text';
  idInput.value = workingComponent.id;
  const idError = document.createElement('div');
  idError.className = 'modal__error';
  idError.style.display = 'none';

  idField.appendChild(idLabel);
  idField.appendChild(idInput);
  idField.appendChild(idError);
  generalContent.appendChild(idField);

  const moveField = document.createElement('div');
  moveField.className = 'modal__field modal__field--checkbox';
  const moveCheckbox = document.createElement('input');
  moveCheckbox.type = 'checkbox';
  moveCheckbox.checked = workingComponent.bloqueado ?? true;
  const moveLabel = document.createElement('label');
  moveLabel.textContent = 'Bloqueado';

  moveCheckbox.addEventListener('change', () => {
    workingComponent.bloqueado = moveCheckbox.checked;
  });

  moveField.appendChild(moveCheckbox);
  moveField.appendChild(moveLabel);
  moveField.appendChild(createHelpIcon({
    text: 'Si está marcado (por defecto), este componente no se puede mover en Modo Juego. Desmárcalo para poder arrastrarlo libremente por la mesa mientras se juega.',
  }));
  generalContent.appendChild(moveField);

  function validateId() {
    const newId = idInput.value.trim();
    if (!newId) {
      idError.textContent = 'El ID no puede estar vacío';
      idError.style.display = 'block';
      return false;
    }
    const isDuplicate = getComponents().some(
      (c) => c.id === newId && c.id !== (component?.id ?? '')
    );
    if (isDuplicate) {
      idError.textContent = 'Ya existe otro componente con este ID';
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
    workingComponent.id = idInput.value.trim();
    validateId();
    updateAcceptButton();
  });

  // Specific tab: type-specific fields
  createTab('specific', 'Específicas');
  const specificContent = tabContents.get('specific').content;

  function renderSpecificTab() {
    specificContent.innerHTML = '';

    if (workingComponent.type === 'texto') {
      // Content field
      const contentField = document.createElement('div');
      contentField.className = 'modal__field';
      const contentLabel = document.createElement('label');
      contentLabel.textContent = 'Contenido';
      const contentInput = document.createElement('textarea');
      contentInput.value = workingComponent.properties.contenido || '';
      contentInput.rows = 3;
      contentField.appendChild(contentLabel);
      contentField.appendChild(contentInput);
      specificContent.appendChild(contentField);

      contentInput.addEventListener('input', () => {
        workingComponent.properties.contenido = contentInput.value;
      });

      // Font size field
      const fontSizeField = document.createElement('div');
      fontSizeField.className = 'modal__field';
      const fontSizeLabel = document.createElement('label');
      fontSizeLabel.textContent = 'Tamaño de fuente (px)';
      const fontSizeInput = document.createElement('input');
      fontSizeInput.type = 'number';
      fontSizeInput.value = workingComponent.properties.tamañoFuente || 16;
      fontSizeInput.min = 8;
      fontSizeInput.max = 72;
      fontSizeField.appendChild(fontSizeLabel);
      fontSizeField.appendChild(fontSizeInput);
      specificContent.appendChild(fontSizeField);

      fontSizeInput.addEventListener('input', () => {
        workingComponent.properties.tamañoFuente = parseInt(fontSizeInput.value) || 16;
      });

      // Text color field
      const textColorField = document.createElement('div');
      textColorField.className = 'modal__field';
      const textColorLabel = document.createElement('label');
      textColorLabel.textContent = 'Color de texto';
      const textColorInput = document.createElement('input');
      textColorInput.type = 'color';
      textColorInput.value = workingComponent.properties.colorTexto || '#000000';
      textColorField.appendChild(textColorLabel);
      textColorField.appendChild(textColorInput);
      specificContent.appendChild(textColorField);

      textColorInput.addEventListener('input', () => {
        workingComponent.properties.colorTexto = textColorInput.value;
      });

      // Background color field with transparency option
      const bgColorField = document.createElement('div');
      bgColorField.className = 'modal__field';
      const bgColorLabel = document.createElement('label');
      bgColorLabel.textContent = 'Color de fondo';
      const bgColorContainer = document.createElement('div');
      bgColorContainer.style.display = 'flex';
      bgColorContainer.style.gap = '0.5rem';
      bgColorContainer.style.alignItems = 'center';

      const bgColorInput = document.createElement('input');
      bgColorInput.type = 'color';
      bgColorInput.value = workingComponent.properties.colorFondo || '#ffffff';

      const bgTransparentCheckbox = document.createElement('input');
      bgTransparentCheckbox.type = 'checkbox';
      bgTransparentCheckbox.checked = !workingComponent.properties.colorFondo;

      const bgTransparentLabel = document.createElement('label');
      bgTransparentLabel.textContent = 'Transparente';
      bgTransparentLabel.style.margin = 0;

      bgColorInput.disabled = bgTransparentCheckbox.checked;

      bgTransparentCheckbox.addEventListener('change', () => {
        bgColorInput.disabled = bgTransparentCheckbox.checked;
        if (bgTransparentCheckbox.checked) {
          workingComponent.properties.colorFondo = '';
        } else {
          workingComponent.properties.colorFondo = bgColorInput.value;
        }
      });

      bgColorInput.addEventListener('input', () => {
        workingComponent.properties.colorFondo = bgColorInput.value;
      });

      bgColorContainer.appendChild(bgColorInput);
      bgColorContainer.appendChild(bgTransparentCheckbox);
      bgColorContainer.appendChild(bgTransparentLabel);
      bgColorField.appendChild(bgColorLabel);
      bgColorField.appendChild(bgColorContainer);
      specificContent.appendChild(bgColorField);
    } else {
      const empty = document.createElement('p');
      empty.textContent = 'Sin propiedades específicas';
      empty.style.color = 'var(--text-muted)';
      specificContent.appendChild(empty);
    }
  }

  renderSpecificTab();

  // Footer buttons
  if (!isNew && onDelete) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-eliminar';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.addEventListener('click', () => {
      if (confirm(`¿Eliminar el componente "${workingComponent.id}"?`)) {
        onDelete(component);
        overlay.remove();
      }
    });
    footer.appendChild(deleteBtn);
  }

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => {
    overlay.remove();
  });
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';
  acceptBtn.addEventListener('click', () => {
    if (validateId()) {
      if (onAccept) {
        onAccept(workingComponent, isNew);
      }
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

  // Close on overlay click (outside modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}
