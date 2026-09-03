// Portapapeles de "Copiar/Pegar estilo" entre cartas: vive solo en memoria de
// módulo durante la sesión del navegador — nunca se persiste ni se incluye
// en el guardado/exportado del juego. Solo puede contener un estilo copiado
// a la vez (el último sustituye por completo al anterior, sin historial).

import { t } from './i18n.js';

let clipboard = null;

function cloneFace(face) {
  return {
    ...face,
    ajusteImagen: { ...face.ajusteImagen },
    textBoxes: face.textBoxes.map((tb) => ({ ...tb })),
  };
}

// `data` solo debe incluir las claves de los bloques marcados al copiar:
// { generales, proporcion, esquinasRedondeadas, caraFrontal, caraTrasera }.
// `generales` incluye `etiquetaIds`/`etiquetaNames` (este último de solo
// lectura, para el mensaje de error si alguna etiqueta deja de existir al
// pegar; un componente puede tener varias etiquetas a la vez). `esquinasRedondeadas` viaja
// siempre junto a `proporcion`, dentro del bloque "Proporción" del checklist
// de copiar/pegar estilo. Los bloques copiados se clonan en profundidad para
// que futuras ediciones de la carta origen no muten el portapapeles ya
// guardado.
export function setStyleClipboard(data) {
  clipboard = {
    generales: data.generales ? { ...data.generales } : undefined,
    proporcion: data.proporcion,
    esquinasRedondeadas: data.esquinasRedondeadas,
    caraFrontal: data.caraFrontal ? cloneFace(data.caraFrontal) : undefined,
    caraTrasera: data.caraTrasera ? cloneFace(data.caraTrasera) : undefined,
  };
}

export function getStyleClipboard() {
  return clipboard;
}

export function hasStyleClipboard() {
  return clipboard !== null;
}

// Recorre solo los bloques presentes en `clip` (no los de la carta destino) y
// devuelve la lista de referencias que ya no existen en el proyecto —
// `[]` si todo es válido. Función pura: no toca el estado ni el portapapeles.
export function validateStyleClipboardForPaste(clip, { tags, resources }) {
  const incidencias = [];
  if (!clip) return incidencias;

  if (clip.generales && Array.isArray(clip.generales.etiquetaIds)) {
    clip.generales.etiquetaIds.forEach((etiquetaId, index) => {
      const exists = tags.some((t) => t.id === etiquetaId);
      if (!exists) {
        incidencias.push({
          elemento: t('styleClipboardError.row.generales'),
          referencia: t('styleClipboardError.row.tag'),
          detalle: t('styleClipboardError.row.noLongerExists', { name: clip.generales.etiquetaNames?.[index] || etiquetaId }),
        });
      }
    });
  }

  const faceChecks = [
    { key: 'caraFrontal', label: t('option.cara.frontal') },
    { key: 'caraTrasera', label: t('option.cara.trasera') },
  ];
  for (const { key, label } of faceChecks) {
    const face = clip[key];
    if (!face) continue;
    if (face.imagenResourceId && !resources.some((r) => r.id === face.imagenResourceId)) {
      incidencias.push({ elemento: label, referencia: t('styleClipboardError.row.backgroundImage'), detalle: t('styleClipboardError.row.resourceGone') });
    }
    for (const textBox of face.textBoxes) {
      if (textBox.fuenteResourceId && !resources.some((r) => r.id === textBox.fuenteResourceId)) {
        incidencias.push({
          elemento: label,
          referencia: t('styleClipboardError.row.typefaceInTextBox', { box: textBox.contenido || textBox.id }),
          detalle: t('styleClipboardError.row.resourceGone'),
        });
      }
    }
  }

  return incidencias;
}
