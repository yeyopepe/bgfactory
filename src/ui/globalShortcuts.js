// Atajos de teclado globales (ESC/INTRO/SUPR/flechas), equivalentes directos de los
// botones o acciones ya existentes en cada contexto — no introducen ninguna
// acción/confirmación/validación nueva. Módulo agnóstico del dominio: solo conoce el
// patrón DOM común a las modales (`.modal-overlay` > `.modal` > `.modal__footer` con
// `.btn-cancel`/`.btn-accept`/`.btn-eliminar`), nunca `modes/*` — quien conecta el caso
// "SUPR sin modal abierta" con el modo edición es `main.js`, vía el callback
// `onDeleteSelected`, y quien conecta las flechas (cambio 00145) es `onMoveSelected`.

function getTopModalOverlay() {
  const overlays = Array.from(document.body.children).filter((el) => el.classList.contains('modal-overlay'));
  return overlays.length > 0 ? overlays[overlays.length - 1] : null;
}

function isTextEditableElement(el) {
  return el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement;
}

const ARROW_DELTA_BY_KEY = {
  ArrowUp: (step) => [0, -step],
  ArrowDown: (step) => [0, step],
  ArrowLeft: (step) => [-step, 0],
  ArrowRight: (step) => [step, 0],
};

export function initGlobalShortcuts({ isEditMode, onDeleteSelected, onMoveSelected } = {}) {
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
      return;
    }

    if (event.key in ARROW_DELTA_BY_KEY) {
      // Ninguna modal tiene un botón equivalente a "mover": con una abierta (incluida
      // `ui/cardEditorModal.js`, que ya escucha flechas para su propio lienzo), este
      // atajo no hace nada, para no mover a la vez un componente de la mesa por debajo.
      if (getTopModalOverlay()) return;
      if (isTextEditableElement(document.activeElement)) return;
      if (!isEditMode || !isEditMode() || !onMoveSelected) return;
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      const [dx, dy] = ARROW_DELTA_BY_KEY[event.key](step);
      onMoveSelected(dx, dy);
    }
  });
}
