// Modal reducida de propiedades para un componente de tipo Copia: sin pestañas,
// nada editable (siempre sincronizado con su original, ver core/component.js/state.js).
// Solo muestra el id, un aviso, el id del original, y Eliminar/Cancelar/Aceptar.

export function openCopyComponentModal({ component, onDelete }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Propiedades del componente';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const idField = document.createElement('div');
  idField.className = 'modal__field';
  const idLabel = document.createElement('label');
  idLabel.textContent = 'ID del componente';
  const idValue = document.createElement('div');
  idValue.textContent = component.id;
  idField.appendChild(idLabel);
  idField.appendChild(idValue);
  content.appendChild(idField);

  const notice = document.createElement('p');
  notice.className = 'modal__hint';
  notice.textContent = 'Este componente es una copia de otro elemento. Sus propiedades no se pueden editar aquí: se sincronizan automáticamente con el original.';
  content.appendChild(notice);

  const originalField = document.createElement('div');
  originalField.className = 'modal__field';
  const originalLabel = document.createElement('label');
  originalLabel.textContent = 'Elemento original';
  const originalValue = document.createElement('div');
  originalValue.textContent = component.copyOf;
  originalField.appendChild(originalLabel);
  originalField.appendChild(originalValue);
  content.appendChild(originalField);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  if (onDelete) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-eliminar';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.addEventListener('click', () => {
      if (confirm(`¿Eliminar el componente "${component.id}"?`)) {
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
    overlay.remove();
  });
  footer.appendChild(acceptBtn);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) {
      overlay.remove();
    }
  });
}
