// Lecture et écriture des réglages et de la progression, via l'interface de storage.js.
// JavaScript pur : aucun import de React, aucun accès au DOM, aucun accès direct à localStorage.

import { getItem, setItem } from './storage.js';
import { REGLAGES_PAR_DEFAUT } from './constants.js';
import { normaliserBareme } from './score.js';
import { normaliserDureeMinutes } from './chrono.js';
import { normaliserProgression, progressionVide } from './stats.js';

const CLE_REGLAGES = 'qcm-ifip:reglages:v1';
const CLE_PROGRESSION = 'qcm-ifip:progression:v1';

async function lireJson(cle) {
  const texte = await getItem(cle);
  if (texte === null) return null;
  try {
    return JSON.parse(texte);
  } catch {
    return null;
  }
}

async function ecrireJson(cle, valeur) {
  try {
    return await setItem(cle, JSON.stringify(valeur));
  } catch {
    return false;
  }
}

/** Complète et assainit des réglages (valeurs par défaut pour tout ce qui manque). */
export function normaliserReglages(brut) {
  const r = brut && typeof brut === 'object' ? brut : {};
  return {
    verifieesSeulement: r.verifieesSeulement === true,
    inclureGenerees: r.inclureGenerees !== false,
    dureeExamenMin: normaliserDureeMinutes(r.dureeExamenMin, REGLAGES_PAR_DEFAUT.dureeExamenMin),
    bareme: normaliserBareme(r.bareme),
  };
}

export async function chargerReglages() {
  return normaliserReglages(await lireJson(CLE_REGLAGES));
}

export function sauverReglages(reglages) {
  return ecrireJson(CLE_REGLAGES, normaliserReglages(reglages));
}

export async function chargerProgression() {
  const brut = await lireJson(CLE_PROGRESSION);
  return brut === null ? progressionVide() : normaliserProgression(brut);
}

export function sauverProgression(progression) {
  return ecrireJson(CLE_PROGRESSION, progression);
}
