// Construction du lien « Signaler une erreur » (issue GitHub pré-remplie).
// JavaScript pur : aucun import de React, aucun accès au DOM.
// L'URL du dépôt est passée en argument ; elle est définie dans src/config.js.

export function urlSignalement(urlDepot, question) {
  const titre = `[Erreur] Question ${question.id}`;
  const corps = [
    `Question : ${question.id}`,
    `Thème : ${question.theme}`,
    `Origine : ${question.origine}`,
    `Statut : ${question.statut}`,
    ...(question.generateur
      ? [
          `Générateur : ${question.generateur.type}`,
          `Graine : ${question.generateur.seed}`,
          `Niveau : ${question.generateur.niveau}`,
          `Version du générateur : ${question.generateur.version}`,
          `Pour reproduire : generate(${question.generateur.seed}, ${question.generateur.niveau}) du générateur ${question.generateur.type}`,
        ]
      : []),
    '',
    "Description de l'erreur :",
    '',
    '',
    "Source à l'appui (lien ou référence) :",
    '',
  ].join('\n');
  const base = String(urlDepot).replace(/\/+$/, '');
  return `${base}/issues/new?title=${encodeURIComponent(titre)}&body=${encodeURIComponent(corps)}`;
}

/** Un lien de source n'est cliquable que si l'URL est en http(s). */
export function urlSourceValide(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}
