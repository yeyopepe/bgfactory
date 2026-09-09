// Funcionalidad 029 — Autoguardado en el navegador.
// Nivel arranque real: runner-page-boot.html carga main.js UNA sola vez.
// Escenario 6 del análisis: un guardado anterior al registro de grupos
// (`componentGroups` ausente) reconstruye una entrada de grupo por cada
// `groupId` presente en las piezas — vía `deriveMissingGroups` en main.js.
//
// Nota (desviación respecto a plan.md): `deriveMissingGroups` (core/group.js)
// solo deriva grupos con 2+ miembros (un grupo de 1 no es una unidad de
// agrupación válida — mismo criterio que la disolución automática en
// `removeComponent`). El plan proponía `g1` con 2 piezas y `g2` con 1; con 1
// miembro `g2` NO se derivaría. Se ajusta a la realidad del código: ambos
// grupos con 2 miembros, y se comprueba que se derivan los dos.

import { describe, it, expect, registerFeature } from '../harness.js';
import { getComponents, getGroups } from '../../core/state.js';
import { CURRENT_VERSION } from '../../data/version.js';

registerFeature({ primary: 29 });

const SAVED_STATE = {
  version: CURRENT_VERSION,
  components: [
    { id: 'c1', type: 'carta', order: 1, name: 'A', groupId: 'g1' },
    { id: 'c2', type: 'carta', order: 2, name: 'B', groupId: 'g1' },
    { id: 'c3', type: 'dado', order: 3, name: 'C', groupId: 'g2' },
    { id: 'c4', type: 'dado', order: 4, name: 'D', groupId: 'g2' },
  ],
  resources: [],
  tags: [],
  // SIN `componentGroups`: es lo que ejercita el backfill.
  appTitle: 'BG Factory',
  tableText: '',
};

export async function setupBoot() {
  localStorage.setItem('bgfactory:state', JSON.stringify(SAVED_STATE));
  localStorage.setItem('bgfactory:lang', 'es');
  const seedEl = document.getElementById('initial-state');
  if (seedEl) seedEl.textContent = '';
}

export function afterBoot() {
  describe('029 — Backfill de grupos al restaurar un guardado antiguo (arranque real)', () => {
    it('FT-029-17 · getGroups() tiene una entrada derivada por cada groupId distinto (g1, g2)', () => {
      const ids = getGroups().map((g) => g.id).sort();
      expect(ids).toEqual(['g1', 'g2']);
    });

    it('FT-029-18 · las piezas conservan su groupId tras el arranque', () => {
      const byId = Object.fromEntries(getComponents().map((c) => [c.id, c.groupId]));
      expect(byId.c1).toBe('g1');
      expect(byId.c2).toBe('g1');
      expect(byId.c3).toBe('g2');
      expect(byId.c4).toBe('g2');
    });
  });
}
