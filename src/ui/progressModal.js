// Modal de "operación en curso": informa de una operación potencialmente lenta
// y devuelve el control al terminar. Sin botones ni vía de cierre manual (ni
// click fuera, ni ESC) — se cierra sola en cuanto termina `work`.

export function runWithProgressModal(text, work) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'progress-modal';

  const spinner = document.createElement('div');
  spinner.className = 'progress-modal__spinner';
  modal.appendChild(spinner);

  const textEl = document.createElement('p');
  textEl.className = 'progress-modal__text';
  textEl.textContent = text;
  modal.appendChild(textEl);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Doble rAF anidado: el primero se dispara antes del repintado que inserta
  // la modal, el segundo ya en el frame siguiente, cuando ese repintado se ha
  // completado de verdad — a diferencia de setTimeout(fn, 0), que solo
  // garantiza orden en la cola de tareas, no que haya habido un repintado real.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        work();
      } finally {
        overlay.remove();
      }
    });
  });
}
