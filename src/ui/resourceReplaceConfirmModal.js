// Modal de confirmación al añadir uno o varios recursos cuyo nombre ya existe
// en la galería (fix 00166) — mismo patrón de callbacks onAccept/onCancel que
// ui/importConfirmModal.js. Cubre tanto un único duplicado (subida de un
// fichero) como varios a la vez (subida múltiple o de carpeta).

export function openResourceReplaceConfirmModal({ names, onAccept, onCancel }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = names.length === 1 ? 'Recurso duplicado' : 'Recursos duplicados';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';

  if (names.length === 1) {
    const message = document.createElement('p');
    message.textContent = `Ya existe un recurso llamado "${names[0]}". Si continúas, se reemplazará su contenido. Los componentes que ya lo usan pasarán a mostrar el recurso nuevo.`;
    content.appendChild(message);
  } else {
    const intro = document.createElement('p');
    intro.textContent = `${names.length} de los ficheros seleccionados coinciden con recursos ya existentes en la galería:`;
    content.appendChild(intro);

    const list = document.createElement('ul');
    list.className = 'resource-replace-confirm-modal__list';
    for (const name of names) {
      const item = document.createElement('li');
      item.textContent = name;
      list.appendChild(item);
    }
    content.appendChild(list);

    const outro = document.createElement('p');
    outro.textContent = 'Si continúas, se reemplazará su contenido. El resto de ficheros sin conflicto se añadirán con normalidad.';
    content.appendChild(outro);
  }

  modal.appendChild(content);

  function close() {
    overlay.remove();
  }

  const footer = document.createElement('div');
  footer.className = 'modal__footer';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => {
    close();
    if (onCancel) onCancel();
  });
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Reemplazar';
  acceptBtn.addEventListener('click', () => {
    close();
    if (onAccept) onAccept();
  });
  footer.appendChild(acceptBtn);

  modal.appendChild(footer);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) {
      close();
      if (onCancel) onCancel();
    }
  });
}
