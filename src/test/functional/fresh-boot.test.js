// Funcionalidad 036 — Contenido de ejemplo al arrancar una partida nueva.
// Nivel estado: reproduce el arranque "sin nada guardado" con las funciones
// públicas de core/, sin ejecutar main.js.

import { describe, it, expect, beforeEach, registerFeature } from '../harness.js';
import { resetState } from '../helpers.js';
import {
  getComponents, getResources, getResourcesSeeded,
  markResourcesSeeded, addResource, removeResource, replaceResource,
} from '../../core/state.js';
import { createResource, updateResource } from '../../core/resource.js';
import { DEFAULT_RESOURCES } from '../../data/defaultResources.js';

registerFeature({ primary: 36 });

// Reproduce main.js#seedDefaultResources(): marca el flag y siembra cada recurso.
function seedDefaultResources() {
  markResourcesSeeded();
  for (const data of DEFAULT_RESOURCES) {
    addResource(createResource({ ...data }));
  }
}

describe('036 — Contenido de ejemplo al arrancar', () => {
  beforeEach(resetState);

  it('FT-036-01 · arranque nuevo: sin componentes y con los recursos de ejemplo sembrados', () => {
    // resetState() ha dejado el estado vacío y sin `resourcesSeeded`, que es la
    // situación en la que main.js#seedDefaultResources() siembra la galería.
    expect(getComponents()).toHaveLength(0);
    expect(getResourcesSeeded()).toBe(false);

    seedDefaultResources();

    expect(getResources()).toHaveLength(DEFAULT_RESOURCES.length);
    expect(getResourcesSeeded()).toBe(true);
  });

  it('FT-036-02 · DEFAULT_RESOURCES son 2: una imagen y una tipografía con id fijo', () => {
    expect(DEFAULT_RESOURCES).toHaveLength(2);
    const porId = Object.fromEntries(DEFAULT_RESOURCES.map((r) => [r.id, r]));
    expect(porId['example-image'].type).toBe('imagen');
    expect(porId['example-font'].type).toBe('tipografia');
  });

  it('FT-036-03 · tras sembrar, la galería tiene los 2 recursos con sus ids fijos', () => {
    seedDefaultResources();
    const ids = getResources().map((r) => r.id).sort();
    expect(ids).toEqual(['example-font', 'example-image']);
    expect(getResourcesSeeded()).toBe(true);
  });

  it('FT-036-04 · los recursos de ejemplo se editan y eliminan como cualquier otro', () => {
    seedDefaultResources();

    removeResource('example-image');
    expect(getResources().map((r) => r.id)).toEqual(['example-font']);

    const font = getResources().find((r) => r.id === 'example-font');
    replaceResource('example-font', updateResource(font, { name: 'Tipografía renombrada' }));
    expect(getResources().find((r) => r.id === 'example-font').name).toBe('Tipografía renombrada');
  });

  it('FT-036-05 · con resourcesSeeded=true no se vuelve a sembrar aunque se borre un recurso', () => {
    // Primera siembra + borrado de uno de los recursos.
    seedDefaultResources();
    removeResource('example-image');
    expect(getResources().map((r) => r.id)).toEqual(['example-font']);

    // Segunda pasada de la lógica de arranque: la guarda es getResourcesSeeded(),
    // que ya es true, así que NO repone nada.
    if (!getResourcesSeeded()) {
      seedDefaultResources();
    }
    expect(getResources().map((r) => r.id)).toEqual(['example-font']);
  });
});
