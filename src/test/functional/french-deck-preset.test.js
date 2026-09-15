// Funcionalidad 002 — Alta/edición/borrado de componentes: el conjunto
// pre-definido "Baraja francesa estándar (54 cartas)" es una vía de alta de
// componentes desde el mismo modal ("Añadir componente"). Numeración
// continúa desde FT-002-18 (component-modal-tabs.test.js).
// Nivel state.

import { describe, it, expect, beforeEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode } from '../helpers.js';
import { getComponents } from '../../core/state.js';
import { createFrenchDeckPreset } from '../../core/presets/frenchDeck.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 2 });

describe('002 — Conjunto pre-definido "Baraja francesa"', () => {
  beforeEach(() => {
    resetState();
    mountEditMode();
  });

  it('FT-002-19 · el componente mazo generado tiene el id legible "Baraja Francesa"', () => {
    createFrenchDeckPreset();
    const mazo = getComponents().find((c) => c.type === 'mazo');
    expect(mazo.id).toBe(t('componentTypeModal.preset.frenchDeck.deckName'));
  });

  it('FT-002-20 · cada carta tiene un id descriptivo "card-<palo>-<valor>" / "card-joker", y el borde sale de la propiedad, no del recurso', () => {
    createFrenchDeckPreset();
    const cartas = getComponents().filter((c) => c.type === 'carta');
    expect(cartas.length).toBe(54);

    const as = cartas.find((c) => c.id === 'card-picas-as');
    expect(as).toBeTruthy();
    expect(as.properties.caraFrontal.bordeColor).toBe('#d8d8d8');
    expect(as.properties.caraFrontal.bordeGrosor).toBe(1);
    expect(as.properties.caraTrasera.bordeColor).toBe('#d8d8d8');
    expect(as.properties.caraTrasera.bordeGrosor).toBe(1);

    const jokerIds = cartas.filter((c) => c.id.startsWith('card-joker')).map((c) => c.id);
    expect(jokerIds).toHaveLength(2);
    expect(jokerIds).toContain('card-joker');
    expect(jokerIds).toContain('card-joker-2');
  });

  it('FT-002-21 · generar la baraja francesa dos veces en la misma partida desambigua los ids repetidos con sufijo "(n)"', () => {
    createFrenchDeckPreset();
    createFrenchDeckPreset();
    const cartas = getComponents().filter((c) => c.type === 'carta');
    expect(cartas.length).toBe(108);

    const asIds = cartas.filter((c) => c.id.startsWith('card-picas-as')).map((c) => c.id);
    expect(asIds).toHaveLength(2);
    expect(asIds).toContain('card-picas-as');
    expect(asIds).toContain('card-picas-as(1)');
  });

  it('FT-002-22 · createFrenchDeckPreset acepta deckId y cardPrefix personalizados y los aplica al mazo y a las cartas, desambiguando igual que con los valores por defecto', () => {
    createFrenchDeckPreset({ deckId: 'Mi Baraja', cardPrefix: 'naipe-' });
    const mazo = getComponents().find((c) => c.type === 'mazo');
    expect(mazo.id).toBe('Mi Baraja');

    const cartas = getComponents().filter((c) => c.type === 'carta');
    expect(cartas.length).toBe(54);
    const as = cartas.find((c) => c.id === 'naipe-picas-as');
    expect(as).toBeTruthy();
    const jokerIds = cartas.filter((c) => c.id.startsWith('naipe-joker')).map((c) => c.id);
    expect(jokerIds).toHaveLength(2);
    expect(jokerIds).toContain('naipe-joker');
    expect(jokerIds).toContain('naipe-joker-2');

    // Generar de nuevo con el mismo deckId y prefijo desambigua igual que con los valores por defecto.
    createFrenchDeckPreset({ deckId: 'Mi Baraja', cardPrefix: 'naipe-' });
    const mazos = getComponents().filter((c) => c.type === 'mazo');
    expect(mazos.map((m) => m.id)).toContain('Mi Baraja(1)');
    const asIds = getComponents().filter((c) => c.id.startsWith('naipe-picas-as')).map((c) => c.id);
    expect(asIds).toHaveLength(2);
    expect(asIds).toContain('naipe-picas-as(1)');
  });
});
