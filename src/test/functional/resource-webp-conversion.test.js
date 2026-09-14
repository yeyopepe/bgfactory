// Funcionalidad 010 — Conversión automática a WebP al subir imágenes.
// Nivel state: `core/imageConversion.js#convertImageToWebP` es una función pura,
// sin montar ninguna UI.

import { describe, it, expect, registerFeature } from '../harness.js';
import { convertImageToWebP } from '../../core/imageConversion.js';

registerFeature({ primary: 10 });

// PNG 1×1 real, válido, para que <img>/<canvas> lo puedan decodificar en el
// navegador headless.
const PNG_1X1_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('010 — Conversión automática a WebP', () => {
  it('FT-010-01 · PNG/JPG/JPEG se convierten a WebP', async () => {
    for (const name of ['foto.png', 'foto.jpg', 'foto.jpeg']) {
      // eslint-disable-next-line no-await-in-loop
      const result = await convertImageToWebP({ name, type: 'image/png' }, PNG_1X1_DATA_URL);
      expect(result.mimeType).toBe('image/webp');
      expect(result.fileName.endsWith('.webp')).toBe(true);
      expect(result.dataUrl.startsWith('data:image/webp')).toBe(true);
    }
  });

  it('FT-010-02 · WebP, SVG y GIF ya subidos no se reconvierten', async () => {
    const casos = [
      { name: 'ya.webp', type: 'image/webp' },
      { name: 'vector.svg', type: 'image/svg+xml' },
      { name: 'animado.gif', type: 'image/gif' },
    ];
    for (const file of casos) {
      const originalDataUrl = `data:${file.type};base64,AA==`;
      // eslint-disable-next-line no-await-in-loop
      const result = await convertImageToWebP(file, originalDataUrl);
      expect(result).toEqual({ dataUrl: originalDataUrl, fileName: file.name, mimeType: file.type });
    }
  });

  it('FT-010-03 · si la conversión falla, se guarda el original sin bloquear ni avisar', async () => {
    const file = { name: 'roto.png', type: 'image/png' };
    const dataUrlCorrupto = 'data:image/png;base64,esto-no-es-una-imagen-valida';

    const result = await convertImageToWebP(file, dataUrlCorrupto);

    expect(result).toEqual({ dataUrl: dataUrlCorrupto, fileName: 'roto.png', mimeType: 'image/png' });
  });
});
