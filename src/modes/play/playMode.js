// Modo juego: funcionamiento normal de la partida.
// De momento solo muestra los componentes disponibles; la lógica de juego
// (turnos, reglas, tablero interactivo...) se irá añadiendo aquí.

import { getComponents } from '../../core/state.js';
import { renderComponentList } from '../../ui/componentList.js';

export function renderPlayMode(container) {
  container.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = 'Partida';
  container.appendChild(title);

  const listContainer = document.createElement('div');
  container.appendChild(listContainer);

  renderComponentList(listContainer, getComponents());
}
