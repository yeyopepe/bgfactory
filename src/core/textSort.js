// Utilidad de ordenación por nombre, reutilizada por cualquier listado de la
// app que muestre elementos con un campo `name` (grupos, recursos...).

// Devuelve una copia nueva de `items` ordenada alfabéticamente por `.name`,
// insensible a mayúsculas y a tildes (p.ej. "Águila" y "águila" quedan
// juntos), sin mutar el array recibido.
export function sortByName(items) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}
