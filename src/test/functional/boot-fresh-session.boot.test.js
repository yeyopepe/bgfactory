// Funcionalidad 036 — Contenido de ejemplo al arrancar una partida nueva.
// Nivel arranque real: se ejecuta en runner-page-boot.html, que carga main.js
// UNA sola vez tras `setupBoot()`. Escenario 1 del análisis: sesión totalmente
// nueva (sin guardado en localStorage, sin semilla embebida).

import { describe, it, expect, registerFeature } from '../harness.js';
import { getResources, getResourcesSeeded } from '../../core/state.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 36 });

// Prepara el entorno ANTES de que main.js arranque: nada guardado, semilla
// vacía, idioma activo conocido ('es') para poder comprobar la traducción del
// nombre de los recursos sembrados.
export async function setupBoot() {
  localStorage.removeItem('bgfactory:state');
  localStorage.setItem('bgfactory:lang', 'es');
  const seedEl = document.getElementById('initial-state');
  if (seedEl) seedEl.textContent = '';
}

export function afterBoot() {
  describe('036 — Contenido de ejemplo al arrancar (arranque real)', () => {
    it('FT-036-06 · la galería tiene exactamente los 2 recursos de ejemplo', () => {
      const ids = getResources().map((r) => r.id).sort();
      expect(ids).toEqual(['example-font', 'example-image']);
    });

    it('FT-036-07 · el nombre de cada recurso de ejemplo está traducido al idioma activo', () => {
      const image = getResources().find((r) => r.id === 'example-image');
      const font = getResources().find((r) => r.id === 'example-font');
      expect(image.name).toBe(t('defaultResource.exampleImage'));
      expect(font.name).toBe(t('defaultResource.exampleFont'));
    });

    it('FT-036-08 · getResourcesSeeded() es true tras el arranque nuevo', () => {
      expect(getResourcesSeeded()).toBe(true);
    });

    it('FT-036-09 · no hay .toast en el documento (arranque nuevo, sin aviso)', () => {
      expect(document.querySelector('.toast')).toBeNull();
    });
  });
}
