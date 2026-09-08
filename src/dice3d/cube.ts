import * as THREE from 'three';
import { $opt } from '../dom';
import type { CubeTarget } from './types';

export function _themeColorHex(varName: string, fallback: number): number {
  try{
    var probe=$opt('game-screen')||document.body;
    var c=getComputedStyle(probe).getPropertyValue(varName).trim();
    if(!c) return fallback;
    // normaliser en nombre hex 0xRRGGBB
    if(c[0]==='#'){
      if(c.length===4){ c='#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]; }
      return parseInt(c.slice(1),16);
    }
    // rgb()
    var m=c.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if(m) return (parseInt(m[1])<<16)|(parseInt(m[2])<<8)|parseInt(m[3]);
    return fallback;
  }catch(e){ return fallback; }
}

// texture d'une face : points seulement, fond transparent (pour plaque posée sur le cube coloré)
export function _dieFaceTexture(v: number, bodyHex: number, pipHex: number): THREE.CanvasTexture {
  var c=document.createElement('canvas'); c.width=c.height=256;
  var x=c.getContext('2d') as CanvasRenderingContext2D; // contexte 2D toujours disponible sur un canvas neuf (comme avant : erreur sinon)
  var pip='#'+pipHex.toString(16).padStart(6,'0');
  // fond transparent : on laisse voir le corps du dé
  var o=0.28;
  var M: Record<number, number[][]>={1:[[0,0]],2:[[-o,o],[o,-o]],3:[[-o,o],[0,0],[o,-o]],
    4:[[-o,o],[o,o],[-o,-o],[o,-o]],5:[[-o,o],[o,o],[0,0],[-o,-o],[o,-o]],
    6:[[-o,o],[o,o],[-o,0],[o,0],[-o,-o],[o,-o]]};
  (M[v]||[]).forEach(function(pp){
    var cx=128+pp[0]*256, cy=128-pp[1]*256;
    // creux : ombre autour + point
    x.beginPath(); x.arc(cx,cy,29,0,7); x.fillStyle='rgba(0,0,0,0.28)'; x.fill();
    x.beginPath(); x.arc(cx,cy,26,0,7); x.fillStyle=pip; x.fill();
    // reflet
    x.beginPath(); x.arc(cx-8,cy-8,7,0,7); x.fillStyle='rgba(255,255,255,0.55)'; x.fill();
  });
  var t=new THREE.CanvasTexture(c); t.anisotropy=16; return t; // 16 : chiffres nets en vue rasante (Three plafonne au max du GPU)
}

// rotation cible pour amener la valeur v face caméra (+Z)
// faces BoxGeometry: [+X,-X,+Y,-Y,+Z,-Z] -> on assigne [3,4,1,6,5,2] (opposées = 7)
export var _DIE_TARGET: Record<number, CubeTarget>={
  5:{x:0,y:0},                    // +Z déjà face (peinte 5)
  2:{x:0,y:Math.PI},              // -Z (peinte 2)
  3:{x:0,y:-Math.PI/2},           // +X (peinte 3)
  4:{x:0,y:Math.PI/2},            // -X (peinte 4)
  1:{x:Math.PI/2,y:0},            // -Y (peinte 6) -> amène la valeur 1 : fix 1<->6
  6:{x:-Math.PI/2,y:0}            // +Y (peinte 1) -> amène la valeur 6 : fix 1<->6
};
// d3 : faces valant 1,2,3,1,2,3 -> rotation amenant une face de la valeur voulue face caméra
export var _DIE_TARGET_D3: Record<number, CubeTarget>={
  1:{x:0,y:-Math.PI/2},           // +X porte 1
  2:{x:0,y:Math.PI/2},            // -X porte 2
  3:{x:Math.PI/2,y:0}             // +Y porte 3 (rotX +PI/2, vérifié)
};

// Construit une géométrie de cube à coins arrondis.
// 6 groupes (0..5) = les 6 faces plates (pour les textures de points),
// groupe 6 = les bords/coins arrondis (matériau corps uni).
export function makeRoundedBoxGeometry(size: number, radius: number, curveSeg: number): THREE.BoxGeometry {
  var h=size/2;
  // On part d'un BoxGeometry très subdivisé et on "arrondit" en projetant
  // les sommets vers l'intérieur d'un cube à coins sphériques.
  var seg=Math.max(2, curveSeg*2);
  var geo=new THREE.BoxGeometry(size,size,size,seg,seg,seg);
  var pos=geo.attributes.position as THREE.BufferAttribute;
  var inner=h-radius; // demi-taille de la zone plate
  var v=new THREE.Vector3();
  for(var i=0;i<pos.count;i++){
    v.set(pos.getX(i),pos.getY(i),pos.getZ(i));
    // point de référence clampé dans le cube intérieur
    var cx=Math.max(-inner,Math.min(inner,v.x));
    var cy=Math.max(-inner,Math.min(inner,v.y));
    var cz=Math.max(-inner,Math.min(inner,v.z));
    var dx=v.x-cx, dy=v.y-cy, dz=v.z-cz;
    var len=Math.sqrt(dx*dx+dy*dy+dz*dz);
    if(len>0){
      var k=radius/len;
      pos.setXYZ(i, cx+dx*k, cy+dy*k, cz+dz*k);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

export function _makeDie(size: number, bodyHex: number, pipHex: number, faceValsArg?: number[]): THREE.Group {
  // dé légèrement plus grand + coins arrondis
  var S=2.2, R=0.42;
  var faceVals=faceValsArg || [3,4,1,6,5,2]; // +X,-X,+Y,-Y,+Z,-Z (d6 par défaut)
  // corps uni pour les bords arrondis
  var bodyMat=new THREE.MeshStandardMaterial({color:bodyHex,roughness:0.4,metalness:0.12});
  // Plaques de face texturées, posées juste au-dessus de chaque face plane
  var group=new THREE.Group();
  var geo=makeRoundedBoxGeometry(S,R,4);
  var cube=new THREE.Mesh(geo, bodyMat); cube.castShadow=true;
  group.add(cube);
  // ajoute une fine plaque texturée (points) centrée sur chaque face plane
  var flat=S/2-R;           // niveau de la zone plate du cube arrondi
  var plateSize=(S-2*R)+R*0.5; // couvre la zone plate, léger débord contrôlé
  var off=flat+R+0.012;     // juste au ras de la surface bombée de la face
  var faceDefs=[
    {v:faceVals[0], pos:[off,0,0],  rot:[0,Math.PI/2,0]},
    {v:faceVals[1], pos:[-off,0,0], rot:[0,-Math.PI/2,0]},
    {v:faceVals[2], pos:[0,off,0],  rot:[-Math.PI/2,0,0]},
    {v:faceVals[3], pos:[0,-off,0], rot:[Math.PI/2,0,0]},
    {v:faceVals[4], pos:[0,0,off],  rot:[0,0,0]},
    {v:faceVals[5], pos:[0,0,-off], rot:[0,Math.PI,0]}
  ];
  faceDefs.forEach(function(f){
    var pg=new THREE.PlaneGeometry(plateSize,plateSize);
    var pm=new THREE.MeshStandardMaterial({map:_dieFaceTexture(f.v,bodyHex,pipHex),
      roughness:0.34,metalness:0.12,transparent:true,side:THREE.DoubleSide,
      polygonOffset:true,polygonOffsetFactor:-2});
    var plane=new THREE.Mesh(pg,pm);
    plane.position.set(f.pos[0],f.pos[1],f.pos[2]);
    plane.rotation.set(f.rot[0],f.rot[1],f.rot[2]);
    plane.castShadow=false;
    group.add(plane);
  });
  return group;
}

// Crée un dé 3D PERSISTANT dans le conteneur, rendu statique (aperçu),
// et renvoie un objet réutilisable pour l'animation de lancer.
