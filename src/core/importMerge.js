// Lógica de fusión de una importación: combina la selección de
// componentes/recursos/etiquetas leída de un fichero con el estado actual del
// juego, según el modo elegido (añadir/sobrescribir) y el comportamiento ante
// id duplicado (sobrescribir/mantener ambos). Sin dependencias de DOM ni de
// core/state.js: recibe y devuelve datos planos, quien la invoca decide cómo
// aplicarlo al estado (mismo criterio que core/component.js / core/resource.js).

import { createTag, isTagNameTaken } from './tag.js';
import { normalizeComponentEtiquetaIds } from './component.js';
import { t } from './i18n.js';

const RESOURCE_REF_KEYS = new Set(['imagenResourceId', 'fuenteResourceId']);

// Calcula el siguiente id libre para `baseId` con el sufijo "-imported" (o
// "-imported(n)" si también choca), análogo a nextCloneId (core/component.js)
// pero genérico: opera sobre el conjunto de ids ya usados que le pasen,
// indistintamente de si son de componente, recurso o etiqueta.
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
// (imagenResourceId/fuenteResourceId) presente en el mapa de renombrado
// correspondiente, en cualquier nivel de anidamiento.
function remapRefsDeep(value, resourceIdMap) {
  if (Array.isArray(value)) {
    return value.map((item) => remapRefsDeep(item, resourceIdMap));
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (RESOURCE_REF_KEYS.has(key) && typeof item === 'string' && resourceIdMap.has(item)) {
        out[key] = resourceIdMap.get(item);
      } else {
        out[key] = remapRefsDeep(item, resourceIdMap);
      }
    }
    return out;
  }
  return value;
}

// Reescribe, solo en los componentes seleccionados para importar, las
// referencias a recursos/etiquetas cuyo id se haya renombrado por conflicto
// ("mantener ambos"). Los componentes ya existentes no se tocan aquí.
// `etiquetaIds` es propiedad plana de primer nivel del componente, igual que
// `image`, así que se remapea aquí en vez de dentro de remapRefsDeep (que
// solo recorre `properties`).
function remapComponentRefs(components, resourceIdMap, tagIdMap) {
  if (resourceIdMap.size === 0 && tagIdMap.size === 0) return components;
  return components.map((component) => {
    let image = component.image;
    if (typeof image === 'string' && resourceIdMap.has(image)) image = resourceIdMap.get(image);
    const etiquetaIds = component.etiquetaIds.map((id) => (tagIdMap.has(id) ? tagIdMap.get(id) : id));
    const properties = remapRefsDeep(component.properties ?? {}, resourceIdMap);
    return { ...component, image, etiquetaIds, properties };
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

// Deduplica nombres de etiquetas tras el merge por id: para cada etiqueta
// cuyo nombre ya aparece antes en la lista, renombra añadiendo " (importado)"
// (o " (importado n)" si esa forma también colisiona). Devuelve las
// etiquetas deduplicated y un array de renombres aplicados.
function dedupeTagNames(tags) {
  const result = [];
  const seenNames = new Map();
  const renames = [];

  for (const tag of tags) {
    const normalizedName = tag.name.trim().toLowerCase();

    if (seenNames.has(normalizedName)) {
      let newName;
      const root = `${tag.name} (importado)`;
      const rootNormalized = root.trim().toLowerCase();

      if (!seenNames.has(rootNormalized)) {
        newName = root;
        seenNames.set(rootNormalized, true);
      } else {
        let n = 2;
        while (true) {
          const candidate = `${tag.name} (importado ${n})`;
          const candidateNormalized = candidate.trim().toLowerCase();
          if (!seenNames.has(candidateNormalized)) {
            newName = candidate;
            seenNames.set(candidateNormalized, true);
            break;
          }
          n += 1;
        }
      }

      renames.push({ tagId: tag.id, oldName: tag.name, newName });
      result.push({ ...tag, name: newName });
    } else {
      seenNames.set(normalizedName, true);
      result.push(tag);
    }
  }

  return { tags: result, renames };
}

// Punto de entrada: fusiona la selección de una importación con el estado
// actual, resuelve las referencias rotas resultantes (recurso ausente se
// descarta, etiqueta ausente se autocrea) y devuelve el estado final más un
// informe de los avisos generados (una fila por referencia rota detectada).
export function mergeImportedGame({
  mode,
  conflictMode,
  existingComponents,
  existingResources,
  existingTags,
  selectedComponents,
  selectedResources,
  selectedTags,
  allImportedResources = [],
  allImportedTags = [],
}) {
  const { result: resources, idMap: resourceIdMap } = mergeCollection(existingResources, selectedResources, mode, conflictMode);
  let { result: tags, idMap: tagIdMap } = mergeCollection(existingTags, selectedTags, mode, conflictMode);

  const { tags: dedupedTags, renames: tagRenames } = dedupeTagNames(tags);
  tags = dedupedTags;

  // Componentes importados pueden venir de un fichero exportado con formato
  // antiguo (campo escalar `grupoId`, array `grupoIds`, o su ausencia total)
  // — se normalizan aquí, antes de remapear referencias, para no asumir que
  // ya están en el formato `etiquetaIds: string[]` actual.
  const normalizedSelectedComponents = selectedComponents.map(normalizeComponentEtiquetaIds);
  const remappedSelectedComponents = remapComponentRefs(normalizedSelectedComponents, resourceIdMap, tagIdMap);
  const { result: components, insertedIds: importedComponentIds } = mergeCollection(existingComponents, remappedSelectedComponents, mode, conflictMode);

  const resourceIds = new Set(resources.map((r) => r.id));
  const tagIds = new Set(tags.map((t) => t.id));
  const createdTagIds = new Set();
  const report = [];

  for (const rename of tagRenames) {
    report.push({
      tipoError: 'etiquetaDuplicada',
      solucion: t('importReport.solution.tagRenamed'),
      elemento: rename.newName,
    });
  }

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
          solucion: t('importReport.solution.componentWithoutResource'),
          elemento: findNameById(ref.value, allImportedResources),
        });
      }
    }

    for (let i = 0; i < component.etiquetaIds.length; i += 1) {
      const etiquetaId = component.etiquetaIds[i];
      if (!etiquetaId || tagIds.has(etiquetaId)) continue;
      const candidateName = findNameById(etiquetaId, allImportedTags);

      if (createdTagIds.has(etiquetaId)) continue;

      const existingTagWithSameName = tags.find(
        (t) => isTagNameTaken(candidateName, [t], etiquetaId)
      );

      if (existingTagWithSameName) {
        component.etiquetaIds[i] = existingTagWithSameName.id;
        changed = true;
        report.push({
          tipoError: 'etiquetaDuplicada',
          solucion: t('importReport.solution.tagLinkedToExisting'),
          elemento: candidateName,
        });
      } else {
        tags.push(createTag({ id: etiquetaId, name: candidateName }));
        tagIds.add(etiquetaId);
        createdTagIds.add(etiquetaId);
        changed = true;
        report.push({
          componentId: component.id,
          tipoError: 'etiqueta',
          solucion: t('importReport.solution.tagAutoCreated'),
          elemento: candidateName,
        });
      }
    }

    return changed ? { ...component } : component;
  });

  return { components: finalComponents, resources, tags, report };
}
