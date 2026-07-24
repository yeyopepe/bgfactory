// Conversión de imágenes de la galería a WebP al subirlas, para reducir el
// espacio que ocupan (autoguardado, HTML exportado, JSON de exportar/importar)
// sin pérdida de calidad perceptible. Sin dependencias de otras capas.

const CONVERTIBLE_EXTENSIONS = ['png', 'jpg', 'jpeg'];
const WEBP_QUALITY = 0.92;

// `file` es el File original (para su nombre/mimeType) y `dataUrl` el
// resultado ya leído por FileReader.readAsDataURL(file). Devuelve
// { dataUrl, fileName, mimeType } — convertido a WebP si procede, o el
// original tal cual si no aplica o la conversión no puede completarse.
export async function convertImageToWebP(file, dataUrl) {
  const original = { dataUrl, fileName: file.name, mimeType: file.type };

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!CONVERTIBLE_EXTENSIONS.includes(ext)) return original;

  try {
    const webpDataUrl = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/webp', WEBP_QUALITY));
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen para convertirla'));
      img.src = dataUrl;
    });

    if (!webpDataUrl.startsWith('data:image/webp')) return original;

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return { dataUrl: webpDataUrl, fileName: `${baseName}.webp`, mimeType: 'image/webp' };
  } catch {
    return original;
  }
}
