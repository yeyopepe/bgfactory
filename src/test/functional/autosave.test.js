// Funcionalidad 029 — Autoguardado en el navegador.
// Nivel estado: usa saveState/loadState de core/persistence.js directamente
// (mismo camino que el autoguardado de main.js, sin sus listeners).

import { describe, it, expect, beforeEach, registerFeature } from '../harness.js';
import { resetState } from '../helpers.js';
import {
  getComponents, addComponent, loadComponents, replaceComponent, removeComponent,
  getPanelState, setPanelState, getResources, getResourcePanelState, getResourcesSeeded,
  getTags, addTag, getTagPanelState, getGroups, getAppTitle, setAppTitle, getTableText,
} from '../../core/state.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { updateComponent } from '../../core/component.js';
import { createTag } from '../../core/tag.js';
import { saveState, loadState } from '../../core/persistence.js';
import { DEFAULT_APP_TITLE } from '../../core/appTitle.js';
import { CURRENT_VERSION } from '../../data/version.js';

registerFeature({ primary: 29, secondary: [30] });

function persist() {
  saveState(
    getComponents(), getPanelState(), getResources(), getResourcePanelState(),
    getResourcesSeeded(), getTags(), getTagPanelState(), getGroups(),
    getAppTitle(), getTableText(),
  );
}

describe('029 — Autoguardado en el navegador', () => {
  beforeEach(resetState);

  it('FT-029-01 · tras crear un componente, el estado guardado lo contiene', () => {
    addComponent(createDefaultComponent('carta'));
    persist();

    const raw = localStorage.getItem('bgfactory:state');
    expect(typeof raw).toBe('string');
    const parsed = JSON.parse(raw);
    expect(parsed.components).toHaveLength(1);
    expect(parsed.version).toBe(CURRENT_VERSION);
  });

  it('FT-029-02 · una nueva carga recupera el componente guardado', () => {
    addComponent(createDefaultComponent('carta'));
    persist();

    // Simula recarga: vaciar el estado en memoria y rehidratar desde el guardado.
    loadComponents([]);
    expect(getComponents()).toHaveLength(0);

    const saved = loadState();
    expect(saved).toBeTruthy();
    expect(saved.error).toBeFalsy();
    loadComponents(saved.components);

    expect(getComponents()).toHaveLength(1);
    expect(getComponents()[0].type).toBe('carta');
  });

  it('FT-029-03 · el estado guardado refleja una edición de componente', () => {
    const c = createDefaultComponent('carta');
    addComponent(c);
    persist();
    replaceComponent(c.id, updateComponent(getComponents()[0], { name: 'Editada' }));
    persist();

    const parsed = JSON.parse(localStorage.getItem('bgfactory:state'));
    expect(parsed.components).toHaveLength(1);
    expect(parsed.components[0].name).toBe('Editada');
  });

  it('FT-029-04 · el estado guardado refleja un borrado de componente', () => {
    const a = createDefaultComponent('carta');
    const b = createDefaultComponent('dado');
    addComponent(a);
    addComponent(b);
    persist();
    removeComponent(a.id);
    persist();

    const parsed = JSON.parse(localStorage.getItem('bgfactory:state'));
    expect(parsed.components).toHaveLength(1);
    expect(parsed.components[0].type).toBe('dado');
  });

  it('FT-029-05 · se guarda y recupera el estado del panel', () => {
    setPanelState({ collapsed: true, width: 321 });
    persist();

    const saved = loadState();
    expect(saved.panelState).toBeTruthy();
    expect(saved.panelState.collapsed).toBe(true);
    expect(saved.panelState.width).toBe(321);
  });

  it('FT-029-06 · se guardan y recuperan las etiquetas', () => {
    addTag(createTag({ name: 'Héroes' }));
    persist();

    const saved = loadState();
    expect(Array.isArray(saved.tags)).toBe(true);
    expect(saved.tags.some((t) => t.name === 'Héroes')).toBe(true);
  });

  it('FT-029-07 · se guarda y recupera el título de cabecera; vacío ⇒ título por defecto', () => {
    setAppTitle('Mi partida');
    persist();
    expect(loadState().appTitle).toBe('Mi partida');

    // Guardado sin `appTitle`: loadState() devuelve el título por defecto.
    localStorage.setItem('bgfactory:state', JSON.stringify({ version: CURRENT_VERSION, components: [] }));
    expect(loadState().appTitle).toBe(DEFAULT_APP_TITLE);
  });

  it('FT-029-08 · loadState distingue misma versión / otra versión / corrupto / inexistente', () => {
    localStorage.removeItem('bgfactory:state');
    expect(loadState()).toBeNull();

    localStorage.setItem('bgfactory:state', JSON.stringify({ version: CURRENT_VERSION, components: [] }));
    expect(loadState().error).toBeFalsy();

    localStorage.setItem('bgfactory:state', JSON.stringify({ version: 999999, components: [] }));
    expect(loadState().error).toBe('version-mismatch');

    localStorage.setItem('bgfactory:state', '{ esto no es json');
    expect(loadState().error).toBe('corrupt');

    localStorage.setItem('bgfactory:state', JSON.stringify({ version: CURRENT_VERSION }));
    expect(loadState().error).toBe('corrupt'); // sin `components` array
  });

  it('FT-029-09 · un guardado sin panelState/tags no invalida el estado', () => {
    localStorage.setItem('bgfactory:state', JSON.stringify({ version: CURRENT_VERSION, components: [] }));
    const saved = loadState();
    expect(saved.error).toBeFalsy();
    expect(saved.panelState).toBeNull();
    expect(saved.tags).toEqual([]);
  });
});
