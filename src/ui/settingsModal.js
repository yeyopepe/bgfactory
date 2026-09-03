// Panel de configuración: modal con el patrón estándar de la app. Contiene el
// selector de idioma y la versión actual (solo lectura). Se re-renderiza en vivo
// al cambiar el idioma, sin cerrarse.

import { on } from '../core/eventBus.js';
import { getLanguage, setLanguage, SUPPORTED_LANGUAGES, t } from '../core/i18n.js';
import { getFullAppTitle } from '../core/appTitle.js';
import { getAppTitle } from '../core/state.js';

// Etiqueta de cada idioma, escrita en su propio idioma (literal fijo, no traducible).
const LANGUAGE_LABELS = { es: 'Español', en: 'English' };

export function openSettingsModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';
  overlay.appendChild(modal);

  function renderContent() {
    modal.textContent = '';

    const header = document.createElement('div');
    header.className = 'modal__header';
    header.textContent = t('settings.title');
    modal.appendChild(header);

    const content = document.createElement('div');
    content.className = 'modal__content';
    modal.appendChild(content);

    // --- Bloque idioma ---
    const langField = document.createElement('div');
    langField.className = 'modal__field';

    const langLabel = document.createElement('label');
    langLabel.textContent = t('settings.language.label');
    langField.appendChild(langLabel);

    const select = document.createElement('select');
    for (const code of SUPPORTED_LANGUAGES) {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = LANGUAGE_LABELS[code] || code;
      if (code === getLanguage()) option.selected = true;
      select.appendChild(option);
    }
    select.addEventListener('change', () => setLanguage(select.value));
    langField.appendChild(select);

    content.appendChild(langField);

    const separator = document.createElement('hr');
    separator.className = 'modal__separator';
    content.appendChild(separator);

    // --- Bloque versión (solo lectura) ---
    const versionField = document.createElement('div');
    versionField.className = 'modal__field';

    const versionLabel = document.createElement('label');
    versionLabel.textContent = t('settings.version.label');
    versionField.appendChild(versionLabel);

    const versionValue = document.createElement('div');
    versionValue.className = 'settings-modal__version';
    versionValue.textContent = getFullAppTitle(getAppTitle());
    versionField.appendChild(versionValue);

    content.appendChild(versionField);

    // TODO 00231: sección de changelog aquí.

    const footer = document.createElement('div');
    footer.className = 'modal__footer';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-cancel';
    closeBtn.textContent = t('common.close');
    closeBtn.addEventListener('click', close);
    footer.appendChild(closeBtn);
    modal.appendChild(footer);
  }

  const offLanguageChanged = on('language:changed', renderContent);

  function close() {
    offLanguageChanged();
    overlay.remove();
  }

  renderContent();

  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) close();
  });

  document.body.appendChild(overlay);
}
