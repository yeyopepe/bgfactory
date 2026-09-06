// Funcionalidad 005 — Elementos tipo Copia, vinculados y sincronizados con un
// original. Cobertura secundaria: 022 (componente "carta").
// Nivel interfaz. Caso de ejemplo completo del framework.

import { describe, it, expect, beforeEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode } from '../helpers.js';
import { getComponents, addComponent, replaceComponent, removeComponent } from '../../core/state.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { createCopy, updateComponent } from '../../core/component.js';

registerFeature({ primary: 5, secondary: [22] });

// Crea `original` + `n` copias vinculadas, todas en el estado. Devuelve el original.
function seedOriginalConCopias(tipo, n) {
  const original = createDefaultComponent(tipo);
  original.id = `orig-${tipo}`;
  addComponent(original);
  for (let i = 0; i < n; i += 1) {
    addComponent(createCopy(getComponents().find((c) => c.id === original.id), getComponents()));
  }
  return original;
}

describe('005 — Copia sincronizada de una carta', () => {
  beforeEach(resetState);

  it('FT-005-01 · un cambio de diseño en el original se propaga a la copia sincronizada', () => {
    mountEditMode();

    // 1. Crear una carta.
    const original = createDefaultComponent('carta');
    addComponent(original);
    expect(getComponents()).toHaveLength(1);

    // 2. Crear una copia sincronizada (lo mismo que hace "Copiar" en editMode.js).
    addComponent(createCopy(original, getComponents()));
    mountEditMode();
    expect(getComponents()).toHaveLength(2);

    const copia = getComponents().find((c) => c.copyOf === original.id);
    expect(copia).toBeTruthy();
    expect(copia.sincronizado).toBe(true);
    expect(copia.groupId).toBeNull();

    // 3. Editar el diseño de la carta ORIGINAL (color de fondo de la cara frontal).
    const origActual = getComponents().find((c) => c.id === original.id);
    const caraActual = origActual.properties.caraFrontal;
    const edited = updateComponent(origActual, {
      properties: {
        caraFrontal: { ...caraActual, colorFondo: '#ff0000', fondoTipo: 'color' },
      },
    });
    replaceComponent(original.id, edited); // dispara syncCopyWithOriginal en state.js
    mountEditMode();

    // 4. El cambio está en el original Y en la copia.
    const orig = getComponents().find((c) => c.id === original.id);
    const cop = getComponents().find((c) => c.copyOf === original.id);
    expect(orig.properties.caraFrontal.colorFondo).toBe('#ff0000');
    expect(orig.properties.caraFrontal.fondoTipo).toBe('color');
    expect(cop.properties.caraFrontal.colorFondo).toBe('#ff0000');
    expect(cop.properties.caraFrontal.fondoTipo).toBe('color');

    // 5. En pantalla se dibujan las dos cartas.
    const content = document.getElementById('content');
    expect(content.querySelectorAll('.carta').length).toBe(2);
  });

  it('FT-005-02 · la primera copia lleva sufijo -COPY-001 y la segunda -COPY-002', () => {
    const original = seedOriginalConCopias('dado', 2);
    const copias = getComponents().filter((c) => c.copyOf === original.id).map((c) => c.id).sort();
    expect(copias).toEqual([`${original.id}-COPY-001`, `${original.id}-COPY-002`]);
  });

  it('FT-005-03 · al borrar una copia se reutiliza su hueco en la siguiente', () => {
    const original = seedOriginalConCopias('dado', 3); // 001, 002, 003
    removeComponent(`${original.id}-COPY-002`);
    addComponent(createCopy(getComponents().find((c) => c.id === original.id), getComponents()));
    const copias = getComponents().filter((c) => c.copyOf === original.id).map((c) => c.id).sort();
    expect(copias).toEqual([
      `${original.id}-COPY-001`,
      `${original.id}-COPY-002`, // hueco reutilizado
      `${original.id}-COPY-003`,
    ]);
  });

  it('FT-005-04 · cambiar el id del original renombra en cascada las copias', () => {
    const original = seedOriginalConCopias('dado', 1);
    const orig = getComponents().find((c) => c.id === original.id);
    replaceComponent(original.id, updateComponent(orig, { id: 'renombrado' }));
    const copia = getComponents().find((c) => c.copyOf === 'renombrado');
    expect(copia).toBeTruthy();
    expect(copia.id).toBe('renombrado-COPY-001');
    // Ya no queda ninguna copia apuntando al id viejo.
    expect(getComponents().some((c) => c.copyOf === original.id)).toBe(false);
  });

  it('FT-005-05 · al editar el original se sincronizan nombre, tamaño y diseño del tipo', () => {
    const original = seedOriginalConCopias('carta', 1);
    const orig = getComponents().find((c) => c.id === original.id);
    replaceComponent(original.id, updateComponent(orig, {
      name: 'Sincronizada',
      width: 250,
      height: 350,
      properties: {
        caraTrasera: { ...orig.properties.caraTrasera, bordeGrosor: 7 },
      },
    }));
    const copia = getComponents().find((c) => c.copyOf === original.id);
    expect(copia.name).toBe('Sincronizada');
    expect(copia.width).toBe(250);
    expect(copia.height).toBe(350);
    expect(copia.properties.caraTrasera.bordeGrosor).toBe(7);
  });

  it('FT-005-06 · posición y cara mostrada de la copia son independientes del original', () => {
    const original = seedOriginalConCopias('carta', 1);
    const copiaId = `${original.id}-COPY-001`;

    // La copia se mueve y voltea su propia cara.
    const copia = getComponents().find((c) => c.id === copiaId);
    replaceComponent(copiaId, updateComponent(copia, {
      x: 999, y: 777,
      properties: { caraActual: 'frontal' },
    }));

    // Editar el original NO revierte la posición ni la cara de la copia.
    const orig = getComponents().find((c) => c.id === original.id);
    replaceComponent(original.id, updateComponent(orig, { name: 'x', properties: { caraActual: 'trasera' } }));

    const cop = getComponents().find((c) => c.id === copiaId);
    expect(cop.x).toBe(999);
    expect(cop.y).toBe(777);
    expect(cop.properties.caraActual).toBe('frontal');
  });

  it('FT-005-07 · bloqueado sigue al original solo mientras sincronizado es true', () => {
    const original = seedOriginalConCopias('dado', 1);
    const copiaId = `${original.id}-COPY-001`;

    // Sincronizada: un cambio de bloqueado en el original llega a la copia.
    replaceComponent(original.id, updateComponent(getComponents().find((c) => c.id === original.id), { bloqueado: 'juego' }));
    expect(getComponents().find((c) => c.id === copiaId).bloqueado).toBe('juego');

    // Desincronizar la copia y fijarle su propio bloqueado.
    replaceComponent(copiaId, updateComponent(getComponents().find((c) => c.id === copiaId), { sincronizado: false, bloqueado: 'ninguno' }));

    // Ahora un cambio en el original ya no toca a la copia.
    replaceComponent(original.id, updateComponent(getComponents().find((c) => c.id === original.id), { bloqueado: 'todos' }));
    expect(getComponents().find((c) => c.id === copiaId).bloqueado).toBe('ninguno');
  });

  it('FT-005-08 · borrado en cascada del original; borrar una copia no afecta al resto', () => {
    const original = seedOriginalConCopias('dado', 2);

    // Borrar una copia: el original y la otra copia siguen.
    removeComponent(`${original.id}-COPY-001`);
    expect(getComponents().some((c) => c.id === original.id)).toBe(true);
    expect(getComponents().some((c) => c.id === `${original.id}-COPY-002`)).toBe(true);

    // Borrar el original: se lleva por delante la copia que quedaba.
    removeComponent(original.id);
    expect(getComponents()).toHaveLength(0);
  });

  it('FT-005-09 · createCopy sobre una copia vincula a la copia (la UI impide llegar aquí)', () => {
    const original = seedOriginalConCopias('dado', 1);
    const copia = getComponents().find((c) => c.copyOf === original.id);
    // A nivel de dato nada lo impide; en la app, ui/componentList.js oculta
    // "Copiar"/"Clonar" en la fila de una copia, así que este camino no existe.
    const copiaDeCopia = createCopy(copia, getComponents());
    expect(copiaDeCopia.copyOf).toBe(copia.id);
    expect(copiaDeCopia.id).toBe(`${copia.id}-COPY-001`);
  });
});
