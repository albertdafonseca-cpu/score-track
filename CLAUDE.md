# ScoreTrack — repères pour les contributions

Application web mono-fichier (`index.html`) : compteur de scores universel + lanceur de dés 3D (Three.js r149 embarqué). Pas de build, pas de dépendances : ouvrir le fichier suffit.

## Conventions fixées (ne pas rediscuter)

### Accessibilité
- Toute création visuelle doit rester lisible par les daltoniens : le contraste passe par la **luminance** (jamais par la teinte seule). Les dés appliquent la règle : corps normalisé en luminance moyenne-sombre, encre ivoire, halo de résultat en encre contrastée.

### Lanceur de dés (validé le 2026-09-06)
- 14 types : d2 (pièce), d3 et d6 (cube à pips), d4, d8, d10, d12, d20, d24, d30, d48, d60, d100, d120.
- **Tous les solides à chiffres passent par le même pipeline** (`buildDieByType` → `_dieBody` + `buildNumberedDie`). Corps = `_roundedBody` : faces planes rétrécies, arêtes en quart de cylindre et sommets en calotte (rayon `ROUND_R` = 0.18 : « une vraie courbe plutôt qu'une pointe », plafonné à 30 % du plus petit rayon inscrit pour que 70 % de la face reste plane), normales lissées sur les arrondis seulement. Plaques-chiffres en `FrontSide` (les chiffres des faces cachées ne dépassent pas de la silhouette). C'est l'aspect « résine » demandé (« gommer les angles »). Pas de « boule » : d48/d60/d120 sont les solides de Catalan (`catalanDie`).
- **d48 et d120** (faces triangulaires) : sommets ramenés vers la sphère englobante (`catalanDie(..., t)`, t = 1 pour le d48, 0.85 pour le d120 car à 1 ses faces fusionnent par paires) pour une silhouette ronde, pas « biscornue ». Matériau plus mat à partir de 48 faces.
- **Taille des chiffres** : calculée d'après le vrai rayon inscrit de la face (`dieExtractFaces`), plaque = 2 × (inradius − rayon d'arrondi / 2), plafond 0.72, plancher 0.22 : le chiffre reste sur la partie plane, sinon il « flotte » au-dessus de l'arrondi et dépasse de la silhouette en vue rasante. Le chiffre du résultat est agrandi jusqu'à une largeur cible (`_RESULT_WIDTH`) pour rester lisible sur les gros dés.
- **d4** : numéroté aux sommets comme un vrai d4 (3 chiffres par face, valeur = sommet du haut). Pose d'arrêt = pointe vers le haut, vue de **trois-quarts** (`_D4_YAW` = 30°, choisi par l’utilisateur ; 0 et 20° jugés « trop de face », 40° trop tourné, 60 = arête devant), pointe quasi verticale (`_D4_TILT` = 2.5, pyramide posée vue de devant-dessus), pointes plus arrondies que les autres dés (`D4_ROUND_R` = 0.18, choisi par l’utilisateur ; 0.28 jugé trop « galet »).
- **d10** : faces 0..9 (le 10 s'écrit « 0 »). **d100** : deux d10, le premier (dizaines) porte 00, 10, … 90 ; « 00 » + « 0 » = 100.
- Rendus validés par l'utilisateur : d2, d3, d6, d8, d10, d12, d20, d24, d30 (ne pas modifier sans demande).

## Vérification visuelle
Le rendu WebGL se teste sous Playwright/Chromium avec `--use-gl=swiftshader`. Attention : au-delà d'une quinzaine de contextes WebGL simultanés, Chromium blanchit les canvases ; copier chaque rendu dans un canvas 2D puis libérer le contexte.
