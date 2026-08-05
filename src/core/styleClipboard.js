// Portapapeles de "Copiar/Pegar estilo" entre cartas (change 00085): vive
// solo en memoria de módulo durante la sesión del navegador — nunca se
// persiste ni se incluye en el guardado/exportado del juego. Solo puede
// contener un estilo copiado a la vez (el último sustituye por completo al
// anterior, sin historial).

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
// `generales` (cambio 00105) incluye ahora también `grupoIds`/`grupoNames`
// (este último de solo lectura, para el mensaje de error si alguno de los
// grupos deja de existir al pegar; un componente puede tener varios grupos
// a la vez desde el cambio 00139). `esquinasRedondeadas` (cambio 00117) viaja siempre junto
// a `proporcion`, dentro del mismo bloque "Proporción" del checklist de
// copiar/pegar estilo. Los bloques copiados se clonan en profundidad para
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
export function validateStyleClipboardForPaste(clip, { groups, resources }) {
  const incidencias = [];
  if (!clip) return incidencias;

  if (clip.generales && Array.isArray(clip.generales.grupoIds)) {
    clip.generales.grupoIds.forEach((grupoId, index) => {
      const exists = groups.some((g) => g.id === grupoId);
      if (!exists) {
        incidencias.push({
          elemento: 'Generales',
          referencia: 'Grupo',
          detalle: `"${clip.generales.grupoNames?.[index] || grupoId}" ya no existe`,
        });
      }
    });
  }

  const faceChecks = [
    { key: 'caraFrontal', label: 'Cara frontal' },
    { key: 'caraTrasera', label: 'Cara trasera' },
  ];
  for (const { key, label } of faceChecks) {
    const face = clip[key];
    if (!face) continue;
    if (face.imagenResourceId && !resources.some((r) => r.id === face.imagenResourceId)) {
      incidencias.push({ elemento: label, referencia: 'Imagen de fondo', detalle: 'Recurso ya no existe' });
    }
    for (const textBox of face.textBoxes) {
      if (textBox.fuenteResourceId && !resources.some((r) => r.id === textBox.fuenteResourceId)) {
        incidencias.push({
          elemento: label,
          referencia: `Tipografía (cuadro de texto "${textBox.contenido || textBox.id}")`,
          detalle: 'Recurso ya no existe',
        });
      }
    }
  }

  return incidencias;
}
