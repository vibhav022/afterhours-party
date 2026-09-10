"use client";

import { useEffect, useRef, useState, type FormEvent, type CSSProperties } from "react";
import { ArrowUpRight, Check, Camera as Instagram, MapPin, MapPinned, Clock3, Navigation, LoaderCircle, X } from "lucide-react";
import KineticField from "./kinetic-field";
import DateReveal from "./date-reveal";
import { Checkbox } from "@/components/ui/checkbox";

const INSTAGRAM = "https://www.instagram.com/afterhours_.ie/";
export default function Home() {
  const [started,setStarted]=useState(false);
  const [intro,setIntro]=useState(true);
  const [skipped,setSkipped]=useState(false);
  const heroRef=useRef<HTMLElement>(null);
  const [consent,setConsent]=useState(false);
  const [status,setStatus]=useState<"idle"|"sending"|"success">("idle");
  const [error,setError]=useState("");
  const [firstName,setFirstName]=useState("");
  const [closed,setClosed]=useState(false);
  const [lightbox,setLightbox]=useState<{src:string;alt:string}|null>(null);
  const successRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{setClosed(Date.now()>=Date.parse("2026-09-17T00:00:00+05:30"));},[]);
  useEffect(()=>{if(status==="success")successRef.current?.focus();},[status]);
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setLightbox(null)};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.location.hash) {
      setSkipped(true); setIntro(false); setStarted(true); return;
    }
    let finish: ReturnType<typeof setTimeout>;
    let cancelled=false;
    let begun=false;
    const begin=()=>{
      if(cancelled||begun)return;
      begun=true;setStarted(true);finish=setTimeout(()=>setIntro(false),2100);
    };
    const fontLimit=setTimeout(begin,700);
    document.fonts.load("1em AfterhoursGothic").then(()=>{clearTimeout(fontLimit);begin();}).catch(begin);
    const failSafe=setTimeout(()=>{setIntro(false);setStarted(true);},4500);
    return()=>{cancelled=true;clearTimeout(fontLimit);clearTimeout(finish);clearTimeout(failSafe);};
  }, []);
  useEffect(() => {
    if(intro)return;
    const page=heroRef.current?.closest("main");
    if(!page)return;
    const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf=0;
    let scrollDistance=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    const scenes=Array.from(page.querySelectorAll<HTMLElement>("[data-scroll-scene]"));
    scenes.forEach(scene=>{scene.style.setProperty("--scene-progress","1");scene.querySelectorAll<HTMLElement>(".scroll-word").forEach(line=>line.style.setProperty("--line-progress","1"))});
    const animations: Animation[]=[];
    const clamp=(n:number)=>Math.min(1,Math.max(0,n));
    const update=()=>{
      raf=0;
      const hero=heroRef.current;
      const heroBox=hero?.getBoundingClientRect();
      const reduced=reduce.matches;
      page.style.setProperty("--page-progress",String(clamp(window.scrollY/scrollDistance)));
      if(hero&&heroBox)hero.style.setProperty("--hero-scroll",reduced?"0":String(clamp(-heroBox.top/heroBox.height)));
    };
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(update)};
    const observer="IntersectionObserver" in window?new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        if(!reduce.matches)animations.push(entry.target.animate([
          {opacity:0,transform:"perspective(1000px) translateY(55px) rotateX(5deg) scale(.97)"},
          {opacity:1,transform:"perspective(1000px) translateY(0) rotateX(0) scale(1)"}
        ],{duration:1000,easing:"cubic-bezier(.16,1,.3,1)",fill:"backwards"}));
        observer?.unobserve(entry.target);
      });
    },{threshold:.12}):null;
    page.querySelectorAll("[data-enter]").forEach(el=>observer?.observe(el));
    const videoObserver="IntersectionObserver" in window?new IntersectionObserver(entries=>{entries.forEach(entry=>{const video=entry.target as HTMLVideoElement;if(entry.isIntersecting)void video.play().catch(()=>{});else video.pause()})},{rootMargin:"120px 0px",threshold:.01}):null;
    page.querySelectorAll("video").forEach(video=>videoObserver?.observe(video));
    const motionChange=()=>{animations.forEach(animation=>animation.cancel());schedule()};
    const resize=()=>{scrollDistance=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);schedule()};
    window.addEventListener("scroll",schedule,{passive:true});window.addEventListener("resize",resize);reduce.addEventListener("change",motionChange);update();
    return()=>{window.removeEventListener("scroll",schedule);window.removeEventListener("resize",resize);reduce.removeEventListener("change",motionChange);cancelAnimationFrame(raf);observer?.disconnect();videoObserver?.disconnect();animations.forEach(animation=>animation.cancel())};
  }, [intro]);
  function skipIntro(){setSkipped(true);setStarted(true);setIntro(false);}
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if(status==="sending")return;
    if(!consent){setError("Please agree to the RSVP notice to continue.");return;}
    const data=new FormData(e.currentTarget);
    setError("");setStatus("sending");
    try {
      const response=await fetch("/api/rsvp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:data.get("name"),college:data.get("college"),phone:String(data.get("phone")||"").replace(/\s/g,""),consent,website:data.get("website")}),signal:AbortSignal.timeout(20000)});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Please try again shortly.");
      setFirstName(String(data.get("name")).trim().split(" ")[0]); setStatus("success");
    }catch(e){setError(e instanceof Error && e.name==="TimeoutError"?"That took too long. Please try again—your RSVP won’t be duplicated.":e instanceof Error?e.message:"Unable to connect. Please try again.");setStatus("idle");}
  }
  return <main className="experience" data-started={started} data-skipped={skipped}>
    <div className="page-progress" aria-hidden="true"/>
    {intro&&<div className="arrival">
      <div className="arrival-half arrival-top" aria-hidden="true"><span>After</span></div>
      <div className="arrival-half arrival-bottom" aria-hidden="true"><span>Hours</span></div>
      <div className="arrival-cut" aria-hidden="true"/>
      <p className="arrival-caption" aria-hidden="true">YOUR NIGHT STARTS HERE. / 16.09.26</p>
      <button type="button" className="skip-intro" onClick={skipIntro}>Skip intro <ArrowUpRight size={16}/></button>
    </div>}
    <header className="header">
      <a href="#" className="wordmark" aria-label="Afterhours home"><img className="profile-logo" src="/assets/afterhours-profile.jpg" alt=""/>afterhours</a>
      <nav aria-label="Main navigation"><a className="nav-social" href={INSTAGRAM} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={15}/></a><a className="nav-rsvp" href="#rsvp">I’m coming <ArrowUpRight size={16}/></a></nav>
    </header>

    <section className="hero" aria-labelledby="hero-title" ref={heroRef}>
      <KineticField/>
      <div className="hero-shade" aria-hidden="true"/>
      <div className="ambient-light light-one" aria-hidden="true" />
      <div className="hero-topline"><span>AFTERHOURS/ ONLYPARTY</span></div>
      <div className="hero-content">
        <div className="title-depth">
          <h1 id="hero-title" aria-label="Afterhours">
            <span className="mega-word word-after" aria-hidden="true">{"After".split("").map((letter,i)=><span key={i} style={{"--letter":i} as CSSProperties}>{letter}</span>)}</span>
            <span className="mega-word word-hours" aria-hidden="true">{"Hours".split("").map((letter,i)=><span key={i} style={{"--letter":i+3} as CSSProperties}>{letter}</span>)}</span>
          </h1>
        </div>
        <DateReveal enabled={!intro}/>
        <div className="hero-where" aria-label="Party location and time"><span><MapPin size={15}/> Studio XO</span><span><Clock3 size={15}/> 4 PM onwards</span></div>
        <div className="hero-actions"><a className="button button-primary" href="#rsvp">I’m coming <ArrowUpRight size={23}/></a></div>
      </div>
    </section>
    <section className="exclusive-section" aria-labelledby="exclusive-title" data-scroll-scene="exclusive">
      <div className="exclusive-heading" data-scroll-scene="text">
        <p className="section-label"><span>04 /</span> EXCLUSIVE DETAILS</p>
        <h2 id="exclusive-title"><span className="scroll-word">Pick your</span><br/><em className="scroll-word">after-hours energy.</em></h2>
        <p>Little extras for the people who came for more than just a playlist.</p>
      </div>
      <div className="exclusive-deck" aria-label="Exclusive party details">
        <article className="detail-poster" data-enter>
          <img src="/assets/afterhours-fun-games-poster.png" alt="Graphic party poster representing fun games" loading="lazy"/>
          <div className="detail-poster-copy"><span>01 / EXCLUSIVE</span><h3>Fun<br/>games.</h3><p>Chaos, prizes, no boring side quests.</p></div>
        </article>
        <article className="detail-poster" data-enter>
          <img src="/assets/afterhours-tags-stickers-poster.png" alt="Graphic party poster representing tags and stickers" loading="lazy"/>
          <div className="detail-poster-copy"><span>02 / EXCLUSIVE</span><h3>Tags &amp;<br/>stickers.</h3><p>Leave your mark. Wear the night.</p></div>
        </article>
        <article className="detail-poster" data-enter>
          <img src="/assets/afterhours-sfx-poster.png" alt="Graphic party poster representing high-end sound effects" loading="lazy"/>
          <div className="detail-poster-copy"><span>03 / EXCLUSIVE</span><h3>High-end<br/>SFX.</h3><p>Big-room sound. No weak moments.</p></div>
        </article>
        <article className="detail-poster" data-enter>
          <img src="/assets/afterhours-party-details-poster.png" alt="Graphic poster of a dancing gorilla, mummy, and skeletons" loading="lazy"/>
          <div className="detail-poster-copy"><span>04 / EXCLUSIVE</span><h3>The<br/>crew.</h3><p>Gorilla. Mummy. Skeletons.</p></div>
        </article>
      </div>
      <p className="deck-hint" aria-hidden="true">SWIPE TO EXPLORE <span>→</span></p>
    </section>


    <section className="rsvp-section" id="rsvp" aria-labelledby="rsvp-title">
      <div className="rsvp-intro" data-scroll-scene="text">
        <p className="section-label"><span>01 /</span> THE ONLY PLAN YOU NEED</p>
        <h2 id="rsvp-title"><span className="scroll-word">Don’t just</span><br/><span className="scroll-word">watch the stories.</span><br/><em className="scroll-word">Be in them.</em></h2>
        <p>Bring your energy. Find your people.<br/>Let us know you’re coming to Afterhours.</p>
      </div>
      <div className="rsvp-card" data-enter>
        {status==="success"?<div className="success" ref={successRef} tabIndex={-1} role="status">
          <span className="success-check"><Check size={38}/></span><p className="section-label">RSVP SAVED</p><h3>You’re on the list,<br/><em>{firstName}.</em></h3><p>16 September 2026. It’s a plan.</p><div className="success-details">Your attendance response has been recorded. This RSVP is not an entry ticket. Follow Afterhours for entry details and event updates.</div><a className="button button-primary" href={INSTAGRAM} target="_blank" rel="noreferrer">Follow the reveal <Instagram size={20}/></a>
        </div>:<>
          <div className="card-heading"><div><span className="section-label">THE RSVP LIST</span><h3>Count me in<span>↗</span></h3></div><span className="rsvp-badge">16<br/>SEP</span></div>
          <div className="rsvp-price" aria-label="Early bird pass prices">
            <div className="price-banner"><span>EARLY BIRD IS OUT NOW</span><b>50 PASSES ONLY</b></div>
            <div className="price-grid">
              <div className="price-option"><span>STAG PASS</span><strong>₹1,200</strong></div>
              <div className="price-option"><span>COUPLE PASS</span><strong>₹2,100</strong></div>
              <div className="price-option"><span>GROUP <em>(10+)</em></span><strong>₹1,100 <small>PP</small></strong></div>
              <div className="price-option price-table"><span>TABLE <em>(10 PERSON)</em></span><strong>₹25K</strong></div>
            </div>
          </div>
          <p className="form-description">{closed?"RSVPs for this event have closed.":"Three details. Then we’ll see you there."}</p>
          <form onSubmit={submit}>
            <label htmlFor="name">Your name<input id="name" name="name" placeholder="What do your friends call you?" autoComplete="name" required minLength={2} maxLength={80} disabled={closed}/></label>
            <label htmlFor="college">College / university<input id="college" name="college" placeholder="Where’s your crew from?" required minLength={2} maxLength={120} disabled={closed}/></label>
            <label htmlFor="phone">Mobile number<div className="phone-field"><span>+91</span><input id="phone" name="phone" placeholder="Your 10-digit number" type="tel" autoComplete="tel-national" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} title="Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9" required disabled={closed}/></div></label>
            <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
            <div className="consent-row"><Checkbox id="consent" checked={consent} onCheckedChange={v=>setConsent(v===true)} disabled={closed} className="consent-box"/><label htmlFor="consent">I agree that the organisers can use these details for my RSVP and event updates.</label></div>
            {error&&<p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary submit-button" type="submit" disabled={status==="sending"||closed}>{status==="sending"?<><LoaderCircle className="spin" size={20}/> Saving your RSVP…</>:<>Yes, I’m coming <ArrowUpRight size={23}/></>}</button>
            <p className="form-footnote">RSVP confirms your interest, not entry. Entry details will be announced by the organisers.</p>
          </form>
        </>}
      </div>
    </section>


    <section className="location-section" id="location" data-scroll-scene="location" aria-labelledby="location-title">
      <div className="location-copy" data-scroll-scene="text">
        <p className="section-label"><span>02 /</span> TONIGHT’S COORDINATES</p>
        <h2 id="location-title"><span className="scroll-word">Your night starts</span><br/><em className="scroll-word">right here.</em></h2>
        <div className="venue-lockup"><span className="venue-number">XO</span><div><strong>Studio XO</strong><span><Clock3 size={16}/> 16 September · 4 PM onwards</span></div></div>
        <p className="venue-address">302–304, 3rd Floor, A Block,<br/>High Street Apollo, Niranjanpur, Indore.</p>
        <a className="button button-primary map-button" href="https://maps.app.goo.gl/oxWgeG64vFjciwCn8" target="_blank" rel="noreferrer">Take me there <Navigation size={19}/></a>
        <p className="location-note">Tell the group chat. Charge your phone. Bring the chaos.</p>
      </div>
      <div className="map-shell" data-enter>
        <div className="map-stamp" aria-hidden="true"><MapPinned size={24}/><span>PARTY<br/>THIS WAY</span></div>
        <iframe className="party-map" title="Studio XO location map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Studio%20XO%2C%20302-304%2C%203rd%20Floor%2C%20A%20Block%2C%20High%20Street%20Apollo%2C%20Niranjanpur%2C%20Indore%2C%20Madhya%20Pradesh%20452010&output=embed"/>
        <div className="map-noise" aria-hidden="true"/>
        <div className="map-footer"><span>HIGH STREET APOLLO / INDORE</span><a href="https://maps.app.goo.gl/oxWgeG64vFjciwCn8" target="_blank" rel="noreferrer">OPEN MAPS <ArrowUpRight size={16}/></a></div>
      </div>
    </section>
    <section className="venue-gallery" data-scroll-scene="venue-gallery" aria-labelledby="venue-gallery-title">
      <div className="venue-gallery-heading" data-scroll-scene="text">
        <p className="section-label"><span>03 /</span> INSIDE STUDIO XO</p>
        <h2 id="venue-gallery-title"><span className="scroll-word">The room is</span><br/><em className="scroll-word">waiting for you.</em></h2>
        <p>Red lights, late plans, one space made for the stories you will not stop talking about.</p>
      </div>
      <div className="venue-gallery-grid">
        <figure className="venue-card venue-video venue-video-tall" data-enter>
          <video src="/assets/afterglow-party.mp4" poster="/assets/afterhours-characters.jpg" muted loop autoPlay playsInline preload="metadata" aria-label="Afterhours party video"/>
          <figcaption><span>THE AFTERGLOW</span><i>01</i></figcaption>
        </figure>
        <figure className="venue-card venue-still venue-still-lounge" data-enter><button type="button" className="venue-image-button" onClick={()=>setLightbox({src:"/assets/studio-xo-main-floor.webp",alt:"Main floor and stage at Studio XO"})}><img src="/assets/studio-xo-main-floor.webp" alt="Main floor and stage at Studio XO" loading="lazy"/></button><figcaption><span>MAIN FLOOR</span><i>02</i></figcaption></figure>
        <figure className="venue-card venue-still venue-still-cocktail" data-enter><button type="button" className="venue-image-button" onClick={()=>setLightbox({src:"/assets/afterhours-pizza-party.jpg",alt:"Pizza spread at an Afterhours party"})}><img src="/assets/afterhours-pizza-party.jpg" alt="Pizza spread at an Afterhours party" loading="lazy"/></button><figcaption><span>ALL THAT IS MISSING</span><i>YOU</i></figcaption></figure>
        <figure className="venue-card venue-video venue-video-short" data-enter>
          <video src="/assets/studio-xo-reel-two.mp4" poster="/assets/studio-xo-stage.jpg" muted loop autoPlay playsInline preload="metadata" aria-label="Studio XO stage video"/>
          <figcaption><span>LIGHTS UP</span><i>03</i></figcaption>
        </figure>
        <figure className="venue-card venue-video venue-still-day" data-enter><video src="/assets/afterhours-high-end-sfx.mp4" muted loop autoPlay playsInline preload="metadata" aria-label="High-End SFX party video"/><figcaption><span>HIGH-END SFX</span><i>04</i></figcaption></figure>
        <figure className="venue-card venue-still venue-still-stage" data-enter><button type="button" className="venue-image-button" onClick={()=>setLightbox({src:"/assets/afterhours-characters.jpg",alt:"Costumed characters at an Afterhours party"})}><img src="/assets/afterhours-characters.jpg" alt="Costumed characters at an Afterhours party" loading="lazy"/></button><figcaption><span>SPECIAL CHARACTERS</span><i>✦</i></figcaption></figure>
      </div>
    </section>
    {lightbox&&<div className="venue-lightbox" role="dialog" aria-modal="true" aria-label="Venue image preview" onClick={()=>setLightbox(null)}><div className="venue-lightbox-inner" onClick={event=>event.stopPropagation()}><button type="button" className="venue-lightbox-close" onClick={()=>setLightbox(null)} aria-label="Close image"><X size={23}/></button><img src={lightbox.src} alt={lightbox.alt}/><p>TAP OUTSIDE TO CLOSE</p></div></div>}
    <div className="party-words" aria-hidden="true"><div><span>DRESS LOUD</span><i>✦</i><span>NO BORING PLANS</span><i>✦</i><span>STUDIO XO</span><i>✦</i><span>4 PM ONWARDS</span><i>✦</i><span>SEE YOU INSIDE</span><i>✦</i><span>DRESS LOUD</span><i>✦</i><span>NO BORING PLANS</span><i>✦</i><span>STUDIO XO</span><i>✦</i><span>4 PM ONWARDS</span><i>✦</i><span>SEE YOU INSIDE</span><i>✦</i></div></div>

    <footer data-scroll-scene="footer">
      <div className="footer-cta">
        <div><p className="section-label">ONE NIGHT. NO RE-RUNS.</p><h2><span>Meet us</span> <em>after dark.</em></h2></div>
        <div className="footer-collaborators"><span>COLLABORATORS</span><div><a href="https://www.instagram.com/genzone.ie/" target="_blank" rel="noreferrer">GENZONE <ArrowUpRight size={17}/></a><i>×</i><a href="https://www.instagram.com/indorievents/" target="_blank" rel="noreferrer">INDORI EVENTS <ArrowUpRight size={17}/></a></div></div>
      </div>
      <div className="footer-big" aria-hidden="true">afterhours<span>✦</span></div>
      <div className="footer-grid">
        <div><small>THE DATE</small><strong>16 September</strong><span>4 PM onwards</span></div>
        <div><small>THE PLACE</small><strong>Studio XO</strong><span>High Street Apollo, Niranjanpur, Indore</span></div>
        <div><small>STAY CLOSE</small><a href={INSTAGRAM} target="_blank" rel="noreferrer">@afterhours_.ie <ArrowUpRight size={15}/></a><span>Follow for party updates and entry details</span></div>
      </div>
      <div className="footer-bottom"><span>MAKE MEMORIES. LOSE TRACK OF TIME.</span><span>© AFTERHOURS 2026</span></div>
    </footer>

  </main>;
}
