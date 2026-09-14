// Red de seguridad de infraestructura de estilo: comprueba que una muestra
// representativa de los tokens de diseño nuevos (uno por grupo, más un alias
// de la escala de grises) resuelve al valor esperado en el `:root` real.
// Objetivo: detectar en segundos un error tipográfico, un alias mal escrito
// o una referencia circular al ampliar :root con ~45 tokens a mano — antes de
// empezar a migrar valores sueltos, y como red de seguridad durante el resto
// de la migración (debe seguir en verde después de cada tarea).
//
// No llama a registerFeature: es una prueba de infraestructura de estilo, no
// de una funcionalidad de usuario del catálogo design/docs/features/.

import { describe, it, expect, beforeEach } from '../harness.js';
import { loadRealStylesheet } from '../helpers.js';

describe('Infraestructura — tokens de diseño en :root', () => {
  let style;

  beforeEach(async () => {
    await loadRealStylesheet();
    style = getComputedStyle(document.documentElement);
  });

  function token(name) {
    return style.getPropertyValue(name).trim();
  }

  it('superficies: --bg-surface y --bg-overlay resuelven', () => {
    expect(token('--bg-surface')).toBe('#ffffff');
    expect(token('--bg-overlay')).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('acento azul (alphas): --accent-blue-alpha-15/-25/-35 resuelven', () => {
    expect(token('--accent-blue-alpha-15')).toBe('rgba(44, 125, 216, 0.15)');
    expect(token('--accent-blue-alpha-25')).toBe('rgba(44, 125, 216, 0.25)');
    expect(token('--accent-blue-alpha-35')).toBe('rgba(44, 125, 216, 0.35)');
  });

  it('semánticos: --error-alpha resuelve', () => {
    expect(token('--error-alpha')).toBe('rgba(211, 47, 47, 0.35)');
  });

  it('escala de grises: --gray-500/--gray-800 (nuevos) resuelven', () => {
    expect(token('--gray-500')).toBe('#cccccc');
    expect(token('--gray-800')).toBe('#3a3a3a');
  });

  it('escala de grises: --gray-100 (alias) resuelve al valor de --bg-card', () => {
    expect(token('--gray-100')).toBe(token('--bg-card'));
  });

  it('esquinas: --radius-full resuelve', () => {
    expect(token('--radius-full')).toBe('9999px');
  });

  it('sombras: --shadow-lifted y --shadow-3 resuelven', () => {
    expect(token('--shadow-lifted')).toBe('6px 7px 9px 2px rgba(0, 0, 0, 0.35)');
    expect(token('--shadow-3')).toBe('0 8px 24px rgba(0, 0, 0, 0.18)');
  });

  it('tipografía: --text-xl resuelve', () => {
    expect(token('--text-xl')).toBe('2rem');
  });
});
