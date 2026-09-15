// Título de cabecera: texto libre editable en modo edición + versión, esta
// última siempre no editable.

import { MODES, getState, getAppTitle, setAppTitle } from '../core/state.js';
import { getFullAppTitle, formatVersion } from '../core/appTitle.js';
import { iconSvg, ICON_SIZE } from './icons.js';
import { t } from '../core/i18n.js';
import { createImportControls, createExportMenu } from './editModeToggle.js';

// Estado transitorio, mismo patrón que `selectedComponentId` en `playMode.js`: no persiste, se pierde al recargar sin problema.
let editing = false;

function renderHoverable(container, appTitle, h1) {
  container.classList.add('app-title--hoverable');
  container.textContent = appTitle;

  const pencil = document.createElement('span');
  pencil.className = 'app-title__pencil';
  pencil.setAttribute('aria-hidden', 'true');
  pencil.innerHTML = iconSvg('edit-title', { size: ICON_SIZE.menu });
  container.appendChild(pencil);

  h1.onclick = () => {
    editing = true;
    renderAppTitle(h1);
  };
}

function renderEditing(container, appTitle) {
  container.classList.add('app-title--editing');

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

// Indicador de modo edición: texto fijo debajo del título, visible solo en
// modo edición (en ambos sub-estados, lápiz y edición). No es interactivo.
function renderModeIndicator(container) {
  const indicator = document.createElement('span');
  indicator.className = 'app-title__mode-indicator';
  indicator.textContent = t('toolbar.modeEdit');
  container.appendChild(indicator);
}

// Fila de controles de fichero (Importar/Exportar), integrada dentro de h1
// para que solo exista una trama de fondo en la cabecera de modo edición (00290:
// antes vivían en un elemento hermano, .edit-toolbar, y ninguna combinación de
// color/trama/sombra lograba que las dos franjas se vieran como una sola).
// `stopPropagation` en el click evita que, al pulsar estos botones, el evento
// burbujee hasta `h1.onclick` (asignado por renderHoverable) y abra sin querer
// la edición en línea del título.
function renderControls(container) {
  const controls = document.createElement('div');
  controls.className = 'app-title__controls';
  controls.addEventListener('click', (event) => event.stopPropagation());
  controls.appendChild(createImportControls());
  controls.appendChild(createExportMenu());
  container.appendChild(controls);
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

  // Modo edición: título + indicador apilados en columna (`.app-title__block`),
  // con la fila del título (`.app-title__row`) llevando el aspecto lápiz/edición
  // que ya montaban `renderHoverable`/`renderEditing` directamente sobre `h1`.
  h1.classList.add('app-title-bar--edit');

  const block = document.createElement('div');
  block.className = 'app-title__block';

  const row = document.createElement('div');
  row.className = 'app-title__row';
  block.appendChild(row);

  // `block`/`row` deben quedar insertados en `h1` (y por tanto en el documento)
  // ANTES de llamar a renderEditing, que hace `input.focus()`: un elemento
  // desconectado del documento nunca llega a ser `document.activeElement`, y
  // el posterior `input.blur()` (Enter/pérdida de foco) no dispararía `confirm`.
  renderModeIndicator(block);
  renderControls(block);
  h1.appendChild(block);

  if (editing) {
    renderEditing(row, appTitle);
  } else {
    renderHoverable(row, getFullAppTitle(appTitle), h1);
  }
}
