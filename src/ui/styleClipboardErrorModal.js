// Modal de error al pegar estilo (change 00085): alguna referencia del
// estilo copiado (mazo, imagen, tipografía) ya no existe en el proyecto, así
// que no se aplica ningún cambio a la carta destino. Mismo patrón que
// ui/importConversionErrorModal.js — cabecera de error de ui/errorModal.js
// combinada con la tabla de ui/importReportModal.js, reutilizando tal cual
// (sin CSS propio) las clases `.import-report-modal`/`.import-report-modal__table`.

export function openStyleClipboardPasteErrorModal(incidencias) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal import-report-modal';

  const header = document.createElement('div');
  header.className = 'modal__header modal__header--error';
  const icon = document.createElement('span');
  icon.className = 'modal__error-icon';
  icon.textContent = '!';
  header.appendChild(icon);
  const heading = document.createElement('h2');
  heading.className = 'modal__header-title';
  heading.textContent = 'No se pudo pegar el estilo';
  header.appendChild(heading);
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';

  const message = document.createElement('p');
  message.textContent = 'El estilo copiado hace referencia a elementos que ya no existen en el proyecto. No se ha modificado nada de esta carta.';
  content.appendChild(message);

  const table = document.createElement('table');
  table.className = 'import-report-modal__table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const label of ['Elemento', 'Referencia', 'Detalle']) {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const row of incidencias) {
    const tr = document.createElement('tr');
    const elementoCell = document.createElement('td');
    elementoCell.textContent = row.elemento;
    const referenciaCell = document.createElement('td');
    referenciaCell.textContent = row.referencia;
    const detalleCell = document.createElement('td');
    detalleCell.className = 'error-cell';
    detalleCell.textContent = row.detalle;
    tr.appendChild(elementoCell);
    tr.appendChild(referenciaCell);
    tr.appendChild(detalleCell);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  content.appendChild(table);
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-cancel';
  closeBtn.textContent = 'Cerrar';
  closeBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(closeBtn);
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
