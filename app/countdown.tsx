"use client";
import { useEffect, useState } from "react";

export const COUNTDOWN_TARGET=Date.parse("2026-09-16T00:00:00+05:30");
export function countdownParts(now:number) {
  const seconds=Math.max(0,Math.ceil((COUNTDOWN_TARGET-now)/1000));
  return {ended:seconds===0,values:[Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60]};
}
export default function Countdown() {
  const [time,setTime]=useState<ReturnType<typeof countdownParts>|null>(null);
  useEffect(()=>{
    let interval:ReturnType<typeof setInterval>|undefined;
    const tick=()=>{const next=countdownParts(Date.now());setTime(next);if(next.ended&&interval)clearInterval(interval)};
    const start=()=>{if(interval)clearInterval(interval);tick();if(!document.hidden&&Date.now()<COUNTDOWN_TARGET)interval=setInterval(tick,1000)};
    start();document.addEventListener("visibilitychange",start);
    return()=>{if(interval)clearInterval(interval);document.removeEventListener("visibilitychange",start)};
  },[]);
  return <div className="event-countdown">
    {time?.ended?<p className="countdown-arrived">The date has arrived.</p>:<>
      <div className="countdown-digits" role="timer" aria-live="off" aria-label="Time until 16 September 2026, India Standard Time">
        {["Days","Hours","Mins","Secs"].map((label,i)=><div className="countdown-unit" key={label}><span>{time?String(time.values[i]).padStart(2,"0"):"—"}</span><small>{label}</small></div>)}
      </div>
    </>}
  </div>;
}
