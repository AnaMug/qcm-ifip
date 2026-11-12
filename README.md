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
  ui/                  composants React : affichage uniquement, appellent src/core
  data/
    questions.json     source unique des questions
    epreuve.json       rappel du format de l'épreuve affiché à l'accueil
```

### Portage React Native

`src/core/` ne dépend ni de React ni du navigateur et peut être repris tel quel. Seul
`src/core/storage.js` est à remplacer : il expose `getItem`, `setItem` et `removeItem`, qui
renvoient des `Promise`, comme `AsyncStorage`. Les composants de `src/ui/` sont à réécrire.

## Prévu plus tard (non fait dans cette version)

Version React Native, génération de questions similaires, comptes utilisateurs, partie QRC, mode
sombre, animations, PWA, tests. Rien dans le code actuel ne s'y oppose : la logique est isolée
dans `src/core/`, le stockage passe par une interface asynchrone remplaçable, et le schéma des
questions porte déjà les champs `similaire_a` et `extrait_source`.
