// Registro central de las interacciones de un click sobre un componente en
// Modo Juego, por tipo. Único sitio que declara qué interacciones tiene
// programadas cada tipo, para listarlas en la pestaña "Generales" de
// ui/componentModal.js y comprobar si siguen activas al renderizar en Modo
// Juego (ui/componentRenderer.js).

export const TYPE_INTERACTIONS = {
  dado: [{ key: 'lanzar', label: 'Lanzar dado' }],
  carta: [{ key: 'voltear', label: 'Voltear carta' }],
  mazo: [{ key: 'sacarCarta', label: 'Sacar carta de arriba' }],
};

export function getInteractionsForType(type) {
  return TYPE_INTERACTIONS[type] || [];
}

export function isInteractionActive(component, key) {
  return !(component.interaccionesDesactivadas || []).includes(key);
}
