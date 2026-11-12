// SEUL fichier du projet autorisé à utiliser localStorage.
// L'interface est asynchrone (Promise), calquée sur AsyncStorage : pour le portage
// React Native, il suffira de remplacer ce fichier par un équivalent basé sur AsyncStorage.

function magasin() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // accès refusé (navigation privée, réglages du navigateur…)
  }
}

/** @returns {Promise<string|null>} la valeur, ou null si absente ou illisible */
export async function getItem(cle) {
  try {
    const m = magasin();
    return m ? m.getItem(cle) : null;
  } catch {
    return null;
  }
}

/** @returns {Promise<boolean>} true si l'écriture a réussi */
export async function setItem(cle, valeur) {
  try {
    const m = magasin();
    if (!m) return false;
    m.setItem(cle, valeur);
    return true;
  } catch {
    return false; // quota dépassé, stockage désactivé…
  }
}

/** @returns {Promise<boolean>} true si la suppression a réussi */
export async function removeItem(cle) {
  try {
    const m = magasin();
    if (!m) return false;
    m.removeItem(cle);
    return true;
  } catch {
    return false;
  }
}
