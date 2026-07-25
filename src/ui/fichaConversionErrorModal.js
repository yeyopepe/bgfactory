// Modal para errores en la conversión de fichas a cartas durante importación (cambio 00087):
// cabecera de error + tabla con errores + dos acciones (Abortar/Continuar).

export function openFichaConversionErrorModal({ errors, onAbort, onContinue }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal ficha-conversion-error-modal';

  const header = document.createElement('div');
  header.className = 'modal__header modal__header--error';
  const icon = document.createElement('span');
  icon.className = 'modal__error-icon';
  icon.textContent = '!';
  header.appendChild(icon);
  const heading = document.createElement('h2');
  heading.className = 'modal__header-title';
  heading.textContent = 'Errores al convertir fichas';
  header.appendChild(heading);
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';

  const message = document.createElement('p');
  message.textContent = 'No se pudieron convertir las siguientes fichas a cartas. Puedes abortar la importación o continuar sin ellas.';
  content.appendChild(message);

  const table = document.createElement('table');
  table.className = 'import-report-modal__table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const label of ['Ficha afectada', 'Error']) {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const { id, motivo } of errors) {
    const tr = document.createElement('tr');
    const idCell = document.createElement('td');
    idCell.textContent = id;
    const errorCell = document.createElement('td');
    errorCell.textContent = motivo;
    tr.appendChild(idCell);
    tr.appendChild(errorCell);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  content.appendChild(table);

  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';

  const abortBtn = document.createElement('button');
  abortBtn.className = 'btn-cancel';
  abortBtn.textContent = 'Abortar importación';
  abortBtn.addEventListener('click', () => {
    if (onAbort) onAbort();
    overlay.remove();
  });
  footer.appendChild(abortBtn);

  const continueBtn = document.createElement('button');
  continueBtn.className = 'btn-accept';
  continueBtn.textContent = 'Continuar sin esas fichas';
  continueBtn.addEventListener('click', () => {
    if (onContinue) onContinue();
    overlay.remove();
  });
  footer.appendChild(continueBtn);

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
