/* Illustrative mechanisms, not measured data. The article remains untouched. */
(() => {
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => { x=clamp(x); return x*x*(3-2*x); };
  const txt = (x,y,s,c='',a='start') => `<text x="${x}" y="${y}" class="${c}" text-anchor="${a}">${s}</text>`;
  const line = (d,c='im-wire',extra='') => `<path d="${d}" class="${c}" ${extra}/>`;
  const rect = (x,y,w,h,c='im-box',extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" class="${c}" ${extra}/>`;
  const group = (opacity,content) => `<g opacity="${opacity}">${content}</g>`;
  const dot = (x,y,r=3) => `<circle cx="${x}" cy="${y}" r="${r}" class="im-fill"/>`;
  const check = (x,y) => line(`M${x-6} ${y}l4 4 9-10`);
  const cross = (x,y) => line(`M${x-5} ${y-5}l10 10m0-10l-10 10`);
  function arrow(d,id,opacity=1,dashed=false){
    return group(opacity,line(d,'im-wire',`marker-end="url(#${id}-arrow)" ${dashed?'stroke-dasharray="5 5"':''}`));
  }
  function network(x,y,w,failed,patched,spread){
    const cx=x+w/2, ay=y+26, by=y+83, cy=y+139;
    let s=line(`M${cx} ${ay+15}V${cy-15}`,'im-faint');
    const nodes=[['Gateway',ay],['Service',by],['Records',cy]];
    nodes.forEach(([name,ny],i)=>{
      const bad=failed&&(i===0||i===1&&spread>.25||i===2&&spread>.6);
      s+=rect(x+13,ny-16,w-26,32,'im-box',bad?'style="stroke:var(--ink);stroke-dasharray:3 2"':'');
      s+=txt(x+24,ny+5,name,'im-small');
      s+=bad?cross(x+w-27,ny):patched?check(x+w-27,ny):dot(x+w-27,ny,2);
    });
    if(failed){const py=ay+clamp(spread)*113;s+=dot(cx,py,4);}
    return s;
  }
  function drawSecurity(u,m,id){
    const st=Math.min(3,Math.floor(u)), f=u-st,W=m?360:600, w=m?157:242, rx=W-w-8;
    let s=txt(16,18,'LIVE SYSTEM','im-tag')+txt(rx+8,18,'ISOLATED COPY','im-tag');
    s+=rect(8,36,w,248)+rect(rx,36,w,248);
    s+=network(8,76,w,false,st===3,0)+network(rx,76,w,st===1,st>=2,ease(f*1.5));
    s+=txt(20,263,'Operating','im-small')+txt(rx+12,263,['Copied','Failure spreads','Retest: blocked','Fix reviewed'][st],'im-small');
    s+=arrow(`M${8+w+4} 55H${rx-5}`,id,st===0?1:.2,true);
    if(st===1||st===2){
      s+=txt(rx+12,59,'Simulated attack','im-small');
      s+=arrow(`M${rx+w/2} 64V86`,id);
      if(st===2)s+=line(`M${rx+w/2-17} 80h34`,'im-wire','style="stroke-width:4"');
    }
    const ty=316;
    let outcome='Copy the relevant system behavior.';
    let detail='The live system continues operating.';
    if(st===1){outcome='A failure can affect connected parts.';detail='The test stays inside the copy.';}
    if(st===2){outcome='Change the copy; repeat the attack.';detail='Does the repair stop this failure?';}
    if(st===3){outcome='Review, then deploy the change.';detail='A test covers only what the copy models.';}
    s+=rect(8,ty,W-16,m?93:78)+txt(22,ty+30,outcome,'im-bold')+txt(22,ty+57,detail,'im-small');
    if(st===3){
      s+=arrow(`M${rx+w/2} 288V${ty-5}`,id);
      s+=arrow(`M8 ${ty+44}H2V244H8`,id);
      s+=dot(2,ty+44-ease(f)*(ty+44-244),2);
    }
    return {s,w:W,h:m?432:416};
  }
  function drawProfile(u,m,id){
    const st=Math.min(3,Math.floor(u)),f=u-st,W=m?360:600;
    const left=8,lw=m?344:258,right=m?8:334,rw=m?344:258,ry=m?198:36;
    let s=txt(16,18,'OBSERVED EVENTS','im-tag');
    const events=['Visited a travel page','Bought outdoor equipment','Clicked a recommendation'];
    events.forEach((name,i)=>{
      const active=i<2||st===3;
      s+=group(active?1:.22,rect(left,36+i*48,lw,39)+txt(left+13,61+i*48,name,'im-small')+(active?check(left+lw-19,56+i*48):''));
    });
    s+=txt(right+8,ry-14,'INFERRED INTEREST','im-tag');
    const infer=st>=1?1:.24;
    s+=group(infer,rect(right,ry,rw,140,'im-box','style="stroke:var(--ink);stroke-dasharray:5 4"')+txt(right+16,ry+35,'“Interested in hiking”','im-bold')+txt(right+16,ry+64,'A hypothesis from selected traces.','im-small')+txt(right+16,ry+90,'Could be a gift or a one-off visit.','im-small')+txt(right+16,ry+119,st===3?'A click can reinforce the inference.':'The interest was never directly observed.','im-small'));
    if(m)s+=arrow(`M180 173V${ry-4}`,id,st>=1?1:.2,true);
    else s+=arrow(`M${left+lw+5} 107H${right-7}`,id,st>=1?1:.2,true);
    const dy=m?374:245;
    s+=txt(16,dy-14,'WHAT THE PERSON SEES','im-tag');
    const visible=st>=2?1:.24;
    s+=group(visible,rect(8,dy,W-16,91)+line(`M24 ${dy+64}l16-29 18 29 12-18 13 18`)+txt(101,dy+33,'Hiking content is ranked higher','im-bold')+txt(101,dy+61,'A prediction shapes the next choice.','im-small'));
    if(m)s+=arrow(`M180 ${ry+146}V${dy-5}`,id,visible);
    else s+=arrow(`M${right+rw/2} ${ry+145}V${dy-5}`,id,visible);
    const feedbackY=dy+124;
    s+=group(st===3?1:.24,arrow(`M${W-10} ${dy+70}H${W-2}V${feedbackY}H2V151H8`,id,1)+txt(W/2,feedbackY+26,'New behavior becomes another recorded trace.','im-small','middle'));
    if(st===3){
      const cx=m?66:72,cy=dy+42;
      s+=`<circle cx="${cx}" cy="${cy}" r="${5+ease(f)*12}" class="im-wire" opacity="${1-ease(f)*.65}"/>`;
    }
    return {s,w:W,h:feedbackY+40};
  }
  const specs=[
    {id:'engine',anchor:92,title:'Test an action before taking it',short:'Engine ↔ model',steps:['Measure','Compare','Act','Check'],desc:'Illustrative engine loop. Sensors update a model; predicted vibration is compared for continued operation and maintenance. An operator chooses maintenance, and new measurements check the result.',icon:'M3 9l20-4 6 5v13l-6 4-20-4Z M7 10v12 M11 11v10 M15 10v12 M19 9v14 M23 8v16'},
    {id:'security',anchor:120,title:'Test the failure on the copy',short:'Test the copy',steps:['Copy','Attack','Retest','Deploy'],draw:drawSecurity,desc:'An illustrative security test. The live system keeps operating while an attack spreads through a separate copy. A repair is tested there; a reviewed change can then be deployed. A successful test is limited by what the copy represents.',icon:'M3 7h10v18H3Z M19 7h10v18H19Z M14 13h4 M21 16l3 3 4-6'},
    {id:'profile',anchor:130,title:'From a trace to a decision',short:'Digital profile',steps:['Observe','Infer','Rank','Feedback'],draw:drawProfile,desc:'Illustrative profile feedback loop. A page visit and purchase are observed events; an interest in hiking is an inference that could be wrong. Ranked recommendations affect what someone sees. Clicking creates another trace, potentially reinforcing the inference.',icon:'M3 7h10 M3 13h10 M3 19h10 M16 13h5 M26 6a4 4 0 1 0 0 8a4 4 0 1 0 0-8 M20 26v-4q6-9 12 0v4'}
  ];
  const links=document.createElement('nav'); links.className='mirror-links';links.setAttribute('aria-label','Illustrations');
  document.querySelector('.head').append(links);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  specs.forEach(spec=>{
    const el=document.createElement('figure');el.className='inline-mirror';el.id=`mirror-${spec.id}`;
    el.setAttribute('aria-labelledby',`${el.id}-title`);
    el.innerHTML=`<h3 id="${el.id}-title">${spec.title}</h3><svg class="im-scene" role="img" aria-labelledby="${el.id}-title ${el.id}-desc"></svg><div class="im-controls"><button class="im-play" aria-label="Play ${spec.short}"></button><div class="im-steps" role="group" aria-label="${spec.short} stages">${spec.steps.map((s,i)=>`<button data-im-step="${i}" aria-pressed="${i===0}">${s}</button>`).join('')}</div></div><div class="im-progress" aria-hidden="true"><i></i></div>`;
    document.querySelector(`.para[data-p="${spec.anchor}"]`).after(el);
    const link=document.createElement('a');link.href=`#${el.id}`;link.innerHTML=`<svg viewBox="0 0 36 32" aria-hidden="true"><path d="${spec.icon}"/></svg><span>${spec.short}</span>`;links.append(link);
    link.onclick=async e=>{e.preventDefault();if(level===1)await setLevel(2);el.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});el.tabIndex=-1;el.focus({preventScroll:true});};
    if(spec.id==='engine'){mountEngineExperiment(el);return;}
    const scene=el.querySelector('svg'),play=el.querySelector('.im-play'),steps=[...el.querySelectorAll('[data-im-step]')],bar=el.querySelector('.im-progress i');
    let elapsed=1800,playing=false,visible=false,started=false,raf=0,last=0,lastDraw=0,previousStage=-1;
    const duration=18000;
    function draw(){
      const u=Math.min(3.9999,elapsed/duration*4),st=Math.floor(u),small=el.clientWidth<500;
      const result=spec.draw(u,small,el.id);
      scene.setAttribute('viewBox',`0 0 ${result.w} ${result.h}`);
      scene.innerHTML=`<desc id="${el.id}-desc">${spec.desc}</desc><defs><marker id="${el.id}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5 0 10Z" fill="var(--ink)"/></marker></defs>${result.s}`;
      el.dataset.stage=st;el.dataset.playing=String(playing);
      bar.style.transform=`scaleX(${elapsed/duration})`;
      if(st!==previousStage){steps.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===st)));previousStage=st;}
    }
    function button(){
      const label=playing?'Pause':elapsed>=duration?'Replay':'Play';
      play.setAttribute('aria-label',`${label} ${spec.short}`);
      play.innerHTML=`<svg viewBox="0 0 20 20" aria-hidden="true">${playing?'<path d="M4 3h4v14H4zM12 3h4v14h-4z"/>':elapsed>=duration?'<path fill="none" stroke="currentColor" stroke-width="1.7" d="M5 5a7 7 0 1 1-1 8M2 2v6h6"/>':'<path d="M5 2l13 8L5 18z"/>'}</svg>`;
    }
    function tick(now){
      raf=0;if(!playing||!visible||document.hidden)return;
      if(last)elapsed=Math.min(duration,elapsed+Math.min(now-last,100));last=now;
      if(now-lastDraw>40||elapsed>=duration){draw();lastDraw=now;}
      if(elapsed>=duration){playing=false;button();draw();return;}raf=requestAnimationFrame(tick);
    }
    function schedule(){last=0;if(raf)cancelAnimationFrame(raf);raf=0;if(playing&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
    play.onclick=()=>{started=true;playing=!playing;if(playing&&elapsed>=duration)elapsed=0;button();draw();schedule();};
    steps.forEach((b,i)=>b.onclick=()=>{started=true;playing=false;elapsed=(i+.8)*duration/4;button();draw();schedule();});
    new IntersectionObserver(entries=>{
      visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.30;
      if(visible&&!started&&!reduced.matches){started=true;playing=true;elapsed=0;button();draw();}schedule();
    },{threshold:[0,.3]}).observe(el);
    new ResizeObserver(draw).observe(el);
    document.addEventListener('visibilitychange',schedule);
    reduced.addEventListener('change',()=>{if(reduced.matches){playing=false;button();draw();schedule();}});
    button();draw();
  });
  measure();track(true);
})();
