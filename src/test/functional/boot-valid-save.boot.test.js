// Funcionalidad 029 — Autoguardado en el navegador (primaria).
// Funcionalidad 036 — Contenido de ejemplo al arrancar (secundaria).
// Nivel arranque real: se ejecuta en runner-page-boot.html, que carga main.js
// UNA sola vez tras `setupBoot()`. Escenario 2 del análisis: restaurar un
// guardado válido que NO trae la clave `resourcesSeeded` — no se re-siembra.
// El escenario 5 (invariante de orden de hidratación de `resourcesSeeded`)
// vive en `boot-seed-order.boot.test.js`: solo es observable con un guardado
// que traiga `resourcesSeeded: true` (un valor distinto del defecto `false`);
// con la clave ausente, `false === false` y el orden no cambia el resultado.

import { describe, it, expect, registerFeature } from '../harness.js';
import {
  getComponents, getResources, getResourcesSeeded, getTags,
  getAppTitle, getTableText, getPanelState,
} from '../../core/state.js';
import { CURRENT_VERSION } from '../../data/version.js';

registerFeature({ primary: 29, secondary: [36] });

// Guardado válido SIN la clave `resourcesSeeded`: al restaurar, la lógica de
// siembra NO corre (hay guardado válido con datos) y `getResourcesSeeded()`
// queda en `false`.
const SAVED_STATE = {
  version: CURRENT_VERSION,
  components: [
    { id: 'c1', type: 'carta', order: 1, name: 'Pieza uno', groupId: null },
    { id: 'c2', type: 'dado', order: 2, name: 'Pieza dos', groupId: null },
  ],
  resources: [
    { id: 'mi-recurso', name: 'Mi recurso', type: 'imagen', dataUrl: 'data:image/png;base64,AAAA', fileName: 'mi.png', mimeType: 'image/png' },
  ],
  tags: [{ id: 't1', name: 'Héroes' }],
  componentGroups: [],
  appTitle: 'Partida guardada',
  tableText: 'nota',
  panelState: { collapsed: true, position: null, width: 321, height: null, expandedGroupIds: [] },
  resourcePanelState: { collapsed: false, position: null, width: null, height: null },
  tagPanelState: { collapsed: false, position: null, width: null, height: null },
};

export async function setupBoot() {
  localStorage.setItem('bgfactory:state', JSON.stringify(SAVED_STATE));
  localStorage.setItem('bgfactory:lang', 'es');
  const seedEl = document.getElementById('initial-state');
  if (seedEl) seedEl.textContent = '';
}

export function afterBoot() {
  describe('029 — Restaurar un guardado válido al arrancar (arranque real)', () => {
    it('FT-029-10 · el guardado se restaura en su totalidad', () => {
      expect(getComponents().map((c) => c.id).sort()).toEqual(['c1', 'c2']);
      expect(getResources().map((r) => r.id)).toEqual(['mi-recurso']);
      expect(getTags().map((t) => t.name)).toEqual(['Héroes']);
      expect(getAppTitle()).toBe('Partida guardada');
      expect(getTableText()).toBe('nota');
      expect(getPanelState().collapsed).toBe(true);
      expect(getPanelState().width).toBe(321);
    });

    it('FT-029-11 · con guardado válido NO se siembran los recursos de ejemplo aunque falte la marca', () => {
      const ids = getResources().map((r) => r.id);
      expect(ids).toContain('mi-recurso');
      expect(ids.includes('example-image')).toBe(false);
      expect(ids.includes('example-font')).toBe(false);
      expect(getResourcesSeeded()).toBe(false);
    });

    it('FT-029-12 · no hay .toast (guardado válido, sin aviso)', () => {
      expect(document.querySelector('.toast')).toBeNull();
    });
  });

  describe('036 — La lógica de siembra no corre con guardado válido (secundaria)', () => {
    it('FT-036-10 · misma comprobación que FT-029-11 desde la óptica de la feature 036', () => {
      const ids = getResources().map((r) => r.id);
      expect(ids.includes('example-image')).toBe(false);
      expect(ids.includes('example-font')).toBe(false);
    });
  });
}
