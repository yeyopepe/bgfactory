// Modal previa al alta de un componente: lista de tipos disponibles para
// elegir cuál crear, antes de abrir su ventana de configuración
// (ui/componentModal.js). Abierta desde el botón "+ Añadir componente".

// Iconos ilustrativos por tipo. SVG inline lineal (24×24, stroke currentColor),
// misma iconografía que ui/editModeToggle.js / ui/componentList.js. Decorativos:
// el <span> contenedor los marca aria-hidden al pintarlos.
import { t } from '../core/i18n.js';
import { iconSvg, ICON_SIZE } from './icons.js';
// `label` como getter: se resuelve con t() en cada lectura, siguiendo el idioma
// activo. La clave i18n es `componentType.<value>`.
const COMPONENT_TYPES = [
  {
    value: 'texto',
    get label() { return t('componentType.texto'); },
    icon: iconSvg('type-texto', { size: ICON_SIZE.toolbar }),
  },
  {
    value: 'tableroSimple',
    get label() { return t('componentType.tableroSimple'); },
    icon: iconSvg('type-tablero-simple', { size: ICON_SIZE.toolbar }),
  },
  {
    value: 'tableroPersonalizado',
    get label() { return t('componentType.tableroPersonalizado'); },
    icon: iconSvg('type-tablero-personalizado', { size: ICON_SIZE.toolbar }),
  },
  {
    value: 'dado',
    get label() { return t('componentType.dado'); },
    icon: iconSvg('type-dado', { size: ICON_SIZE.toolbar }),
  },
  {
    value: 'documento',
    get label() { return t('componentType.documento'); },
    icon: iconSvg('type-documento', { size: ICON_SIZE.toolbar }),
  },
  {
    value: 'carta',
    get label() { return t('componentType.carta'); },
    icon: iconSvg('type-carta', { size: ICON_SIZE.toolbar }),
  },
  {
    value: 'mazo',
    get label() { return t('componentType.mazo'); },
    icon: iconSvg('type-mazo', { size: ICON_SIZE.toolbar }),
  },
];

export function getComponentTypeLabel(type) {
  const entry = COMPONENT_TYPES.find((e) => e.value === type);
  return entry ? entry.label : type;
}

export function openComponentTypeModal({ onAccept, onPresetSelected }) {
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

  const sectionLabel = document.createElement('div');
  sectionLabel.className = 'component-type-modal__section-label';
  sectionLabel.textContent = t('componentTypeModal.componentsLabel');
  content.appendChild(sectionLabel);

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

  const setSeparator = document.createElement('div');
  setSeparator.className = 'component-type-modal__set-separator';
  const separatorLineLeft = document.createElement('span');
  separatorLineLeft.className = 'component-type-modal__set-separator-line';
  const separatorText = document.createElement('span');
  separatorText.className = 'component-type-modal__set-separator-text';
  separatorText.textContent = t('componentTypeModal.presetsSeparator');
  const separatorLineRight = document.createElement('span');
  separatorLineRight.className = 'component-type-modal__set-separator-line';
  setSeparator.appendChild(separatorLineLeft);
  setSeparator.appendChild(separatorText);
  setSeparator.appendChild(separatorLineRight);
  content.appendChild(setSeparator);

  const presetItem = document.createElement('div');
  presetItem.className = 'component-type-modal__preset-item';
  presetItem.setAttribute('role', 'button');
  presetItem.setAttribute('tabindex', '0');

  const presetIcon = document.createElement('span');
  presetIcon.className = 'component-type-modal__preset-icon';
  presetIcon.setAttribute('aria-hidden', 'true');
  presetIcon.innerHTML = iconSvg('preset-french-deck', { size: ICON_SIZE.toolbar });
  presetItem.appendChild(presetIcon);

  const presetBody = document.createElement('div');
  presetBody.className = 'component-type-modal__preset-body';

  const presetTitle = document.createElement('div');
  presetTitle.className = 'component-type-modal__preset-title';
  presetTitle.textContent = t('componentTypeModal.preset.frenchDeck');
  presetBody.appendChild(presetTitle);

  const presetTags = document.createElement('div');
  presetTags.className = 'component-type-modal__preset-tags';
  for (const tagKey of ['componentTypeModal.preset.frenchDeck.tag1', 'componentTypeModal.preset.frenchDeck.tag2']) {
    const tag = document.createElement('span');
    tag.className = 'component-type-modal__preset-tag';
    tag.textContent = t(tagKey);
    presetTags.appendChild(tag);
  }
  presetBody.appendChild(presetTags);

  presetItem.appendChild(presetBody);

  const presetGo = document.createElement('span');
  presetGo.className = 'component-type-modal__preset-go';
  presetGo.setAttribute('aria-hidden', 'true');
  presetGo.textContent = '›';
  presetItem.appendChild(presetGo);

  const selectPreset = () => {
    // 00275: ya no cierra el overlay al pulsarse — el modal de tipo sigue
    // visible mientras se decide en la ventana de confirmación del preset;
    // solo se cierra si el usuario confirma (ver editMode.js#openAddModal).
    if (onPresetSelected) onPresetSelected('frenchDeck54');
  };
  presetItem.addEventListener('click', selectPreset);
  presetItem.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectPreset();
    }
  });

  content.appendChild(presetItem);

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

  // 00275: expuesto para que quien orqueste un preset pueda cerrar este modal
  // de tipo tras confirmar en la ventana de confirmación del preset.
  return { close: () => overlay.remove() };
}
