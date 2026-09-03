// Registro central de las interacciones de un click sobre un componente en
// Modo Juego, por tipo. Único sitio que declara qué interacciones tiene
// programadas cada tipo, para listarlas en la pestaña "Generales" de
// ui/componentModal.js y comprobar si siguen activas al renderizar en Modo
// Juego (ui/componentRenderer.js).

import { t } from './i18n.js';

export const TYPE_INTERACTIONS = {
  dado: [{ key: 'lanzar', get label() { return t('interactionDef.rollDie'); } }],
  carta: [{ key: 'voltear', get label() { return t('interactionDef.flipCard'); } }],
  mazo: [{ key: 'sacarCarta', get label() { return t('interactionDef.drawTopCard'); } }],
};

export function getInteractionsForType(type) {
  return TYPE_INTERACTIONS[type] || [];
}

export function isInteractionActive(component, key) {
  return !(component.interaccionesDesactivadas || []).includes(key);
}
