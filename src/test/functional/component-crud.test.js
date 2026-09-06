// Funcionalidad 002 — Alta/edición/borrado de componentes.
// Nivel estado salvo FT-002-12 (interfaz).

import { describe, it, expect, beforeEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode } from '../helpers.js';
import { getComponents, addComponent, removeComponent, replaceComponent } from '../../core/state.js';
import { createComponent, updateComponent } from '../../core/component.js';
import { createDefaultComponent } from '../../ui/componentModal.js';

registerFeature({ primary: 2 });

// Reproduce la condición de `validateId` (closure privada de ui/componentModal.js):
// id no vacío y no duplicado de OTRO componente. `editingId` = id del componente
// que se está editando (se excluye de la comprobación de duplicado), '' al crear.
function isIdValid(rawId, editingId = '') {
  const newId = String(rawId).trim();
  if (!newId) return false;
  return !getComponents().some((c) => c.id === newId && c.id !== editingId);
}

describe('002 — Alta/edición/borrado de componentes', () => {
  beforeEach(resetState);

  it('FT-002-01 · crear una carta la añade al estado con tipo e id', () => {
    addComponent(createDefaultComponent('carta'));
    expect(getComponents()).toHaveLength(1);
    expect(getComponents()[0].type).toBe('carta');
    expect(typeof getComponents()[0].id).toBe('string');
    expect(getComponents()[0].id.length).toBeGreaterThan(0);
  });

  it('FT-002-02 · crear un componente de cada tipo básico deja uno de cada', () => {
    const tipos = ['texto', 'tableroSimple', 'dado', 'carta', 'mazo'];
    for (const t of tipos) addComponent(createDefaultComponent(t));
    expect(getComponents().map((c) => c.type).sort()).toEqual([...tipos].sort());
  });

  it('FT-002-03 · eliminar un componente recién creado deja el estado vacío', () => {
    const c = createDefaultComponent('carta');
    addComponent(c);
    expect(getComponents()).toHaveLength(1);
    removeComponent(c.id);
    expect(getComponents()).toHaveLength(0);
  });

  it('FT-002-04 · un id vacío o solo espacios no es válido', () => {
    addComponent(createDefaultComponent('carta'));
    expect(isIdValid('')).toBe(false);
    expect(isIdValid('   ')).toBe(false);
    expect(isIdValid('carta-1')).toBe(true);
  });

  it('FT-002-05 · un id duplicado de otro componente no es válido', () => {
    const a = createDefaultComponent('carta');
    a.id = 'alpha';
    const b = createDefaultComponent('dado');
    b.id = 'beta';
    addComponent(a);
    addComponent(b);
    // Editando 'alpha', ponerle el id de 'beta' no vale; un id libre sí.
    expect(isIdValid('beta', 'alpha')).toBe(false);
    expect(isIdValid('gamma', 'alpha')).toBe(true);
    // Editando 'beta', conservar su propio id sí vale (se excluye de la comprobación).
    expect(isIdValid('beta', 'beta')).toBe(true);
  });

  it('FT-002-06 · createComponent() genera id no vacío y los defaults generales', () => {
    const c = createComponent({ type: 'carta' });
    expect(typeof c.id).toBe('string');
    expect(c.id.length).toBeGreaterThan(0);
    expect(c.order).toBeNull();
    expect(c.copyOf).toBeNull();
    expect(c.groupId).toBeNull();
    expect(c.sincronizado).toBe(true);
    expect(c.bloqueado).toBe('ninguno');
    expect(c.oculto).toBe(false);
    expect(c.accionClickDerecho).toBe('ninguno');
  });

  it('FT-002-07 · createDefaultComponent() cubre los 7 tipos con sus valores por defecto', () => {
    const tipos = ['texto', 'tableroSimple', 'tableroPersonalizado', 'dado', 'documento', 'carta', 'mazo'];
    for (const tipo of tipos) {
      const c = createDefaultComponent(tipo);
      expect(c.type).toBe(tipo);
      // Todos menos 'texto' fijan `properties` con contenido por defecto.
      if (tipo !== 'texto') {
        expect(Object.keys(c.properties).length).toBeGreaterThan(0);
      }
    }
  });

  it('FT-002-08 · el tipo no cambia por la vía de edición de la app', () => {
    // `updateComponent` es un merge genérico y dejaría pasar `type`; la
    // inmutabilidad la garantiza la UI (la modal no ofrece cambiarlo), igual
    // que la validación de id de FT-002-04/05. Este caso fija ese contrato:
    // la vía de edición real parte de `workingComponent` sin tocar `type`.
    const c = createDefaultComponent('carta');
    addComponent(c);
    const editado = updateComponent(getComponents()[0], { name: 'Renombrada' });
    replaceComponent(c.id, editado);
    expect(getComponents()[0].type).toBe('carta');
    expect(getComponents()[0].name).toBe('Renombrada');
  });

  it('FT-002-09 · editar una propiedad general y persistirla en el estado', () => {
    const c = createDefaultComponent('carta');
    addComponent(c);
    replaceComponent(c.id, updateComponent(getComponents()[0], { bloqueado: 'juego' }));
    expect(getComponents()[0].bloqueado).toBe('juego');
  });

  it('FT-002-10 · addComponent apila el nuevo en order=1 y desplaza los demás', () => {
    const a = createDefaultComponent('carta');
    const b = createDefaultComponent('dado');
    const c = createDefaultComponent('mazo');
    addComponent(a);
    addComponent(b);
    addComponent(c);
    const byId = Object.fromEntries(getComponents().map((x) => [x.id, x.order]));
    expect(byId[c.id]).toBe(1); // el último añadido, arriba del todo
    expect(byId[b.id]).toBe(2);
    expect(byId[a.id]).toBe(3); // el primero añadido, al fondo
  });

  it('FT-002-11 · removeComponent recompacta el order a 1..n contiguo', () => {
    const a = createDefaultComponent('carta');
    const b = createDefaultComponent('dado');
    const d = createDefaultComponent('mazo');
    addComponent(a);
    addComponent(b);
    addComponent(d);
    removeComponent(b.id);
    expect(getComponents()).toHaveLength(2);
    expect(getComponents().map((x) => x.order).sort()).toEqual([1, 2]);
  });

  it('FT-002-12 · alta → pintado → borrado → no pintado (interfaz)', () => {
    const c = createDefaultComponent('carta');
    addComponent(c);
    let content = mountEditMode();
    expect(content.querySelectorAll('.carta').length).toBe(1);

    removeComponent(c.id);
    content = mountEditMode();
    expect(content.querySelectorAll('.carta').length).toBe(0);
  });
});
