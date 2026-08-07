// Lógica pura del componente "Dado": sin dependencias de otras capas,
// reutilizada por ui/componentModal.js (validación/recálculo de resultado al
// cambiar configuración) y ui/componentRenderer.js (parpadeo/tirada).

export function parseListaValores(listaValores) {
  return (listaValores || '')
    .split(',')
    .map((v) => v.trim());
}

export function isListaValoresValida(listaValores) {
  const valores = parseListaValores(listaValores);
  return valores.length >= 2 && valores.some((v) => v.length > 0);
}

export function getPosibleValores(properties) {
  if (properties.modoCaras === 'lista') {
    return parseListaValores(properties.listaValores);
  }
  const max = properties.numeroMaximoCaras || 6;
  return Array.from({ length: max }, (_, i) => String(i + 1));
}

export function getResultadoInicial(properties) {
  return getPosibleValores(properties)[0] ?? '';
}

export function esResultadoValido(resultado, properties) {
  return getPosibleValores(properties).includes(resultado);
}

export function tirarDado(properties) {
  const posibles = getPosibleValores(properties);
  return posibles[Math.floor(Math.random() * posibles.length)];
}
