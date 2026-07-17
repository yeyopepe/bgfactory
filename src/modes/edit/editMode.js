// Modo edición: por ahora, sin formulario ni listado editable (ver changes/00001).

export function renderEditMode(container) {
  container.innerHTML = '';

  const placeholder = document.createElement('p');
  placeholder.textContent = 'Modo edición — próximamente';
  container.appendChild(placeholder);
}
