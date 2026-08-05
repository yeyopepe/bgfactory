// Conversión de un color hex a rgba con un nivel de transparencia, usada por
// el fondo de TextBox/Forma (cara de carta) en sus dos puntos de renderizado
// (ui/componentRenderer.js y ui/visualEditorModal.js). Datos puros, análogo en
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

// Aclara (percent > 0) u oscurece (percent < 0) un color hex mezclándolo con
// blanco/negro — usado para el bisel del borde de 'tableroSimple'/'dado'
// (ui/componentRenderer.js) y de 'tableroPersonalizado' (ui/visualEditorModal.js,
// STYLE_BIBLE.md sección 13).
export function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const mix = percent > 0 ? 255 : 0;
  const amount = Math.abs(percent);
  r = Math.round(r + (mix - r) * amount);
  g = Math.round(g + (mix - g) * amount);
  b = Math.round(b + (mix - b) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}
