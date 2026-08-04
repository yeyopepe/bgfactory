// Modelo mínimo de "grupo" (agrupación de elementos, cualquiera que sea su
// tipo). Análogo a core/resource.js.

export function createGroup({ id, name = '' } = {}) {
  return { id: id || crypto.randomUUID(), name };
}

export function updateGroup(group, changes) {
  return { ...group, ...changes };
}

export function isGroupNameTaken(name, groups, excludeId = null) {
  const normalizedName = name.trim().toLowerCase();
  return groups.some(
    (g) => g.name.trim().toLowerCase() === normalizedName && g.id !== excludeId
  );
}

// Ids de los componentes (de cualquier tipo) que referencian `grupoId` (vacío
// si ninguno) — grupoId es siempre una propiedad plana de primer nivel del
// componente, a diferencia de las referencias a recursos (sin necesidad de un
// recorrido profundo tipo collectDeepValues de core/resource.js).
export function getComponentsUsingGroup(groupId, components) {
  return components.filter((component) => component.grupoId === groupId).map((component) => component.id);
}
