// Registro de propiedades propio de un grupo de componentes (agrupación en modo
// edición). Mismo patrón que core/tag.js/core/resource.js. A diferencia de esas
// colecciones, `id` no se autogenera aquí: siempre lo fija quien llama
// (nextGroupId() de core/component.js al formar el grupo, o el valor editado
// desde ui/groupModal.js al renombrarlo).

export function createGroup({ id, bloqueado = 'ninguno', mostrarTooltip = false, subirAlMoverInteractuar = false, oculto = false, etiquetaIds = [] } = {}) {
  return { id, bloqueado, mostrarTooltip, subirAlMoverInteractuar, oculto, etiquetaIds };
}

export function updateGroup(group, changes) {
  return { ...group, ...changes };
}

// A diferencia de isTagNameTaken (nombre libre, normalizado), aquí el `id` es
// literal: comparación exacta, sin recortar ni normalizar mayúsculas.
export function isGroupIdTaken(id, groups, excludeId = null) {
  return groups.some((g) => g.id === id && g.id !== excludeId);
}

// Propiedades generales efectivas de un componente: las de su grupo si
// pertenece a uno (mientras dure la agrupación, gobiernan el comportamiento
// real en mesa sustituyendo a las propias del componente), o las suyas
// propias en caso contrario. Salvaguarda: si el componente tiene `groupId`
// pero no hay registro de grupo con ese id (no debería ocurrir, ver alta
// automática al "Agrupar"), cae también a las propiedades propias.
export function getEffectiveGeneralProps(component, groups) {
  if (component.groupId != null) {
    const group = groups.find((g) => g.id === component.groupId);
    if (group) {
      return {
        bloqueado: group.bloqueado,
        oculto: group.oculto,
        mostrarTooltip: group.mostrarTooltip,
        subirAlMoverInteractuar: group.subirAlMoverInteractuar,
        etiquetaIds: group.etiquetaIds,
      };
    }
  }
  return {
    bloqueado: component.bloqueado,
    oculto: component.oculto,
    mostrarTooltip: component.mostrarTooltip,
    subirAlMoverInteractuar: component.subirAlMoverInteractuar,
    etiquetaIds: component.etiquetaIds,
  };
}

// Ids de los grupos (de `groups`) que tienen `tagId` entre sus etiquetas propias
// — mismo criterio que getComponentsUsingTag (core/tag.js), aplicado al registro
// de grupo en vez de al componente.
export function getGroupsUsingTag(tagId, groups) {
  return groups.filter((g) => g.etiquetaIds.includes(tagId)).map((g) => g.id);
}

// Backfill de guardados anteriores a la introducción de este registro: por cada
// `groupId` distinto presente en `components` (con 2+ miembros, mismo criterio
// que una fila de grupo válida) sin entrada ya en `existingGroups`, añade una
// con valores por defecto. Pura: no muta `existingGroups`.
export function deriveMissingGroups(components, existingGroups) {
  const existingIds = new Set(existingGroups.map((g) => g.id));
  const memberCountByGroupId = new Map();
  for (const c of components) {
    if (c.groupId == null) continue;
    memberCountByGroupId.set(c.groupId, (memberCountByGroupId.get(c.groupId) ?? 0) + 1);
  }
  const derived = [];
  for (const [groupId, count] of memberCountByGroupId) {
    if (count < 2 || existingIds.has(groupId)) continue;
    derived.push(createGroup({ id: groupId }));
  }
  return [...existingGroups, ...derived];
}
