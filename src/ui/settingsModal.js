// Panel de configuración: modal con el patrón estándar de la app. Contiene el
// selector de idioma y la versión actual (solo lectura). Se re-renderiza en vivo
// al cambiar el idioma, sin cerrarse.

import { on } from '../core/eventBus.js';
import { getLanguage, setLanguage, SUPPORTED_LANGUAGES, t } from '../core/i18n.js';
import { getVersionedProductName } from '../core/appTitle.js';
import { getTableText, setTableText } from '../core/state.js';

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

    // --- Bloque texto de la mesa ---
    const tableTextField = document.createElement('div');
    tableTextField.className = 'modal__field';

    const tableTextLabel = document.createElement('label');
    tableTextLabel.textContent = t('settings.tableText.label');
    tableTextLabel.htmlFor = 'settings-table-text';
    tableTextField.appendChild(tableTextLabel);

    const tableTextInput = document.createElement('textarea');
    tableTextInput.id = 'settings-table-text';
    tableTextInput.rows = 3;
    tableTextInput.maxLength = 500;
    tableTextInput.value = getTableText();
    tableTextInput.addEventListener('input', () => setTableText(tableTextInput.value));
    tableTextField.appendChild(tableTextInput);

    const tableTextHint = document.createElement('p');
    tableTextHint.className = 'modal__hint';
    tableTextHint.textContent = t('settings.tableText.hint');
    tableTextField.appendChild(tableTextHint);

    content.appendChild(tableTextField);

    const separator2 = document.createElement('hr');
    separator2.className = 'modal__separator';
    content.appendChild(separator2);

    // --- Bloque versión (solo lectura) ---
    const versionField = document.createElement('div');
    versionField.className = 'modal__field';

    const versionLabel = document.createElement('label');
    versionLabel.textContent = t('settings.version.label');
    versionField.appendChild(versionLabel);

    // Siempre "BG Factory" + versión, con independencia del título que el
    // usuario haya dado a su juego.
    const versionValue = document.createElement('div');
    versionValue.className = 'settings-modal__version';
    versionValue.textContent = getVersionedProductName();
    versionField.appendChild(versionValue);

    // Mismo enlace al repositorio que aparece en la esquina de la mesa
    // (main.js, renderAppVersion): createElement + propiedades, nunca innerHTML.
    const repoLine = document.createElement('div');
    repoLine.className = 'settings-modal__repo';
    const repoLink = document.createElement('a');
    repoLink.href = 'https://github.com/yeyopepe/bgfactory';
    repoLink.target = '_blank';
    repoLink.rel = 'noopener';
    repoLink.textContent = t('appVersion.repoLink');
    repoLine.appendChild(repoLink);
    versionField.appendChild(repoLine);

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
