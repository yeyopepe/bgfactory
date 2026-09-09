// Funcionalidad 037 — Indicador de versión y enlace al repositorio.
// Nivel arranque real: runner-page-boot.html carga main.js UNA sola vez, así
// que `main.js#renderAppVersion` (no exportada) se ejerce de verdad sobre
// #app-version — a diferencia de `version-indicator.test.js`, que replica un
// render mínimo por no cargar main.js. Escenario 7 del análisis.
//
// Una sola ejecución de main.js por fichero: se arranca CON texto libre (que
// también contiene marcado, para cubrir de paso el pintado como texto plano).
// El caso "sin texto libre" queda cubierto a nivel réplica por
// `version-indicator.test.js` FT-037-03.

import { describe, it, expect, registerFeature } from '../harness.js';
import { CURRENT_VERSION } from '../../data/version.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 37 });

const TABLE_TEXT = '<b>nota</b> de la mesa';

const SAVED_STATE = {
  version: CURRENT_VERSION,
  components: [],
  resources: [],
  tags: [],
  componentGroups: [],
  appTitle: 'Partida guardada',
  tableText: TABLE_TEXT,
};

export async function setupBoot() {
  localStorage.setItem('bgfactory:state', JSON.stringify(SAVED_STATE));
  localStorage.setItem('bgfactory:lang', 'es');
  const seedEl = document.getElementById('initial-state');
  if (seedEl) seedEl.textContent = '';
}

export function afterBoot() {
  const versionEl = () => document.getElementById('app-version');

  describe('037 — Bloque de versión pintado por main.js en el arranque real', () => {
    it('FT-037-07 · nombre+versión y enlace al repo con target/rel correctos', () => {
      const el = versionEl();
      const name = el.querySelector('.app-version__name');
      expect(name.textContent).toContain(CURRENT_VERSION);
      const link = el.querySelector('.app-version__repo a');
      expect(link.getAttribute('href')).toBe('https://github.com/yeyopepe/bgfactory');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener');
      expect(link.textContent).toBe(t('appVersion.repoLink'));
    });

    it('FT-037-08 · con texto libre: nota + hr por encima de las dos líneas fijas (4 hijos)', () => {
      const el = versionEl();
      expect(el.children.length).toBe(4);
      expect(el.children[0].classList.contains('app-version__table-text')).toBe(true);
      expect(el.children[0].textContent).toBe(TABLE_TEXT);
      expect(el.children[1].tagName).toBe('HR');
      expect(el.children[1].classList.contains('app-version__separator')).toBe(true);
      expect(el.children[2].classList.contains('app-version__name')).toBe(true);
      expect(el.children[3].classList.contains('app-version__repo')).toBe(true);
    });

    it('FT-037-09 · el texto libre se pinta como texto plano, no como HTML', () => {
      const note = versionEl().querySelector('.app-version__table-text');
      expect(note.querySelector('b')).toBeNull();
      expect(note.textContent).toContain('<b>nota</b>');
    });
  });
}
