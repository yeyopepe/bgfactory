// Funcionalidad 036 — Contenido de ejemplo al arrancar (primaria).
// Funcionalidad 029 — Autoguardado en el navegador (secundaria).
// Nivel arranque real: runner-page-boot.html carga main.js UNA sola vez.
// Escenario 4 del análisis: no hay guardado en localStorage pero SÍ hay una
// semilla embebida en el documento (<script id="initial-state">).

import { describe, it, expect, registerFeature } from '../harness.js';
import { getComponents, getResources, getAppTitle } from '../../core/state.js';
import { CURRENT_VERSION } from '../../data/version.js';

registerFeature({ primary: 36, secondary: [29] });

const SEED_STATE = {
  version: CURRENT_VERSION,
  components: [
    { id: 's1', type: 'carta', order: 1, name: 'Pieza de la semilla', groupId: null },
  ],
  resources: [
    { id: 'mi-recurso', name: 'Mi recurso', type: 'imagen', dataUrl: 'data:image/png;base64,AAAA', fileName: 'mi.png', mimeType: 'image/png' },
  ],
  tags: [],
  componentGroups: [],
  appTitle: 'Semilla',
  tableText: '',
  // La semilla trae explícitamente `resourcesSeeded: false`: aun así, al traer
  // datos propios NO se le siembran los recursos de ejemplo.
  resourcesSeeded: false,
};

export async function setupBoot() {
  localStorage.removeItem('bgfactory:state');
  localStorage.setItem('bgfactory:lang', 'es');
  document.getElementById('initial-state').textContent = JSON.stringify(SEED_STATE);
}

export function afterBoot() {
  describe('036 — Recuperar una semilla embebida al arrancar (arranque real)', () => {
    it('FT-036-12 · se recuperó la semilla: sus componentes y su título', () => {
      expect(getComponents().map((c) => c.id)).toEqual(['s1']);
      expect(getAppTitle()).toBe('Semilla');
    });

    it('FT-036-13 · NO se sembraron recursos de ejemplo aunque la semilla trajera resourcesSeeded: false', () => {
      const ids = getResources().map((r) => r.id);
      expect(ids).toContain('mi-recurso');
      expect(ids.includes('example-image')).toBe(false);
      expect(ids.includes('example-font')).toBe(false);
    });
  });

  describe('029 — Semilla válida, sin aviso (secundaria)', () => {
    it('FT-029-16 · no hay .toast (semilla válida)', () => {
      expect(document.querySelector('.toast')).toBeNull();
    });
  });
}
