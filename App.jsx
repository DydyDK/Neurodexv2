import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import CARDS from "./data/cards.json";
import { SERIES, META } from "./data/catalog.js";
import { BACK, PACKART, WRINKLES } from "./data/art.js";

const KEY = "psyche-collection-v1";
const PIECES = SERIES.flatMap(s => [1,2,3,4].map(n => s.id + "-" + n));
const BYID = Object.fromEntries(META.map(m => [m.id, m]));
const ALL = META.map(m => m.id);
const TOTAL = ALL.length;
const GEMS = ["#FF8C69","#5CD3E6","#FF8FB1","#B59CFF","#7EE0A1","#FFB347","#8FB7FF","#E8574A","#FFE9B8"];
const RANK = { commune: 0, peu: 1, rare: 2, shiny: 3, mythe: 4, ultra: 5, maitresse: 6 };
const RLABEL = { commune: "Commune", peu: "Peu commune", rare: "Rare", shiny: "Shiny", mythe: "Mythe démasqué", ultra: "Ultra Shiny", maitresse: "Carte maîtresse" };
const RCOLOR = { commune: "#CFC8F5", peu: "#BFE3F2", rare: "#FFC857", shiny: "#FF8FB1", mythe: "#FF7A6B", ultra: "#FFE9B8", maitresse: "#FFC857" };
const DUP = { commune: 5, peu: 10, rare: 20, shiny: 50, mythe: 100, ultra: 100 };
const COST = { commune: 40, peu: 80, rare: 150, shiny: 400, mythe: 800, ultra: 800 };
const DAILY = 10;
const reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const T = ms => reduce ? 30 : ms;
const TEST = location.hash === "#test";
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch(e){} };

const fresh = () => ({ counts:{}, lastPack:null, email:null, news:false, asked:false, eclats:0, seenIntro:false });
function load(){ try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.counts) return Object.assign(fresh(), v); } catch(e){} return fresh(); }
function persist(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }
function today(){ const d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function untilTomorrow(){ const d = new Date(), m = new Date(d.getFullYear(), d.getMonth(), d.getDate()+1); let s = Math.max(0, Math.floor((m-d)/1000)); const h = Math.floor(s/3600); s -= h*3600; const mn = Math.floor(s/60); s -= mn*60; return [h,mn,s].map(v => String(v).padStart(2,"0")).join(":"); }
const ownedIn = (st, id) => (st.counts[id] || 0) > 0;
const completeIn = (st, sid) => [1,2,3,4].every(n => ownedIn(st, sid+"-"+n));
const hasIn = (st, id) => BYID[id] && BYID[id].r === "maitresse" ? completeIn(st, BYID[id].series) : ownedIn(st, id);
const totalIn = st => ALL.filter(id => hasIn(st, id)).length;
const seriesById = sid => SERIES.find(s => s.id === sid);
const mask = e => { const [u,d] = e.split("@"); return u.slice(0,1)+"•••@"+d; };
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const ofRarity = r => META.filter(m => m.r === r).map(m => m.id);

function burst(x, y, colors, n, spread){
  if (reduce) return; const layer = document.getElementById("particles");
  for (let i = 0; i < n; i++){
    const p = document.createElement("span"); p.className = "p";
    const a = Math.random()*Math.PI*2, d = (spread || 200) * (0.5 + Math.random());
    p.style.left = x+"px"; p.style.top = y+"px"; p.style.background = colors[i % colors.length];
    const s = 6 + Math.random()*8; p.style.width = s+"px"; p.style.height = s+"px";
    p.style.setProperty("--dx", Math.cos(a)*d+"px"); p.style.setProperty("--dy", Math.sin(a)*d+"px"); p.style.setProperty("--r", Math.random()*720+"deg");
    layer.appendChild(p); setTimeout(() => p.remove(), 1300);
  }
}
function useViewport(){ const [v, setV] = useState({ w: innerWidth, h: innerHeight }); useEffect(() => { const f = () => setV({ w: innerWidth, h: innerHeight }); addEventListener("resize", f); return () => removeEventListener("resize", f); }, []); return v; }
function useTick(){ const [, set] = useState(0); useEffect(() => { const t = setInterval(() => set(x => x+1), 1000); return () => clearInterval(t); }, []); }
function Timer(){ useTick(); return (<span className="timer">{untilTomorrow()}</span>); }
const Gem = ({ size }) => (<svg width={size||16} height={size||16} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 9l8 13 8-13z" fill="#5CD3E6"></path><path d="M12 2 4 9h16z" fill="#BFF3FF"></path><path d="M12 22 8 9h8z" fill="#2BA9C4"></path></svg>);

/* ---------- cartes ---------- */
const Card = memo(function Card({ id, w }){
  const h = w*880/630;
  return (<div className="cbox" style={{ width: w+"px", height: h+"px" }}><div className="cscale" style={{ transform: `scale(${w/630})` }} dangerouslySetInnerHTML={{ __html: id === "back" ? BACK : CARDS[id] }}></div></div>);
});
const Slice = memo(function Slice({ id, w }){
  const s = w/590;
  return (<div className="slice" style={{ height: 173*s+"px" }}><div className="cscale" style={{ transform: `scale(${s}) translate(-20px,-687px)` }} dangerouslySetInnerHTML={{ __html: CARDS[id] }}></div></div>);
});
function TiltCard({ id, w, live }){
  const r = BYID[id] ? BYID[id].r : "";
  const fx = r === "shiny" || r === "ultra" || r === "mythe";
  const [t, setT] = useState({ x: 0, y: 0, hx: 50, hy: 50 });
  const ref = useRef(null);
  const move = e => { const b = ref.current.getBoundingClientRect(); const nx = (e.clientX-b.left)/b.width, ny = (e.clientY-b.top)/b.height; setT({ x: (0.5-ny)*16, y: (nx-0.5)*20, hx: nx*100, hy: ny*100 }); };
  return (<div ref={ref} className={"tilt " + (fx ? "fx-"+r : "")} onPointerMove={live ? move : undefined} onPointerLeave={() => setT({ x: 0, y: 0, hx: 50, hy: 50 })}
      style={{ width: w+"px", transform: `perspective(1000px) rotateX(${t.x}deg) rotateY(${t.y}deg)`, "--hx": t.hx+"%", "--hy": t.hy+"%" }}>
    <Card id={id} w={w} />
    {fx ? (<><div className="holo"></div><div className="glints"><i></i><i></i><i></i><i></i></div></>) : null}
  </div>);
}


/* ---------- inspection 3D : pencher la carte sous tous les angles ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function Inspect({ id, w }){
  const r = BYID[id].r, fx = ["shiny","ultra","mythe"].includes(r);
  const [a, setA] = useState({ x: 0, y: 0 }); const [drag, setDrag] = useState(false);
  const [back, setBack] = useState(false); const [gyro, setGyro] = useState(false);
  const st = useRef(null), base = useRef(null), dragging = useRef(false);
  const gyroOK = typeof window.DeviceOrientationEvent !== "undefined";
  const down = e => { e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); st.current = { x: e.clientX, y: e.clientY, ax: a.x, ay: a.y }; dragging.current = true; setDrag(true); };
  const move = e => {
    if (dragging.current && st.current){ const dx = e.clientX - st.current.x, dy = e.clientY - st.current.y;
      setA({ x: clamp(st.current.ax - dy*.35, -50, 50), y: clamp(st.current.ay + dx*.35, -55, 55) }); return; }
    if (e.pointerType === "mouse" && !gyro){ const b = e.currentTarget.getBoundingClientRect(); const nx = (e.clientX-b.left)/b.width-.5, ny = (e.clientY-b.top)/b.height-.5; setA({ x: -ny*30, y: nx*36 }); }
  };
  const up = () => { dragging.current = false; setDrag(false); st.current = null; if (!gyro) setA({ x: 0, y: 0 }); };
  useEffect(() => {
    if (!gyro) return;
    const f = e => { if (dragging.current || e.beta == null) return; if (!base.current) base.current = { b: e.beta, g: e.gamma };
      setA({ x: clamp(-(e.beta - base.current.b) * 1.1, -45, 45), y: clamp((e.gamma - base.current.g) * 1.3, -50, 50) }); };
    addEventListener("deviceorientation", f); return () => removeEventListener("deviceorientation", f);
  }, [gyro]);
  const enableGyro = async () => {
    try { if (typeof DeviceOrientationEvent.requestPermission === "function"){ const p = await DeviceOrientationEvent.requestPermission(); if (p !== "granted") return; } } catch(e){ return; }
    base.current = null; setGyro(true); buzz(10);
  };
  const ry = a.y + (back ? 180 : 0), int = Math.min(1, (Math.abs(a.x) + Math.abs(a.y)) / 45);
  const vars = { "--hx": (50 + a.y*1.6) + "%", "--hy": (50 - a.x*1.6) + "%", "--gx": (50 + a.y*1.4) + "%", "--gy": (50 - a.x*1.4) + "%", "--int": int };
  const h = w*880/630;
  return (<div className="inspect-wrap">
    <div className="inspect" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={() => { if (!dragging.current && !gyro) setA({ x: 0, y: 0 }); }}
      style={{ width: w+"px", height: h+"px" }}>
      <div className="shadow3d" style={{ transform: `translate(${-a.y*.8}px, ${30 + a.x*.5}px) scale(${1 - int*.06})` }}></div>
      {r === "ultra" || r === "shiny" || r === "mythe" ? (<div className={"glow3d g3-"+r} style={{ transform: `rotateX(${a.x}deg) rotateY(${ry}deg)` }}></div>) : null}
      <div className={"card3d k-"+r} style={{ ...vars, transform: `rotateX(${a.x}deg) rotateY(${ry}deg)`, transition: drag || gyro ? "transform .06s linear" : "transform .6s cubic-bezier(.2,1.2,.3,1)" }}>
        <div className="side">
          <Card id={id} w={w} />
          {fx ? (<><div className="holo live"></div><div className="glints"><i></i><i></i><i></i><i></i></div></>) : null}
          <div className="glare"></div><div className="edge"></div>
        </div>
        <div className="side back"><Card id="back" w={w} /><div className="holo live soft"></div><div className="glare"></div><div className="edge"></div></div>
      </div>
    </div>
    <p className="hint" style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>{gyro ? "Penche ton téléphone pour faire jouer les reflets" : "Fais glisser la carte pour la pencher"}</p>
    <div className="row" style={{ gap: "8px" }}>
      <button className="ghost" onClick={() => { setBack(b => !b); buzz(8); }}>{back ? "Voir le recto" : "Retourner la carte"}</button>
      {gyroOK && !gyro ? (<button className="ghost" onClick={enableGyro}>Pencher avec le téléphone</button>) : null}
    </div>
  </div>);
}

/* ---------- booster physique (inchangé) ---------- */
function geo(W){ const H = Math.round(W*1.5); return { W, H, seal: Math.round(H*.07), tear: Math.round(H*.125), bseal: Math.round(H*.93) }; }
function zig(W, y, amp, step, up){ const pts = []; for (let x = 0, i = 0; x <= W+.1; x += step/2, i++) pts.push(`${x.toFixed(1)}px ${(i%2 ? y+(up?-amp:amp) : y).toFixed(1)}px`); return pts; }
function jag(x0, x1, y, amp){ const pts = []; let i = 0; for (let x = x0; x <= x1+.1; x += 7, i++) pts.push(`${x.toFixed(1)}px ${(y+((i*37)%5-2)*amp/2).toFixed(1)}px`); return pts; }
const Skin = memo(function Skin({ g }){
  const { W, H, seal, tear, bseal } = g, f = W/300;
  return (<div className="skin" style={{ width: W+"px", height: H+"px" }}>
    <div className="base"></div><div className="seal" style={{ top: 0, height: seal+"px" }}></div><div className="seal b" style={{ top: bseal+"px", height: (H-bseal)+"px" }}></div>
    <div className="perf" style={{ top: tear+"px" }}></div><div className="notch" style={{ top: (tear-7)+"px" }}></div>
    <div className="brand" style={{ top: H*.155+"px" }}><strong style={{ fontSize: 38*f+"px" }}>NEURODEX</strong><span style={{ fontSize: 12*f+"px" }}>Édition 1 · 10 séries à collectionner</span></div>
    <div className="window" style={{ left: W*.09+"px", right: W*.09+"px", top: H*.29+"px", height: H*.47+"px" }} dangerouslySetInnerHTML={{ __html: PACKART }}></div>
    <div className="gems" style={{ top: H*.795+"px" }}>{GEMS.map(c => (<i key={c} style={{ background: c }}></i>))}</div>
    <div className="ribbon" style={{ top: H*.84+"px", fontSize: 14*f+"px", padding: `${4*f}px ${14*f}px` }}>Booster · 5 cartes</div>
    <div className="wrinkles" dangerouslySetInnerHTML={{ __html: WRINKLES }}></div><div className="pillow"></div><div className="foil"></div>
  </div>);
});
function Pack({ W, interactive, onOpened, children, idle }){
  const g = useMemo(() => geo(W), [W]); const { H, tear } = g;
  const [p, setP] = useState(0); const [done, setDone] = useState(false); const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const drag = useRef(null), last = useRef(0), ref = useRef(null);
  const bodyClip = useMemo(() => `polygon(0px ${tear}px, ${W}px ${tear}px, ${zig(W, H, 6, 10, true).reverse().join(", ")})`, [W, H, tear]);
  const topBase = useMemo(() => zig(W, 0, 6, 10, false), [W]);
  const px = p*W;
  const leftClip = `polygon(${topBase.filter(s => parseFloat(s) <= px).join(", ")}, ${px}px 0px, ${jag(0, px, tear, 5).reverse().join(", ")})`;
  const rightClip = `polygon(${px}px 0px, ${topBase.filter(s => parseFloat(s) >= px).join(", ")}, ${W}px ${tear}px, ${jag(px, W, tear, 5).reverse().join(", ")})`;
  const finish = () => { setDone(true); setP(1); buzz([20,40,30]); const r = ref.current.getBoundingClientRect(); burst(r.left+r.width/2, r.top+tear, ["#FFF6E8","#FFC857"], 30); setTimeout(() => onOpened && onOpened(), T(520)); };
  const down = e => { if (!interactive || done) return; e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x0: e.clientX, base: p }; };
  const move = e => { const r = ref.current.getBoundingClientRect(); const nx = (e.clientX-r.left)/r.width-.5, ny = (e.clientY-r.top)/r.height-.5; if (!done) setTilt({ x: -ny*10, y: nx*14 });
    if (!drag.current || done) return; const np = Math.max(0, Math.min(1, drag.current.base + (e.clientX-drag.current.x0)/(W*.82)));
    const step = Math.floor(np*10); if (step > last.current){ buzz(6); last.current = step; } setP(np); if (np >= .97){ drag.current = null; finish(); } };
  const up = () => { setTilt({ x: 0, y: 0 }); if (!drag.current || done) return; drag.current = null; if (p > .7) finish(); else { setP(0); last.current = 0; } };
  const key = e => { if (interactive && !done && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); finish(); } };
  const lift = done ? `translate(${-W*.35}px, ${-H*.7}px) rotate(-34deg)` : `rotate(${-p*16}deg) translateY(${-p*10}px)`;
  const ps = { width: W+"px", height: H+"px" };
  return (<div ref={ref} className={"pk"+(idle?" idle":"")} role={interactive?"button":undefined} tabIndex={interactive?0:undefined}
      aria-label={interactive ? "Booster : glisse le doigt de gauche à droite sur le haut pour le déchirer, ou appuie sur Entrée" : undefined}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}
      style={{ width: W+"px", height: H+"px", transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, "--fx": (50+tilt.y*3)+"%", "--fy": (50+tilt.x*3)+"%" }}>
    {children}
    <div className="piece" style={{ ...ps, clipPath: bodyClip, WebkitClipPath: bodyClip, zIndex: 3 }}><Skin g={g} /></div>
    {p > 0 && !done ? (<svg style={{ position: "absolute", left: 0, top: tear-6+"px", zIndex: 4, pointerEvents: "none" }} width={px} height="12" aria-hidden="true"><polyline points={jag(0, px, 6, 5).map(s => s.replace(/px/g, "")).join(" ")} fill="none" stroke="#F4F1FF" strokeWidth="2.5"></polyline></svg>) : null}
    <div className="piece" style={{ ...ps, clipPath: rightClip, WebkitClipPath: rightClip, zIndex: 4, opacity: done?0:1 }}><Skin g={g} /></div>
    <div className={"piece"+(done?" flyoff":"")} style={{ ...ps, clipPath: leftClip, WebkitClipPath: leftClip, zIndex: 5, transformOrigin: `${px}px ${tear}px`, transform: lift, opacity: done?0:1 }}><Skin g={g} /></div>
    {interactive && p === 0 && !done ? (<div className="tearhint" style={{ top: (tear-34)+"px", zIndex: 6 }}>Glisse pour ouvrir <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></div>) : null}
    {done ? (<div className="flash" style={{ top: tear+"px" }}></div>) : null}
  </div>);
}

/* ---------- vidéo d'introduction (30 s) ---------- */
const SCENES = [
  { d: 4000, k: "hello" }, { d: 5000, k: "pack" }, { d: 6500, k: "series" }, { d: 4000, k: "master" }, { d: 6500, k: "rare" }, { d: 4500, k: "eclats" }
];
function Intro({ onDone }){
  const vp = useViewport();
  const [i, setI] = useState(0); const [t0, setT0] = useState(Date.now()); useTick();
  const total = SCENES.reduce((a, s) => a + s.d, 0);
  const before = SCENES.slice(0, i).reduce((a, s) => a + s.d, 0);
  useEffect(() => { if (i >= SCENES.length) return; const t = setTimeout(() => { setI(i+1); setT0(Date.now()); }, reduce ? 2500 : SCENES[i].d); return () => clearTimeout(t); }, [i]);
  const pct = Math.min(100, (before + (i < SCENES.length ? Math.min(Date.now()-t0, SCENES[i].d) : 0)) / total * 100);
  const cw = Math.floor(Math.min(110, (vp.w-60)/5));
  const k = i < SCENES.length ? SCENES[i].k : "end";
  let body;
  if (k === "hello") body = (<div className="iscene"><div className="ilogo">Neurodex</div><p className="iline">Les grandes découvertes de la psychologie, à collectionner.</p></div>);
  else if (k === "pack") body = (<div className="iscene"><p className="ititle">Chaque jour, un booster</p>
      <div className="ifan">{["back","back","back","back","back"].map((c, j) => (<div key={j} className="ifancard" style={{ "--r": (j-2)*12+"deg", "--d": j*120+"ms" }}><Card id="back" w={Math.floor(cw*.9)} /></div>))}</div>
      <p className="iline">5 cartes à découvrir, une fois par jour.</p></div>);
  else if (k === "series") body = (<div className="iscene"><p className="ititle">Réunis les 5 cartes d’une série</p>
      <div className="irow">{[1,2,3,4].map(n => (<div key={n} className="islide" style={{ "--d": n*250+"ms" }}><Card id={"005-"+n} w={cw} /></div>))}</div>
      <div className="istrip" style={{ width: cw*4+18+"px" }}>{[1,2,3,4].map(n => (<Slice key={n} id={"005-"+n} w={cw} />))}</div>
      <p className="iline">Ensemble, leurs frises forment une fresque.</p></div>);
  else if (k === "master") body = (<div className="iscene"><p className="ititle">Série complète ?</p><div className="irise"><TiltCard id="005-5" w={Math.floor(Math.min(220, vp.w*.5))} /></div><p className="iline">La carte maîtresse se débloque.</p></div>);
  else if (k === "rare") body = (<div className="iscene"><p className="ititle">Chasse les cartes rares</p>
      <div className="irow">{[["SH-005","Shiny","1 booster sur 8"],["MY-01","Mythe démasqué","1 sur 25"],["US-AINSWORTH","Ultra Shiny","1 sur 40"]].map(([id, l, p], j) => (<div key={id} className="islide" style={{ "--d": j*500+"ms" }}>
        <TiltCard id={id} w={Math.floor(Math.min(130, (vp.w-60)/3))} /><b className="ilabel" style={{ color: RCOLOR[BYID[id].r] }}>{l}</b><small className="iprob">{p}</small></div>))}</div>
      <p className="iline">Versions dorées, idées reçues démasquées, grands chercheurs…</p></div>);
  else if (k === "eclats") body = (<div className="iscene"><p className="ititle">Les doublons ne sont jamais perdus</p>
      <div className="ishards">{Array.from({ length: 9 }).map((_, j) => (<span key={j} style={{ "--a": j*40+"deg", "--d": j*90+"ms" }}><Gem size={26} /></span>))}<div className="icounter"><Gem size={30} /> +20</div></div>
      <p className="iline">Ils deviennent des éclats de savoir pour fabriquer les cartes qui te manquent.</p></div>);
  else body = (<div className="iscene"><div className="ilogo" style={{ fontSize: "48px" }}>À toi de jouer !</div><button className="cta" onClick={onDone}>Ouvrir mon booster</button></div>);
  return (<div className="overlay intro" style={{ zIndex: 45 }}>
    <div className="ibar"><b style={{ width: (k === "end" ? 100 : pct)+"%" }}></b></div>
    <button className="iskip" onClick={onDone}>Passer</button>
    <div key={k} className="ifade">{body}</div>
  </div>);
}

/* ---------- ouverture ---------- */
function Opening({ run, onFinish, onCollection, onHome, canMore, onAgain, onView }){
  const vp = useViewport();
  const W = Math.floor(Math.min(300, vp.w*.74, (vp.h-190)/1.5)); const g = geo(W);
  const CW = Math.floor(Math.min(330, vp.w*.78, (vp.h-240)*630/880));
  const [phase, setPhase] = useState("pack"); const [uk, setUk] = useState(0);
  const toNext = () => { if (run.unlocked.length) setPhase("unlock"); else { setPhase("summary"); onFinish(); } };
  const opened = () => { setPhase("emerge"); setTimeout(() => setPhase("rise"), T(60)); setTimeout(() => setPhase("dropping"), T(1050)); setTimeout(() => setPhase("deck"), T(1600)); };
  if (["pack","emerge","rise","dropping"].includes(phase)){
    const ew = W*.84, eh = ew*880/630, rising = phase === "rise" || phase === "dropping", dropping = phase === "dropping";
    return (<div className="overlay"><p className="hint">{phase === "pack" ? "Déchire le haut du booster" : "\u00a0"}</p>
      <div className="stage" style={{ width: W+"px", height: g.H+"px" }}>
        <div className={dropping ? "drop" : ""} style={{ position: "absolute", inset: 0, transform: dropping ? `translateY(${vp.h}px) rotate(6deg)` : "none", opacity: dropping ? 0 : 1 }}>
          <Pack W={W} interactive={phase === "pack"} onOpened={opened}>
            {phase !== "pack" ? (<div className="emerge" style={{ left: (W-ew)/2+"px", top: g.tear+8+"px", zIndex: 2, transform: rising ? `translateY(${-eh*.62}px)` : "none" }}>
              {[0,1,2].map(i => (<div key={i} style={{ position: i ? "absolute" : "relative", top: -i*3+"px", left: i*2+"px" }}><Card id="back" w={ew} /></div>))}</div>) : null}
          </Pack></div></div>
      <p className="hint" style={{ fontSize: "14px", fontWeight: 700 }}>{phase === "pack" ? "Avec le doigt, de gauche à droite" : "\u00a0"}</p></div>);
  }
  if (phase === "deck") return (<Deck run={run} CW={CW} onEnd={toNext} />);
  if (phase === "unlock"){
    const s = seriesById(run.unlocked[uk]); const w = Math.min(290, vp.w*.7, (vp.h-260)*630/880);
    return (<Unlock key={s.id} s={s} w={w} onNext={() => { if (uk+1 < run.unlocked.length) setUk(uk+1); else { setPhase("summary"); onFinish(); } }} />);
  }
  const sw = Math.floor((Math.min(vp.w-40, 460)-32)/5);
  const nNew = run.result.filter(r => r.isNew).length;
  return (<div className="overlay">
    <div className="summary">{run.ordered.map((r, i) => (<div key={i} className="slot" style={{ animationDelay: (reduce?0:i*90)+"ms" }}>
      <button className="thumb" aria-label={BYID[r.id].label + " : regarder sous tous les angles"} onClick={() => onView(r.id)}><Card id={r.id} w={sw} /></button><small style={{ color: RCOLOR[BYID[r.id].r] }}>{RLABEL[BYID[r.id].r]}</small><small className={r.isNew ? "" : "old"}>{r.isNew ? "Nouvelle" : "+"+DUP[BYID[r.id].r]}</small></div>))}</div>
    <div className="gain"><Gem size={22} /> +{run.gained} éclats de savoir <span>({DAILY} pour le booster du jour{run.gained > DAILY ? ", le reste pour les doublons" : ""})</span></div>
    <p className="hint" style={{ fontSize: "13px", fontWeight: 700, margin: "-6px 0 0" }}>Touche une carte pour la regarder sous tous les angles</p>
    <p className="hint">{nNew ? `${nNew} nouvelle${nNew>1?"s":""} carte${nNew>1?"s":""} dans ta collection` : "Que des doublons cette fois : tes éclats grimpent !"}</p>
    <div className="row">{canMore ? (<button className="cta" onClick={onAgain}>Ouvrir un autre booster</button>) : (<p className="hint" style={{ width: "100%" }}>Prochain booster dans <Timer /></p>)}
      <button className="ghost" onClick={onCollection}>Voir ma collection</button><button className="ghost" onClick={onHome}>Accueil</button></div>
  </div>);
}

const TEASE = ["", "", "Ça chauffe…", "Quelque chose brille…", "Dernière carte !"];
function Deck({ run, CW, onEnd }){
  const CH = CW*880/630; const N = run.ordered.length;
  const [i, setI] = useState(0); const [stage, setStage] = useState("back"); /* back, charge, ultra, shown */
  const [d, setD] = useState({ x: 0, y: 0, on: false }); const [flash, setFlash] = useState(0);
  const start = useRef(null), ref = useRef(null);
  const r = run.ordered[i], m = BYID[r.id], rank = RANK[m.r];
  const level = Math.min(4, i + (rank >= 2 ? 1 : 0));
  useEffect(() => { ref.current && ref.current.focus(); }, []);
  const center = () => { const b = ref.current.getBoundingClientRect(); return [b.left+b.width/2, b.top+b.height/2]; };
  const revealFx = () => {
    const [x, y] = center(); const acc = m.series ? seriesById(m.series).accent : "#FFC857";
    const n = [10, 18, 28, 40, 55][level] + (rank >= 3 ? 40 : 0);
    const cols = rank >= 3 ? ["#5CD3E6","#FF8FB1","#FFC857","#7EE0A1","#B59CFF","#FFFFFF"] : rank === 2 ? ["#FFC857","#FFE9B8",acc] : [acc, "#FFF6E8"];
    burst(x, y, cols, n, 160 + level*40 + (rank >= 3 ? 120 : 0));
    if (rank >= 2) setFlash(f => f+1);
    buzz(rank >= 5 ? [60,40,60,40,120] : rank >= 3 ? [30,30,60] : rank === 2 ? [25,25,25] : 10 + level*6);
    if (rank >= 3) setTimeout(() => burst(x, y, ["#FFFFFF","#FFE9B8","#5CD3E6","#FF8FB1"], 30, 320), T(350));
  };
  const flip = () => {
    if (stage !== "back") return;
    const chargeMs = rank >= 5 ? 0 : (level >= 3 || rank >= 2) ? 500 + level*180 : 0;
    if (rank >= 5){ setStage("ultra"); buzz([40,80,40,80,40,80]); setTimeout(() => { setStage("shown"); revealFx(); }, T(2600)); return; }
    if (chargeMs){ setStage("charge"); buzz(15); setTimeout(() => { setStage("shown"); revealFx(); }, T(chargeMs)); }
    else { setStage("shown"); setTimeout(revealFx, T(350)); }
  };
  const next = dir => { setD({ x: dir*innerWidth*1.3, y: -80, on: false });
    setTimeout(() => { if (i+1 >= N) { onEnd(); return; } setI(i+1); setStage("back"); setD({ x: 0, y: 0, on: false }); }, T(380)); };
  const down = e => { start.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); };
  const move = e => { if (!start.current || stage !== "shown") return; setD({ x: e.clientX-start.current.x, y: e.clientY-start.current.y, on: true }); };
  const up = e => { const s = start.current; start.current = null; if (!s) return; const dx = e.clientX-s.x, dy = e.clientY-s.y, tap = Math.abs(dx) < 8 && Math.abs(dy) < 8;
    if (stage === "back"){ if (tap || Math.abs(dx) > 30) flip(); return; }
    if (stage !== "shown") return;
    if (Math.abs(dx) > 90 || dy < -110) next(dx >= 0 ? 1 : -1); else if (tap) next(1); else setD({ x: 0, y: 0, on: false }); };
  const key = e => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); if (stage === "back") flip(); else if (stage === "shown") next(1); } };
  const shown = stage === "shown";
  const tease = stage === "back" && rank >= 3 ? " tease-"+m.r : stage === "back" && rank === 2 ? " tease-rare" : "";
  const bg = `radial-gradient(circle at 50% 45%, rgba(${rank >= 5 ? "255,233,184" : rank >= 3 ? "255,143,177" : "92,211,230"},${0.04 + level*0.035 + (shown && rank >= 2 ? .08 : 0)}), rgba(15,12,41,${0.92 + level*0.015}) 70%)`;
  const rest = N-i-1;
  return (<div className={"overlay deckov lvl"+level} style={{ background: bg }}>
    {flash ? (<div key={flash} className={"screenflash"+(rank >= 3 ? " rainbow" : "")}></div>) : null}
    {(shown && rank >= 3) || stage === "ultra" ? (<div className={"rays "+(rank >= 5 ? "rays-ultra" : "rays-shiny")} aria-hidden="true"></div>) : null}
    {shown && rank >= 5 ? (<div className="sparkrain" aria-hidden="true">{Array.from({ length: 24 }).map((_, j) => (<i key={j} style={{ left: (j*41)%100+"%", animationDelay: (j*170)%2400+"ms" }}></i>))}</div>) : null}
    <div className="dots" aria-hidden="true">{run.ordered.map((_, j) => (<span key={j} className={j < i || (j === i && shown) ? "done" : ""}></span>))}</div>
    <div ref={ref} className="deck" tabIndex="0" role="button" aria-label={stage === "back" ? "Retourner la carte" : "Carte suivante"}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key} style={{ width: CW+"px", height: CH+"px", perspective: "1600px" }}>
      {Array.from({ length: Math.min(rest, 3) }).map((_, j) => (<div key={"r"+j} className="dcard" style={{ transform: `translate(${-(j+1)*3}px, ${-(j+1)*4}px)`, zIndex: 1 }}><Card id="back" w={CW} /></div>))}
      <div key={i} className={"dcard"+(stage === "charge" ? " charging c"+level : "")+(stage === "back" ? " idle"+level : "")+(stage === "ultra" ? " ultraup" : "")} style={{ zIndex: 5, width: CW+"px", height: CH+"px", transition: d.on ? "none" : "transform .38s cubic-bezier(.2,.8,.2,1)", transform: `translate(${d.x}px, ${d.y}px) rotate(${d.x*.06}deg)` }}>
        {shown && (r.isNew || rank >= 2) ? (<div className="aura" style={{ background: `radial-gradient(circle, ${RCOLOR[m.r]}aa, transparent 70%)` }}></div>) : null}
        <div className={"flipper"+(shown ? " on" : "")+tease}>
          <div className="face"><Card id="back" w={CW} /></div>
          <div className="face front">{shown ? (<TiltCard id={r.id} w={CW} live={false} />) : (<Card id={r.id} w={CW} />)}</div>
        </div>
        {shown ? (<div className={"tag rtag r-"+m.r}>{RLABEL[m.r]}{r.isNew ? " · Nouvelle" : " · ×"+r.n}</div>) : null}
      </div>
    </div>
    {shown && m.r === "mythe" ? (<div className="stamp" aria-hidden="true">MYTHE DÉMASQUÉ</div>) : null}
    {shown && rank >= 5 ? (<div className="ultratitle" aria-hidden="true">{"ULTRA SHINY".split("").map((c, j) => (<span key={j} style={{ animationDelay: j*70+"ms" }}>{c === " " ? "\u00a0" : c}</span>))}</div>) : null}
    <p className="hint" aria-live="polite">{stage === "back" ? (TEASE[level] || `Touche pour révéler la carte ${i+1} sur ${N}`) : stage === "shown" ? m.label + (m.series ? " · " + seriesById(m.series).name : "") : stage === "ultra" ? "…" : "\u00a0"}</p>
    <p className="hint" style={{ fontSize: "14px", fontWeight: 700, marginTop: "-12px" }}>{stage === "shown" ? (i < N-1 ? "Glisse la carte pour continuer" : "Glisse la carte pour terminer") : stage === "back" && TEASE[level] ? `Carte ${i+1} sur ${N} · touche pour révéler` : "\u00a0"}</p>
  </div>);
}
function Unlock({ s, w, onNext }){
  const ref = useRef(null), btn = useRef(null);
  useEffect(() => { buzz([30,50,30,50,60]); btn.current && btn.current.focus(); const t = setTimeout(() => { if (ref.current){ const r = ref.current.getBoundingClientRect(); burst(r.left+r.width/2, r.top+r.height/2, ["#FFC857","#FFE9B8","#FFFFFF"], 60, 300); } }, T(900)); return () => clearTimeout(t); }, []);
  return (<div className="overlay unlock" style={{ zIndex: 30 }}><div className="rays rays-shiny" aria-hidden="true"></div><h2>Série complète !</h2><p>{s.name} : la carte maîtresse est débloquée.</p>
    <div ref={ref} className="rise"><Card id={s.id+"-5"} w={w} /></div><button ref={btn} className="cta" style={{ position: "relative" }} onClick={onNext}>Continuer</button></div>);
}

/* ---------- collection, atelier ---------- */
function Collection({ st, onHome, onView, onCraft, onReset }){
  const vp = useViewport(); const [tab, setTab] = useState("series"); const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t); }, [armed]);
  const inner = Math.min(vp.w, 480) - 40 - 28 - 6; const sw = Math.floor(inner/5), tw = Math.floor((inner-24)/5);
  const slot = (id, w) => { const m = BYID[id], c = st.counts[id] || 0;
    if (hasIn(st, id)) return (<button key={id} className={"thumb th-"+m.r} aria-label={m.label+" : agrandir"} onClick={() => onView(id)}><Card id={id} w={w} />{(m.r === "shiny" || m.r === "ultra") ? (<div className="holo small"></div>) : null}{c > 1 ? (<span className="badge">×{c}</span>) : null}</button>);
    if (m.r === "maitresse") return (<button key={id} className="thumb" disabled aria-label="Carte maîtresse : complète la série"><div className="ghostcard"><b>★</b><span>Maîtresse</span></div></button>);
    const afford = st.eclats >= COST[m.r];
    return (<button key={id} className="thumb" aria-label={`${m.label}, ${RLABEL[m.r]} : à fabriquer pour ${COST[m.r]} éclats`} onClick={() => onCraft(id)}><div className={"ghostcard g-"+m.r}><b>?</b><span>{m.r === "mythe" || m.r === "ultra" ? RLABEL[m.r] : m.label}</span><em className={afford ? "ok" : ""}><Gem size={11} />{COST[m.r]}</em></div></button>); };
  const bonus = [["Shiny « Archives »", "shiny", "Les histoires vraies, en édition d’époque. Environ 1 booster sur 8."], ["Mythes démasqués", "mythe", "Les idées reçues, démontées. Environ 1 booster sur 25."], ["Chercheuses et chercheurs", "ultra", "Les grands noms derrière les découvertes. Environ 1 booster sur 40."]];
  return (<main className="screen">
    <div className="topbar"><button className="ghost" onClick={onHome}>Accueil</button><h1>Ma collection</h1><span className="eclats"><Gem />{st.eclats}</span></div>
    <div className="tabs" role="tablist"><button role="tab" aria-selected={tab === "series"} className={tab === "series" ? "on" : ""} onClick={() => setTab("series")}>Séries</button><button role="tab" aria-selected={tab === "bonus"} className={tab === "bonus" ? "on" : ""} onClick={() => setTab("bonus")}>Cartes bonus</button></div>
    <p className="cap" style={{ textAlign: "center", marginTop: "10px" }}>{totalIn(st)} / {TOTAL} cartes · touche une carte manquante pour la fabriquer avec tes éclats</p>
    {tab === "series" ? SERIES.map(s => { const n = [1,2,3,4,5].filter(i => hasIn(st, s.id+"-"+i)).length;
      return (<section key={s.id} className={"series"+(completeIn(st, s.id) ? " complete" : "")}>
        <div className="shead"><div><h2 style={{ color: s.accent }}>{s.name}</h2><div className="cat">Série {s.id} · {s.cat}</div></div><div className="count">{n} / 5</div></div>
        <div className="strip">{[1,2,3,4,5].map(i => { const id = s.id+"-"+i; return hasIn(st, id) ? (<Slice key={id} id={id} w={sw} />) : (<div key={id} className="slice missing" style={{ height: 173*sw/590+"px" }}></div>); })}</div>
        <div className="thumbs" style={{ marginTop: "10px" }}>{[1,2,3,4,5].map(i => slot(s.id+"-"+i, tw))}</div></section>); })
    : bonus.map(([title, r, sub]) => { const ids = ofRarity(r), n = ids.filter(id => hasIn(st, id)).length;
      return (<section key={r} className={"series bonus b-"+r}><div className="shead"><div><h2>{title}</h2><div className="cat">{sub}</div></div><div className="count">{n} / {ids.length}</div></div>
        <div className="thumbs">{ids.map(id => slot(id, tw))}</div></section>); })}
    <div style={{ display: "flex", justifyContent: "center", margin: "30px 0 10px" }}><button className="linkish" style={{ color: "var(--lav)", fontWeight: 700 }} onClick={() => { if (armed){ setArmed(false); onReset(); } else setArmed(true); }}>{armed ? "Toucher à nouveau pour tout effacer" : "Réinitialiser la collection"}</button></div>
  </main>);
}
function CraftSheet({ id, st, onCraft, onClose }){
  const m = BYID[id], cost = COST[m.r], ok = st.eclats >= cost, s = m.series ? seriesById(m.series) : null;
  return (<div className="overlay" style={{ zIndex: 40 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sheet craft"><h2>Atelier</h2>
      <div className="craftcard"><div className="silhouette"><Card id="back" w={120} /></div><div><b>{m.label}</b><div style={{ color: "var(--lav)", fontWeight: 700 }}>{s ? s.name : ""}</div><div style={{ color: RCOLOR[m.r], fontWeight: 800 }}>{RLABEL[m.r]}</div></div></div>
      <p>Fabrique cette carte avec tes éclats de savoir. Tu en as <b><Gem size={14} /> {st.eclats}</b>.</p>
      <button className="cta" disabled={!ok} onClick={() => onCraft(id)}>{ok ? (<span>Fabriquer pour <Gem size={16} /> {cost}</span>) : `Il te manque ${cost - st.eclats} éclats`}</button>
      <button className="ghost" onClick={onClose}>Fermer</button>
      <p className="fine">Les éclats s’obtiennent avec le booster du jour (+{DAILY}) et avec chaque doublon.</p></div></div>);
}
function SaveSheet({ st, onSave, onLater }){
  const [email, setEmail] = useState(st.email || ""); const [consent, setConsent] = useState(false); const [news, setNews] = useState(!!st.news); const [err, setErr] = useState("");
  const inp = useRef(null); useEffect(() => { setTimeout(() => inp.current && inp.current.focus(), 60); }, []);
  const submit = e => { e.preventDefault(); const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { setErr("Saisis une adresse e-mail valide, par exemple prenom@exemple.fr."); return; }
    if (!consent) { setErr("Coche la case d’accord pour sauvegarder ta collection."); return; } onSave(v, news); };
  return (<div className="overlay" style={{ zIndex: 40 }}><form className="sheet" noValidate onSubmit={submit} aria-labelledby="saveTitle">
    <h2 id="saveTitle">Garde ta collection</h2><p>Entre ton adresse e-mail pour retrouver tes cartes sur n’importe quel appareil.</p>
    <div className="field"><label htmlFor="email">Adresse e-mail</label><input ref={inp} id="email" type="email" autoComplete="email" inputMode="email" placeholder="prenom@exemple.fr" value={email} onChange={e => setEmail(e.target.value)} /></div>
    <label className="check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>J’accepte que mon adresse serve uniquement à sauvegarder ma collection.</span></label>
    <label className="check"><input type="checkbox" checked={news} onChange={e => setNews(e.target.checked)} /><span>Me prévenir quand une nouvelle série arrive (facultatif).</span></label>
    <p className="err" role="alert">{err}</p><button className="cta" type="submit">Sauvegarder ma collection</button><button className="ghost" type="button" onClick={onLater}>Plus tard</button>
    <p className="fine">Version prototype : l’adresse et la collection restent sur cet appareil.</p></form></div>);
}

/* ---------- tirage (équilibrage) ---------- */
function rollSlot(base){
  const x = Math.random();
  if (x < 0.005) return pick(ofRarity("ultra"));
  if (x < 0.013) return pick(ofRarity("mythe"));
  if (x < 0.040) return pick(ofRarity("shiny"));
  return pick(ofRarity(base));
}
const PITY_SHINY = 10, PITY_BIG = 30;
function draw(st, force){
  const bases = ["commune", "commune", "commune", Math.random() < .75 ? "peu" : "rare", Math.random() < .85 ? "rare" : "peu"];
  const ids = [];
  bases.forEach(b => { let id, tries = 0; do { id = rollSlot(b); tries++; } while (ids.includes(id) && tries < 20); ids.push(id); });
  const isBig = id => ["mythe","ultra"].includes(BYID[id].r), isShinyUp = id => RANK[BYID[id].r] >= 3;
  if (force === "special"){ ids[2] = pick(ofRarity("shiny")); ids[3] = pick(ofRarity("mythe")); ids[4] = pick(ofRarity("ultra")); return ids; }
  if (!ids.some(isBig) && (st.sinceBig || 0) + 1 >= PITY_BIG) ids[4] = pick(ofRarity(Math.random() < .5 ? "mythe" : "ultra"));
  else if (!ids.some(isShinyUp) && (st.sinceShiny || 0) + 1 >= PITY_SHINY) ids[4] = pick(ofRarity("shiny"));
  const missing = PIECES.filter(id => !ownedIn(st, id));
  if (missing.length && !ids.some(id => !ownedIn(st, id))){
    for (let k = 0; k < ids.length; k++){ const r = BYID[ids[k]].r; const cand = missing.filter(id => BYID[id].r === r && !ids.includes(id)); if (cand.length){ ids[k] = pick(cand); break; } }
  }
  return ids;
}
function App(){
  const [st, setSt] = useState(load); const [screen, setScreen] = useState("home"); const [run, setRun] = useState(null);
  const [intro, setIntro] = useState(false); const [save, setSave] = useState(false); const [view, setView] = useState(null); const [craft, setCraft] = useState(null);
  const [toast, setToast] = useState(null); const [unlockS, setUnlockS] = useState(null);
  const vp = useViewport(); useTick(); const stRef = useRef(st); stRef.current = st;
  useEffect(() => persist(st), [st]);
  const canOpen = TEST || st.lastPack !== today();
  const showToast = m => { setToast(m); setTimeout(() => setToast(null), 2600); };
  const startOpen = () => { const s = stRef.current; if (!(TEST || s.lastPack !== today())) return; if (!s.seenIntro) { setIntro(true); return; } openPack(); };
  const openPack = (force) => {
    const s = stRef.current; if (!(TEST || s.lastPack !== today())) return;
    const ids = draw(s, force), next = { ...s, counts: { ...s.counts }, lastPack: today(), seenIntro: true };
    next.sinceShiny = ids.some(id => RANK[BYID[id].r] >= 3) ? 0 : (s.sinceShiny || 0) + 1;
    next.sinceBig = ids.some(id => ["mythe","ultra"].includes(BYID[id].r)) ? 0 : (s.sinceBig || 0) + 1;
    const before = SERIES.filter(x => completeIn(s, x.id)).map(x => x.id);
    let gained = DAILY;
    const result = ids.map(id => { const isNew = !ownedIn(next, id); next.counts[id] = (next.counts[id] || 0) + 1; if (!isNew) gained += DUP[BYID[id].r]; return { id, isNew, n: next.counts[id] }; });
    next.eclats = (s.eclats || 0) + gained;
    const ordered = result.map((r, k) => ({ ...r, k })).sort((a, b) => RANK[BYID[a.id].r] - RANK[BYID[b.id].r] || a.k - b.k);
    const unlocked = SERIES.filter(x => completeIn(next, x.id) && !before.includes(x.id)).map(x => x.id);
    stRef.current = next; setSt(next); setRun({ key: Date.now(), result, ordered, unlocked, gained });
  };
  const doCraft = id => {
    const s = stRef.current, cost = COST[BYID[id].r]; if (s.eclats < cost) return;
    const before = SERIES.filter(x => completeIn(s, x.id)).map(x => x.id);
    const next = { ...s, counts: { ...s.counts, [id]: 1 }, eclats: s.eclats - cost }; stRef.current = next; setSt(next); setCraft(null); setView(id);
    buzz([20,30,40]); setTimeout(() => burst(innerWidth/2, innerHeight/2, ["#5CD3E6","#BFF3FF","#FFC857"], 50, 260), 200);
    const un = SERIES.filter(x => completeIn(next, x.id) && !before.includes(x.id)); if (un.length) setTimeout(() => setUnlockS(un[0]), 1400);
  };
  const finished = () => { const s = stRef.current; if (!s.email && !s.asked) setTimeout(() => setSave(true), T(1300)); };
  const go = s => { setScreen(s); scrollTo(0, 0); };
  const t = totalIn(st); const W = Math.floor(Math.min(220, vp.w*.54));
  const vw = Math.floor(Math.min(400, vp.w*.84, (vp.h-230)*630/880));
  return (<React.Fragment>
    {screen === "home" ? (<main className="screen home">
      <h1 className="logo">Neurodex</h1>
      <p className="lede">Collectionne les grandes découvertes de la psychologie, une carte à la fois.</p>
      <div className="row" style={{ gap: "8px" }}><div className="progress"><span className="bar"><b style={{ width: t/TOTAL*100+"%" }}></b></span><span>{t} / {TOTAL}</span></div><div className="progress"><Gem /> {st.eclats} éclats</div></div>
      <div className={canOpen ? "floaty" : "locked"} style={{ marginTop: "6px" }} onClick={startOpen}><Pack W={W} interactive={false} idle={true} /></div>
      <button className="cta" disabled={!canOpen} onClick={startOpen}>{canOpen ? "Ouvrir le booster du jour" : (<span>Prochain booster dans <Timer /></span>)}</button>
      <button className="ghost" onClick={() => go("collection")}>Voir ma collection</button>
      {TEST ? (<button className="ghost" style={{ borderColor: "#FF8FB1" }} onClick={() => openPack("special")}>Test : booster Shiny + Mythe + Ultra</button>) : null}
      <div className="row" style={{ gap: "4px" }}><button className="linkish" onClick={() => setIntro(true)}>Comment ça marche ?</button>
        {st.email ? null : (<button className="linkish" onClick={() => setSave(true)}>Sauvegarder ma collection</button>)}</div>
      {st.email ? (<span style={{ fontSize: "14px", color: "var(--lav)" }}>Collection sauvegardée avec {mask(st.email)}</span>) : null}
    </main>) : (<Collection st={st} onHome={() => go("home")} onView={setView} onCraft={setCraft} onReset={() => setSt(fresh())} />)}
    {intro ? (<Intro onDone={() => { setIntro(false); setSt(s => ({ ...s, seenIntro: true })); stRef.current = { ...stRef.current, seenIntro: true }; if (TEST || stRef.current.lastPack !== today()) setTimeout(openPack, 60); }} />) : null}
    {run ? (<Opening key={run.key} run={run} onFinish={finished} canMore={TEST || st.lastPack !== today()} onView={setView} onAgain={() => { setRun(null); setTimeout(openPack, 50); }} onCollection={() => { setRun(null); go("collection"); }} onHome={() => { setRun(null); go("home"); }} />) : null}
    {view ? (<div className={"overlay viewer v-"+BYID[view].r} style={{ zIndex: 25 }} onClick={e => { if (e.target === e.currentTarget) setView(null); }}>
        {BYID[view].r === "ultra" ? (<div className="rays rays-ultra" aria-hidden="true"></div>) : null}
        <div className="rise" style={{ animationDuration: ".45s", filter: "none" }}><Inspect key={view} id={view} w={vw} /></div>
        <button className="ghost" style={{ position: "relative" }} onClick={() => setView(null)}>Fermer</button></div>) : null}
    {craft ? (<CraftSheet id={craft} st={st} onCraft={doCraft} onClose={() => setCraft(null)} />) : null}
    {unlockS ? (<Unlock s={unlockS} w={Math.min(290, vp.w*.7, (vp.h-260)*630/880)} onNext={() => setUnlockS(null)} />) : null}
    {save ? (<SaveSheet st={st} onLater={() => { setSave(false); setSt(s => ({ ...s, asked: true })); }} onSave={(e, n) => { setSave(false); setSt(s => ({ ...s, email: e, news: n, asked: true })); showToast("Collection sauvegardée"); }} />) : null}
    {toast ? (<div className="toast" role="status">{toast}</div>) : null}
  </React.Fragment>);
}

export default App;
