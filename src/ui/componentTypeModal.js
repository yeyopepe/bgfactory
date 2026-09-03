// Modal previa al alta de un componente: lista de tipos disponibles para
// elegir cuál crear, antes de abrir su ventana de configuración
// (ui/componentModal.js). Abierta desde el botón "+ Añadir componente".

// Iconos ilustrativos por tipo. SVG inline lineal (24×24, stroke currentColor),
// misma iconografía que ui/editModeToggle.js / ui/componentList.js. Decorativos:
// el <span> contenedor los marca aria-hidden al pintarlos.
import { t } from '../core/i18n.js';
// `label` como getter: se resuelve con t() en cada lectura, siguiendo el idioma
// activo. La clave i18n es `componentType.<value>`.
const COMPONENT_TYPES = [
  {
    value: 'texto',
    get label() { return t('componentType.texto'); },
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h16"/><path d="M4 18h9"/>
    </svg>`,
  },
  {
    value: 'tableroSimple',
    get label() { return t('componentType.tableroSimple'); },
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1.5"/>
      <path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/>
    </svg>`,
  },
  {
    value: 'tableroPersonalizado',
    get label() { return t('componentType.tableroPersonalizado'); },
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 3h11v6"/><path d="M3 9h9"/><path d="M3 15h7"/><path d="M3 3v18h9"/><path d="M9 15v6"/>
      <path d="M18.5 12.5l3 3L16 21l-3 .5.5-3z"/>
    </svg>`,
  },
  {
    value: 'dado',
    get label() { return t('componentType.dado'); },
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none"/>
      <circle cx="16" cy="8" r="1.1" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>
      <circle cx="8" cy="16" r="1.1" fill="currentColor" stroke="none"/>
      <circle cx="16" cy="16" r="1.1" fill="currentColor" stroke="none"/>
    </svg>`,
  },
  {
    value: 'documento',
    get label() { return t('componentType.documento'); },
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
      <path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/>
    </svg>`,
  },
  {
    value: 'carta',
    get label() { return t('componentType.carta'); },
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="2.5" width="12" height="19" rx="2.5"/>
      <path d="M9 7h6"/><path d="M9 11h4"/>
    </svg>`,
  },
  {
    value: 'mazo',
    get label() { return t('componentType.mazo'); },
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="8" y="6" width="11" height="15" rx="2"/>
      <path d="M5.5 17.5V5.5a2 2 0 0 1 2-2H15"/>
    </svg>`,
  },
];

export function getComponentTypeLabel(type) {
  const entry = COMPONENT_TYPES.find((e) => e.value === type);
  return entry ? entry.label : type;
}

export function openComponentTypeModal({ onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = t('componentTypeModal.title');
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  let selectedType = COMPONENT_TYPES[0].value;

  const list = document.createElement('div');
  list.className = 'component-type-modal__list';

  for (const { value, label, icon } of COMPONENT_TYPES) {
    const item = document.createElement('label');
    item.className = 'component-type-modal__item';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'component-type';
    radio.value = value;
    radio.checked = value === selectedType;
    radio.addEventListener('change', () => {
      selectedType = value;
    });

    const iconEl = document.createElement('span');
    iconEl.className = 'component-type-modal__icon';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.innerHTML = icon;

    const text = document.createElement('span');
    text.textContent = label;

    item.appendChild(radio);
    item.appendChild(iconEl);
    item.appendChild(text);
    list.appendChild(item);
  }

  content.appendChild(list);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = t('common.cancel');
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = t('common.accept');
  acceptBtn.addEventListener('click', () => {
    if (onAccept) onAccept(selectedType);
    overlay.remove();
  });
  footer.appendChild(acceptBtn);

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
