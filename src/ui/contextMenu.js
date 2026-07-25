// Menú contextual genérico posicionado junto al cursor (cambio 00088), reutilizable
// para cualquier menú de click derecho de la app. Distinto de una modal: no bloquea
// el resto de la pantalla, no tiene overlay. Distinto de `createAddMenu`
// (ui/resourceList.js, sección 12.7 de STYLE_BIBLE.md), que es un desplegable fijo
// bajo un botón: este se abre en cualquier punto de la pantalla y se cierra también
// con ESC, no solo con click fuera.

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

function addRow(menu, { icon, label, onClick }) {
  const item = document.createElement('div');
  item.className = 'context-menu__item';
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
  item.addEventListener('click', () => {
    closeCurrentMenu();
    if (onClick) onClick();
  });
  menu.appendChild(item);
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

// `generalItems`/`specificItems`: `{ icon: SVGElement, label: string, onClick: () => void }[]`.
// El separador entre ambas secciones solo se dibuja si `specificItems` no está vacío.
// `interactionItems`: `{ label: string, value: string }[]` — sección de solo lectura al final del menú.
export function openContextMenu({ x, y, generalItems = [], specificItems = [], interactionItems = [], onClose } = {}) {
  closeCurrentMenu();

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  for (const item of generalItems) addRow(menu, item);

  if (specificItems.length > 0) {
    const separator = document.createElement('div');
    separator.className = 'context-menu__separator';
    menu.appendChild(separator);
    for (const item of specificItems) addRow(menu, item);
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
