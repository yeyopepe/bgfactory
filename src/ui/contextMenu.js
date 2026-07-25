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

// `generalItems`/`specificItems`: `{ icon: SVGElement, label: string, onClick: () => void }[]`.
// El separador entre ambas secciones solo se dibuja si `specificItems` no está vacío.
export function openContextMenu({ x, y, generalItems = [], specificItems = [], onClose } = {}) {
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
