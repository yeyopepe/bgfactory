// Funcionalidad 029 — Autoguardado en el navegador (primaria).
// Funcionalidad 036 — Contenido de ejemplo al arrancar (secundaria).
// Nivel arranque real: runner-page-boot.html carga main.js UNA sola vez.
// Escenario 3 del análisis: guardado NO restaurable.
//
// Una sola ejecución de main.js por fichero obliga a probar aquí UNA variante
// de extremo a extremo: JSON ilegible. Las otras dos variantes que
// `parseState` unifica bajo `{ error: 'corrupt' }` (guardado sin array
// `components`, guardado de otra versión) comparten exactamente la misma rama
// de arranque (`bootFromSeedOrDefaults()` + toast) y ya están cubiertas a
// nivel unidad por `autosave.test.js` FT-029-08.

import { describe, it, expect, registerFeature } from '../harness.js';
import { getComponents, getResources, getResourcesSeeded } from '../../core/state.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 29, secondary: [36] });

export async function setupBoot() {
  localStorage.setItem('bgfactory:state', '{ esto no es json');
  localStorage.setItem('bgfactory:lang', 'es');
  const seedEl = document.getElementById('initial-state');
  if (seedEl) seedEl.textContent = '';
}

export function afterBoot() {
  describe('029 — Guardado corrupto: aviso y arranque desde defecto (arranque real)', () => {
    it('FT-029-14 · aparece un .toast con el texto de recuperación fallida', () => {
      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast.textContent).toBe(t('toast.stateRecoverFailedCorrupt'));
    });

    it('FT-029-15 · la app arranca desde valores por defecto y siembra los recursos de ejemplo', () => {
      expect(getComponents()).toHaveLength(0);
      expect(getResourcesSeeded()).toBe(true);
      const ids = getResources().map((r) => r.id).sort();
      expect(ids).toEqual(['example-font', 'example-image']);
    });
  });

  describe('036 — El fallback de arranque siembra los recursos de ejemplo (secundaria)', () => {
    it('FT-036-11 · sin guardado recuperable ni semilla embebida, se siembran los 2 recursos', () => {
      const ids = getResources().map((r) => r.id).sort();
      expect(ids).toEqual(['example-font', 'example-image']);
    });
  });
}
