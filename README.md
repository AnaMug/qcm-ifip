# QCM Inspecteur des finances publiques — entraînement

Application web d'entraînement au QCM de l'épreuve écrite n° 2 du concours externe d'inspecteur des
finances publiques (DGFiP, format rénové, première session 2026).

- Vite + React (JavaScript), CSS simple. Aucune autre dépendance.
- Aucun backend, aucun appel réseau, aucune IA : tout fonctionne dans le navigateur.
- La progression et les réglages sont enregistrés sur l'appareil (localStorage).

> **État du contenu.** `src/data/questions.json` contient les 45 questions du QCM officiel 2026,
> recopiées du sujet publié par la DGFiP, qui ne comporte pas de corrigé. Les réponses proposées
> sont donc toutes au statut `a_verifier` : elles doivent être contrôlées avant d'être passées
> à `concordant` ou `verifie`. Les figures des questions 33, 36 et 37 sont dans `public/images/`.

## À compléter avant la mise en ligne

Ces informations n'ont pas été fournies ; elles sont laissées en attente et rien n'a été deviné.

| Quoi | Où | Valeur actuelle |
| --- | --- | --- |
| Nom du dépôt GitHub | `vite.config.js`, ligne `base` | `'/NOM_DU_DEPOT/'` |
| URL du dépôt (lien « Signaler une erreur ») | `src/config.js` | `https://github.com/UTILISATEUR/NOM_DU_DEPOT` |
| Durée officielle de l'épreuve | `src/data/epreuve.json`, `duree_officielle_minutes` | `null` |

Tant que ce dernier champ vaut `null`, l'accueil affiche « non renseigné dans
l'application ». Le sujet 2026 indique 2 h 30 pour l'ensemble de l'épreuve (QCM et QRC), sans
préciser la part du QCM. Ne le remplir qu'à partir d'une source officielle.

## Lancer en local

Il faut Node.js 20.19 ou plus récent (22 recommandé).

```bash
npm install
npm run dev
```

Ouvrir l'adresse affichée dans le terminal (par défaut `http://localhost:5173/NOM_DU_DEPOT/`).

Pour vérifier la version de production :

```bash
npm run build
npm run preview
```

## Mettre en ligne (GitHub Pages)

1. Créer le dépôt sur GitHub et y pousser ce projet sur la branche `main`.
2. Remplacer `NOM_DU_DEPOT` dans `vite.config.js` par le nom exact du dépôt, par exemple
   `base: '/qcm-ifip/'`. Sans cela, la page en ligne reste blanche.
3. Remplacer l'URL dans `src/config.js` par l'adresse réelle du dépôt.
4. Sur GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
5. Pousser sur `main`. Le workflow `.github/workflows/deploy.yml` construit le site et le publie
   avec `actions/deploy-pages`. Il peut aussi être lancé à la main depuis l'onglet **Actions**.
6. Le site est disponible à l'adresse `https://UTILISATEUR.github.io/NOM_DU_DEPOT/`.

Le fichier `package-lock.json` doit rester dans le dépôt : le workflow utilise `npm ci`.

## Ajouter une question

Toutes les questions sont dans `src/data/questions.json`, un tableau d'objets. Ajouter un objet
qui respecte exactement ce schéma (tous les champs sont obligatoires, aucun autre n'est accepté) :

```json
{
  "id": "2026-Q01",
  "origine": "officiel_2026",
  "theme": "ue",
  "enonce": "Texte de la question",
  "choix": ["choix 1", "choix 2", "choix 3", "choix 4"],
  "bonne_reponse": 1,
  "explication": "Texte de l'explication",
  "source": { "libelle": "Référence de la source", "url": "https://..." },
  "confiance": "haute",
  "statut": "a_verifier",
  "image": null,
  "similaire_a": null,
  "extrait_source": null
}
```

| Champ | Valeurs admises |
| --- | --- |
| `id` | texte unique, par exemple `2026-Q01` |
| `origine` | `officiel_2026` ou `ia_sourcee` |
| `theme` | `environnement`, `ue`, `numerique`, `logique`, `anglais` |
| `enonce` | texte |
| `choix` | exactement 4 textes |
| `bonne_reponse` | `1`, `2`, `3`, `4` (numéro du choix) ou `null` |
| `explication` | texte ou `null` |
| `source` | `{ "libelle": "...", "url": "..." }` ; `url` peut être vide (`""`) |
| `confiance` | `haute`, `moyenne`, `faible` ou `null` |
| `statut` | `a_verifier`, `concordant`, `verifie` |
| `image` | `null`, `"A_FOURNIR"` ou un chemin comme `"images/2026-Q07.png"` |
| `similaire_a` | `null`, ou l'`id` de la question d'origine dont celle-ci est une variante |
| `extrait_source` | `null`, ou la phrase exacte du texte source qui justifie la réponse |

Règles à retenir :

- **Ne jamais deviner.** Si la bonne réponse, l'explication ou le niveau de confiance ne sont pas
  établis, mettre `null`. Avec `bonne_reponse: null`, la question s'affiche et la correction
  indique « Réponse non encore établie » ; elle ne compte pas dans le score.
- **Extrait de la source.** `extrait_source` est une citation exacte, copiée depuis le texte
  source, jamais une reformulation. Il s'affiche dans la correction, au-dessus du lien vers la
  source. En cas de doute sur la formulation exacte, laisser `null`.
- **Questions similaires.** `similaire_a` doit désigner une question présente dans le fichier ;
  sinon la question est écartée et signalée. Le champ est seulement enregistré pour l'instant :
  la génération de questions similaires n'est pas faite dans cette version.
- **Images.** Déposer le fichier dans `public/images/` et écrire le chemin sans barre oblique
  initiale : `"images/2026-Q07.png"`. Tant que l'image manque, écrire `"A_FOURNIR"`.
- **Examen blanc.** Il reprend toutes les questions dont `origine` vaut `officiel_2026`, dans
  l'ordre des thèmes ci-dessus puis dans l'ordre du fichier. Leur nombre n'est écrit nulle part
  dans le code.
- **Contrôle automatique.** Au chargement, chaque question est comparée au schéma. Une question
  non conforme (champ manquant, valeur inconnue, `id` en doublon…) est écartée et listée en bas
  de la page d'accueil avec la raison.

Après modification, relancer `npm run dev` pour vérifier, puis pousser sur `main`.

## Questions générées (logique)

En plus des questions du fichier, l'application calcule des questions de logique. Elles ne sont
jamais écrites dans `questions.json` : chacune est reconstruite à partir d'un type, d'une graine et
d'un niveau, et **la bonne réponse est toujours calculée par le code**.

| Type | Contenu | Niveaux |
| --- | --- | --- |
| `suite_numerique` | suites arithmétiques, géométriques, entrelacées, à écarts croissants, carrés, cubes, « × a + b » | 1 à 3 |
| `suite_lettres_nombres` | séries du type « A1 – C4 – E9 – G16 – ? » | 1 à 3 |
| `calendrier` | jour de la semaine dans N jours, ou il y a N jours | 1 à 3 |
| `probabilites` | tirages dans une urne (une ou deux boules, avec ou sans remise), fractions irréductibles | 1 à 3 |
| `matrice` | grille 3 × 3 dont une case manque ; 1, 2 ou 3 règles selon le niveau | 1 à 3 |
| `suite_figures` | carré 2 × 2 ou 3 × 3 où un ou deux marqueurs se déplacent d'un pas constant | 1 à 3 |

- **Reproductibilité.** `generate(seed, niveau)` renvoie toujours la même question pour la même
  graine. L'`id` vaut `gen-<type>-<seed>-<niveau>` et le champ `generateur` contient
  `{ type, seed, niveau, version }`. Aucun générateur n'utilise `Math.random` : l'aléa vient de
  `src/core/random.js` (mulberry32).
- **Vérification.** `verify(question)` repart de l'énoncé affiché et recalcule la solution par une
  autre méthode que `generate` (solveur de suites à hypothèses multiples, décompte jour par jour,
  énumération de toutes les issues d'un tirage). Il exige que les 4 choix soient différents et
  qu'un seul soit correct. Si la vérification échoue, `generate` essaie la graine suivante
  (20 essais), puis lève une erreur.
- **Distracteurs.** Chaque mauvaise réponse reproduit une erreur typique calculée (décalage d'un
  rang, oubli de la non-remise, addition au lieu de multiplication…). L'explication nomme l'erreur
  qui correspond à chaque choix.
- **Statut.** Les questions générées portent l'origine `generateur` (badge « Générée
  (calculée) ») et le statut `concordant`. Le réglage « N'afficher que les questions vérifiées »
  les écarte donc.
- **Où elles apparaissent.** En entraînement, quand le thème Logique est coché et que le réglage
  « Inclure des questions générées » est actif (c'est le cas par défaut) : 10 questions s'ajoutent
  à la séance. L'examen blanc ne contient que les questions officielles. Dans les statistiques,
  leurs réponses sont cumulées dans le thème Logique ; elles n'entrent pas dans la liste des
  questions à revoir.
- **Signalement.** « Signaler une erreur » inscrit dans l'issue le type, la graine, le niveau et la
  version du générateur, ce qui suffit à reproduire la question.

### Questions à figures

Une figure est une **donnée**, jamais une image : les générateurs `matrice` et `suite_figures`
renvoient un champ `figure` qui décrit ce qu'il faut dessiner, et leurs 4 choix sont eux aussi des
descriptions. Aucun générateur ne produit de SVG ni de HTML.

```json
{
  "kind": "matrice", "lignes": 3, "colonnes": 3, "manquante": [2, 2],
  "cases": [[{ "forme": "cercle", "nombre": 2, "remplissage": "plein", "rotation": 0, "marques": [] }, "…"], "…"]
}
```

- **Case** : `forme` (`cercle`, `carre`, `triangle`, `losange`, `etoile`, `fleche`), `nombre`
  (1 à 4), `remplissage` (`plein`, `vide`, `hachure`), `rotation` (degrés, sens horaire) et
  `marques` (points placés sur le pourtour de la case : `n`, `ne`, `e`, `se`, `s`, `so`, `o`, `no`).
  La case manquante vaut `null` dans `cases`.
- **Suite de figures** : `{ "kind": "suite", "etapes": [grille, …] }`, où une grille vaut
  `{ "kind": "grille", "taille": 2 ou 3, "marqueurs": [{ "forme", "remplissage", "ligne", "colonne" }] }`.
- **Règles d'une grille 3 × 3** : progression du nombre d'éléments, rotation constante de 45° ou
  90°, cycle de 3 formes, cycle des 3 remplissages, superposition des points du pourtour (réunion,
  ou points présents dans une seule des deux premières cases). Une règle se lit par ligne ou par
  colonne. Chaque distracteur ne diffère de la bonne case que par un attribut.
- **Symétries.** Avant toute comparaison, la rotation est ramenée à sa valeur canonique selon la
  forme : cercle, toute rotation ; carré, 90° ; triangle, 120° ; losange, 180° ; étoile, 72° ;
  flèche, aucune. Deux choix visuellement identiques sont donc refusés.
- **Dessin.** `src/core/figures/trace.js` (JavaScript pur) transforme une description en
  primitives géométriques ; `src/ui/Figure.jsx` les dessine en SVG, sans librairie. Pour React
  Native, seul `Figure.jsx` est à réécrire avec `react-native-svg`.
- **Accessibilité.** Chaque figure reçoit un texte alternatif produit par
  `src/core/figures/description.js`.

### Contrôler les générateurs

```bash
npm run check
```

Le script `scripts/check-generators.mjs` (Node, sans dépendance) génère 1 000 questions par
générateur et par niveau, appelle `verify` sur chacune et affiche le nombre d'échecs. Il vérifie
aussi qu'une même graine redonne la même question, que `verify` refuse une question dont on a
volontairement faussé la bonne réponse et, pour les grilles, qu'il refuse un choix qui serait la
bonne case tournée d'un angle de symétrie. Il sort avec le code 1 au moindre échec.

### Relire des questions générées

Ajouter `#apercu` à l'adresse de l'application (par exemple
`http://localhost:5173/NOM_DU_DEPOT/#apercu`). La page affiche 20 questions par type avec la
réponse, l'explication et le résultat de `verify`. Elle n'est liée depuis aucun écran.

### Modifier un générateur

Toute modification qui change les questions produites pour une même graine doit s'accompagner d'une
hausse de la constante `VERSION` du générateur : c'est elle qui permet de retrouver, à partir d'un
signalement, le code qui a produit la question.

## Fonctionnement

- **Entraînement** : un ou plusieurs thèmes, ordre aléatoire, correction immédiate avec
  explication, source et lien « Signaler une erreur ».
- **Examen blanc** : chronomètre (80 min par défaut, réglable), bouton « Je m'abstiens »,
  correction à la fin. Une question laissée sans réponse compte comme une abstention. Quand le
  temps est écoulé, l'examen se termine tout seul.
- **Résultat** : bonnes réponses, fausses, abstentions, et un score indicatif avec un barème
  réglable (par défaut +1 / −0,5 / 0). Le barème officiel n'est pas publié.
- **Statistiques** : par thème, et liste des questions dont la dernière réponse était fausse.
- **Réglages** : « N'afficher que les questions vérifiées », durée du chronomètre, barème.

## Organisation du code

```
scripts/
  check-generators.mjs contrôle des générateurs (npm run check)
src/
  config.js            URL du dépôt GitHub (seul endroit où elle est définie)
  main.jsx             point d'entrée
  core/                logique en JavaScript pur : ni React, ni DOM
    constants.js       thèmes, statuts, libellés, réglages par défaut
    questions.js       validation du schéma, filtres, mélange, ordre de l'examen
    score.js           correction d'une réponse, bilan, barème
    chrono.js          chronomètre (calcul à partir d'horodatages)
    session.js         état d'une séance (réponses, navigation)
    stats.js           progression, statistiques par thème, questions à revoir
    persistance.js     lecture et écriture des réglages et de la progression
    storage.js         seul fichier qui utilise localStorage (interface asynchrone)
    signalement.js     lien d'issue GitHub pré-remplie
    random.js          générateur pseudo-aléatoire à graine (mulberry32)
    entrainement.js    composition d'une séance (questions du fichier + questions générées)
    generators/        générateurs de questions de logique (JavaScript pur)
      commun.js                assemblage d'une question, boucle generate / verify
      familles-suites.js       familles de suites et leurs erreurs typiques
      solveur-suites.js        solveur indépendant utilisé par verify
      suite-numerique.js, suite-lettres-nombres.js, calendrier.js, probabilites.js
      matrice.js, regles-matrice.js   grille 3 × 3 et contrôle indépendant de ses règles
      suite-figures.js         suite de figures
      index.js                 registre des générateurs
    figures/           modèle des figures (JavaScript pur)
      formes.js                formes, remplissages, symétries, clés de comparaison
      description.js           description en français (explications, texte alternatif)
      trace.js                 calcul du tracé en primitives géométriques
  ui/                  composants React : affichage uniquement, appellent src/core
                       (Apercu.jsx : page de relecture des générateurs, #apercu ;
                        Figure.jsx : dessin SVG des figures)
  data/
    questions.json     source unique des questions
    epreuve.json       rappel du format de l'épreuve affiché à l'accueil
```

### Portage React Native

`src/core/` ne dépend ni de React ni du navigateur et peut être repris tel quel. Seul
`src/core/storage.js` est à remplacer : il expose `getItem`, `setItem` et `removeItem`, qui
renvoient des `Promise`, comme `AsyncStorage`. Les composants de `src/ui/` sont à réécrire.

## Prévu plus tard (non fait dans cette version)

Version React Native, génération de questions similaires à une question du fichier, comptes utilisateurs, partie QRC, mode
sombre, animations, PWA, tests. Rien dans le code actuel ne s'y oppose : la logique est isolée
dans `src/core/`, le stockage passe par une interface asynchrone remplaçable, et le schéma des
questions porte déjà les champs `similaire_a` et `extrait_source`.
