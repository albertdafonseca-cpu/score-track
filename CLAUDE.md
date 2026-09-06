# ScoreTrack — repères pour les contributions

Application web mono-fichier (`index.html`) : compteur de scores universel + lanceur de dés 3D (Three.js r149 embarqué). Pas de build, pas de dépendances : ouvrir le fichier suffit.

## Conventions fixées (ne pas rediscuter)

### Accessibilité
- Toute création visuelle doit rester lisible par les daltoniens : le contraste passe par la **luminance** (jamais par la teinte seule). Les dés appliquent la règle : corps normalisé en luminance moyenne-sombre, encre ivoire, halo de résultat en encre contrastée.

### Lanceur de dés (validé le 2026-09-06)
- 14 types : d2 (pièce), d3 et d6 (cube à pips), d4, d8, d10, d12, d20, d24, d30, d48, d60, d100, d120.
- **Tous les solides à chiffres passent par le même pipeline** (`buildDieByType` → `_chamferSolid` + `buildNumberedDie`) : faces planes, arêtes nettes, sommets légèrement chanfreinés, `flatShading`. Pas de corps lissé ni de « boule » : d48/d60/d120 sont les vrais solides de Catalan (`catalanDie`).
- **Taille des chiffres** : calculée d'après le vrai rayon inscrit de la face (`dieExtractFaces`), plaque = 2 × inradius, plafond 0.72, plancher 0.22. Le chiffre du résultat est agrandi jusqu'à une largeur cible (`_RESULT_WIDTH`) pour rester lisible sur les gros dés.
- **d4** : numéroté aux sommets comme un vrai d4 (3 chiffres par face, valeur = sommet du haut). Pose d'arrêt = pointe vers le haut, arête vers le joueur (`_D4_TILT`).
- **d10** : faces 0..9 (le 10 s'écrit « 0 »). **d100** : deux d10, le premier (dizaines) porte 00, 10, … 90 ; « 00 » + « 0 » = 100.
- Rendus validés par l'utilisateur : d2, d3, d6, d8, d10, d12, d20, d24, d30 (ne pas modifier sans demande).

## Vérification visuelle
Le rendu WebGL se teste sous Playwright/Chromium avec `--use-gl=swiftshader`. Attention : au-delà d'une quinzaine de contextes WebGL simultanés, Chromium blanchit les canvases ; copier chaque rendu dans un canvas 2D puis libérer le contexte.
