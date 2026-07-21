// Modal previa al alta de un componente: lista de tipos disponibles para
// elegir cuál crear, antes de abrir su ventana de configuración
// (ui/componentModal.js). Abierta desde el botón "+ Añadir componente".

const COMPONENT_TYPES = [
  { value: 'texto', label: 'Cuadro de texto' },
  { value: 'tablero', label: 'Tablero' },
  { value: 'dado', label: 'Dado' },
  { value: 'documento', label: 'Visor de documentos' },
  { value: 'ficha', label: 'Ficha' },
];

export function openComponentTypeModal({ onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Añadir componente';
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

  for (const { value, label } of COMPONENT_TYPES) {
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

    const text = document.createElement('span');
    text.textContent = label;

    item.appendChild(radio);
    item.appendChild(text);
    list.appendChild(item);
  }

  content.appendChild(list);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';
  acceptBtn.addEventListener('click', () => {
    if (onAccept) onAccept(selectedType);
    overlay.remove();
  });
  footer.appendChild(acceptBtn);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
