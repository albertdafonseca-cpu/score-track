// Types partagés de l'état du jeu (source de vérité pour game.ts, recap-pdf.ts,
// animations.ts, dice-ui.ts). Les types des dés 3D sont dans dice3d/types.ts.

/** Joueur en cours de partie. */
export interface Player {
  playerName: string;
  score: number;
  eliminated: boolean;
  /** score brut avant plafonnement (mode « bloquer ») */
  rawScore?: number;
  /** score figé au moment de l'élimination / de la victoire */
  finalScore?: number;
  winner?: boolean;
  /** rang de victoire (1 = premier vainqueur) */
  winRank?: number;
  /** rang d'élimination (1 = premier éliminé) */
  elimRank?: number;
  /** rotation de la carte à l'écran (mémorisée pour orienter le modal de score) */
  rot?: CardRot;
}

/** Orientation d'une carte joueur (et du modal de score qui en découle). */
export type CardRot = 'rot-0' | 'rot-180' | 'rot-l' | 'rot-r';

export type ObjectifMode = 'none' | 'win' | 'elim';

/** Blocage des gains/pertes (UI supprimée, conservé dans les sauvegardes). */
export type BloquerMode = 'none' | 'min' | 'max';

/** Réglages d'une partie (mémorisés pour « nouvelle partie, mêmes réglages »). */
export interface GameConfig {
  numPlayers: number;
  startPoints: number;
  objectifMode: ObjectifMode;
  objectifVal: number | null;
  bloquerMode: BloquerMode;
  allowNeg: boolean;
  singleWinner: boolean;
  lastLoser: boolean;
}

/** Préférences persistées dans localStorage (scoretrack_settings). */
export interface Settings {
  theme: string;
  lang?: string;
  defPlayers: number;
  defStart: number;
  defMax: number;
  defNeg: boolean;
  defObjectifMode: ObjectifMode;
  defObjectifVal: number | null;
  defSaved: boolean;
  defSingleWinner?: boolean;
  defLastLoser?: boolean;
  lastGameConfig?: GameConfig | null;
}

/** Une variation de score dans un groupe d'actions. */
export interface HistoryEntry {
  delta: number;
}

/** Groupe d'actions consécutives d'un même joueur (une ligne du récap). */
export interface HistoryGroup {
  playerIdx: number;
  who: string;
  entries: HistoryEntry[];
  open: boolean;
  rank: number;
}

/** Partie en cours persistée dans localStorage (scoretrack_save). */
export interface GameSave {
  players: Player[];
  seatOrder: number[];
  history: HistoryGroup[];
  actionCounter: number;
  numPlayers: number;
  startPoints: number;
  /** null = pas de plafond (Infinity n'est pas sérialisable) */
  maxPoints: number | null;
  allowNeg: boolean;
  saveVersion: number;
  elimPoints: number | null;
  winPoints: number | null;
  objectifMode: ObjectifMode;
  bloquerMode: BloquerMode;
  rankCounter: number;
  singleWinner: boolean;
  lastLoser: boolean;
  lastGameConfig: GameConfig | null;
  ts: number;
}

/** Instantané empilé par saveUndo (sérialisé en JSON dans undoStack). */
export interface UndoSnapshot {
  players: Player[];
  history: HistoryGroup[];
  seatOrder: number[];
  actionCounter: number;
}

/** Jeu préconfiguré de l'écran d'accueil. */
export interface GamePreset {
  nameKey: string;
  detailKey: string;
  players: number;
  start: number;
  objectifMode: ObjectifMode;
  objectifVal: number;
  singleWinner: boolean;
  lastLoser: boolean;
  allowNeg?: boolean;
}

/** Identifiants des thèmes visuels (attribut data-theme). */
export type ThemeId =
  | 'cyber' | 'cyber-light' | 'dark' | 'dark-light' | 'neon-pink' | 'neon-pink-light'
  | 'arcade' | 'arcade-light' | 'nature' | 'nature-light' | 'sunset' | 'sunset-light'
  | 'ocean' | 'ocean-light' | 'gold' | 'gold-light' | 'sobre' | 'light'
  | 'mono' | 'mono-light' | 'ldm' | 'ldm-day';

/** Thème visuel (couleurs de la grille de sélection). */
export interface Theme {
  id: ThemeId;
  nameKey: string;
  bg: string;
  a: string;
  b: string;
}

/** Configuration courante du lanceur de dés. */
export interface DiceConfig {
  faces: number;
  count: number;
}

/** Résultat d'un lancer (historique du lanceur). */
export interface DiceRoll {
  rolls: number[];
  sum: number;
  faces: number;
  count: number;
  percent: boolean;
}
