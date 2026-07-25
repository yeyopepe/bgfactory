// Aviso de errores al convertir fichas durante una importación explícita
// (cambio 00087): a diferencia de ui/importReportModal.js (informativo,
// posterior a aplicar la importación), esta modal se muestra ANTES de tocar
// la partida actual y ofrece dos acciones con consecuencias distintas —
// mismo patrón de "confirmación con consecuencias" que
// ui/deckDeleteConfirmModal.js, con la cabecera de error de ui/errorModal.js
// y la tabla/ancho de ui/importReportModal.js (clase `import-report-modal`
// reutilizada tal cual, sin CSS nuevo).

export function openImportConversionErrorModal({ errors, onContinue, onAbort }) {
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
  heading.textContent = 'Errores al convertir fichas';
  header.appendChild(heading);
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';

  const message = document.createElement('p');
  message.textContent = 'Se han detectado errores al convertir las siguientes fichas a Carta/Ficha. Puedes continuar la importación sin ellas, o abortarla por completo.';
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
  for (const row of errors) {
    const tr = document.createElement('tr');
    const componentCell = document.createElement('td');
    componentCell.textContent = row.componentId;
    const errorCell = document.createElement('td');
    errorCell.className = 'error-cell';
    errorCell.textContent = row.errors.join('; ');
    tr.appendChild(componentCell);
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
    overlay.remove();
    onAbort();
  });
  footer.appendChild(abortBtn);

  const continueBtn = document.createElement('button');
  continueBtn.className = 'btn-accept';
  continueBtn.textContent = 'Continuar sin esas fichas';
  continueBtn.addEventListener('click', () => {
    overlay.remove();
    onContinue();
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
    if (e.target === overlay && mousedownOnOverlay) {
      overlay.remove();
      onAbort();
    }
  });
}
