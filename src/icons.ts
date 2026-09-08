import { $, $opt } from './dom';

(function(){
  try{
    // ── Génère l'icône PNG 192×192 via canvas ──────────────────────
    function makeIcon(size: number){
      const c=document.createElement('canvas');c.width=size;c.height=size;
      const ctx=c.getContext('2d') as CanvasRenderingContext2D;const s=size/64;
      // Fond arrondi
      const r=14*s;ctx.beginPath();ctx.moveTo(r,0);ctx.lineTo(size-r,0);ctx.quadraticCurveTo(size,0,size,r);ctx.lineTo(size,size-r);ctx.quadraticCurveTo(size,size,size-r,size);ctx.lineTo(r,size);ctx.quadraticCurveTo(0,size,0,size-r);ctx.lineTo(0,r);ctx.quadraticCurveTo(0,0,r,0);ctx.closePath();ctx.fillStyle='#1a1a1a';ctx.fill();
      // Ligne horizontale séparatrice
      ctx.strokeStyle='#3a3a3a';ctx.lineWidth=1.2*s;ctx.beginPath();ctx.moveTo(14*s,38*s);ctx.lineTo(50*s,38*s);ctx.stroke();
      // Barre + (bleue)
      ctx.strokeStyle='#66CCEE';ctx.lineWidth=2.5*s;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(32*s,11*s);ctx.lineTo(32*s,27*s);ctx.stroke();
      ctx.beginPath();ctx.moveTo(24*s,19*s);ctx.lineTo(40*s,19*s);ctx.stroke();
      // Barre − (rose)
      ctx.strokeStyle='#EE6677';ctx.beginPath();ctx.moveTo(24*s,51*s);ctx.lineTo(40*s,51*s);ctx.stroke();
      return c.toDataURL('image/png');
    }
    const png64  = makeIcon(64);
    const png192 = makeIcon(192);
    const png512 = makeIcon(512);
    (function(){const sc=document.createElement('canvas');sc.width=2732;sc.height=2732;const sctx=sc.getContext('2d') as CanvasRenderingContext2D;sctx.fillStyle='#020d12';sctx.fillRect(0,0,2732,2732);const img=new Image();img.onload=function(){sctx.drawImage(img,(2732-512)/2,(2732-512)/2,512,512);const sp=$opt<HTMLLinkElement>('dyn-splash');if(sp)sp.href=sc.toDataURL('image/png');};img.src=png512;})();
    // Favicon onglet
    $<HTMLLinkElement>('dyn-favicon').href=png64;
    // Apple touch icon
    $<HTMLLinkElement>('dyn-touch-icon').href=png192;
    // Manifest entièrement inline via Blob — aucun fichier externe requis
    const manifest={
      name:'ScoreTrack',short_name:'ScoreTrack',
      description:'Compteur de scores universel',
      start_url:'./',display:'standalone',orientation:'portrait-primary',
      background_color:'#020d12',theme_color:'#020d12',
      icons:[
        {src:png192,sizes:'192x192',type:'image/png'},
        {src:png192,sizes:'192x192',type:'image/png',purpose:'maskable'},
        {src:png512,sizes:'512x512',type:'image/png'},
        {src:png512,sizes:'512x512',type:'image/png',purpose:'maskable'}
      ]
    };
    const blob=new Blob([JSON.stringify(manifest)],{type:'application/manifest+json'});
    $<HTMLLinkElement>('dyn-manifest').href=URL.createObjectURL(blob);
  }catch(e){}
})();
