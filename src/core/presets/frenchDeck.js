// Conjunto pre-definido "Baraja francesa estándar (54 cartas)": genera en
// memoria 55 recursos SVG (54 caras únicas + 1 reverso compartido) y 54
// componentes 'carta' sueltos (sin agrupar) más 1 componente 'mazo', y los
// vuelca al estado en 2 llamadas load* — ver justificación de "reemplazo
// completo + 1 solo evento" en la tarea del plan.md de este cambio y el
// precedente bootFromSeedOrDefaults() de main.js.

import { getComponents, getResources, loadResources, loadComponents } from '../state.js';
import { createResource } from '../resource.js';
import { nextCloneId } from '../component.js';
import { buildFrenchDeckCatalog, cardId } from '../../data/cardTemplates.js';
import { renderCardBackSvg, renderCardFaceSvg } from '../svgTemplates.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { t } from '../i18n.js';

const DEFAULT_CARD_PREFIX = 'card-';

// Id descriptivo fijo (00274): si ya está en uso (p. ej. una generación previa
// del mismo conjunto en la misma partida), se desambigua con la misma regla
// que "Clonar" (nextCloneId — sufijo "(n)" con el siguiente entero libre),
// en vez de fallar o colisionar en silencio.
function freeId(candidateId, components) {
  return components.some((c) => c.id === candidateId)
    ? nextCloneId(candidateId, components)
    : candidateId;
}

function svgToDataUrl(svg) {
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

// Fila = palo (0-3) o fila de jokers (4); columna = índice dentro de la fila
// (0-12 para los palos, 0-1 para los jokers). Separación horizontal = ancho
// de carta × 1.1, vertical = alto de carta × 1.2 (design_data_catalogo-cartas.md).
// Origen desplazado a la derecha del mazo (00273), que ocupa la posición base
// (100, 100) — igual que un componente creado desde el picker normal
// (editMode.js#openAddModal).
function computeGridPosition(index, cardWidth, cardHeight) {
  const row = Math.floor(index / 13);
  const col = index % 13;
  const originX = 100 + cardWidth * 2;
  const originY = 100;
  return {
    x: originX + col * cardWidth * 1.1,
    y: originY + row * cardHeight * 1.2,
  };
}

// Resumen ligero para la ventana de confirmación (00275): deriva conteos de
// `buildFrenchDeckCatalog()` sin generar SVGs ni tocar el estado. Forma
// genérica reutilizable por cualquier futuro conjunto pre-definido, no solo
// la baraja francesa (ver ui/presetConfirmModal.js).
export function getFrenchDeckPresetSummary() {
  const catalog = buildFrenchDeckCatalog();
  const jokerCount = catalog.filter((entry) => entry.rank === 'joker').length;
  const cardCount = catalog.length;
  return {
    title: t('componentTypeModal.preset.frenchDeck'),
    defaultDeckId: t('componentTypeModal.preset.frenchDeck.deckName'),
    defaultCardPrefix: DEFAULT_CARD_PREFIX,
    counts: [
      { icon: 'panel-recursos', count: cardCount, label: t('presetConfirmModal.frenchDeck.resourcesCount', { count: cardCount }) },
      { icon: 'type-carta', count: cardCount, label: t('presetConfirmModal.frenchDeck.cardsCount', { count: cardCount, normalCount: cardCount - jokerCount, jokerCount }) },
      { icon: 'type-mazo', count: 1, label: t('presetConfirmModal.frenchDeck.deckCount') },
    ],
  };
}

export function createFrenchDeckPreset({ deckId, cardPrefix } = {}) {
  const catalog = buildFrenchDeckCatalog();
  const resolvedCardPrefix = cardPrefix?.trim() || DEFAULT_CARD_PREFIX;

  const backSvg = renderCardBackSvg();
  const backDataUrl = svgToDataUrl(backSvg);
  const backResource = createResource({
    name: t('componentTypeModal.preset.frenchDeck.backResourceName'),
    type: 'imagen',
    dataUrl: backDataUrl,
    fileName: 'baraja-francesa-reverso.svg',
    mimeType: 'image/svg+xml',
  });

  const newResources = [backResource];
  const newComponents = [];
  let jokerResourceId = null;

  const template = createDefaultComponent('carta');
  const cardWidth = template.width;
  const cardHeight = template.height;

  catalog.forEach((entry, index) => {
    let faceResource;
    if (entry.rank === 'joker' && jokerResourceId) {
      faceResource = { id: jokerResourceId };
    } else {
      const faceSvg = renderCardFaceSvg(entry);
      faceResource = createResource({
        name: entry.resourceName.replace(/\.svg$/, ''),
        type: 'imagen',
        dataUrl: svgToDataUrl(faceSvg),
        fileName: entry.resourceName,
        mimeType: 'image/svg+xml',
      });
      newResources.push(faceResource);
      if (entry.rank === 'joker') jokerResourceId = faceResource.id;
    }

    const carta = createDefaultComponent('carta');
    const desiredCardId = cardId({ suitId: entry.suitId, rank: entry.rank, jokerIndex: entry.jokerIndex, prefix: resolvedCardPrefix });
    carta.id = freeId(desiredCardId, [...getComponents(), ...newComponents]);
    carta.properties.caraFrontal.imagenResourceId = faceResource.id;
    carta.properties.caraFrontal.bordeColor = '#d8d8d8';
    carta.properties.caraFrontal.bordeGrosor = 1;
    carta.properties.caraTrasera.imagenResourceId = backResource.id;
    carta.properties.caraTrasera.bordeColor = '#d8d8d8';
    carta.properties.caraTrasera.bordeGrosor = 1;
    carta.properties.caraActual = 'frontal';
    const { x, y } = computeGridPosition(index, cardWidth, cardHeight);
    carta.x = x;
    carta.y = y;
    newComponents.push(carta);
  });

  const mazo = createDefaultComponent('mazo');
  const resolvedDeckId = deckId?.trim() || t('componentTypeModal.preset.frenchDeck.deckName');
  mazo.id = freeId(resolvedDeckId, [...getComponents(), ...newComponents]);
  mazo.properties.cartaIds = newComponents.map((c) => c.id);
  mazo.x = 100;
  mazo.y = 100;
  newComponents.push(mazo);

  loadResources([...getResources(), ...newResources]);
  loadComponents([...getComponents(), ...newComponents]);
}
