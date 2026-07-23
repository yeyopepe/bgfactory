// Lógica de fusión de una importación (change 00065): combina la selección de
// componentes/recursos/mazos leída de un fichero con el estado actual del
// juego, según el modo elegido (añadir/sobrescribir) y el comportamiento ante
// id duplicado (sobrescribir/mantener ambos). Sin dependencias de DOM ni de
// core/state.js: recibe y devuelve datos planos, quien la invoca decide cómo
// aplicarlo al estado (mismo criterio que core/component.js / core/resource.js).

import { createDeck } from './deck.js';

const RESOURCE_REF_KEYS = new Set(['imagenResourceId', 'fuenteResourceId']);

// Calcula el siguiente id libre para `baseId` con el sufijo "-imported" (o
// "-imported(n)" si también choca), análogo a nextCloneId (core/component.js)
// pero genérico: opera sobre el conjunto de ids ya usados que le pasen,
// indistintamente de si son de componente, recurso o mazo.
export function nextImportedId(baseId, usedIds) {
  const root = `${baseId}-imported`;
  if (!usedIds.has(root)) return root;
  let n = 2;
  while (usedIds.has(`${root}(${n})`)) n += 1;
  return `${root}(${n})`;
}

// Fusiona una colección seleccionada (`selected`) del mismo tipo con la
// colección existente (`existing`), según `mode`/`conflictMode`. Devuelve la
// colección resultante, un mapa `idOriginal -> idFinal` con los ids que se
// han tenido que renombrar (vacío si no ha habido ningún conflicto) y el
// conjunto de ids finales que proceden de `selected` (nuevos, sobrescritos o
// renombrados) para poder distinguirlos luego de los preexistentes intactos.
function mergeCollection(existing, selected, mode, conflictMode) {
  if (mode === 'overwrite') {
    const result = selected.map((item) => ({ ...item }));
    return { result, idMap: new Map(), insertedIds: new Set(result.map((item) => item.id)) };
  }

  const result = existing.map((item) => ({ ...item }));
  const existingIds = new Set(result.map((item) => item.id));
  const idMap = new Map();
  const insertedIds = new Set();

  for (const item of selected) {
    if (!existingIds.has(item.id)) {
      const copy = { ...item };
      result.push(copy);
      existingIds.add(copy.id);
      insertedIds.add(copy.id);
      continue;
    }
    if (conflictMode === 'overwrite') {
      const index = result.findIndex((r) => r.id === item.id);
      result[index] = { ...item };
      insertedIds.add(item.id);
      continue;
    }
    // conflictMode === 'keepBoth'
    const newId = nextImportedId(item.id, existingIds);
    idMap.set(item.id, newId);
    result.push({ ...item, id: newId });
    existingIds.add(newId);
    insertedIds.add(newId);
  }

  return { result, idMap, insertedIds };
}

// Reconstruye `value` reescribiendo cualquier referencia a un recurso
// (imagenResourceId/fuenteResourceId) o a un mazo (deckId) presente en el
// mapa de renombrado correspondiente, en cualquier nivel de anidamiento.
function remapRefsDeep(value, resourceIdMap, deckIdMap) {
  if (Array.isArray(value)) {
    return value.map((item) => remapRefsDeep(item, resourceIdMap, deckIdMap));
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (RESOURCE_REF_KEYS.has(key) && typeof item === 'string' && resourceIdMap.has(item)) {
        out[key] = resourceIdMap.get(item);
      } else if (key === 'deckId' && typeof item === 'string' && deckIdMap.has(item)) {
        out[key] = deckIdMap.get(item);
      } else {
        out[key] = remapRefsDeep(item, resourceIdMap, deckIdMap);
      }
    }
    return out;
  }
  return value;
}

// Reescribe, solo en los componentes seleccionados para importar, las
// referencias a recursos/mazos cuyo id se haya renombrado por conflicto
// ("mantener ambos"). Los componentes ya existentes no se tocan aquí.
function remapComponentRefs(components, resourceIdMap, deckIdMap) {
  if (resourceIdMap.size === 0 && deckIdMap.size === 0) return components;
  return components.map((component) => {
    let image = component.image;
    if (typeof image === 'string' && resourceIdMap.has(image)) image = resourceIdMap.get(image);
    const properties = remapRefsDeep(component.properties ?? {}, resourceIdMap, deckIdMap);
    return { ...component, image, properties };
  });
}

// Recoge, con capacidad de anularlas, todas las referencias a recursos
// (`image` + imagenResourceId/fuenteResourceId en cualquier nivel de
// `properties`) de un componente — mismo criterio de recorrido que
// collectResourceRefs (core/resource.js), pero conservando cómo poner a
// `null` cada una si resulta que apunta a un recurso ausente.
function collectResourceRefsWithPath(component) {
  const refs = [];
  if (typeof component.image === 'string') {
    refs.push({ value: component.image, setNull: () => { component.image = null; } });
  }
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => walk(item));
      return;
    }
    if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) {
        if (RESOURCE_REF_KEYS.has(key) && typeof value[key] === 'string') {
          refs.push({ value: value[key], setNull: () => { value[key] = null; } });
        } else {
          walk(value[key]);
        }
      }
    }
  };
  walk(component.properties ?? {});
  return refs;
}

function findNameById(id, items) {
  const found = items.find((item) => item.id === id);
  return found ? found.name : id;
}

// Punto de entrada: fusiona la selección de una importación con el estado
// actual, resuelve las referencias rotas resultantes (recurso ausente se
// descarta, mazo ausente se autocrea) y devuelve el estado final más un
// informe de los avisos generados (una fila por referencia rota detectada).
export function mergeImportedGame({
  mode,
  conflictMode,
  existingComponents,
  existingResources,
  existingDecks,
  selectedComponents,
  selectedResources,
  selectedDecks,
  allImportedResources = [],
  allImportedDecks = [],
}) {
  const { result: resources, idMap: resourceIdMap } = mergeCollection(existingResources, selectedResources, mode, conflictMode);
  const { result: decks, idMap: deckIdMap } = mergeCollection(existingDecks, selectedDecks, mode, conflictMode);

  const remappedSelectedComponents = remapComponentRefs(selectedComponents, resourceIdMap, deckIdMap);
  const { result: components, insertedIds: importedComponentIds } = mergeCollection(existingComponents, remappedSelectedComponents, mode, conflictMode);

  const resourceIds = new Set(resources.map((r) => r.id));
  const deckIds = new Set(decks.map((d) => d.id));
  const createdDeckIds = new Set();
  const report = [];

  const finalComponents = components.map((component) => {
    if (!importedComponentIds.has(component.id)) return component;

    const refs = collectResourceRefsWithPath(component);
    let changed = false;
    for (const ref of refs) {
      if (!resourceIds.has(ref.value)) {
        ref.setNull();
        changed = true;
        report.push({
          componentId: component.id,
          tipoError: 'recurso',
          solucion: 'Se añadió el componente sin ese recurso',
          elemento: findNameById(ref.value, allImportedResources),
        });
      }
    }

    const deckId = component.properties?.deckId;
    if (deckId && !deckIds.has(deckId)) {
      if (!createdDeckIds.has(deckId)) {
        decks.push(createDeck({ id: deckId, name: findNameById(deckId, allImportedDecks) }));
        deckIds.add(deckId);
        createdDeckIds.add(deckId);
      }
      changed = true;
      report.push({
        componentId: component.id,
        tipoError: 'mazo',
        solucion: 'Se creó el mazo automáticamente',
        elemento: findNameById(deckId, allImportedDecks),
      });
    }

    return changed ? { ...component } : component;
  });

  return { components: finalComponents, resources, decks, report };
}
