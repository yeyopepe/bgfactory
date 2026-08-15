// Sistema reutilizable de variables de texto: sustituye `{nombre}` por un valor
// resuelto en runtime dentro de campos de texto libre del componente (tooltipTexto,
// tituloTexto). Diseñado para ampliarse con variables futuras sin rediseño —
// añadir una variable nueva es solo ampliar getAvailableVariables.

// Variables disponibles para un componente concreto, según su tipo. Ausencia de
// una clave para el tipo actual se interpreta como "no aplica" (ver resolveTextVariables).
export function getAvailableVariables(component) {
  if (component.type === 'mazo') {
    return { cards_current: String((component.properties.cartaIds || []).length) };
  }
  return {};
}

// Sustituye cada `{nombre}` de `text` por su valor en getAvailableVariables(component),
// si existe. Una variable no aplicable al tipo de componente actual se deja literal,
// sin sustituir (nunca cadena vacía).
export function resolveTextVariables(text, component) {
  const vars = getAvailableVariables(component);
  return text.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match));
}
