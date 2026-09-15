// Ventana de confirmación previa a crear un conjunto pre-definido de
// componentes (00275). Genérica para cualquier preset (hoy solo la baraja
// francesa): recibe un resumen ya calculado por el propio preset y dos
// identificadores editables con valor por defecto. Mismo patrón que
// ui/bulkDeleteConfirmModal.js (.modal-overlay/.modal, header, .modal__content,
// footer .btn-cancel/.btn-accept).

import { t } from '../core/i18n.js';
import { iconSvg, ICON_SIZE } from './icons.js';

export function openPresetConfirmModal({ summary, onAccept, onCancel }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = t('presetConfirmModal.title', { name: summary.title });
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';

  const summaryLabel = document.createElement('p');
  summaryLabel.textContent = t('presetConfirmModal.summaryLabel');
  content.appendChild(summaryLabel);

  const summaryList = document.createElement('ul');
  summaryList.className = 'preset-confirm-modal__summary';
  for (const row of summary.counts) {
    const item = document.createElement('li');
    item.className = 'preset-confirm-modal__summary-item';

    const icon = document.createElement('span');
    icon.className = 'preset-confirm-modal__summary-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = iconSvg(row.icon, { size: ICON_SIZE.menu });
    item.appendChild(icon);

    const text = document.createElement('span');
    const countText = String(row.count);
    const rest = row.label.startsWith(countText) ? row.label.slice(countText.length) : ` ${row.label}`;
    const count = document.createElement('span');
    count.className = 'preset-confirm-modal__summary-count';
    count.textContent = countText;
    text.appendChild(count);
    text.appendChild(document.createTextNode(rest));
    item.appendChild(text);

    summaryList.appendChild(item);
  }
  content.appendChild(summaryList);

  const idsHint = document.createElement('p');
  idsHint.className = 'preset-confirm-modal__ids-hint';
  idsHint.textContent = t('presetConfirmModal.idsHint');
  content.appendChild(idsHint);

  const idsSection = document.createElement('fieldset');
  idsSection.className = 'modal__section';

  const deckIdField = document.createElement('div');
  deckIdField.className = 'modal__field';
  const deckIdLabel = document.createElement('label');
  deckIdLabel.setAttribute('for', 'preset-confirm-deck-id');
  deckIdLabel.textContent = t('presetConfirmModal.deckIdLabel');
  const deckIdInput = document.createElement('input');
  deckIdInput.type = 'text';
  deckIdInput.id = 'preset-confirm-deck-id';
  deckIdInput.value = summary.defaultDeckId;
  deckIdField.appendChild(deckIdLabel);
  deckIdField.appendChild(deckIdInput);
  idsSection.appendChild(deckIdField);

  const cardPrefixField = document.createElement('div');
  cardPrefixField.className = 'modal__field';
  const cardPrefixLabel = document.createElement('label');
  cardPrefixLabel.setAttribute('for', 'preset-confirm-card-prefix');
  cardPrefixLabel.textContent = t('presetConfirmModal.cardPrefixLabel');
  const cardPrefixInput = document.createElement('input');
  cardPrefixInput.type = 'text';
  cardPrefixInput.id = 'preset-confirm-card-prefix';
  cardPrefixInput.value = summary.defaultCardPrefix;
  cardPrefixField.appendChild(cardPrefixLabel);
  cardPrefixField.appendChild(cardPrefixInput);
  idsSection.appendChild(cardPrefixField);

  content.appendChild(idsSection);
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = t('common.cancel');
  cancelBtn.addEventListener('click', () => {
    if (onCancel) onCancel();
    overlay.remove();
  });
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = t('common.accept');
  acceptBtn.addEventListener('click', () => {
    const deckId = deckIdInput.value.trim() || summary.defaultDeckId;
    const cardPrefix = cardPrefixInput.value.trim() || summary.defaultCardPrefix;
    overlay.remove();
    if (onAccept) onAccept({ deckId, cardPrefix });
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
    if (e.target === overlay && mousedownOnOverlay) overlay.remove();
  });
}
