// Sincroniza un único <style> con una regla @font-face por cada recurso de
// tipo tipografía, para que su dataUrl esté disponible como font-family en
// cualquier vista previa (o, en el futuro, en un componente que la use).

import { RESOURCE_TYPES } from '../core/resource.js';

const STYLE_ID = 'resource-font-faces';

const FORMAT_BY_EXTENSION = {
  ttf: 'truetype',
  otf: 'opentype',
  woff: 'woff',
  woff2: 'woff2',
};

export function fontFamilyFor(resourceId) {
  return `resource-font-${resourceId}`;
}

export function syncFontFaces(resources) {
  let styleEl = document.getElementById(STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = resources
    .filter((resource) => resource.type === RESOURCE_TYPES.FONT)
    .map((resource) => {
      const ext = resource.fileName.split('.').pop()?.toLowerCase();
      const format = FORMAT_BY_EXTENSION[ext] ?? 'truetype';
      return `@font-face { font-family: '${fontFamilyFor(resource.id)}'; src: url('${resource.dataUrl}') format('${format}'); }`;
    })
    .join('\n');
}
