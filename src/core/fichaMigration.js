// Migración del extinto tipo 'ficha' (cambio 00087) a 'carta': módulo puro,
// sin dependencias de otras capas salvo core/cardProportions.js. Reutilizado
// tanto por la migración silenciosa al cargar (core/state.js) como por el
// aviso de errores de la importación explícita (ui/editModeToggle.js).
//
// Nunca lanza excepción: siempre devuelve un `properties` de carta válido
// (best-effort), más una lista de errores (vacía si no hubo ninguno). Quien
// llama decide qué hacer con esos errores — la migración silenciosa los
// ignora, la importación los usa para poder abortar antes de aplicar nada.

import { CARD_DESIGN_WIDTH, getProporcionRatio } from './cardProportions.js';

function defaultCaraProperties() {
  return {
    imagenResourceId: null,
    ajusteImagen: { zoom: 100, posX: 50, posY: 50 },
    textBoxes: [],
    bordeColor: '#000000',
    bordeGrosor: 0,
    transparenciaImagen: 0,
  };
}

function isValidAjusteImagen(value) {
  return (
    value !== null
    && typeof value === 'object'
    && Number.isFinite(value.zoom)
    && Number.isFinite(value.posX)
    && Number.isFinite(value.posY)
  );
}

export function migrateFichaProperties(fichaProperties) {
  const errors = [];
  const properties = fichaProperties && typeof fichaProperties === 'object' ? fichaProperties : null;
  if (!properties) errors.push('Falta la configuración de diseño (properties)');

  const forma = properties?.forma;
  let proporcion;
  if (forma === 'circular') {
    proporcion = 'circular';
  } else if (forma === 'cuadrada') {
    proporcion = '1:1';
  } else {
    proporcion = '1:1';
    if (properties) {
      errors.push(forma === undefined ? 'Falta la forma de la ficha' : `Forma no reconocida ("${forma}")`);
    }
  }

  const bordeColor = typeof properties?.bordeColor === 'string' ? properties.bordeColor : '#000000';
  const bordeGrosor = Number.isFinite(properties?.bordeGrosor) && properties.bordeGrosor >= 0 && properties.bordeGrosor <= 20
    ? properties.bordeGrosor
    : 0;

  const cara = defaultCaraProperties();
  cara.bordeColor = bordeColor;
  cara.bordeGrosor = bordeGrosor;

  const fondoTipo = properties?.fondoTipo;
  if (fondoTipo === 'imagen') {
    if (isValidAjusteImagen(properties.ajusteImagen)) {
      cara.ajusteImagen = { ...properties.ajusteImagen };
      if (typeof properties.imagenResourceId === 'string') cara.imagenResourceId = properties.imagenResourceId;
    } else {
      errors.push('Ajuste de imagen con datos incompletos');
    }
  } else if (fondoTipo === 'texto') {
    const height = CARD_DESIGN_WIDTH / getProporcionRatio(proporcion);
    cara.textBoxes = [{
      id: crypto.randomUUID(),
      contenido: typeof properties.texto === 'string' ? properties.texto : '',
      fuenteResourceId: null,
      tamañoFuente: 16,
      color: '#000000',
      x: 0,
      y: 0,
      width: CARD_DESIGN_WIDTH,
      height,
      bordeActivo: false,
      bordeColor: '#000000',
      bordeGrosor: 2,
      bordeTipo: 'continua',
      colorFondo: typeof properties.colorFondo === 'string' ? properties.colorFondo : '',
    }];
  }
  // fondoTipo === 'color' (o ausente/no reconocido): colorFondo no tiene
  // equivalente en el modelo de carta y se pierde sin aviso (mismo criterio
  // ya seguido con "carta sin diseño").

  const cartaProperties = {
    proporcion,
    caraActual: 'frontal',
    caraFrontal: { ...cara, ajusteImagen: { ...cara.ajusteImagen }, textBoxes: cara.textBoxes.map((tb) => ({ ...tb })) },
    caraTrasera: { ...cara, ajusteImagen: { ...cara.ajusteImagen }, textBoxes: cara.textBoxes.map((tb) => ({ ...tb })) },
  };

  return { properties: cartaProperties, errors };
}

export function migrateFichaComponent(component) {
  const { properties, errors } = migrateFichaProperties(component.properties);
  return {
    component: { ...component, type: 'carta', properties, grupoIds: [] },
    errors,
  };
}
