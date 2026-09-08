// Types du moteur de dés 3D (dice3d/*, dice-ui.ts).
import type * as THREE from 'three';

/** Face d'un solide, extraite de la géométrie nette (dieExtractFaces). */
export interface DieFace {
  /** valeur affichée (1..N ; 0 pour la face « 10 » du d10) */
  value?: number;
  normal: THREE.Vector3;
  center: THREE.Vector3;
  /** accumulateur des centres de triangles (construction) */
  acc?: THREE.Vector3;
  cnt?: number;
  verts: THREE.Vector3[];
  /** distance max centre -> sommet */
  circum?: number;
  /** vrai rayon inscrit du polygone (chiffre contenu dans la face) */
  inradius: number;
  /** sommets ordonnés du polygone */
  poly?: THREE.Vector3[];
  /** distance du plan à l'origine (corps arrondi) */
  d?: number;
  /** référence « haut » imposée pour l'orientation d'arrêt (d4 numéroté aux sommets) */
  upRef?: THREE.Vector3;
}

/** Données attachées au groupe Three.js d'un dé. */
export interface DieUserData {
  faces: DieFace[] | null;
  /** plaques-chiffres par valeur (plusieurs pour le d4) */
  plates?: Record<number, THREE.Mesh[]>;
  halo?: THREE.Mesh;
  N: number;
  type: number;
  special?: 'cube' | 'coin';
  /** dé à chiffres (≠ cube à pips / pièce) */
  numbered?: boolean;
  numHex?: number;
  /** direction caméra (choix de la plaque du halo) */
  camDir?: THREE.Vector3;
  /** largeur cible du chiffre du résultat (d4 : agrandissement modéré) */
  resultWidth?: number;
}

/** Groupe Three.js d'un dé complet (corps + chiffres + halo). */
export type DieGroup = THREE.Group & { userData: DieUserData };

/** Dé persistant de l'aperçu / du lancer (un renderer par dé). */
export interface Die3D {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  die: DieGroup;
  type: number;
  camDir: THREE.Vector3;
  raf: number | null;
}

/** Plaque-chiffre : mesh plan portant la texture du glyphe. */
export interface PlateUserData {
  label?: string | number;
  dense?: boolean;
  _baseScale?: THREE.Vector3;
}
