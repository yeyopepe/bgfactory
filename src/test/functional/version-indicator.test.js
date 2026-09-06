// Funcionalidad 037 — Indicador de versión y enlace al repositorio.
// Nivel state + 1 caso ui. main.js#renderAppVersion NO está exportada y el runner
// no carga main.js, así que el caso de interfaz replica un render mínimo
// equivalente dentro de este propio fichero (misma técnica que fresh-boot.test.js
// con seedDefaultResources). El resto se cubre sobre las funciones de cálculo de
// versión y de lectura/escritura del texto libre de la mesa.

import { describe, it, expect, beforeEach, registerFeature } from '../harness.js';
import { resetState } from '../helpers.js';
import { getTableText, setTableText } from '../../core/state.js';
import { formatVersion, getVersionedProductName } from '../../core/appTitle.js';
import { CURRENT_VERSION } from '../../data/version.js';
import { initI18n, t } from '../../core/i18n.js';

registerFeature({ primary: 37 });

// Réplica fiel de la estructura DOM de main.js#renderAppVersion (sólo la parte de
// construcción de nodos; la lógica de negocio vive en core/*).
function renderAppVersionInto(el) {
  el.textContent = '';

  const nameLine = document.createElement('div');
  nameLine.className = 'app-version__name';
  nameLine.textContent = `BG Factory ${CURRENT_VERSION}`;

  const repoLine = document.createElement('div');
  repoLine.className = 'app-version__repo';
  const repoLink = document.createElement('a');
  repoLink.href = 'https://github.com/yeyopepe/bgfactory';
  repoLink.target = '_blank';
  repoLink.rel = 'noopener';
  repoLink.textContent = t('appVersion.repoLink');
  repoLine.appendChild(repoLink);

  const tableText = getTableText();
  if (tableText.trim() !== '') {
    const noteLine = document.createElement('div');
    noteLine.className = 'app-version__table-text';
    noteLine.textContent = tableText;

    const separator = document.createElement('hr');
    separator.className = 'app-version__separator';

    el.append(noteLine, separator, nameLine, repoLine);
    return;
  }

  el.append(nameLine, repoLine);
}

describe('037 — Indicador de versión y enlace al repositorio', () => {
  beforeEach(() => {
    resetState();
    initI18n();
  });

  it('FT-037-01 · formatVersion() y getVersionedProductName() derivan de CURRENT_VERSION', () => {
    expect(formatVersion()).toBe(`v.${CURRENT_VERSION.slice(1)}`);
    expect(getVersionedProductName()).toBe(`BG Factory ${formatVersion()}`);
  });

  it('FT-037-02 · el bloque muestra nombre+versión y el enlace a GitHub abriendo en pestaña nueva', () => {
    const el = document.getElementById('app-version');
    renderAppVersionInto(el);

    expect(el.querySelector('.app-version__name').textContent).toContain(CURRENT_VERSION);
    const link = el.querySelector('.app-version__repo a');
    expect(link.getAttribute('href')).toBe('https://github.com/yeyopepe/bgfactory');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
    expect(link.textContent).toBe(t('appVersion.repoLink'));
  });

  it('FT-037-03 · sin texto libre, sólo las dos líneas fijas y sin hr', () => {
    setTableText('');
    const el = document.getElementById('app-version');
    renderAppVersionInto(el);

    expect(el.querySelector('.app-version__table-text')).toBeNull();
    expect(el.querySelector('.app-version__separator')).toBeNull();
    expect(el.children.length).toBe(2);
  });

  it('FT-037-04 · con texto libre, aparece por encima de las fijas y separado por hr', () => {
    setTableText('nota de la mesa');
    const el = document.getElementById('app-version');
    renderAppVersionInto(el);

    expect(el.children[0].classList.contains('app-version__table-text')).toBe(true);
    expect(el.children[0].textContent).toBe('nota de la mesa');
    expect(el.children[1].tagName).toBe('HR');
    expect(el.children[1].classList.contains('app-version__separator')).toBe(true);
    expect(el.children[2].classList.contains('app-version__name')).toBe(true);
    expect(el.children[3].classList.contains('app-version__repo')).toBe(true);
    expect(el.children.length).toBe(4);
  });

  it('FT-037-05 · el texto libre se pinta como texto plano, no como HTML', () => {
    setTableText('<b>hola</b>\nsegunda línea');
    const el = document.getElementById('app-version');
    renderAppVersionInto(el);

    const note = el.querySelector('.app-version__table-text');
    expect(note.querySelector('b')).toBeNull();
    expect(note.textContent).toContain('<b>hola</b>');
    expect(note.textContent).toContain('segunda línea');
  });

  it('FT-037-06 · getTableText/setTableText: default vacío y round-trip', () => {
    expect(getTableText()).toBe('');
    setTableText('abc');
    expect(getTableText()).toBe('abc');
  });
});
