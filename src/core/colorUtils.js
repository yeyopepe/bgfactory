// Conversión de un color hex a rgba con un nivel de transparencia, usada por
// el fondo de TextBox/Forma (cara de carta) en sus dos puntos de renderizado
// (ui/componentRenderer.js y ui/cardEditorModal.js). Datos puros, análogo en
// espíritu a core/textBoxLayout.js: sin dependencias de otras capas.

export function hexToRgba(hex, transparenciaPercent) {
  if (!hex) return 'transparent';

  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  const alpha = 1 - (transparenciaPercent || 0) / 100;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
