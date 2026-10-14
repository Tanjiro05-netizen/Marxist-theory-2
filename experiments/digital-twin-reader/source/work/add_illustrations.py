from pathlib import Path
import base64,json
p=Path('outputs/The Digital Twin — Enhanced.html')
s=p.read_text()
assets=[]
for anchor,name,title,alt in [(92,'engine-digital-twin-v2','An engine and its digital twin','A cutaway engine beside a matching wireframe model. Sensor connections carry observations to the model; a return arrow represents action on the physical engine.'),(97,'city-digital-twin-v2','A city and a possible future','An existing city block beside a wireframe planning model with a proposed tower casting a shadow onto the surrounding space.')]:
 assets.append(dict(anchor=anchor,title=title,alt=alt,src='data:image/png;base64,'+base64.b64encode(Path('outputs/illustrations/'+name+'.png').read_bytes()).decode()))
css='''
.generated-plate{margin:1.8rem 0 2rem;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:.7rem 0}
.generated-plate button{display:block;width:100%;cursor:zoom-in;background:#fff}
.generated-plate img{display:block;width:100%;height:auto}
.generated-plate figcaption{display:flex;justify-content:space-between;gap:1rem;font-family:var(--cond);font-size:.85rem;line-height:1.3;padding:.65rem 0 .1rem}
.generated-plate figcaption span{color:var(--graphite);font-size:.75rem;white-space:nowrap}
.image-viewer{width:min(96vw,1400px);max-width:96vw;max-height:94vh;padding:0;border:1px solid var(--rule);background:var(--paper);color:var(--ink)}
.image-viewer::backdrop{background:rgba(0,0,0,.65)}
.image-viewer header{display:flex;justify-content:flex-end;align-items:center;padding:.2rem .5rem;gap:1rem;font-family:var(--cond)}
.image-viewer button{padding:.5rem;min-width:44px;min-height:44px}
.image-viewer img{display:block;width:100%;max-height:calc(94vh - 80px);object-fit:contain;background:white}
@media print{.image-viewer{display:none}.generated-plate{break-inside:avoid}}
'''
s=s.replace('</style>',css+'</style>',1)
s=s.replace('<div class="pop" id="pop" role="dialog" hidden></div>','<div class="pop" id="pop" role="dialog" hidden></div>\n<dialog class="image-viewer" id="imageViewer" aria-labelledby="imageTitle"><header><span id="imageTitle" class="sr-only"></span><button id="imageClose" aria-label="Close illustration">×</button></header><img id="imageFull" alt=""></dialog>')
js='const GENERATED_ART = '+json.dumps(assets)+';\n'+'''
GENERATED_ART.forEach(a=>{
 const el=document.querySelector(`.para[data-p="${a.anchor}"]`);
 const figure=document.createElement('figure');figure.className='generated-plate';
 const button=document.createElement('button');button.setAttribute('aria-label','Enlarge '+a.title);
 const img=document.createElement('img');img.src=a.src;img.alt=a.alt;img.width=1536;img.height=1024;img.loading='lazy';
 button.append(img);figure.append(button);

 el.after(figure);
 button.onclick=()=>{$('#imageTitle').textContent=a.title;$('#imageFull').src=a.src;$('#imageFull').alt=a.alt;$('#imageViewer').showModal();};
});
$('#imageClose').onclick=()=>$('#imageViewer').close();
$('#imageViewer').onclick=e=>{if(e.target===$('#imageViewer'))$('#imageViewer').close();};
'''
s=s.replace('const paraEl =',js+'\nconst paraEl =',1)
p.write_text(s)
print('Saved standalone illustrated reader',p.stat().st_size)
