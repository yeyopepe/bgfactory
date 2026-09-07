// Funcionalidad 018 — Componente "tablero simple".
//
// Valida los valores por defecto del modelo, la migración del nombre antiguo
// ('tablero' → 'tableroSimple'), el dibujo del borde (activo/biselado/plano/
// desactivado), la sombra, el fondo (color sólido, patrón cuadrado, patrón
// hexagonal, imagen sin recurso), la coexistencia de la configuración de fondo
// al alternar `fondoTipo`, el alias legacy `patronForma: 'hexagonal'`, el clamp
// del grosor de borde en la ventana de configuración y el comportamiento en
// modo juego (se pinta, no reacciona al clic).
//
// [gotcha] aislamiento: `src/modes/edit/editMode.js` mantiene
// `selectedComponentIds` (y `primarySelectedIds`) como estado de módulo que
// `resetState()` NO limpia. Los casos que ejercitan selección en modo edición
// usan ids de componente distintos por caso (mismo criterio que
// `component-transform.test.js`, `carta.test.js`, `component-title.test.js`).

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode, mountPlayMode } from '../helpers.js';
import { getComponents, addComponent, loadComponents } from '../../core/state.js';
import { createComponent } from '../../core/component.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { openComponentModal } from '../../ui/componentModal.js';

registerFeature({ primary: 18 });

describe('018 — Tablero simple', () => {
  beforeEach(resetState);
  afterEach(() => document.querySelectorAll('.modal-overlay').forEach((o) => o.remove()));

  // Crea un tablero con defaults, le fija un id estable, mezcla overrides sobre
  // `properties` y sobre el propio componente, y lo registra en el estado.
  function addBoard(id, propsExtra = {}, compExtra = {}) {
    const c = createDefaultComponent('tableroSimple');
    c.id = id;
    Object.assign(c.properties, propsExtra);
    Object.assign(c, compExtra);
    addComponent(c);
    return c;
  }

  const boardEl = (root) => root.querySelector('.board');

  it('FT-018-01 · valores por defecto de un tablero recién creado', () => {
    const c = createDefaultComponent('tableroSimple');
    expect(c.width).toBe(200);
    expect(c.height).toBe(200);
    const p = c.properties;
    expect(p.bordeColor).toBe('#000000');
    expect(p.bordeGrosor).toBe(2);
    expect(p.bordeActivo).toBe(true);
    expect(p.biselado).toBe(true);
    expect(p.sombra).toBe(true);
    expect(p.fondoTipo).toBe('colorPatron');
    expect(p.colorFondo).toBe('#ffffff');
    expect(p.patronColor).toBe('#000000');
    expect(p.patronGrosor).toBe(1);
    expect(p.patronForma).toBe('cuadrada');
    expect(p.patronFilas).toBe(8);
    expect(p.patronColumnas).toBe(8);
    expect(p.imagenResourceId).toBeNull();
    expect(p.colorSolido).toBe('#ffffff');

    // Los defaults los pone `createDefaultComponent`, no `createComponent`:
    // sin pasar por aquél, `properties` queda a {} y width/height a null.
    const bare = createComponent({ type: 'tableroSimple' });
    expect(Object.keys(bare.properties)).toHaveLength(0);
    expect(bare.width).toBeNull();
    expect(bare.height).toBeNull();
  });

  it("FT-018-02 · migración del nombre antiguo 'tablero' → 'tableroSimple'", () => {
    loadComponents([
      {
        id: 'brd-legacy',
        type: 'tablero',
        name: 'X',
        properties: { bordeColor: '#123456', bordeGrosor: 7, fondoTipo: 'color', colorSolido: '#abcdef' },
        x: 10,
        y: 20,
        width: 300,
        height: 150,
      },
      {
        id: 'brd-nuevo',
        type: 'tableroSimple',
        properties: { bordeGrosor: 3 },
        x: 0,
        y: 0,
        width: 200,
        height: 200,
      },
    ]);

    const legacy = getComponents().find((c) => c.id === 'brd-legacy');
    expect(legacy.type).toBe('tableroSimple');
    expect(legacy.properties.bordeColor).toBe('#123456');
    expect(legacy.properties.bordeGrosor).toBe(7);
    expect(legacy.properties.fondoTipo).toBe('color');
    expect(legacy.properties.colorSolido).toBe('#abcdef');
    expect(legacy.x).toBe(10);
    expect(legacy.y).toBe(20);
    expect(legacy.width).toBe(300);
    expect(legacy.height).toBe(150);

    const nuevo = getComponents().find((c) => c.id === 'brd-nuevo');
    expect(nuevo.type).toBe('tableroSimple');
    expect(nuevo.properties.bordeGrosor).toBe(3);
  });

  it('FT-018-03 · dibujo del borde: activo, biselado, plano y desactivado', () => {
    // 1) Borde activo y biselado: sólido, grosor configurado, y tonos distintos
    //    arriba/abajo (el bisel deriva top/left claro, bottom/right oscuro).
    addBoard('brd-bisel', { bordeActivo: true, biselado: true, bordeColor: '#808080', bordeGrosor: 6 });
    let content = mountPlayMode();
    let b = boardEl(content);
    expect(b.style.borderStyle).toBe('solid');
    expect(b.style.borderWidth).toBe('6px');
    expect(b.style.borderTopColor).toBeTruthy();
    expect(b.style.borderBottomColor).toBeTruthy();
    expect(b.style.borderTopColor === b.style.borderBottomColor).toBe(false);

    // 2) Borde activo y plano: sólido, grosor configurado, y los 4 lados iguales
    //    (el render fija `borderColor` en shorthand).
    resetState();
    addBoard('brd-plano', { bordeActivo: true, biselado: false, bordeColor: '#808080', bordeGrosor: 4 });
    content = mountPlayMode();
    b = boardEl(content);
    expect(b.style.borderStyle).toBe('solid');
    expect(b.style.borderWidth).toBe('4px');
    expect(b.style.borderTopColor === b.style.borderBottomColor).toBe(true);

    // 3) Borde desactivado: no se dibuja (`border-style: none`); color y grosor
    //    se conservan en el modelo por si se vuelve a activar.
    resetState();
    addBoard('brd-sinborde', { bordeActivo: false, bordeColor: '#808080', bordeGrosor: 6 });
    content = mountPlayMode();
    b = boardEl(content);
    expect(b.style.borderStyle).toBe('none');
    const model = getComponents().find((c) => c.id === 'brd-sinborde');
    expect(model.properties.bordeColor).toBe('#808080');
    expect(model.properties.bordeGrosor).toBe(6);
  });

  it('FT-018-04 · dibujo de la sombra: con y sin', () => {
    addBoard('brd-consombra', { sombra: true });
    let content = mountPlayMode();
    expect(boardEl(content).classList.contains('board--sin-sombra')).toBe(false);

    resetState();
    addBoard('brd-sinsombra', { sombra: false });
    content = mountPlayMode();
    expect(boardEl(content).classList.contains('board--sin-sombra')).toBe(true);
  });

  it('FT-018-05 · dibujo del fondo: color sólido, patrón cuadrado, patrón hexagonal e imagen sin recurso', () => {
    // 1) Color sólido: se aplica el color (el navegador normaliza hex a rgb()).
    addBoard('brd-solido', { fondoTipo: 'color', colorSolido: '#ff0000' });
    let content = mountPlayMode();
    expect(boardEl(content).style.backgroundColor).toBe('rgb(255, 0, 0)');

    // ...y con `colorSolido` vacío, el fondo queda transparente.
    resetState();
    addBoard('brd-solido-vacio', { fondoTipo: 'color', colorSolido: '' });
    content = mountPlayMode();
    expect(boardEl(content).style.backgroundColor).toBe('transparent');

    // 2) Patrón cuadrado: rejilla con `linear-gradient`, sin <svg>.
    resetState();
    addBoard('brd-cuadrada', { fondoTipo: 'colorPatron', patronForma: 'cuadrada', patronFilas: 4, patronColumnas: 4 });
    content = mountPlayMode();
    let b = boardEl(content);
    expect(b.style.backgroundImage).toContain('linear-gradient');
    expect(b.querySelector('svg')).toBeNull();

    // 3) Patrón hexagonal: un <svg> hijo con al menos un <polygon>.
    resetState();
    addBoard('brd-hex', { fondoTipo: 'colorPatron', patronForma: 'hex-horizontal', patronFilas: 3, patronColumnas: 3 });
    content = mountPlayMode();
    b = boardEl(content);
    expect(b.querySelector('svg')).toBeTruthy();
    expect(b.querySelectorAll('svg polygon').length).toBeGreaterThan(0);

    // 4) Imagen sin recurso válido: fondo blanco de reserva, sin background-image.
    resetState();
    addBoard('brd-img-sinrecurso', { fondoTipo: 'imagen', imagenResourceId: 'no-existe' });
    content = mountPlayMode();
    b = boardEl(content);
    expect(b.style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(b.style.backgroundImage).toBe('');
  });

  it('FT-018-06 · coexistencia de la configuración de fondo al alternar fondoTipo', () => {
    // Un tablero con las tres configuraciones puestas a la vez. Cambiar sólo
    // `fondoTipo` (lo que hace el <select> del modal) no debe destruir las
    // claves de las otras opciones — invariante que garantizan los `onAccept`
    // de cada sub-modal al escribir sólo sus propias claves.
    addBoard('brd-coex', {
      fondoTipo: 'colorPatron',
      patronColor: '#111111',
      patronFilas: 5,
      colorSolido: '#222222',
      imagenResourceId: 'res-x',
    });
    const c = getComponents().find((x) => x.id === 'brd-coex');

    c.properties.fondoTipo = 'color';
    expect(c.properties.patronColor).toBe('#111111');
    expect(c.properties.patronFilas).toBe(5);
    expect(c.properties.imagenResourceId).toBe('res-x');

    c.properties.fondoTipo = 'imagen';
    expect(c.properties.patronColor).toBe('#111111');
    expect(c.properties.patronFilas).toBe(5);
    expect(c.properties.colorSolido).toBe('#222222');

    c.properties.fondoTipo = 'colorPatron';
    expect(c.properties.colorSolido).toBe('#222222');
    expect(c.properties.imagenResourceId).toBe('res-x');
    expect(c.properties.patronColor).toBe('#111111');
    expect(c.properties.patronFilas).toBe(5);
  });

  it("FT-018-07 · un patronForma antiguo 'hexagonal' se dibuja como rejilla hexagonal", () => {
    addBoard('brd-hexlegacy', { fondoTipo: 'colorPatron', patronForma: 'hexagonal', patronFilas: 3, patronColumnas: 3 });
    const content = mountPlayMode();
    const b = boardEl(content);
    expect(b.querySelector('svg')).toBeTruthy();
    expect(b.querySelectorAll('svg polygon').length).toBeGreaterThan(0);

    // El valor almacenado no se reescribe: el alias se resuelve sólo al pintar.
    expect(getComponents().find((c) => c.id === 'brd-hexlegacy').properties.patronForma).toBe('hexagonal');
  });

  it('FT-018-08 · límites del grosor de borde en la ventana de configuración', () => {
    addBoard('brd-clamp');
    mountEditMode();
    const target = getComponents().find((c) => c.id === 'brd-clamp');
    openComponentModal({ component: target, onAccept() {} });

    // `openComponentModal` hace `workingComponent = { ...component }` (copia
    // superficial): `workingComponent.properties` ES el mismo objeto que
    // `target.properties`, y el listener del <input> escribe sobre él por
    // referencia. Por eso el efecto del clamp se lee directamente en
    // `target.properties.bordeGrosor` tras disparar 'input', sin pasar por
    // `onAccept` ni reabrir el modal.
    const modal = document.querySelector('.modal-overlay .modal');
    const input = [...modal.querySelectorAll('input[type=number]')].find(
      (el) => el.min === '1' && el.max === '20',
    );
    expect(input).toBeTruthy();

    const clampOf = (raw) => {
      input.value = raw;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return target.properties.bordeGrosor;
    };

    expect(clampOf('25')).toBe(20);
    expect(clampOf('0')).toBe(1);
    expect(clampOf('-5')).toBe(1);
    expect(clampOf('abc')).toBe(2); // texto no numérico → default (2), no 1
    expect(clampOf('')).toBe(2);
  });

  it('FT-018-09 · en modo juego el tablero se pinta y no reacciona al clic', () => {
    addBoard('brd-juego');
    let content = mountPlayMode();
    const b = boardEl(content);
    expect(b).toBeTruthy(); // se pinta
    expect(b.classList.contains('board--selectable')).toBe(false); // modo juego no pasa onSelect

    b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    b.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(document.querySelector('.modal-overlay')).toBeNull();
    expect(content.querySelector('.board--selected')).toBeNull();

    // Contraste: en modo edición el tablero sí es seleccionable.
    resetState();
    addBoard('brd-edit');
    content = mountEditMode();
    expect(boardEl(content).classList.contains('board--selectable')).toBe(true);
  });
});
