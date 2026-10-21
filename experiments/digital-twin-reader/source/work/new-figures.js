/* Explanatory plates. Diagrams are conceptual, not measured outputs. */
const FIG = {}, CARDS = [], EXPLAIN = {}, plateState = {};
const label = (x,y,t,c='') => tx(x,y,t,c,'start');
const panel = (x,y,w,h,heavy=false) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="var(--paper)" stroke="var(--${heavy?'ink':'rule'})" stroke-width="${heavy?1.7:1}"/>`;
const path = (d,heavy=false,dash=false) => `<path d="${d}" fill="none" stroke="var(--${heavy?'ink':'graphite'})" stroke-width="${heavy?2:1.2}" ${dash?'stroke-dasharray="5 5"':''} marker-end="url(#ahi)"/>`;
const small = (x,y,t) => label(x,y,t,'ts');
const tag = (x,y,t) => label(x,y,t,'eyebrow');
const grp = (active,on,s) => `<g opacity="${active===on?1:.72}">${s}</g>`;
const node = (x,y,w,title,sub,active=false) => panel(x,y,w,54,active)+label(x+12,y+22,title,'tb')+small(x+12,y+41,sub);
function define(id,anchor,title,caption,question,steps,draw){
 CARDS.push([anchor,id,title,caption]); EXPLAIN[id]={question,steps}; FIG[id]=()=>draw(plateState[id]||0);
}

define('argument',1,'Where the argument makes its leap',
 'An argument map of the essay, not a prediction. Technical capacity, collective coordination and political change are different claims; the last does not follow automatically from the first.',
 'Does a better model imply a different society?',[
 ['Capacity','The technical claim: connected machines can collect observations, model systems and compare possible actions.'],
 ['Coordination','The organisational claim: useful coordination also requires shared goals, access to data and the ability to act.'],
 ['Politics','The essay argues that these capacities point beyond capitalism. That conclusion depends on its political premises; a digital twin alone cannot establish it.']
 ], s => {
 let g=tag(12,19,'READ THE ESSAY AS THREE LINKED CLAIMS');
 const rows=[['TECHNICAL CAPACITY','Observe → model → test','What can the system do?'],['COLLECTIVE COORDINATION','Share data → decide → act','Who sets the objective?'],['POLITICAL CONCLUSION','A different organisation of society','The essay’s proposed destination']];
 rows.forEach((r,i)=>g+=grp(s,i,panel(12,38+i*94,396,76,true)+tag(27,58+i*94,r[0])+label(27,83+i*94,r[1],'tb')+small(27,102+i*94,r[2])));
 g+=path('M210 114V131',false,true)+path('M210 208V225',false,true);
 return g+small(12,337,'Dashed links = additional premises, not inevitability.');
});

define('score',56,'A score changes the system it measures',
 'A conceptual reading of the essay’s surveillance and workplace examples. The chosen rule turns observations into consequences, which can change later behaviour. This is not a diagram of a single national scoring system.',
 'Where does measurement become control?',[
 ['Observe','A camera, scanner or app records selected behaviour. What is left unmeasured is absent from this view.'],
 ['Judge','A scoring rule translates a record into a judgement. The metric and threshold encode an organisational choice.'],
 ['Respond','Rewards or restrictions change incentives. The next observation is therefore partly a response to the scoring system itself.']
 ], s=> {
 let g=tag(12,19,'A FEEDBACK LOOP WITH A CHOSEN OBJECTIVE');
 g+=grp(s,0,node(12,44,173,'Activity','work, movement, clicks',true)+node(235,44,173,'Recorded traces','selected observations',true)+path('M187 71H229',true));
 g+=path('M322 100V125');
 g+=grp(s,1,panel(235,132,173,78,true)+tag(249,153,'RULE / THRESHOLD')+label(249,177,'What counts as good?','tb')+small(249,197,'defined by the operator'));
 g+=path('M322 216V243');
 g+=grp(s,2,node(235,250,173,'Consequence','reward or restriction',true)+node(12,250,173,'Changed behaviour','adapt, comply, contest',true)+path('M229 277H191',true)+path('M99 244V104',true)+small(111,176,'feeds back'));
 return g+small(12,337,'Recording a fact and judging it are separate operations.');
});

function engine(x,y){
 let g=`<g transform="translate(${x} ${y})"><path d="M8 17L100 7L152 27V73L100 93L8 83Q-8 50 8 17Z" fill="var(--lead)" stroke="var(--ink)" stroke-width="1.5"/><ellipse cx="13" cy="50" rx="14" ry="33" fill="var(--paper)" stroke="var(--ink)"/><path d="M25 50H166M151 30L173 50L151 70" fill="none" stroke="var(--ink)"/>`;
 for(let i=0;i<7;i++)g+=`<path d="M${39+i*13} ${20+i*.8}l9 27l-9 29" fill="none" stroke="var(--graphite)" stroke-width="1"/>`;
 for(let a=0;a<8;a++){let t=a*Math.PI/4;g+=`<path d="M13 50L${13+10*Math.cos(t)} ${50+27*Math.sin(t)}" stroke="var(--graphite)"/>`;}
 return g+'</g>';
}
define('twin',81,'The useful part is the return path',
 'The essay’s physical object, digital model and two-way connection, shown through an engine example. Measurements update the model; scenarios inform a decision; its real effects are measured again. The traces are illustrative, not engine data.',
 'What makes a model useful as a twin?',[
 ['Measure','Sensors report selected aspects of the engine. The model must be updated as the physical asset changes.'],
 ['Compare','The model tests possible futures, such as continued operation or maintenance. A prediction remains conditional on the model and its inputs.'],
 ['Act & check','An operator or control system chooses an action. New measurements reveal whether the expected result actually happened.']
 ],s=> {
 let g=tag(12,19,'PHYSICAL ASSET')+tag(241,19,'DIGITAL MODEL');
 g+=engine(19,50)+panel(234,41,174,124,true)+small(247,61,'UPDATED STATE')+path('M247 92H262L272 82L285 99L298 85L309 89L320 75L338 88H392',true)+small(247,147,'temperature · vibration');
 g+=grp(s,0,dot(66,68,5)+dot(125,136,5)+path('M71 68H185V69H228',true)+small(135,57,'live data'));
 g+=grp(s,1,path('M322 172V196',true)+node(234,203,174,'Compare futures','operate / inspect / repair',true));
 g+=grp(s,2,node(12,203,174,'Choose an action','operator or controller',true)+path('M228 230H192',true)+path('M98 197V157',true));
 g+=ln(14,291,406,291,'lg th')+small(12,316,'Data travels out. A decision changes the physical system.');
 return g+small(12,337,'A static 3D copy leaves this loop open.');
});

function cityMap(ox,oy,proposal=false,compare=false){
 let g=`<g transform="translate(${ox} ${oy})">`+panel(0,0,186,173);
 g+=`<path d="M0 89H186M93 0V173" stroke="var(--rule)" stroke-width="19"/>`;
 [[12,12,45,44],[117,13,52,37],[13,112,49,42],[120,120,44,39]].forEach(([x,y,w,h])=>{
 g+=`<path d="M${x+6} ${y+6}h${w}v${h}h-${w}Z" fill="var(--fl)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="var(--paper)" stroke="var(--graphite)"/><path d="M${x} ${y+8}H${x+w}" stroke="var(--rule)"/>`;
 });
 g+=`<path d="M10 71H75V158" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="4 4"/>`;
 if(proposal)g+=`<rect x="106" y="58" width="55" height="49" fill="var(--ink)"/><text x="133" y="87" text-anchor="middle" style="fill:var(--paper);font-size:14px">NEW</text>`;
 if(compare)g+=`<path d="M176 89H173V110H101V161" fill="none" stroke="var(--ink)" stroke-width="2.5" marker-end="url(#ahi)"/><circle cx="102" cy="110" r="10" fill="var(--paper)" stroke="var(--ink)"/><text x="102" y="115" text-anchor="middle">?</text>`;
 return g+'</g>';
}
define('city',97,'Test a proposal against the same city',
 'An invented city block illustrates the planning question described in the essay. The proposal changes a model, then planners investigate its effects. These drawings show a workflow; they do not calculate traffic, wind or sunlight.',
 'What changes, and what must be checked?',[
 ['Baseline','Start with a shared baseline: existing buildings, streets and observations. Keep it for comparison.'],
 ['Proposal','Add a proposed building to a copy of the baseline. The physical city has not changed.'],
 ['Investigate','Identify interactions to test: routes, access, shade and other constraints. The question mark is a research question, not a predicted traffic jam.']
 ],s=> {
 let g=tag(12,19,'BASELINE / HELD FIXED')+tag(222,19,'SCENARIO / EDITABLE');
 g+=cityMap(12,38)+cityMap(222,38,s>0,s===2);
 g+=small(12,231,'Observed city')+small(222,231,s===0?'A copy of the same city':s===1?'One proposed change':'New interactions to test');
 g+=panel(12,257,396,64)+tag(26,279,'COMPARE UNDER THE SAME ASSUMPTIONS')+label(26,304,['Keep the baseline before changing the model.','Change one input; inspect the consequences.','A scenario supports a decision. It is not a forecast.'][s],'tb');
 return g;
});

define('world',100,'One model, competing interpretations',
 'The essay uses World3 to discuss how a shared model can support different political readings. This plate separates a modelling workflow from those readings. It deliberately replaces the previous invented time-series curves.',
 'What belongs to the model, and what belongs to its reader?',[
 ['Assumptions','A model starts with a system boundary, relationships and assumptions. Those choices shape what it can represent.'],
 ['Scenario','A run explores what follows under selected assumptions. A scenario is conditional; a line on a chart is not evidence of inevitability.'],
 ['Interpretation','The essay contrasts course correction with systemic rupture. Choosing between those interpretations requires arguments beyond the model output itself.']
 ],s=> {
 let g=tag(12,19,'SEPARATE THE CALCULATION FROM THE CONCLUSION');
 g+=grp(s,0,node(12,40,396,'Assumptions about a world system','resources · production · population · pollution',true));
 g+=path('M210 100V119');
 g+=grp(s,1,node(12,126,396,'Run a conditional scenario','What follows if these relationships persist?',true));
 g+=path('M210 186V203H108V221',false,true)+path('M210 203H312V221',false,true);
 g+=grp(s,2,panel(12,228,192,76,true)+panel(220,228,188,76,true)+tag(25,249,'COURSE CORRECTION')+small(25,271,'Change policy within')+small(25,290,'the existing system')+tag(233,249,'SYSTEMIC CHANGE')+small(233,271,'The essay argues the')+small(233,290,'social form must change'));
 return g+small(12,337,'Two readings of a result ≠ two independently proven futures.');
});

define('security',120,'Break the copy before changing the original',
 'A conceptual security-testing workflow based on the essay. An isolated replica lets a team probe failure and compare a repair before deciding whether to apply it to the live system. A successful test is limited by the fidelity of the copy.',
 'How does the twin reduce the cost of failure?',[
 ['Copy','Capture the relevant configuration and behaviour. The live system continues operating while the replica is prepared.'],
 ['Attack','Direct the test at the replica. Observe which part fails and what the failure affects.'],
 ['Repair','Change the replica and repeat the test. Review the result before deploying a repair; the live system is never automatically safe just because the copy passed.']
 ],s=> {
 let g=tag(12,19,'LIVE SYSTEM')+tag(238,19,'ISOLATED TEST ENVIRONMENT');
 g+=panel(12,39,170,176)+panel(232,39,176,176,true);
 const network=(x,broken)=>{
  let z=path(`M${x+42} 101H${x+122}`)+path(`M${x+84} 110V154`);
  [[24,73],[109,73],[65,148]].forEach(([dx,y],i)=>z+=`<rect x="${x+dx}" y="${y}" width="37" height="30" rx="3" fill="var(--${broken&&i===1?'ink':'paper'})" stroke="var(--ink)"/>`);
  if(broken)z+=`<path d="M${x+119} 81l17 14m0-14l-17 14" stroke="var(--paper)" stroke-width="2"/>`;
  return z;
 };
 g+=network(12,false)+network(232,s===1)+small(25,199,'Continues operating')+small(245,199,s===1?'Failure observed':s===2?'Repair under test':'Relevant behaviour copied');
 g+=grp(s,0,path('M188 57H226',true));
 if(s===1)g+=path('M395 28V66',true)+small(277,59,'attack');
 g+=grp(s,2,panel(12,245,396,67,true)+tag(25,269,'RETEST → REVIEW → DEPLOY')+label(25,294,'Only a reviewed change returns to the live system.','tb')+path('M322 220V239',true));
 return g+small(12,337,'Boundary matters: tests and live operations stay separate.');
});

define('profile',130,'A profile contains observations and guesses',
 'The essay describes digital traces being assembled into a profile. This explanatory example distinguishes recorded events from inferred traits and from the uses of a profile. The sample labels are illustrative, not information about a real person.',
 'Which parts of a data twin are actually observed?',[
 ['Traces','A purchase or recorded location is an event in a dataset. Even an observation may be incomplete or out of date.'],
 ['Inferences','The system groups traces and infers interests or routines. Dashed outlines mark a hypothesis, not a directly observed attribute.'],
 ['Uses','An inferred profile can influence recommendations or targeting. That use can shape the next traces the system collects.']
 ],s=> {
 let g=tag(12,19,'OBSERVED')+tag(244,19,'INFERRED');
 [['purchase','outdoor equipment'],['page visit','travel article'],['location record','recurring journey']].forEach(([a,b],i)=>{
  g+=grp(s,0,node(12,39+i*70,166,a,b,true));
  g+=path(`M184 ${66+i*70}H209V136H233`,false,true);
 });
 g+=grp(s,1,`<rect x="240" y="92" width="168" height="89" rx="5" fill="var(--lead)" stroke="var(--ink)" stroke-dasharray="5 4"/>`+label(254,118,'Possible interests','tb')+small(254,142,'Likely routines')+small(254,165,'Confidence? Missing data?'));
 g+=grp(s,2,path('M323 188V253',true)+node(12,260,396,'Recommendation or targeting','A profile is used to decide what you see next.',true));
 return g+small(12,337,'A profile is a selective model of a person, not the person.');
});

function bridge(x,y,kind,selected){
 let g=panel(x,y,122,122,selected)+tag(x+10,y+20,['OPTION A','OPTION B','OPTION C'][kind]);
 g+=`<path d="M${x+12} ${y+78}h98M${x+20} ${y+78}v23M${x+102} ${y+78}v23" fill="none" stroke="var(--ink)" stroke-width="2"/>`;
 if(kind===0)g+=`<path d="M${x+20} ${y+77}Q${x+61} ${y+24} ${x+102} ${y+77}" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`;
 if(kind===1)g+=`<path d="M${x+20} ${y+78}l21-28l20 28l20-28l21 28M${x+41} ${y+50}h40" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`;
 if(kind===2)g+=`<path d="M${x+42} ${y+95}V${y+37}M${x+42} ${y+40}l-22 36m22-36l60 36" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`;
 return g;
}
define('iteration',155,'The advantage is reversible experimentation',
 'Three invented bridge sketches illustrate the essay’s contrast between physical construction and virtual iteration. The sketches are alternatives, not engineering results; no structural performance is being calculated.',
 'Why test several versions before committing?',[
 ['Generate','Create alternatives in a model while keeping the physical site unchanged. Different shapes are candidates, not a ranking.'],
 ['Test','Apply the same loads, constraints and evaluation criteria to every candidate. A fair comparison requires shared assumptions.'],
 ['Revise','Use the results to change the design and test again. Build only after the relevant engineering review; iteration does not guarantee each version is better.']
 ],s=> {
 let g=tag(12,19,'ONE PROBLEM / MULTIPLE CANDIDATES');
 for(let i=0;i<3;i++)g+=bridge(12+i*137,39,i,s===0);
 if(s===1)for(let i=0;i<3;i++)g+=path(`M${73+i*137} 65V91`,true);
 g+=grp(s,1,panel(12,184,396,58,true)+tag(26,206,'SAME TEST CONDITIONS')+small(26,229,'loads · materials · site · constraints · evaluation criteria'));
 g+=grp(s,2,path('M210 248V269',true)+label(129,297,'Evaluate → revise → test','tb')+path('M119 291H4V28H208',true,true));
 return g+small(12,337,'A cheap revision in the model can avoid a costly rebuild.');
});

define('nested',163,'Local twins must agree at their boundaries',
 'The essay imagines department, factory and regional twins becoming parts of a wider industrial model. This nesting diagram adds the practical question: what information passes between levels, and who can act on it?',
 'What has to connect before the model can scale?',[
 ['Department','A local model describes a bounded activity: its state, needs and output. Local detail does not automatically describe the whole factory.'],
 ['Factory','The factory links departments through shared flows and constraints. Inputs and outputs need compatible meanings.'],
 ['Region','A regional model connects factories with energy, transport and other systems. The essay’s global vision also requires coordination and authority to act.']
 ],s=> {
 let g=tag(12,19,'NESTING IS ALSO AN INTERFACE PROBLEM');
 g+=panel(12,38,396,231,s===2)+tag(26,61,'REGION')+small(230,61,'energy · transport · supply');
 g+=panel(27,78,260,166,s===1)+tag(41,102,'FACTORY');
 g+=grp(s,0,node(41,125,113,'Department','local process',true)+node(168,125,104,'Department','local process',true)+path('M157 153H164',true));
 g+=grp(s,1,small(42,215,'shared flows + common constraints'));
 g+=grp(s,2,panel(311,99,81,125,true)+label(321,125,'Other','tb')+label(321,145,'systems','tb')+path('M290 170H306',true)+path('M306 196H290',true));
 g+=`<path d="M12 285H408" stroke="var(--rule)" stroke-dasharray="4 4"/>`;
 return g+label(12,310,'Who defines the shared objective?','tb')+small(12,337,'A larger model does not itself resolve conflicting interests.');
});

/* Illustrations carry their explanation directly, without editorial panels. */
function renamePlate(id,title,labels){
 CARDS.find(c=>c[1]===id)[2]=title;
 EXPLAIN[id].steps=labels.map(t=>[t,'']);
}
renamePlate('argument','People, tools, collective intelligence',['People','Tools','Network']);
FIG.argument=()=>{
 const s=plateState.argument||0;
 const person=(x,y)=>`<g transform="translate(${x} ${y})"><circle cx="25" cy="23" r="19" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.7"/><path d="M15 23q-5-10 5-12q8-5 11 3q10 2 5 12m-18-8q7-3 8 6m-1-12v15M0 76V65q0-25 25-25t25 25v11" fill="none" stroke="var(--ink)" stroke-width="1.7"/></g>`;
 const computer=(x,y)=>`<g transform="translate(${x} ${y})"><rect width="60" height="43" rx="3" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.7"/><path d="M30 43v12m-18 0h36M10 17l8 5l-8 5m17 0h18" fill="none" stroke="var(--ink)" stroke-width="1.7"/></g>`;
 let g=tag(12,19,'INDIVIDUAL CAPACITY');
 g+=grp(s,0,person(55,34)+label(34,136,'Perceive · learn · decide','tb'));
 g+=grp(s,1,computer(300,51)+label(259,136,'Record · model · test','tb'));
 g+=path('M118 65H285',s===1)+small(172,56,'build & use');
 g+=path('M285 100H118',s===0)+small(163,120,'extend ability');
 g+=path('M81 151V174H210V194',s===2)+path('M332 151V174H210',s===2);
 g+=tag(12,194,'COLLECTIVE CAPACITY');
 let net=path('M99 240H172',true)+path('M231 240H305',true)+path('M86 273L177 302',true)+path('M320 273L232 302',true)+path('M205 274V264',true);
 net+=person(57,210)+computer(175,218)+person(298,210)+computer(177,272);
 g+=grp(s,2,net);
 return g+small(12,348,'Linked people and machines share observations and decisions.');
};
renamePlate('world','How growth meets material limits',['Production','Expansion','Feedback']);
FIG.world=()=>{
 const s=plateState.world||0;
 let g=tag(12,19,'WORLD MODEL / CONCEPTUAL RELATIONSHIPS');
 g+=node(12,43,151,'Resources','finite stocks',s===0)+node(246,43,162,'Production','industrial activity',s===0);
 g+=path('M170 70H239',s===0)+small(181,58,'inputs');
 g+=node(246,156,162,'Goods & services','support activity',s===1)+path('M327 103V149',s===1)+small(336,128,'output');
 g+=node(12,156,151,'Population','needs & demand',s===1)+path('M239 183H170',s===1);
 g+=path('M252 150V123H196V92H239',s===1)+small(172,141,'reinvest');
 g+=node(246,274,162,'Pollution','accumulated waste',s===2)+path('M408 83H416V301H412',s===2)+small(314,253,'waste');
 g+=path('M240 301H220V237H88V217',s===2,true)+label(12,290,'Environmental','tb')+small(12,310,'pressure feeds back');
 g+=path('M14 99V128H149V150',s===2,true)+small(24,119,'resource limits');
 return g+small(12,348,'Solid: flows and support. Dashed: constraints and pressure.');
};
renamePlate('twin','Measure, simulate, act',['Measure','Simulate','Act']);
const twinBase=FIG.twin;
FIG.twin=()=>{
 const s=plateState.twin||0;
 let g=twinBase();
 // Replace the generic trace with a legible model state / scenario comparison.
 g=g.replace(path('M247 92H262L272 82L285 99L298 85L309 89L320 75L338 88H392',true),'');
 g+=`<rect x="240" y="69" width="161" height="60" fill="var(--paper)"/>`;
 g+=`<path d="M247 111H300L313 99L325 104" fill="none" stroke="var(--ink)" stroke-width="2"/>`;
 if(s===0)g+=dot(325,104,4)+small(248,84,'sensor observations');
 else {
  g+=`<path d="M325 104L349 83L388 75M325 104L350 112H388" fill="none" stroke="var(--ink)" stroke-width="1.7" stroke-dasharray="4 3"/>`;
  g+=small(347,68,'operate')+small(346,130,'service');
  if(s===2)g+=dot(388,112,4);
 }
 return g;
};
// Short labels replace commentary within the illustrations.
const cleanFigureText={
 score:['Recording a fact and judging it are separate operations.','Activity → observation → rule → consequence → new activity'],
 city:['A scenario supports a decision. It is not a forecast.','Compare access, routes and available space.'],
 security:['Boundary matters: tests and live operations stay separate.','Copy → attack → repair → retest → deploy'],
 profile:['A profile is a selective model of a person, not the person.','Solid outlines: recorded events. Dashed: inferred attributes.'],
 iteration:['A cheap revision in the model can avoid a costly rebuild.','Revise the model before committing materials to construction.'],
 nested:['Who defines the shared objective?','Shared inputs and outputs connect the levels.']
};
Object.entries(cleanFigureText).forEach(([id,[from,to]])=>{const draw=FIG[id];FIG[id]=()=>draw().replace(from,to);});
const nestedBase=FIG.nested;FIG.nested=()=>nestedBase().replace('A larger model does not itself resolve conflicting interests.','Department → factory → region: one model within another.');
