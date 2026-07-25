// Migración silenciosa de componentes tipo 'ficha' a 'carta'.
// Módulo core sin dependencias de UI, usado en loadComponents (arranque, importación).

import { getDesignSize, CARD_DESIGN_WIDTH } from './cardProportions.js';

const DEFAULT_FORMA = 'circular';
const DEFAULT_BORDE_COLOR = '#000000';
const DEFAULT_BORDE_GROSOR = 2;
const DEFAULT_FONDO_TIPO = 'color';

export function convertFichaToCarta(component) {
  const result = { component, error: null };

  if (!component.properties || typeof component.properties !== 'object') {
    result.error = 'Falta la configuración de diseño (properties)';
    result.component = { ...component, type: 'carta', properties: {} };
    return result;
  }

  const props = component.properties;
  let error = null;

  let proporcion = 'circular';
  const forma = props.forma || DEFAULT_FORMA;
  if (forma === 'circular') {
    proporcion = 'circular';
  } else if (forma === 'cuadrada') {
    proporcion = '1:1';
  } else if (forma !== undefined) {
    error = `Forma no reconocida ("${forma}")`;
    proporcion = 'circular';
  }

  const { width: designWidth, height: designHeight } = getDesignSize(proporcion);
  const bordeColor = props.bordeColor || DEFAULT_BORDE_COLOR;
  const bordeGrosor = props.bordeGrosor ?? DEFAULT_BORDE_GROSOR;

  const fondoTipo = props.fondoTipo || DEFAULT_FONDO_TIPO;

  const cara = {
    bordeColor,
    bordeGrosor,
    imagenResourceId: null,
    ajusteImagen: undefined,
    textBoxes: [],
    transparenciaImagen: 0,
  };

  if (fondoTipo === 'imagen' && props.imagenResourceId) {
    if (!props.ajusteImagen || typeof props.ajusteImagen !== 'object' ||
        !Number.isFinite(props.ajusteImagen.zoom) ||
        !Number.isFinite(props.ajusteImagen.posX) ||
        !Number.isFinite(props.ajusteImagen.posY)) {
      error = error ?? 'Ajuste de imagen con datos incompletos';
    } else {
      cara.imagenResourceId = props.imagenResourceId;
      cara.ajusteImagen = props.ajusteImagen;
    }
  } else if (fondoTipo === 'texto') {
    if (typeof props.texto !== 'string') {
      error = error ?? 'Falta el texto de la ficha';
    } else if (props.texto.trim()) {
      cara.textBoxes = [
        {
          id: crypto.randomUUID(),
          contenido: props.texto,
          fuenteResourceId: null,
          tamañoFuente: 24,
          color: '#000000',
          x: 0,
          y: 0,
          width: designWidth,
          height: designHeight,
        },
      ];
    }
  }

  result.error = error;
  result.component = {
    ...component,
    type: 'carta',
    properties: {
      proporcion,
      deckId: null,
      caraActual: 'frontal',
      caraFrontal: cara,
      caraTrasera: { ...cara, textBoxes: cara.textBoxes.map(tb => ({ ...tb })) },
    },
  };

  return result;
}

export function migrateFichaComponents(components) {
  return components.map(component => {
    if (component.type === 'ficha') {
      return convertFichaToCarta(component).component;
    }
    return component;
  });
}
