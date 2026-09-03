// Modal "Copias vinculadas": lista de solo lectura de todos los ids de copias
// vinculadas a un componente Original. Misma estructura que mazoContentModal.js
// pero simplificada (sin miniaturas, sin botones de acción).

import { getComponents } from '../core/state.js';
import { formatComponentIdentifier } from './componentRenderer.js';
import { t } from '../core/i18n.js';

export function openComponentCopiesModal({ originalId }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = t('componentCopies.title');
  modal.appendChild(header);

  const hint = document.createElement('p');
  hint.className = 'modal__hint';
  modal.appendChild(hint);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const original = getComponents().find((c) => c.id === originalId);
  if (!original) return;

  const copies = getComponents().filter((c) => c.copyOf === originalId);
  hint.textContent = t('componentCopies.hint', { id: formatComponentIdentifier(original), count: copies.length });

  const table = document.createElement('table');
  table.className = 'component-copies-modal__table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  const idHeader = document.createElement('th');
  idHeader.textContent = t('componentCopies.idHeader');
  headerRow.appendChild(idHeader);

  const syncHeader = document.createElement('th');
  syncHeader.textContent = t('componentCopies.syncHeader');
  headerRow.appendChild(syncHeader);

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const copy of copies) {
    const row = document.createElement('tr');

    const idCell = document.createElement('td');
    const idSpan = document.createElement('span');
    idSpan.className = 'component-copies-modal__id';
    idSpan.textContent = copy.id;
    idCell.appendChild(idSpan);
    row.appendChild(idCell);

    const syncCell = document.createElement('td');
    const syncSpan = document.createElement('span');
    const isSynced = copy.sincronizado !== false;
    const syncClass = isSynced ? 'component-copies-modal__sync--yes' : 'component-copies-modal__sync--no';
    syncSpan.className = `component-copies-modal__sync ${syncClass}`;

    const dot = document.createElement('span');
    dot.className = 'component-copies-modal__sync-dot';
    syncSpan.appendChild(dot);

    const text = document.createElement('span');
    text.textContent = isSynced ? t('common.yes') : t('common.no');
    syncSpan.appendChild(text);

    syncCell.appendChild(syncSpan);
    row.appendChild(syncCell);

    tbody.appendChild(row);
  }
  table.appendChild(tbody);

  content.appendChild(table);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-cancel';
  closeBtn.textContent = t('common.close');
  closeBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(closeBtn);

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
