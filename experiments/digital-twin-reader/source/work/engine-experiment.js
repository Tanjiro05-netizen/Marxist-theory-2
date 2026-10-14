function mountEngineExperiment(el) {
  el.classList.add('engine-experiment');
  el.innerHTML = `<h3 id="mirror-engine-title">Test an action before taking it</h3>
    <div class="engine-chain">
      <div><span>Sensors</span><b>Vibration is rising</b></div><i aria-hidden="true">→</i>
      <div><span>Condition estimate</span><b>Wear may be increasing</b></div><i aria-hidden="true">→</i>
      <div><span>Model</span><b>Compare possible actions</b></div>
    </div>
    <svg class="im-scene engine-chart" role="img" aria-labelledby="mirror-engine-title engine-chart-desc"></svg>
    <div class="engine-choice" role="group" aria-label="Choose an action for the engine">
      <button data-action="continue" aria-pressed="false">Continue operating</button>
      <button data-action="repair" aria-pressed="false">Inspect &amp; repair</button>
    </div>
    <div class="engine-outcome"><button class="engine-check" disabled>Check prediction</button><button class="engine-reset" hidden>Compare both</button></div>
    <p class="engine-result" aria-live="polite">Both forecasts start from the same measured condition.</p>`;
  const chart=el.querySelector('.engine-chart'), buttons=[...el.querySelectorAll('[data-action]')];
  const checkButton=el.querySelector('.engine-check'), reset=el.querySelector('.engine-reset'), result=el.querySelector('.engine-result');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let selected=null, progress=0, running=false, raf=0, last=0, visible=false;
  const t=(x,y,text,cls='',anchor='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${text}</text>`;
  const path=(d,attrs='')=>`<path d="${d}" fill="none" ${attrs}/>`;
  // All series are authored, unitless examples. No engineering model or live data is implied.
  const history=[.19,.22,.21,.26,.30,.29,.36,.41,.46];
  const forecast={continue:[.46,.50,.56,.62,.69,.77,.84],repair:[.46,.49,.37,.28,.23,.21,.20]};
  const observation={continue:[.46,.54,.59,.70,.76,.87,.92],repair:[.46,.51,.42,.35,.31,.29,.28]};
  function draw(){
    const mobile=el.clientWidth<500,W=mobile?360:600,H=mobile?370:355;
    const x0=39,xn=mobile?145:255,xe=W-17,yt=114,yb=mobile?307:292;
    const py=v=>yb-v*(yb-yt), x=(a,b,i,n)=>a+(b-a)*i/(n-1);
    const points=(values,a,b)=>values.map((v,i)=>[x(a,b,i,values.length),py(v)]);
    const d=pts=>pts.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');
    const clipW=(xe-xn)*progress;
    chart.setAttribute('viewBox',`0 0 ${W} ${H}`);
    let s=`<desc id="engine-chart-desc">Illustrative relative vibration over time. Solid lines are measurements; dashed lines are predictions. The same measured history branches into continued operation or maintenance. ${selected?`Selected action: ${selected==='repair'?'inspect and repair':'continue operating'}. `:''}${progress>=1?'Subsequent illustrative measurements stay above the selected prediction.':'Choose an action to compare its prediction with subsequent illustrative measurements.'}</desc>`;
    s+=`<defs><clipPath id="engine-outcome-clip"><rect x="${xn-.1}" y="${yt-5}" width="${clipW+.2}" height="${yb-yt+10}"/></clipPath></defs>`;
    s+=t(x0,18,'Vibration level','im-bold')+t(x0,38,'Illustrative data · relative scale','im-small');
    s+=path(`M${x0} 56h23`,'class="engine-observed"')+t(x0+30,61,'Measured','im-small');
    s+=path(`M${mobile?181:202} 56h23`,'class="engine-predicted"')+t(mobile?211:232,61,'Predicted','im-small');
    [.2,.5,.8].forEach(v=>s+=path(`M${x0} ${py(v)}H${xe}`,'class="im-faint"'));
    s+=path(`M${x0} ${yt}V${yb}H${xe}`,'class="engine-axis"');
    s+=t(x0-8,yt+10,'High','engine-axis-label','end')+t(x0-8,yb-1,'Low','engine-axis-label','end');
    s+=path(`M${xn} ${yt}V${yb+6}`,'class="engine-now"');
    s+=t((x0+xn)/2,87,'History','im-small','middle');
    s+=t((xn+xe)/2,87,progress>0?'Prediction & outcome':'Possible futures','im-small','middle');
    s+=path(d(points(history,x0,xn)),'class="engine-observed" data-series="history"');
    for(const key of ['continue','repair']){
      const dim=selected&&selected!==key;
      s+=`<g opacity="${dim?.19:1}">`;
      s+=path(d(points(forecast[key],xn,xe)),`class="engine-predicted" data-series="forecast-${key}"`);
      const labelY=key==='continue'?yt+3:py(.20)+24;
      s+=t(xe,labelY,key==='continue'?'Continue operating':'Inspect & repair','engine-branch','end')+'</g>';
    }
    s+=`<circle cx="${xn}" cy="${py(history.at(-1))}" r="4" fill="var(--ink)"/>`;
    if(selected&&progress>0){
      const obs=points(observation[selected],xn,xe);
      s+=path(d(obs),`class="engine-observed" data-series="outcome-${selected}" clip-path="url(#engine-outcome-clip)"`);
      obs.slice(1).forEach(([xx,yy])=>{if(xx<=xn+clipW)s+=`<circle cx="${xx}" cy="${yy}" r="3" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>`;});
      if(progress>=1){
        const yy=py(observation[selected].at(-1)),fy=py(forecast[selected].at(-1)),bx=xe-4;
        s+=path(`M${bx-5} ${yy}H${bx+5}M${bx} ${yy}V${fy}M${bx-5} ${fy}H${bx+5}`,'class="engine-difference"');
      }
    }
    s+=t(x0,yb+26,'Earlier','im-small')+t(xn,yb+26,'Now','im-bold','middle')+t(xe,yb+26,'Later','im-small','end');
    s+=t(xe,yb+53,'Time →','im-small','end');
    chart.innerHTML=s;
    el.dataset.action=selected||'none';el.dataset.progress=progress.toFixed(3);el.dataset.playing=String(running);
  }
  function controls(){
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===selected)));
    checkButton.disabled=!selected;
    checkButton.textContent=running?'Pause':progress>=1?'Replay outcome':progress>0?'Continue':'Check prediction';
    reset.hidden=!selected;
  }
  function stop(){running=false;cancelAnimationFrame(raf);raf=0;last=0;}
  function finish(){
    stop();progress=1;
    result.textContent=selected==='repair'
      ? 'Vibration falls after repair, but stays above the prediction. Update the model with the new measurements.'
      : 'Vibration rises faster than predicted. Update the model before making the next decision.';
    controls();draw();
  }
  function tick(now){
    raf=0;if(!running||!visible||document.hidden)return;
    if(last)progress=Math.min(1,progress+Math.min(now-last,100)/3500);
    last=now;draw();if(progress>=1){finish();return;}raf=requestAnimationFrame(tick);
  }
  function schedule(){cancelAnimationFrame(raf);last=0;raf=0;if(running&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
  buttons.forEach(b=>b.onclick=()=>{
    stop();selected=b.dataset.action;progress=0;
    result.textContent=selected==='repair'
      ? 'The model predicts lower vibration after maintenance. Does the engine behave as expected?'
      : 'The model predicts vibration will keep rising. Does it predict the change accurately?';
    controls();draw();
  });
  checkButton.onclick=()=>{
    if(!selected)return;
    if(running){stop();controls();draw();return;}
    if(progress>=1)progress=0;
    if(reduced.matches){finish();return;}
    result.textContent='New measurements arrive after the chosen action.';
    running=true;controls();draw();schedule();
  };
  reset.onclick=()=>{
    stop();selected=null;progress=0;result.textContent='Both forecasts start from the same measured condition.';controls();draw();
  };
  new ResizeObserver(draw).observe(el);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:0}).observe(el);
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',()=>{if(reduced.matches&&running)finish();});
  controls();draw();
}
