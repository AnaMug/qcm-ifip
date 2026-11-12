// Chronomètre fondé sur des horodatages : il reste juste même si l'onglet est mis en veille.
// JavaScript pur : aucun import de React, aucun accès au DOM.
// L'interface fournit l'heure courante (Date.now()) à chaque rafraîchissement.

/** @returns {{ dureeSecondes: number, debutMs: number }} */
export function demarrerChrono(dureeSecondes, maintenantMs) {
  return { dureeSecondes, debutMs: maintenantMs };
}

export function secondesEcoulees(chrono, maintenantMs) {
  const ecoulees = Math.floor((maintenantMs - chrono.debutMs) / 1000);
  return Math.min(Math.max(ecoulees, 0), chrono.dureeSecondes);
}

export function secondesRestantes(chrono, maintenantMs) {
  return chrono.dureeSecondes - secondesEcoulees(chrono, maintenantMs);
}

export function estTermine(chrono, maintenantMs) {
  return secondesRestantes(chrono, maintenantMs) <= 0;
}

/** 4805 → "1:20:05" ; 305 → "05:05" */
export function formaterDuree(secondes) {
  const s = Math.max(0, Math.floor(secondes));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const deux = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${deux(m)}:${deux(s % 60)}` : `${deux(m)}:${deux(s % 60)}`;
}

/** Convertit une saisie en nombre entier de minutes (1 à 600), sinon renvoie `defaut`. */
export function normaliserDureeMinutes(valeur, defaut) {
  const n = Math.round(Number(String(valeur).replace(',', '.')));
  return Number.isFinite(n) && n >= 1 && n <= 600 ? n : defaut;
}
