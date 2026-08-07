// Hex a rgba con transparencia. Usado en fondo de TextBox/Forma (cara de
// carta): ui/componentRenderer.js y ui/visualEditorModal.js. Datos puros,
// sin dependencias, análogo a core/textBoxLayout.js.

export function hexToRgba(hex, transparenciaPercent) {
  if (!hex) return 'transparent';

  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  const alpha = 1 - (transparenciaPercent || 0) / 100;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Aclara (percent > 0) u oscurece (percent < 0) mezclando con blanco/negro.
// Usado en bisel del borde de 'tableroSimple'/'dado' (ui/componentRenderer.js)
// y 'tableroPersonalizado' (ui/visualEditorModal.js, design/docs/style/INDEX.md).
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
