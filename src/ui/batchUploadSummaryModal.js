// Modal resumen tras subida en lote (varios ficheros o carpeta): recursos añadidos y, si hay,
// detalle de omitidos por formato no soportado (tabla, mismo patrón que ui/importReportModal.js)
// y/o por subcarpeta (recuento agregado, sin listar ficheros). Mismo esqueleto modal-overlay/modal
// que ui/errorModal.js, variante de cabecera de éxito.

export function openBatchUploadSummaryModal({ added, skippedFormat = [], skippedSubfolderCount = 0 }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header modal__header--success';
  const icon = document.createElement('span');
  icon.className = 'modal__success-icon';
  icon.textContent = '✓';
  header.appendChild(icon);
  const heading = document.createElement('h2');
  heading.className = 'modal__header-title';
  heading.textContent = 'Recursos añadidos';
  header.appendChild(heading);
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';

  const addedLine = document.createElement('p');
  addedLine.innerHTML = `<strong>${added}</strong> recursos añadidos correctamente`;
  content.appendChild(addedLine);

  if (skippedFormat.length > 0) {
    const skippedLine = document.createElement('p');
    skippedLine.innerHTML = `<strong>${skippedFormat.length}</strong> omitidos por formato no soportado`;
    content.appendChild(skippedLine);

    const table = document.createElement('table');
    table.className = 'batch-upload-summary-modal__table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const label of ['Fichero', 'Motivo']) {
      const th = document.createElement('th');
      th.textContent = label;
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const { name } of skippedFormat) {
      const tr = document.createElement('tr');
      const nameCell = document.createElement('td');
      nameCell.textContent = name;
      const reasonCell = document.createElement('td');
      reasonCell.textContent = 'Formato no soportado';
      tr.appendChild(nameCell);
      tr.appendChild(reasonCell);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    content.appendChild(table);
  }

  if (skippedSubfolderCount > 0) {
    const subfolderLine = document.createElement('p');
    subfolderLine.innerHTML = `<strong>${skippedSubfolderCount}</strong> omitidos por estar dentro de una subcarpeta`;
    content.appendChild(subfolderLine);
  }

  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';
  acceptBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(acceptBtn);
  modal.appendChild(footer);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) overlay.remove();
  });
}
