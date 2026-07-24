// Atajos de teclado globales (ESC/INTRO/SUPR), equivalentes directos de los botones
// ya existentes en cada contexto — no introducen ninguna acción/confirmación/validación
// nueva. Módulo agnóstico del dominio: solo conoce el patrón DOM común a las modales
// (`.modal-overlay` > `.modal` > `.modal__footer` con `.btn-cancel`/`.btn-accept`/
// `.btn-eliminar`), nunca `modes/*` — quien conecta el caso "SUPR sin modal abierta"
// con el modo edición es `main.js`, vía el callback `onDeleteSelected`.

function getTopModalOverlay() {
  const overlays = Array.from(document.body.children).filter((el) => el.classList.contains('modal-overlay'));
  return overlays.length > 0 ? overlays[overlays.length - 1] : null;
}

function isTextEditableElement(el) {
  return el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement;
}

export function initGlobalShortcuts({ isEditMode, onDeleteSelected } = {}) {
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return;

    if (event.key === 'Escape') {
      const topOverlay = getTopModalOverlay();
      if (!topOverlay) return;
      const cancelBtn = topOverlay.querySelector('.modal__footer .btn-cancel');
      if (cancelBtn) {
        event.preventDefault();
        cancelBtn.click();
      }
      return;
    }

    if (event.key === 'Enter') {
      if (document.activeElement instanceof HTMLTextAreaElement) return;
      const topOverlay = getTopModalOverlay();
      if (!topOverlay) return;
      const acceptBtn = topOverlay.querySelector('.modal__footer .btn-accept');
      if (acceptBtn && !acceptBtn.disabled) {
        event.preventDefault();
        acceptBtn.click();
      }
      return;
    }

    if (event.key === 'Delete') {
      if (isTextEditableElement(document.activeElement)) return;
      const topOverlay = getTopModalOverlay();
      if (topOverlay) {
        const deleteBtn = topOverlay.querySelector('.modal__footer .btn-eliminar');
        if (deleteBtn) {
          event.preventDefault();
          deleteBtn.click();
        }
        return;
      }
      if (isEditMode && isEditMode() && onDeleteSelected) {
        event.preventDefault();
        onDeleteSelected();
      }
    }
  });
}
