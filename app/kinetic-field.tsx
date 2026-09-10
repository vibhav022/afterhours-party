"use client";
import { useEffect, useRef } from "react";
export default function KineticField() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d",{alpha:true});if(!ctx)return;
    const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
    let width=0,height=0,frame=0,last=0,time=0,visible=true;
    const draw=(clock:number)=>{
      frame=0;if(!visible||document.hidden)return;
      if(clock-last<33&&!reduce.matches){frame=requestAnimationFrame(draw);return;}
      const delta=Math.min(50,clock-last||33);last=clock;if(!reduce.matches)time+=delta*.00014;
      ctx.clearRect(0,0,width,height);
      const centerX=width*.5+Math.sin(time*.7)*width*.05;
      const centerY=height*.42+Math.cos(time*.6)*height*.025;
      const max=Math.max(width,height)*.92;
      ctx.save();ctx.translate(centerX,centerY);ctx.rotate(-.35+Math.sin(time*.32)*.12);
      for(let ring=0;ring<18;ring++){
        const depth=(ring/18+time*.06)%1;
        const radius=32+Math.pow(depth,2.3)*max;
        const opacity=Math.sin(depth*Math.PI)*.48;
        ctx.beginPath();
        for(let point=0;point<=80;point++){
          const a=point/80*Math.PI*2;
          const wave=1+Math.sin(a*3+time*.5+ring*.21)*.055;
          const x=Math.cos(a)*radius*wave,y=Math.sin(a)*radius*.72*wave;
          if(point===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.closePath();
        ctx.strokeStyle=ring%5===0?`rgba(255,50,69,${opacity*.7})`:`rgba(185,23,42,${opacity})`;
        ctx.lineWidth=ring%5===0?1.6:1;ctx.stroke();
      }
      for(let i=0;i<22;i++){
        const angle=i*2.39996+time*.12,radius=max*(.18+(i%7)*.095);
        ctx.fillStyle=`rgba(244,101,112,${.25+Math.sin(time+i)*.12})`;
        ctx.fillRect(Math.cos(angle)*radius,Math.sin(angle)*radius*.64,i%3===0?2:1,i%3===0?2:1);
      }
      ctx.restore();if(!reduce.matches)frame=requestAnimationFrame(draw);
    };
    const resize=()=>{const box=canvas.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(!frame)frame=requestAnimationFrame(draw)};
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!frame)frame=requestAnimationFrame(draw);else if(!visible&&frame){cancelAnimationFrame(frame);frame=0;}},{threshold:0});observer.observe(canvas);
    const resume=()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else if(!frame)frame=requestAnimationFrame(draw)};
    document.addEventListener("visibilitychange",resume);reduce.addEventListener("change",resume);resize();
    return()=>{cancelAnimationFrame(frame);resizeObserver.disconnect();observer.disconnect();document.removeEventListener("visibilitychange",resume);reduce.removeEventListener("change",resume)};
  },[]);
  return <canvas ref={canvasRef} className="kinetic-field" aria-hidden="true"/>;
}
