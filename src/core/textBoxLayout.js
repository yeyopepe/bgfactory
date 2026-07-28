// Traduce la alineación y los márgenes de un `TextBox` (cara de carta) a los
// estilos de layout flex aplicados en sus dos puntos de renderizado
// (ui/componentRenderer.js y ui/cardEditorModal.js). Datos puros, análogo en
// espíritu a core/cardProportions.js: sin dependencias de otras capas.

const JUSTIFY_CONTENT_BY_ALIGN = {
  arriba: 'flex-start',
  centro: 'center',
  abajo: 'flex-end',
};

const TEXT_ALIGN_BY_ALIGN = {
  izquierda: 'left',
  centro: 'center',
  derecha: 'right',
};

export function getTextBoxLayoutStyle(textBox, scale) {
  const alineacionHorizontal = textBox.alineacionHorizontal || 'izquierda';
  const alineacionVertical = textBox.alineacionVertical || 'arriba';

  return {
    justifyContent: JUSTIFY_CONTENT_BY_ALIGN[alineacionVertical] || 'flex-start',
    textAlign: TEXT_ALIGN_BY_ALIGN[alineacionHorizontal] || 'left',
    paddingTop: `${(textBox.margenSuperior || 0) * scale}px`,
    paddingRight: `${(textBox.margenDerecha || 0) * scale}px`,
    paddingBottom: `${(textBox.margenInferior || 0) * scale}px`,
    paddingLeft: `${(textBox.margenIzquierda || 0) * scale}px`,
  };
}
