// Funcionalidad 015 — Posición/arrastre de componentes (secundaria: 020
// "Dado", 022 "Carta"): sombra del estado transitorio ".lifted" al levantar
// un componente en Modo Juego.
//
// Requiere el CSS real (`loadRealStylesheet`): `runner-page.html` no lo carga
// por defecto, así que sin esto `getComputedStyle` no reflejaría box-shadow ni
// filter de ninguna regla — ver helpers.js.
//
// Criterio verificado (design/docs/style/001-tokens-visual.md, "Elevation,
// shadow and transition" / "'Lift' effect on dragging in play mode"): en
// reposo, una carta cuadrada o circular pinta su sombra de contacto con
// box-shadow (silueta = caja del elemento, box-shadow la sigue bien); una
// carta triangular está recortada con clip-path en un hijo interior, así que
// su silueta real no coincide con la caja exterior del elemento y por eso usa
// filter: drop-shadow en su lugar. El mismo criterio debe mantenerse al
// levantar (arrastrar): cuadrada/circular siguen con box-shadow sin cambios;
// triangular debe seguir usando filter, nunca un box-shadow que dibujaría un
// rectángulo alrededor de su caja exterior clippeada.
//
// El 'dado' (silueta redondeada/no rectangular según el número de caras) es
// el caso real más representativo: nace con `profundidad = 4` por defecto
// (extrusión activada), que aplica `style.filter` inline sobre el propio
// elemento (ui/componentRenderer.js) — un estilo inline gana siempre sobre
// cualquier regla de una hoja de estilos, así que si `.dice.lifted` intenta
// cambiar `filter` vía CSS, el inline se impone y la sombra de "levantado"
// desaparece sin más (FT-015-23).

import { describe, it, expect, beforeEach, registerFeature } from '../harness.js';
import { resetState, mountPlayMode, loadRealStylesheet } from '../helpers.js';
import { addComponent } from '../../core/state.js';
import { createDefaultComponent } from '../../ui/componentModal.js';

registerFeature({ primary: 15, secondary: [20, 22] });

describe('015/020/022 — Sombra del efecto "levantado" al arrastrar', () => {
  beforeEach(async () => {
    resetState();
    await loadRealStylesheet();
  });

  function addCarta(id, proporcion) {
    const c = createDefaultComponent('carta');
    c.id = id;
    c.properties.proporcion = proporcion;
    addComponent(c);
    return c;
  }

  function addDado(id) {
    // createDefaultComponent('dado') fija profundidad=4 por defecto (extrusión
    // activada) — se conserva tal cual: es el caso real, no uno aislado.
    const c = createDefaultComponent('dado');
    c.id = id;
    addComponent(c);
    return c;
  }

  // Simula un arrastre real: mousedown en el centro del elemento + un
  // mousemove con desplazamiento no nulo (mismo patrón que dado.test.js
  // FT-020-09) — beginDragLift se dispara en el primer mousemove, no en
  // mousedown, para no romper la síntesis de click del navegador.
  function dragLift(el) {
    const box = el.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: cx, clientY: cy }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: cx + 40, clientY: cy + 40 }));
  }

  function dropLift(el) {
    const box = el.getBoundingClientRect();
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: box.left, clientY: box.top }));
  }

  it('FT-015-20 · carta cuadrada (1:1): al levantar, sigue usando box-shadow (sin filter)', () => {
    addCarta('carta-cuadrada', '1:1');
    const content = mountPlayMode();
    const carta = content.querySelector('.carta');

    dragLift(carta);
    expect(carta.classList.contains('lifted')).toBe(true);

    const style = getComputedStyle(carta);
    expect(style.boxShadow === 'none').toBe(false);
    expect(style.filter).toBe('none');

    dropLift(carta);
  });

  it('FT-015-21 · carta circular: al levantar, sigue usando box-shadow (sin filter)', () => {
    addCarta('carta-circular', 'circular');
    const content = mountPlayMode();
    const carta = content.querySelector('.carta');

    dragLift(carta);
    expect(carta.classList.contains('lifted')).toBe(true);

    const style = getComputedStyle(carta);
    expect(style.boxShadow === 'none').toBe(false);
    expect(style.filter).toBe('none');

    dropLift(carta);
  });

  it('FT-015-22 · carta triangular: al levantar, la sombra usa filter (sigue la silueta), no box-shadow', () => {
    addCarta('carta-triangular', 'triangulo');
    const content = mountPlayMode();
    const carta = content.querySelector('.carta');
    expect(carta.classList.contains('carta--triangle')).toBe(true);

    dragLift(carta);
    expect(carta.classList.contains('lifted')).toBe(true);

    const style = getComputedStyle(carta);
    expect(style.filter === 'none').toBe(false);
    expect(style.boxShadow).toBe('none');

    dropLift(carta);
  });

  it('FT-015-23 · dado (con extrusión por defecto): al levantar, la sombra sigue usando filter (no queda fija en el filter de reposo)', () => {
    const dado = addDado('dado-control');
    const content = mountPlayMode();
    const dice = content.querySelector('.dice');

    const restStyle = getComputedStyle(dice);
    const restFilter = restStyle.filter;
    expect(restFilter === 'none').toBe(false);
    expect(restStyle.boxShadow).toBe('none');

    dragLift(dice);
    expect(dice.classList.contains('lifted')).toBe(true);

    const liftedStyle = getComputedStyle(dice);
    expect(liftedStyle.boxShadow).toBe('none');
    expect(liftedStyle.filter === restFilter).toBe(false);

    dropLift(dice);
  });
});
