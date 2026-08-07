// Sanitización de HTML de usuario antes de insertarlo en el DOM. Necesaria
// porque el estado del proyecto se guarda/exporta como un único HTML
// autocontenido: sin sanitizar, un <script> pegado (o un manejador de evento
// inline) se ejecutaría al reabrir ese fichero en otra sesión. Usado por el
// componente "Visor de documentos" (ui/componentRenderer.js).

const JAVASCRIPT_PROTOCOL = /^\s*javascript:/i;

export function sanitizeHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html;

  for (const script of template.content.querySelectorAll('script')) {
    script.remove();
  }

  for (const element of template.content.querySelectorAll('*')) {
    for (const attr of [...element.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        element.removeAttribute(attr.name);
      } else if ((name === 'href' || name === 'src') && JAVASCRIPT_PROTOCOL.test(attr.value)) {
        element.removeAttribute(attr.name);
      }
    }
  }

  return template.innerHTML;
}
