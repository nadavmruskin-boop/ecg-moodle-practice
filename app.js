(function(){
'use strict';
const D = window.ECG_DATA, L = ['א','ב','ג','ד'], KEY = 'ecgmp_v1_';
const $app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rich = s => esc(s).replace(/&lt;(\/?)sub&gt;/g,'<$1sub>');
const load = id => { try { return JSON.parse(localStorage.getItem(KEY+id)) || {}; } catch(e){ return {}; } };
const save = (id, st) => { try { localStorage.setItem(KEY+id, JSON.stringify(st)); } catch(e){} };
const P = id => D.find(p => p.id === +id);
function flat(p){ const out=[]; p.cases.forEach((c,ci)=>c.qs.forEach((q,qi)=>out.push({q,c,ci,qi}))); return out; }
function qmap(p){ const m={}; flat(p).forEach(x=>m[x.q.id]=x); return m; }

function home(){
  document.title='תרגולי אק״ג — הכנה לסבבים קליניים';
  let h = `<h1>תרגולי אק״ג מהמודל</h1><p class="sub">5 תרגולים מתוך מצגות ״עם תשובות״ של הכנה לסבבים קליניים 2026. כל מקרה מפורק לשלבים (קצב, מקצב, ציר, ממצאים, אבחנה). אחרי כל תשובה מופיע הסבר מלא: שורה תחתונה, מנגנון, משמעות קלינית ו-memory hook. לחיצה על אק״ג פותחת אותו בגדול עם זום.</p><div class="grid">`;
  D.forEach(p => {
    const st = load(p.id), run = st.run;
    const prog = run && !run.finished ? `<span class="chip">בתהליך: ${Object.keys(run.answers).length}/${run.list.length}</span>` : '';
    const best = st.best!=null ? `<span class="chip ok">שיא: ${st.best}%</span>` : '';
    const last = st.last!=null ? `<span class="chip">אחרון: ${st.last}%</span>` : '';
    const kind = p.nstrip ? `<span class="chip strip">${p.nstrip} שאלות על סטריפים</span><span class="chip">${p.n12} שאלות על 12 לידים</span>` : `<span class="chip">כל השאלות על 12 לידים</span>`;
    h += `<div class="card pcard"><div class="row"><span class="pnum">${p.id}</span><h2>${esc(p.title.replace(/^תרגול \d+ — /,''))}</h2></div>
      <div class="topic">${esc(p.topic)}</div>
      <div class="chips"><span class="chip">${p.cases.length} מקרים · ${p.nq} שאלות</span>${kind}${best}${last}${prog}</div>
      <div class="row">
        <a class="btn" href="#/p/${p.id}">${run && !run.finished ? 'המשך' : 'התחל'}</a>
        ${st.wrong && st.wrong.length ? `<a class="btn ghost small" href="#/p/${p.id}/review">חזרה על טעויות (${st.wrong.length})</a>` : ''}
      </div></div>`;
  });
  h += `</div><p class="small" style="margin-top:22px">התשובות מבוססות על התשובות במצגות. במקומות שבהם המצגת נראית שגויה או לא עקבית, יש הערה אדומה בהסבר (״הערה על המצגת״). ההתקדמות נשמרת בדפדפן הזה בלבד.</p>`;
  $app.innerHTML = h; scrollTo(0,0);
}

function start(p, mode){
  const st = load(p.id);
  let list;
  if (mode==='review') list = (st.wrong||[]).slice();
  else list = flat(p).map(x=>x.q.id);
  if (!list.length) list = flat(p).map(x=>x.q.id), mode='all';
  st.run = {mode, list, answers:{}, i:0, finished:false};
  save(p.id, st); return st;
}

function practice(id, mode){
  const p = P(id); if(!p) return home();
  let st = load(p.id);
  if (mode==='review') { if(!st.run || st.run.mode!=='review' || st.run.finished) st = start(p,'review'); }
  else if (mode==='restart' || !st.run || st.run.finished || st.run.mode!=='all') { if(mode==='restart' || !st.run || st.run.mode!=='all' || st.run.finished) st = start(p,'all'); }
  render(p);
}

function render(p){
  const st = load(p.id), run = st.run, m = qmap(p);
  document.title = p.title;
  if (run.i >= run.list.length) return results(p);
  const cur = m[run.list[run.i]], c = cur.c;
  const caseIds = run.list.filter(id => m[id].ci === cur.ci);
  const answered = Object.keys(run.answers).length, correct = Object.entries(run.answers).filter(([k,v])=>m[k].q.ans===v).length;
  const chosen = run.answers[cur.q.id];
  const lastOfCase = caseIds[caseIds.length-1] === cur.q.id;
  let h = `<div class="prog"><div class="bar"><i style="width:${(answered/run.list.length*100).toFixed(1)}%"></i></div>
    <div class="pmeta"><span>${esc(p.title)}${run.mode==='review'?' · חזרה על טעויות':''}</span><span>שאלה ${run.i+1}/${run.list.length} · ציון ${correct}/${answered}</span></div></div>
    <div class="card"><div class="casehead"><div><span class="tag ${c.kind==='12'?'':'strip'}">${c.kind==='12'?'אק״ג 12 לידים':'סטריפ קצב'}</span> <span class="small">מקרה ${c.n} · שקופית ${c.slide} במצגת</span></div>
    <a class="btn ghost small" href="#/">כל התרגולים</a></div>
    <div class="story">${esc(c.story)}</div>
    <div class="ecg" data-src="${c.img}"><img src="${c.img}" alt="ECG מקרה ${c.n}" loading="eager"><span class="zoomhint">🔍 לחץ להגדלה</span></div>
    <div class="stages">${caseIds.map((id,k)=>{const q=m[id].q, a=run.answers[id]; const cls = id===cur.q.id?'cur':(a==null?'':(a===q.ans?'done-ok':'done-bad')); return `<span class="stage ${cls}">${k+1}. ${esc(q.s)}</span>`;}).join('')}</div>
    <div class="q">${rich(cur.q.q)}</div><div class="opts">`;
  cur.q.opts.forEach((o,k)=>{
    let cls='', why='';
    if (chosen!=null){ if(k===cur.q.ans){cls='correct'; why=`<span class="why">✔ ${rich(o.why)}</span>`;} else { if(k===chosen) cls='wrong'; why=`<span class="why">✘ למה לא: ${rich(o.why)}</span>`; } }
    h += `<button class="opt ${cls}" data-k="${k}" ${chosen!=null?'disabled':''}><span class="L">${L[k]}</span><span class="T">${rich(o.t)}${why}</span></button>`;
  });
  h += `</div>`;
  if (chosen!=null){
    h += chosen===cur.q.ans ? `<div class="fb ok">נכון! התשובה היא ${L[cur.q.ans]}.</div>` : `<div class="fb bad">לא מדויק. התשובה הנכונה היא ${L[cur.q.ans]}. ההסבר לכל אפשרות מופיע למעלה.</div>`;
    if (lastOfCase) h += teach(c);
  }
  h += `<div class="nav"><button class="btn ghost" id="prev" ${run.i===0?'disabled':''}>→ הקודם</button>
    <button class="btn" id="next" ${chosen==null?'disabled':''}>${run.i===run.list.length-1?'לתוצאות':(lastOfCase?'למקרה הבא':'לשלב הבא')} ←</button></div></div>`;
  $app.innerHTML = h;
  $app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{ const s=load(p.id); if(s.run.answers[cur.q.id]!=null) return; s.run.answers[cur.q.id]=+b.dataset.k; save(p.id,s); const y=scrollY; render(p); scrollTo(0,y); });
  document.getElementById('next').onclick=()=>{ const s=load(p.id); s.run.i++; save(p.id,s); const nextSame = s.run.i<s.run.list.length && m[s.run.list[s.run.i]].ci===cur.ci; render(p); if(!nextSame) scrollTo(0,0); else { const el=$app.querySelector('.stages'); el && el.scrollIntoView({block:'start'}); scrollBy(0,-70);} };
  document.getElementById('prev').onclick=()=>{ const s=load(p.id); s.run.i=Math.max(0,s.run.i-1); save(p.id,s); render(p); };
  bindZoom();
}

function teach(c){
  const t=c.teach;
  let h=`<div class="teach"><div class="bl"><h4>שורה תחתונה</h4>${rich(t.b)}</div>
   <div><h4>מנגנון / פיזיולוגיה</h4>${rich(t.m)}</div>
   <div><h4>משמעות קלינית</h4>${rich(t.c)}</div>
   <div class="hook"><h4>Memory hook</h4>${rich(t.h)}</div>`;
  if (t.n) h+=`<div class="note"><h4>הערה על המצגת</h4>${rich(t.n)}</div>`;
  if (c.extra && c.extra.length) h+=`<div><h4>תמונות הסבר מהמצגת</h4><div class="extras">${c.extra.map(s=>`<img src="${s}" data-src="${s}" alt="תמונת הסבר" loading="lazy">`).join('')}</div></div>`;
  return h+`</div>`;
}

function results(p){
  const st = load(p.id), run = st.run, m = qmap(p);
  const ids = run.list, corr = ids.filter(id=>run.answers[id]===m[id].q.ans), wrong = ids.filter(id=>run.answers[id]!==m[id].q.ans);
  const pct = Math.round(corr.length/ids.length*100);
  if (!run.finished){
    run.finished = true;
    if (run.mode==='all'){ st.attempts=(st.attempts||0)+1; st.last=pct; st.best=Math.max(st.best||0,pct); st.wrong=wrong; st.lastDate=new Date().toISOString(); }
    else { st.wrong = wrong; }
    save(p.id, st);
  }
  let h = `<div class="card"><div class="casehead"><h1>${esc(p.title)} — ${run.mode==='review'?'סיום חזרה על טעויות':'תוצאות'}</h1><a class="btn ghost small" href="#/">כל התרגולים</a></div>
   <div class="res-big">${pct}%</div><p>${corr.length} נכונות מתוך ${ids.length}${st.best!=null?` · שיא אישי: ${st.best}%`:''}${st.attempts?` · ניסיונות: ${st.attempts}`:''}</p>
   <div class="row">${wrong.length?`<a class="btn" href="#/p/${p.id}/review">חזרה על ${wrong.length} הטעויות</a>`:''}<a class="btn ghost" href="#/p/${p.id}/restart">התחל מחדש</a><a class="btn ghost" href="#/">לתרגול אחר</a></div></div>`;
  if (wrong.length){
    h += `<div class="card" style="margin-top:14px"><h3 style="margin-top:0">הטעויות שלך</h3>`;
    wrong.forEach(id=>{ const x=m[id], q=x.q, a=run.answers[id];
      h += `<div class="mist"><div class="small">מקרה ${x.c.n} · ${esc(q.s)}</div><div><b>${rich(q.q)}</b></div>
       <div>ענית: <span style="color:var(--bad)">${a!=null?L[a]+'. '+rich(q.opts[a].t):'—'}</span></div>
       <div>נכון: <span style="color:var(--ok)">${L[q.ans]}. ${rich(q.opts[q.ans].t)}</span></div><div class="small">${rich(q.opts[q.ans].why)}</div></div>`; });
    h += `</div>`;
  }
  $app.innerHTML = h; scrollTo(0,0);
}

// ---------- lightbox ----------
const lb=document.getElementById('lb'), li=document.getElementById('lbimg'), stage=lb.querySelector('.lb-stage');
let S=1,X=0,Y=0,fit=1; const ptrs=new Map(); let pinch=null, drag=null;
function apply(){ li.style.transform=`translate(${X}px,${Y}px) scale(${S})`; }
function fitImg(){ const r=stage.getBoundingClientRect(); fit=Math.min(r.width/li.naturalWidth, r.height/li.naturalHeight); S=fit; X=(r.width-li.naturalWidth*S)/2; Y=(r.height-li.naturalHeight*S)/2; apply(); }
function zoomAt(f,cx,cy){ const ns=Math.min(Math.max(S*f,fit*0.5),fit*10); X=cx-(cx-X)*(ns/S); Y=cy-(cy-Y)*(ns/S); S=ns; apply(); }
function open(src){ lb.hidden=false; document.body.style.overflow='hidden'; li.onload=fitImg; li.src=src; if(li.complete&&li.naturalWidth) fitImg(); }
function close(){ lb.hidden=true; document.body.style.overflow=''; }
lb.querySelector('.lb-bar').onclick=e=>{ const z=e.target.dataset.z; if(!z) return; const r=stage.getBoundingClientRect(); if(z==='in') zoomAt(1.4,r.width/2,r.height/2); if(z==='out') zoomAt(1/1.4,r.width/2,r.height/2); if(z==='reset') fitImg(); if(z==='close') close(); };
stage.addEventListener('wheel',e=>{ e.preventDefault(); const r=stage.getBoundingClientRect(); zoomAt(e.deltaY<0?1.15:1/1.15,e.clientX-r.left,e.clientY-r.top); },{passive:false});
stage.addEventListener('pointerdown',e=>{ stage.setPointerCapture(e.pointerId); ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY}); if(ptrs.size===1) drag={x:e.clientX-X,y:e.clientY-Y}; if(ptrs.size===2){ const [a,b]=[...ptrs.values()]; pinch={d:Math.hypot(a.x-b.x,a.y-b.y)}; drag=null; } });
stage.addEventListener('pointermove',e=>{ if(!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2&&pinch){ const [a,b]=[...ptrs.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y); const r=stage.getBoundingClientRect(); zoomAt(d/pinch.d,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top); pinch.d=d; }
  else if(drag){ X=e.clientX-drag.x; Y=e.clientY-drag.y; apply(); } });
const up=e=>{ ptrs.delete(e.pointerId); if(ptrs.size<2) pinch=null; if(ptrs.size===1){ const v=[...ptrs.values()][0]; drag={x:v.x-X,y:v.y-Y}; } if(!ptrs.size) drag=null; };
stage.addEventListener('pointerup',up); stage.addEventListener('pointercancel',up);
stage.addEventListener('dblclick',e=>{ const r=stage.getBoundingClientRect(); zoomAt(2,e.clientX-r.left,e.clientY-r.top); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!lb.hidden) close(); });
addEventListener('resize',()=>{ if(!lb.hidden) fitImg(); });
function bindZoom(){ $app.querySelectorAll('[data-src]').forEach(el=>el.onclick=()=>open(el.dataset.src)); }

// ---------- router ----------
function route(){ close(); const h=location.hash.replace(/^#\/?/,'').split('/');
  if(h[0]==='p'&&h[1]){ practice(h[1], h[2]||''); if(h[2]==='restart') history.replaceState(null,'',`#/p/${h[1]}`); }
  else home(); }
addEventListener('hashchange',route); route();
})();
