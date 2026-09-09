// Funcionalidad 029 — Autoguardado en el navegador.
// Nivel arranque real: runner-page-boot.html carga main.js UNA sola vez.
// Escenario 5 del análisis: invariante de orden de hidratación de
// `resourcesSeeded` en el bootstrap de main.js.
//
// main.js hidrata el flag `resourcesSeeded` ANTES de loadComponents()/
// loadResources() (y del resto de cargas), porque cada una de esas cargas
// emite un `*:changed` que dispara `persistState()` — que lee
// `getResourcesSeeded()` y reescribe el guardado. Si el flag se hidratara
// DESPUÉS, el último autoguardado del bootstrap persistiría el valor por
// defecto (`false`) en lugar del guardado, corrompiendo `bgfactory:state`.
//
// [gotcha] este invariante SOLO es observable con un guardado que traiga
// `resourcesSeeded: true`: con la clave ausente el valor por defecto (`false`)
// coincide con el esperado y el orden de hidratación no altera el resultado.
// Por eso este escenario va en su propio fichero (main.js corre una vez por
// fichero) y no comparte el guardado sin-clave de `boot-valid-save.boot.test.js`.

import { describe, it, expect, registerFeature } from '../harness.js';
import { getResources, getResourcesSeeded } from '../../core/state.js';
import { CURRENT_VERSION } from '../../data/version.js';

registerFeature({ primary: 29 });

// Guardado válido del usuario que YA tiene los recursos sembrados alguna vez
// (`resourcesSeeded: true`) y un recurso propio (ninguno de ejemplo).
const SAVED_STATE = {
  version: CURRENT_VERSION,
  components: [
    { id: 'c1', type: 'carta', order: 1, name: 'Pieza', groupId: null },
  ],
  resources: [
    { id: 'mi-recurso', name: 'Mi recurso', type: 'imagen', dataUrl: 'data:image/png;base64,AAAA', fileName: 'mi.png', mimeType: 'image/png' },
  ],
  tags: [{ id: 't1', name: 'Etiqueta' }],
  componentGroups: [],
  appTitle: 'Partida guardada',
  tableText: '',
  resourcesSeeded: true,
};

export async function setupBoot() {
  localStorage.setItem('bgfactory:state', JSON.stringify(SAVED_STATE));
  localStorage.setItem('bgfactory:lang', 'es');
  const seedEl = document.getElementById('initial-state');
  if (seedEl) seedEl.textContent = '';
}

export function afterBoot() {
  describe('029 — Invariante de orden de hidratación de resourcesSeeded (arranque real)', () => {
    it('FT-029-13 · el guardado reescrito por el autoguardado del bootstrap conserva resourcesSeeded === true', () => {
      const rewritten = JSON.parse(localStorage.getItem('bgfactory:state'));
      expect(rewritten.resourcesSeeded).toBe(true);
    });

    it('FT-029-19 · getResourcesSeeded() en memoria refleja el valor del guardado (true)', () => {
      expect(getResourcesSeeded()).toBe(true);
    });

    it('FT-029-20 · no se han repuesto recursos de ejemplo (el guardado ya estaba sembrado)', () => {
      const ids = getResources().map((r) => r.id);
      expect(ids).toContain('mi-recurso');
      expect(ids.includes('example-image')).toBe(false);
      expect(ids.includes('example-font')).toBe(false);
    });
  });
}
