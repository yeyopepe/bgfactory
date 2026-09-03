// Modal de informe final de una importación: tabla con una fila por cada
// referencia rota resuelta automáticamente (recurso no incluido en la
// selección/fichero, o etiqueta ausente autocreada). Mismo patrón modal-overlay/
// modal que el resto, con tabla en vez de campos de formulario.

import { t } from '../core/i18n.js';
const ERROR_LABEL_KEY = {
  recurso: 'importReport.errorType.recurso',
  etiqueta: 'importReport.errorType.etiqueta',
  etiquetaDuplicada: 'importReport.errorType.etiquetaDuplicada',
};

export function openImportReportModal(report) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal import-report-modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = t('import.report.title');
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const table = document.createElement('table');
  table.className = 'import-report-modal__table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const label of [t('importReport.col.component'), t('importReport.col.error'), t('importReport.col.solution'), t('importReport.col.element')]) {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const row of report) {
    const tr = document.createElement('tr');
    const componentCell = document.createElement('td');
    componentCell.textContent = row.componentId;
    const errorCell = document.createElement('td');
    errorCell.textContent = ERROR_LABEL_KEY[row.tipoError] ? t(ERROR_LABEL_KEY[row.tipoError]) : row.tipoError;
    const solutionCell = document.createElement('td');
    solutionCell.textContent = row.solucion;
    const elementCell = document.createElement('td');
    elementCell.textContent = row.elemento;
    tr.appendChild(componentCell);
    tr.appendChild(errorCell);
    tr.appendChild(solutionCell);
    tr.appendChild(elementCell);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  content.appendChild(table);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-cancel';
  closeBtn.textContent = t('common.close');
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
