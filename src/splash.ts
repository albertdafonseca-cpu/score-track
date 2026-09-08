import { $ } from './dom';

export function drawSplashIcon(){

    const c=$<HTMLCanvasElement>('splash-icon');
    const ctx=c.getContext('2d') as CanvasRenderingContext2D;const s=96/64;
    const r=14*s;ctx.beginPath();ctx.moveTo(r,0);ctx.lineTo(96-r,0);ctx.quadraticCurveTo(96,0,96,r);ctx.lineTo(96,96-r);ctx.quadraticCurveTo(96,96,96-r,96);ctx.lineTo(r,96);ctx.quadraticCurveTo(0,96,0,96-r);ctx.lineTo(0,r);ctx.quadraticCurveTo(0,0,r,0);ctx.closePath();ctx.fillStyle='#1a1a1a';ctx.fill();
    ctx.strokeStyle='#3a3a3a';ctx.lineWidth=1.2*s;ctx.beginPath();ctx.moveTo(14*s,38*s);ctx.lineTo(50*s,38*s);ctx.stroke();
    ctx.strokeStyle='#66CCEE';ctx.lineWidth=2.5*s;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(32*s,11*s);ctx.lineTo(32*s,27*s);ctx.stroke();
    ctx.beginPath();ctx.moveTo(24*s,19*s);ctx.lineTo(40*s,19*s);ctx.stroke();
    ctx.strokeStyle='#EE6677';ctx.beginPath();ctx.moveTo(24*s,51*s);ctx.lineTo(40*s,51*s);ctx.stroke();
  
}
