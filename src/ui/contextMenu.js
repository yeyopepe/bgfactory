// Menú contextual genérico posicionado junto al cursor, para cualquier click
// derecho de la app. Distinto de una modal: no bloquea el resto de la pantalla,
// sin overlay. Distinto de `createAddMenu` (ui/resourceList.js,
// design/docs/style/03-modales-menus.md), desplegable fijo bajo un botón: este
// se abre en cualquier punto y cierra también con ESC, no solo click fuera.

let currentMenu = null;

function closeCurrentMenu() {
  if (!currentMenu) return;
  const { el, handleOutsideClick, handleKeydown, onClose } = currentMenu;
  document.removeEventListener('mousedown', handleOutsideClick);
  document.removeEventListener('keydown', handleKeydown);
  el.remove();
  currentMenu = null;
  if (onClose) onClose();
}

function addRow(menu, { icon, label, onClick, disabled }) {
  const item = document.createElement('div');
  item.className = 'context-menu__item';
  if (disabled) item.classList.add('context-menu__item--disabled');
  if (icon) {
    const iconWrap = document.createElement('span');
    iconWrap.className = 'context-menu__item-icon';
    iconWrap.appendChild(icon);
    item.appendChild(iconWrap);
  }
  const text = document.createElement('span');
  text.className = 'context-menu__item-label';
  text.textContent = label;
  item.appendChild(text);
  if (!disabled) {
    item.addEventListener('click', () => {
      closeCurrentMenu();
      if (onClick) onClick();
    });
  }
  menu.appendChild(item);
}

// Fila con un `<select>` inline en vez de acción de click directo. Mismo
// `stopPropagation` que `ui/columnHeaderMenu.js`: interactuar con el
// desplegable no dispara el cierre por click-fuera.
function addSelectRow(menu, { label, options = [], disabled, onChange }) {
  const row = document.createElement('div');
  row.className = 'context-menu__select-row';

  const text = document.createElement('span');
  text.className = 'context-menu__select-row-label';
  text.textContent = label;
  row.appendChild(text);

  const select = document.createElement('select');
  select.disabled = Boolean(disabled) || options.length === 0;

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = options.length === 0 ? 'Sin etiquetas' : 'Elegir etiqueta…';
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  for (const option of options) {
    const optionEl = document.createElement('option');
    optionEl.value = option.value;
    optionEl.textContent = option.label;
    select.appendChild(optionEl);
  }

  select.addEventListener('click', (e) => e.stopPropagation());
  select.addEventListener('change', () => {
    if (!select.value) return;
    closeCurrentMenu();
    if (onChange) onChange(select.value);
  });

  row.appendChild(select);
  menu.appendChild(row);
}

function addDescriptionSection(menu, description) {
  const block = document.createElement('div');
  block.className = 'context-menu__description';

  const main = document.createElement('span');
  main.className = 'context-menu__description-main';
  main.textContent = description.main;
  block.appendChild(main);

  if (description.extra) {
    const extra = document.createElement('span');
    extra.className = 'context-menu__description-extra';
    extra.textContent = description.extra;
    block.appendChild(extra);
  }

  menu.appendChild(block);

  const separator = document.createElement('div');
  separator.className = 'context-menu__separator';
  menu.appendChild(separator);
}

function addInfoSection(menu, interactionItems) {
  const separator = document.createElement('div');
  separator.className = 'context-menu__separator';
  menu.appendChild(separator);

  const infoBlock = document.createElement('div');
  infoBlock.className = 'context-menu__info';

  const title = document.createElement('div');
  title.className = 'context-menu__info-title';
  title.textContent = 'Interacciones';
  infoBlock.appendChild(title);

  for (const item of interactionItems) {
    const row = document.createElement('div');
    row.className = 'context-menu__info-row';

    const label = document.createElement('span');
    label.className = 'context-menu__info-label';
    label.textContent = item.label;
    row.appendChild(label);

    const value = document.createElement('span');
    value.className = 'context-menu__info-value';
    if (item.value === 'Ninguno') {
      value.classList.add('context-menu__info-value--none');
    }
    value.textContent = item.value;
    row.appendChild(value);

    infoBlock.appendChild(row);
  }

  menu.appendChild(infoBlock);
}

// `generalItems`/`specificItems`: `{ icon: SVGElement, label: string, onClick: () => void, disabled?: boolean }[]`,
// o, para una fila con `<select>` inline en vez de acción de click directo:
// `{ label: string, select: { options: { value: string, label: string }[], disabled?: boolean, onChange: (value: string) => void } }`.
// `disabled`: item atenuado y sin acción (no registra listener de click).
// El separador entre ambas secciones solo se dibuja si `specificItems` no está vacío.
// `interactionItems`: `{ label: string, value: string }[]` — sección de solo lectura al final del menú.
// `description`: `{ main: string, extra?: string }` — línea de solo lectura al principio del menú,
// separada del resto por un separador que se dibuja siempre que se pase `description`.
export function openContextMenu({ x, y, generalItems = [], specificItems = [], interactionItems = [], description, onClose } = {}) {
  closeCurrentMenu();

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  if (description) addDescriptionSection(menu, description);

  for (const item of generalItems) {
    if (item.select) addSelectRow(menu, { label: item.label, ...item.select });
    else addRow(menu, item);
  }

  if (specificItems.length > 0) {
    const separator = document.createElement('div');
    separator.className = 'context-menu__separator';
    menu.appendChild(separator);
    for (const item of specificItems) {
      if (item.select) addSelectRow(menu, { label: item.label, ...item.select });
      else addRow(menu, item);
    }
  }

  if (interactionItems.length > 0) {
    addInfoSection(menu, interactionItems);
  }

  document.body.appendChild(menu);

  const rect = menu.getBoundingClientRect();
  const maxLeft = window.innerWidth - rect.width;
  const maxTop = window.innerHeight - rect.height;
  menu.style.left = `${Math.max(0, Math.min(x, maxLeft))}px`;
  menu.style.top = `${Math.max(0, Math.min(y, maxTop))}px`;

  function handleOutsideClick(e) {
    if (!menu.contains(e.target)) closeCurrentMenu();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') closeCurrentMenu();
  }

  document.addEventListener('mousedown', handleOutsideClick);
  document.addEventListener('keydown', handleKeydown);

  currentMenu = { el: menu, handleOutsideClick, handleKeydown, onClose };
}
