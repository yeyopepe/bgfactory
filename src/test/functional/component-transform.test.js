// Funcionalidad 015 — Posición independiente, arrastre y redimensionado de
// componentes (incluye el desplegable "Bloqueado").
// Nivel state + ui.
//
// Aislamiento: modes/edit/editMode.js mantiene `selectedComponentIds` como estado
// de módulo que resetState() NO limpia. Un click SIN ctrl reemplaza la selección
// completa (rama `else` de toggleSelect: clear() + add), así que cada caso que
// necesite una selección concreta empieza con un click plano sobre su objetivo.
// Aun así, cada caso usa ids de componente distintos.

import { describe, it, expect, beforeEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode, mountPlayMode } from '../helpers.js';
import { getComponents, addComponent, replaceComponent } from '../../core/state.js';
import { createComponent, updateComponent } from '../../core/component.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { moveSelectedComponent } from '../../modes/edit/editMode.js';

registerFeature({ primary: 15 });

function addCarta(id, extra = {}) {
  const c = createDefaultComponent('carta');
  c.id = id;
  Object.assign(c, extra);
  addComponent(c);
  return c;
}

function clickOn(el, opts = {}) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, ...opts }));
}

describe('015 — Posición, arrastre, redimensionado y bloqueo', () => {
  beforeEach(resetState);

  it('FT-015-01 · un componente nuevo nace con posición propia (0,0 por defecto)', () => {
    const c = createComponent({ type: 'carta' });
    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
    // width/height automáticos (null) mientras no se fijen.
    expect(c.width).toBeNull();
    expect(c.height).toBeNull();
  });

  it('FT-015-02 · mover un componente actualiza su posición en el estado', () => {
    addCarta('mov-1');
    replaceComponent('mov-1', updateComponent(getComponents()[0], { x: 250, y: 300 }));
    const c = getComponents()[0];
    expect(c.x).toBe(250);
    expect(c.y).toBe(300);
  });

  it('FT-015-03 · el tirador de redimensionado sólo aparece con selección de tamaño 1', () => {
    addCarta('rs-1');
    const content = mountEditMode();
    clickOn(content.querySelector('.carta')); // click plano: selección = { rs-1 }

    // toggleSelect ya ha re-renderizado la mesa; volver a leer del DOM vivo.
    const carta = document.querySelector('#content .carta');
    expect(carta.querySelector('.resize-handle')).toBeTruthy();
  });

  it('FT-015-04 · con selección múltiple no hay tirador de redimensionado', () => {
    addCarta('ms-1');
    addCarta('ms-2');
    const content = mountEditMode();
    const cartas = content.querySelectorAll('.carta');
    clickOn(cartas[0]); // selección = { ms-1 }
    clickOn(document.querySelectorAll('#content .carta')[1], { ctrlKey: true }); // añade ms-2

    const resizeHandles = document.querySelectorAll('#content .carta .resize-handle');
    expect(resizeHandles.length).toBe(0);
  });

  it('FT-015-05 · la clase carta--movable depende del bloqueo y del modo', () => {
    // bloqueado: 'ninguno' → arrastrable en juego.
    addCarta('mv-ninguno', { bloqueado: 'ninguno' });
    let play = mountPlayMode();
    expect(play.querySelector('.carta').classList.contains('carta--movable')).toBe(true);

    resetState();
    // bloqueado: 'todos' → NO arrastrable ni en edición.
    addCarta('mv-todos', { bloqueado: 'todos' });
    let edit = mountEditMode();
    expect(edit.querySelector('.carta').classList.contains('carta--movable')).toBe(false);

    resetState();
    // bloqueado: 'juego' → arrastrable en edición, NO en juego.
    addCarta('mv-juego', { bloqueado: 'juego' });
    edit = mountEditMode();
    expect(edit.querySelector('.carta').classList.contains('carta--movable')).toBe(true);
    play = mountPlayMode();
    expect(play.querySelector('.carta').classList.contains('carta--movable')).toBe(false);
  });

  it('FT-015-06 · la insignia de candado se pinta en edición si hay bloqueo, nunca en juego', () => {
    addCarta('lk-1', { bloqueado: 'juego' });
    let edit = mountEditMode();
    expect(edit.querySelector('.carta .component-lock-badge')).toBeTruthy();

    let play = mountPlayMode();
    expect(play.querySelector('.carta .component-lock-badge')).toBeNull();

    resetState();
    addCarta('lk-2', { bloqueado: 'ninguno' });
    edit = mountEditMode();
    expect(edit.querySelector('.carta .component-lock-badge')).toBeNull();
  });

  it('FT-015-07 · mover con flechas afecta a la selección pero no a los bloqueados en "todos"', () => {
    addCarta('ar-libre', { x: 10, y: 10, bloqueado: 'ninguno' });
    addCarta('ar-fijo', { x: 50, y: 50, bloqueado: 'todos' });
    const content = mountEditMode();
    const cartas = content.querySelectorAll('.carta');
    clickOn(cartas[0]); // selección = { ar-libre }
    clickOn(document.querySelectorAll('#content .carta')[1], { ctrlKey: true }); // añade ar-fijo

    moveSelectedComponent(10, 0);

    const libre = getComponents().find((c) => c.id === 'ar-libre');
    const fijo = getComponents().find((c) => c.id === 'ar-fijo');
    expect(libre.x).toBe(20); // 10 + 10
    expect(fijo.x).toBe(50); // sin cambios: bloqueado en 'todos'
  });
});
