// Conversor de Markdown a HTML para el componente "Visor de documentos".
// Envoltorio mínimo sobre la librería de terceros vendorizada en
// vendor/marked.js (CommonMark + GFM completo). El HTML resultante sigue
// pasando por sanitizeHtml.js antes de insertarse en el DOM (marked no
// sanitiza su salida).

import { parse } from '../vendor/marked.js';

export function markdownToHtml(text) {
  return parse(text || '');
}
