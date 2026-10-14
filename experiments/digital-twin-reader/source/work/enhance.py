from pathlib import Path
import re,json
src=Path('inputs/original.html').read_text()
start=src.index('const FIG = {}, CARDS = [];')
end=src.index('/* ---------- model ---------- */',start)
src=src[:start]+Path('work/new-figures.js').read_text()+'\n\n'+src[end:]
# Editorial summaries: remove two unsupported absolutes without altering source text.
src=src.replace('The 2007 iPhone erased the line between being online and being on the move.','The essay describes how smartphones made connected activity part of everyday life.')
src=src.replace('Objects put into orbit jump from under 200 a year to 1,600 in 2019.','The essay connects the growth of orbital infrastructure with observation, communication and military power.')
css='''
/* Revised explanatory plates: fewer, larger, optional. */
.stage{grid-template-columns:7rem minmax(0,36rem) minmax(22rem,27rem);gap:2.8rem}
.dock-in{padding-top:1.3rem;top:1rem;max-height:calc(100vh - 2rem);overflow-y:auto;scrollbar-width:thin;padding-right:4px}
.head .reader-tools{margin-top:1.2rem;display:flex;gap:.7rem;align-items:center;flex-wrap:wrap;font-family:var(--cond);font-size:.9rem}
.reader-tools button{padding:.4rem .7rem;border:1px solid var(--rule);border-radius:3px;min-height:40px}
.reader-tools button[aria-pressed="true"]{background:var(--ink);color:var(--paper)}
.edition{color:var(--graphite);font-size:.84rem;letter-spacing:.04em}
.mir h2{font-size:1.05rem;text-transform:uppercase;letter-spacing:.1em}
.mir .sub{font-family:var(--cond);font-size:.94rem;margin-bottom:.5rem}
.track{margin:0 8px .65rem;height:34px}
.track button{height:34px;width:26px;margin-left:-13px}
.track button::before{left:12px}.track button.cur::before{left:10px}
.card h3{font-size:1.65rem;line-height:1.08;letter-spacing:-.015em;margin:.4rem 0 .5rem}
.card .question{font-size:.89rem;line-height:1.5;color:var(--graphite);margin-bottom:.9rem}
.art text{font-size:15px}.art text.ts{font-size:13.5px}.art text.tb{font-size:15px;font-weight:600}
.art text.eyebrow{font-size:11px;letter-spacing:.65px;font-weight:600;fill:var(--graphite)}
.fig{padding:.65rem 0;background:var(--paper)}
.fig svg{overflow:hidden}
.step-controls{display:flex;gap:5px;margin:.9rem 0 .65rem;font-family:var(--cond)}
.step-controls button{flex:1;min-width:0;border:1px solid var(--rule);border-radius:3px;min-height:42px;padding:7px 5px;font-size:.94rem;text-align:center;line-height:1.15}
.step-controls button[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.card .step-note{font-family:var(--cond);font-size:1rem;line-height:1.45;min-height:4.4em}
.plate-context{margin-top:.85rem;border-top:1px solid var(--rule);padding-top:.55rem}
.plate-context summary{font-family:var(--cond);font-size:.91rem;cursor:pointer;color:var(--graphite)}
.plate-context p{margin:.6rem 0;font-size:.8rem}
.card .src{font-size:.88rem;min-height:34px;margin-top:.15rem}
.figure-select{width:100%;font-family:var(--cond);font-size:.9rem;padding:.5rem;border:1px solid var(--rule);border-radius:3px;background:var(--paper);color:var(--ink);margin-bottom:.8rem;min-height:40px}
.quiet{border-top:1px solid var(--rule);padding:1.5rem 0;color:var(--graphite)}
.quiet .quiet-label{font-family:var(--cond);font-size:.8rem;letter-spacing:.1em;text-transform:uppercase}
.quiet h3{font-family:var(--cond);font-size:1.6rem;color:var(--ink);font-weight:500;line-height:1.12;margin:.5rem 0 .8rem}
.quiet p{font-size:.85rem;line-height:1.6}
body.read-only .mir,body.read-only .twinbar{display:none}
@media(min-width:1080px){body.read-only .stage{grid-template-columns:7rem minmax(0,38rem)}body.read-only .dock{display:none}}
@media(max-width:1079px){
 .stage{grid-template-columns:minmax(0,40rem);gap:0}.dock-in{padding:0;max-height:none;overflow:visible}.mir{max-height:91svh}
 .twinbar{grid-template-columns:3.4rem minmax(0,1fr) auto}.twinbar .thumb{max-height:46px;overflow:hidden}
 .mir .mhead{position:sticky;top:-1rem;z-index:2;background:var(--paper);padding:.65rem 0;border-bottom:1px solid var(--rule)}
 .mir>.sub,.mir>.track,.mir>.figure-select{display:block;margin-left:auto;margin-right:auto}
 .mir .sub{font-size:.85rem}.card h3{font-size:1.55rem}.card .step-note{min-height:0}
 .art text.ts{font-size:14px}.step-controls button{min-height:44px}
}
@media print{.stage{display:block;padding:0}.dial,.dock,.reader-tools,.figmark,.more,.skip,.lead{display:none!important}.body,.para,.s{display:revert!important}article{padding:0}.sec{break-before:auto}.head p{display:none}}
'''
src=src.replace('</style>',css+'\n</style>',1)
src=src.replace('Read at three magnifications with the control on the left, or pinch. The twin on the right draws what the passage in front of you describes; numbered marks in the margin show where each figure belongs.','Read the complete essay, a curated skim, or its section summaries. Nine optional visual explanations unpack the mechanisms and assumptions behind selected passages.')
src=src.replace('</p>\n    </header>','</p>\n      <div class="reader-tools"><button id="readingMode" aria-pressed="false">Text only</button><span class="edition">VISUAL READER · REVISED EDITION</span></div>\n    </header>',1)
src=src.replace('aria-label="Twin"','aria-label="Visual explanations"').replace('<h2>Twin</h2>','<h2>Visual explanations</h2>')
src=src.replace('A figure for the passage in front of you. It changes as you read.','Selected passages, explained. Choose a step to explore.')
src=src.replace('<div class="card">','<label class="sr-only" for="figureSelect">Browse visual explanations</label><select id="figureSelect" class="figure-select"></select>\n        <div class="quiet" id="quiet" hidden><span class="quiet-label">Reading space</span><h3>This passage works in words.</h3><p>No diagram is needed here. Keep reading, or choose an explanation above to jump to its passage.</p></div>\n        <div class="card" id="plateCard">',1)
src=src.replace('<div class="fig" id="cFig"></div>\n          <h3 id="cTitle"></h3>\n          <p id="cCap"></p>', '''<h3 id="cTitle"></h3>
          <p class="question" id="cQuestion"></p>
          <div class="fig" id="cFig"></div>
          <div class="step-controls" id="stepControls" role="group" aria-label="Explore this explanation"></div>
          <p class="step-note" id="stepNote" aria-live="polite"></p>
          <details class="plate-context"><summary>Context &amp; limits · conceptual illustration</summary><p id="cCap"></p></details>''')
src=src.replace('.stage{grid-template-columns:7rem', '.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}\n.stage{grid-template-columns:7rem',1)
src=src.replace("if (narrow()) $('#howto').textContent = 'Switch magnification at the bottom, or pinch. The twin below the text draws what the passage in front of you describes; tap it to open. Numbered marks in the margin show where each figure belongs.';", "if (narrow()) $('#howto').textContent = 'Switch between Sections, Skim and Full text below. Open the optional visual explanations at selected passages, or choose Text only.';")
a=src.index('const svg = (id, cls=');b=src.index('function goCard(i)',a)
src=src[:a]+'''const svg = id => `<svg class="art" viewBox="0 0 420 350" role="img" aria-label="${esc(C.find(c => c.fig === id)?.title || '')}">${FIG[id]()}</svg>`;
function renderStep(){
 if(curCard<0)return;
 const c=C[curCard], meta=EXPLAIN[c.fig], selected=plateState[c.fig]||0;
 $('#cFig').innerHTML=svg(c.fig); $('#tThumb').innerHTML=svg(c.fig);
 $('#stepNote').textContent=meta.steps[selected][1];
 $$('#stepControls button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));
}
function showCard(i, animate){
 if(i===curCard)return; curCard=i;
 $('#quiet').hidden=i>=0; $('#plateCard').hidden=i<0;
 $('#figureSelect').value=String(i);
 if(i<0){
   $('#tThumb').innerHTML='<svg viewBox="0 0 40 32" aria-hidden="true"><path d="M6 7h28M6 15h28M6 23h18" fill="none" stroke="currentColor"/></svg>';
   $('#tNum').textContent='Reading space'; $('#tTitle').textContent='Browse the visual explanations';
   $$('#track button, .figmark').forEach(b=>b.classList.remove('cur'));
   return;
 }
 const c=C[i], meta=EXPLAIN[c.fig];
 $('#cFig').className='fig';
 $('#cNum').textContent=`EXPLANATION ${i+1} / ${C.length}`;
 $('#cTitle').textContent=c.title; $('#cQuestion').textContent=meta.question;
 $('#cCap').textContent=c.cap;
 const inPara=S[c.sec].paras.indexOf(c.pi)+1;
 $('#cSrc').textContent=`Read the passage · § ${c.sec+1}, paragraph ${inPara}`;
 $('#tNum').textContent=`Explanation ${i+1} of ${C.length}`; $('#tTitle').textContent=c.title;
 $('#stepControls').innerHTML=meta.steps.map((st,j)=>`<button data-step="${j}" aria-pressed="${j===(plateState[c.fig]||0)}">${st[0]}</button>`).join('');
 $('#stepControls').onclick=e=>{const b=e.target.closest('[data-step]');if(!b)return;plateState[c.fig]=+b.dataset.step;renderStep();};
 renderStep();
 $$('#track button').forEach(b=>{const k=+b.dataset.card;b.classList.toggle('cur',k===i);b.classList.toggle('seen',k<i);});
 $$('.figmark').forEach(m=>m.classList.toggle('cur',+m.dataset.card===i));
}
function cardFor(){
 const cards=C.filter(c=>c.sec===curS);
 if(!cards.length)return -1;
 if(level===1)return cards[0].i;
 let chosen=cards[0]; cards.forEach(c=>{if(c.pi<=curP)chosen=c;});
 return chosen.i;
}
$('#figureSelect').innerHTML='<option value="-1">Browse all 9 explanations…</option>'+C.map(c=>`<option value="${c.i}">${c.i+1}. ${esc(c.title)}</option>`).join('');
$('#figureSelect').onchange=e=>{if(+e.target.value>=0)goCard(+e.target.value);};
$('#readingMode').onclick=()=>{
 const anchor=blockAt(probeY())?.el, top=anchor?.getBoundingClientRect().top;
 const on=document.body.classList.toggle('read-only');
 $('#readingMode').setAttribute('aria-pressed',String(on)); $('#readingMode').textContent=on?'Show explanations':'Text only';
 closeSheet(); measure(); if(anchor)scrollBy(0,anchor.getBoundingClientRect().top-top);track(true);
};
''' +src[b:]
# Ensure a quiet first section can render even when the initial sentinel is -1.
src=src.replace("if(i===curCard)return; curCard=i;", "if(i===curCard && $('#tTitle').textContent)return; curCard=i;")
src=src.replace("function openSheet(){ mir.classList.add('open'); scrim.classList.add('on'); const f = $('#cFig'); f.className = 'fig'; void f.offsetWidth; if (!reduce) f.className = 'fig draw'; }", "function openSheet(){mir.classList.add('open');scrim.classList.add('on');$('#twinbar').setAttribute('aria-expanded','true');$('#mClose').focus();}")
src=src.replace("function closeSheet(){ mir.classList.remove('open'); scrim.classList.remove('on'); }", "function closeSheet(){const wasOpen=mir.classList.contains('open');mir.classList.remove('open');scrim.classList.remove('on');$('#twinbar').setAttribute('aria-expanded','false');if(wasOpen)$('#twinbar').focus();}")
src=src.replace("$('#twinbar').onclick = openSheet;", "document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSheet();$('#pop').hidden=true;}});\n$('#twinbar').onclick = openSheet;")
# Keep the essay and illustrations; remove the explanatory commentary UI.
src=src.replace('<p class="question" id="cQuestion"></p>', '')
src=src.replace('<p class="step-note" id="stepNote" aria-live="polite"></p>', '')
src=re.sub(r'<details class="plate-context">.*?</details>', '', src, flags=re.S)
src=src.replace("$('#stepNote').textContent=meta.steps[selected][1];", '')
src=src.replace("$('#cQuestion').textContent=meta.question;", '')
src=src.replace("$('#cCap').textContent=c.cap;", '')
src=src.replace('Selected passages, explained. Choose a step to explore.', 'Choose a view to explore the illustration.')
src=src.replace('This passage works in words.', 'Continue reading')
src=src.replace('No diagram is needed here. Keep reading, or choose an explanation above to jump to its passage.', 'Browse illustrations above to jump to a related passage.')
src=src.replace('Nine optional visual explanations unpack the mechanisms and assumptions behind selected passages.', 'Illustrations accompany selected passages.')

# User preference: no instructional prose or edition badges in the interface.
src=re.sub(r'<p id="howto">.*?</p>', '', src, flags=re.S)
src=re.sub(r'<div class="reader-tools">.*?</div>', '', src, flags=re.S)
src=re.sub(r"if \(narrow\(\)\) \$\('#howto'\).*?;", '', src)
src=re.sub(r"\$\('#readingMode'\)\.onclick=\(\)=>\{.*?\n\};", '', src, flags=re.S)
src=re.sub(r'<p class="hint">.*?</p>', '', src, flags=re.S)
src=re.sub(r'<p class="sub">.*?</p>', '', src, flags=re.S)
src=src.replace('<p>Browse illustrations above to jump to a related passage.</p>', '')

src=src.replace('<p class="lead"><b>In short</b> ${GISTS[i]}</p>', '')

# Keep only diagrams that explain a concrete mechanism.
src=src.replace('/* ---------- model ---------- */', "CARDS.splice(0, CARDS.length, ...CARDS.filter(c => ['twin','security','profile'].includes(c[1])));\n\n/* ---------- model ---------- */")
src=src.replace('Browse all 9 explanations…', 'Illustrations')
src=src.replace('function showCard(i, animate){', "function showCard(i, animate){\n document.body.classList.toggle('no-mirror',i<0);")
src=src.replace('</style>', 'body.no-mirror .mir,body.no-mirror #twinbar{display:none}\n</style>',1)

Path('outputs/The Digital Twin — Enhanced.html').write_text(src)
print('Saved enhanced HTML',len(src),'characters')
# Preserve the generated illustrations when rebuilding subsequent revisions.
if Path('outputs/illustrations/engine-digital-twin-v2.png').exists():
    import runpy
    runpy.run_path('work/add_illustrations.py')
import runpy
runpy.run_path('work/add_inline_mirrors.py')
