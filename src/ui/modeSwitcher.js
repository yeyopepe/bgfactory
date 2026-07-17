// UI para alternar entre modo juego y modo edición.

import { MODES, getState, setMode } from '../core/state.js';

export function renderModeSwitcher(container) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'mode-switcher';

  for (const mode of [MODES.PLAY, MODES.EDIT]) {
    const button = document.createElement('button');
    button.textContent = mode === MODES.PLAY ? 'Modo juego' : 'Modo edición';
    button.className = 'mode-switcher__button';
    button.classList.toggle('is-active', getState().mode === mode);
    button.addEventListener('click', () => setMode(mode));
    wrapper.appendChild(button);
  }

  container.appendChild(wrapper);
}
