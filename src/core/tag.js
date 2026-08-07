// Modelo mínimo de "etiqueta" (agrupación de elementos, cualquiera que sea su
// tipo). Análogo a core/resource.js.

export function createTag({ id, name = '' } = {}) {
  return { id: id || crypto.randomUUID(), name };
}

export function updateTag(tag, changes) {
  return { ...tag, ...changes };
}

export function isTagNameTaken(name, tags, excludeId = null) {
  const normalizedName = name.trim().toLowerCase();
  return tags.some(
    (t) => t.name.trim().toLowerCase() === normalizedName && t.id !== excludeId
  );
}

// Ids de los componentes (de cualquier tipo) que tienen `tagId` entre sus
// etiquetas (vacío si ninguno). `etiquetaIds` es propiedad plana de primer nivel
// del componente, a diferencia de las referencias a recursos (sin recorrido
// profundo tipo collectDeepValues de core/resource.js). Un componente puede
// pertenecer a varias etiquetas a la vez.
export function getComponentsUsingTag(tagId, components) {
  return components.filter((component) => component.etiquetaIds.includes(tagId)).map((component) => component.id);
}
