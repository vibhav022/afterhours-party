"use client";
import { useEffect, useRef, useState } from "react";
import Countdown from "./countdown";

export default function DateReveal({enabled}:{enabled:boolean}) {
  const ref=useRef<HTMLDivElement>(null);
  const [revealed,setRevealed]=useState(false);
  useEffect(()=>{
    if(!enabled)return;
    const el=ref.current;if(!el)return;
    const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
    if(reduce.matches||!("IntersectionObserver" in window)){setRevealed(true);return;}
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){setRevealed(true);observer.disconnect();}
    },{threshold:.55});
    observer.observe(el);return()=>observer.disconnect();
  },[enabled]);
  return <div className="date-feature" ref={ref} data-revealed={revealed}>
    <div className="date-sequence">
      <time className="date-lockup" dateTime="2026-09-16" aria-label="16 September 2026">
        <span className="date-day"><span className="date-digit digit-one">1</span><span className="date-digit digit-six">6</span></span>
        <span className="date-month"><span className="month-mask"><span>SEPTEMBER</span></span><span className="date-weekday">WEDNESDAY / 2026</span></span>
      </time>
      <span className="date-trace" aria-hidden="true"/>
    </div>
    <Countdown/>
  </div>;
}
