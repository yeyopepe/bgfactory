// Utilidad de ordenación por nombre, reutilizada por cualquier listado de la
// app que muestre elementos con un campo `name` (grupos, recursos...).

// Devuelve una copia nueva de `items` ordenada alfabéticamente por `.name`,
// insensible a mayúsculas y a tildes (p.ej. "Águila" y "águila" quedan
// juntos), sin mutar el array recibido.
export function sortByName(items) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

// Comparador genérico por valor (cambio 00165), reutilizado por la ordenación
// de columna de los paneles flotantes de modo edición: numérico si ambos
// valores son `number`, si no comparación de texto insensible a
// mayúsculas/tildes (mismo criterio que sortByName) y consciente de números
// dentro del texto (`numeric: true`, p.ej. "carta-2" antes que "carta-10").
export function compareValues(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'es', { sensitivity: 'base', numeric: true });
}
