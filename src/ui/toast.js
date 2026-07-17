// Aviso breve no bloqueante (toast), reutilizable para cualquier
// confirmación o advertencia puntual de la aplicación.

const DISPLAY_MS = 3000;

let hideTimeout = null;

export function showToast(message) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }

  el.textContent = message;
  el.classList.add('toast--visible');

  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    el.classList.remove('toast--visible');
  }, DISPLAY_MS);
}
