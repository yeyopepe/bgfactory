// Título de cabecera: texto libre editable en modo edición + versión, esta
// última siempre no editable.

import { MODES, getState, getAppTitle, setAppTitle } from '../core/state.js';
import { getFullAppTitle, formatVersion } from '../core/appTitle.js';

// Estado transitorio, mismo patrón que `selectedComponentId` en `playMode.js`: no persiste, se pierde al recargar sin problema.
let editing = false;

function renderHoverable(container, appTitle) {
  container.className = 'app-title--hoverable';
  container.textContent = appTitle;

  const pencil = document.createElement('span');
  pencil.className = 'app-title__pencil';
  pencil.setAttribute('aria-hidden', 'true');
  pencil.innerHTML = `
    <svg class="icon-frame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 20h9" stroke-linecap="round"/>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  container.appendChild(pencil);

  container.onclick = () => {
    editing = true;
    renderAppTitle(container);
  };
}

function renderEditing(container, appTitle) {
  container.className = 'app-title--editing';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'app-title__input';
  input.value = appTitle;
  container.appendChild(input);

  const versionEl = document.createElement('span');
  versionEl.className = 'app-title__version';
  versionEl.textContent = formatVersion();
  container.appendChild(versionEl);

  const confirm = () => {
    const trimmed = input.value.trim();
    editing = false;
    if (trimmed) {
      // `setAppTitle` emite `appTitle:changed` síncrono: ya repinta este `h1` desde `main.js` con `editing` en `false`. No hace falta `renderAppTitle` aquí.
      setAppTitle(trimmed);
    } else {
      renderAppTitle(container);
    }
  };

  input.addEventListener('blur', confirm);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') input.blur();
  });

  input.focus();
  input.select();
}

export function renderAppTitle(h1) {
  h1.innerHTML = '';
  h1.className = '';
  // `h1` es nodo fijo de `index.html`, nunca recreado (solo se vacía). `onclick` debe reasignarse en cada render o queda activo un handler obsoleto.
  h1.onclick = null;

  const appTitle = getAppTitle();
  document.title = getFullAppTitle(appTitle);

  if (getState().mode !== MODES.EDIT) {
    h1.textContent = getFullAppTitle(appTitle);
    return;
  }

  if (editing) {
    renderEditing(h1, appTitle);
  } else {
    renderHoverable(h1, getFullAppTitle(appTitle));
  }
}
