import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';

const read=path=>readFile(path,'utf8');
const [index,i18nSource,demoSource,configSource,cloudSource]=await Promise.all([
  'app/index.html','app/i18n.js','app/demo-data.js','app/config.js','app/cloud-sync.js'
].map(read));
const safeInline=source=>source.replace(/<\/script/gi,'<\\/script');
const html=index
  .replace('<script src="./i18n.js"></script>',`<script>${safeInline(i18nSource)}</script>`)
  .replace('<script src="./demo-data.js"></script>',`<script>${safeInline(demoSource)}</script>`)
  .replace('<script src="./config.js"></script>',`<script>${safeInline(configSource)}</script>`)
  .replace('<script src="./cloud-sync.js"></script>',`<script>${safeInline(cloudSource)}</script>`);

const browserErrors=[];
const virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',error=>{
  if(!/Not implemented: (navigation|HTMLCanvasElement|window\.(?:alert|confirm|prompt))/.test(String(error)))browserErrors.push(`jsdom: ${error.message}`);
});
virtualConsole.on('error',(...values)=>browserErrors.push(`console.error: ${values.map(String).join(' ')}`));

class BroadcastChannelStub{
  constructor(name){this.name=name;this.onmessage=null;}
  postMessage(){}
  close(){}
}

const dom=new JSDOM(html,{
  runScripts:'dangerously',
  pretendToBeVisual:true,
  url:'http://agroplano-v120.test/',
  virtualConsole,
  beforeParse(window){
    window.localStorage.setItem('agroplano_demo_language_v1','es');
    Object.defineProperty(window,'innerWidth',{configurable:true,value:1366});
    Object.defineProperty(window,'innerHeight',{configurable:true,value:768});
    Object.defineProperty(window,'devicePixelRatio',{configurable:true,value:1});
    window.confirm=()=>true;
    window.prompt=(_message,initial='')=>initial||'Motivo QA';
    window.alert=()=>{};
    window.scrollTo=()=>{};
    window.requestAnimationFrame=callback=>window.setTimeout(()=>callback(Date.now()),0);
    window.cancelAnimationFrame=id=>window.clearTimeout(id);
    window.matchMedia=query=>({
      matches:query.includes('(hover: hover)')&&query.includes('(pointer: fine)'),
      media:query,onchange:null,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return false;}
    });
    window.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
    window.BroadcastChannel=BroadcastChannelStub;
    window.URL.createObjectURL=()=>'blob:agroplano-v120-test';
    window.URL.revokeObjectURL=()=>{};
    window.HTMLElement.prototype.scrollIntoView=function(){};
    window.HTMLElement.prototype.scrollTo=function(options={}){if(Number.isFinite(options.left))this.scrollLeft=options.left;};
  }
});

const w=dom.window;
const {document,Event,MouseEvent}=w;
const wait=(ms=30)=>new Promise(resolve=>w.setTimeout(resolve,ms));
const value=expression=>w.eval(expression);
const json=expression=>JSON.parse(w.eval(`JSON.stringify(${expression})`));
const change=(selector,next)=>{
  const element=document.querySelector(selector);
  assert(element,`No existe ${selector}`);
  element.value=next;
  element.dispatchEvent(new Event('change',{bubbles:true}));
  return element;
};
const click=selector=>{
  const element=document.querySelector(selector);
  assert(element,`No existe ${selector}`);
  element.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  return element;
};

await wait(180);
assert.equal(browserErrors.length,0,`Errores al iniciar: ${browserErrors.join(' | ')}`);
assert.equal(value('APP_VERSION'),'1.3.2');
assert.equal(w.AGROPLANO_DEMO?.meta?.privacyClass,'public_demo');
const infrastructure=json(`INFRASTRUCTURE.map(item=>({id:item.id,type:item.type,content:infraMarkerContent(item)}))`);
assert.equal(infrastructure.filter(item=>item.type==='aguada').length,4);
assert.equal(infrastructure.filter(item=>item.type==='manga').length,1);
assert.equal(infrastructure.filter(item=>item.type==='galpon').length,1);
assert(infrastructure.every(item=>!['casa','house'].includes(item.type)),'La infraestructura no debe inferir viviendas desde nombres o códigos');
assert(infrastructure.filter(item=>item.type==='aguada').every(item=>item.content.cls==='water'),'Las aguadas sintéticas deben usar su tipo de agua');
const fixturePlannerAudit=json(`(()=>{
  const range=plannerRange();
  const decision=plannerDecisionMetrics(officialLots(),activeGrazingPeriods(),range.start,range.endExclusive);
  return {pairs:decision.pairs.length,incomplete:decision.incomplete.length,alerts:decision.alertPeriodIds.size};
})()`);
assert.deepEqual(fixturePlannerAudit,{pairs:0,incomplete:0,alerts:1},'El fixture debe demostrar una validación deliberada sin parecer corrupto');

const lotA='demo-lot-01',lotB='demo-lot-02',lotC='demo-lot-03';

// Descanso vs objetivo: la lente usa objetivos por lote y se guarda junto con
// las demás preferencias del Gantt.
value(`
  clearTimeout(saveTimer);saveTimer=null;
  state=buildInitialState();
  state.grazingPeriods=[
    normalizeGrazingPeriod({id:'qa_rest_ready',lotId:${JSON.stringify(lotA)},herdCode:'Rodeo Sintético A',category:'Vacas',heads:10,startDate:addDays(today(),-72),endDateExclusive:addDays(today(),-60),status:'real',source:'qa_v120'}),
    normalizeGrazingPeriod({id:'qa_rest_wait',lotId:${JSON.stringify(lotB)},herdCode:'Rodeo Sintético B',category:'Vaquillonas',heads:8,startDate:addDays(today(),-44),endDateExclusive:addDays(today(),-30),status:'real',source:'qa_v120'}),
    normalizeGrazingPeriod({id:'qa_occupied',lotId:${JSON.stringify(lotC)},herdCode:'Rodeo Sintético C',category:'Novillos',heads:12,startDate:addDays(today(),-5),endDateExclusive:'',status:'real',source:'qa_v120'})
  ];
  for(const lot of state.lots){lot.cattle={...(lot.cattle||{}),category:'',rodeo:'',heads:'',entryDate:'',lastExit:'',avgWeightKg:''};refreshLotCurrentCattleProjection(lot);}
  getLot(${JSON.stringify(lotA)}).rotation.restTargetDays=45;
  getLot(${JSON.stringify(lotB)}).rotation.restTargetDays=45;
  state.view='pastoreo';state.plannerRows='all';state.plannerRestLens='all';state.plannerScale='scroll';render();
`);
await wait(50);
assert(document.querySelector('#gpRestLens'),'Falta el control Descanso vs objetivo');
change('#gpRestLens','ready');
await wait(50);
assert.equal(value('state.plannerRestLens'),'ready');
assert.deepEqual([...document.querySelectorAll('.timeline tbody tr[data-lot-id]')].map(row=>row.dataset.lotId),[lotA]);
assert.match(document.querySelector('.restLensSummary')?.textContent||'',/Objetivo alcanzado/);
value('state.plannerScrollLeft=321;state.plannerExpanded=true');
const savedPlanner=json(`(()=>{const p=persistedPayload();return {lens:p.plannerRestLens,scroll:p.plannerScrollLeft,expanded:p.plannerExpanded}})()`);
assert.deepEqual(savedPlanner,{lens:'ready',scroll:321,expanded:true});

// Ubicar / traer rodeo: el traslado reutiliza el ledger transaccional y no
// modifica las otras ocupaciones.
value(`
  clearTimeout(saveTimer);saveTimer=null;
  state=buildInitialState();state.grazingPeriods=[];state.movements=[];
  for(const lot of state.lots){lot.events=[];lot.cattle={...(lot.cattle||{}),category:'',rodeo:'',heads:'',entryDate:'',lastExit:'',avgWeightKg:''};}
  recordCattleMovement({commandId:'qa_v120_entry',action:'entrada',destinationId:${JSON.stringify(lotA)},category:'Vacas Demo',rodeo:'Rodeo Transferencia Demo',heads:12,date:addDays(today(),-5),source:'qa_v120'});
  state.view='rodeos';render();
`);
await wait(50);
const bring=[...document.querySelectorAll('[data-rodeo-bring]')].find(button=>button.dataset.rodeoBring==='Rodeo Transferencia Demo');
assert(bring&&!bring.disabled,'Rodeos debe ofrecer Traer para una ocupación vigente');
bring.click();
await wait(35);
assert.match(document.querySelector('.rodeoTransferPanel')?.textContent||'',/Traer Rodeo Transferencia Demo/);
change('#rodeoTransferDestination',lotB);
click('#rodeoTransferConfirm');
await wait(70);
const transfer=json(`({placements:currentRodeoPlacements('Rodeo Transferencia Demo').map(p=>({lotId:p.lot.id,heads:p.heads})),movement:state.movements.find(m=>m.type==='mover'&&m.commandId!=='qa_v120_entry'),selectedId:state.selectedId,view:state.view})`);
assert.deepEqual(transfer.placements,[{lotId:lotB,heads:12}]);
assert.equal(transfer.movement.fromLotId,lotA);
assert.equal(transfer.movement.toLotId,lotB);
assert.equal(transfer.selectedId,lotB);
assert.equal(transfer.view,'map');

// Ficha contextual y accesibilidad: no reaparece el tooltip nativo en los
// objetos principales del mapa; el contexto continúa disponible por ARIA.
assert.equal(document.querySelectorAll('.contextIndicatorGrid .contextIndicator').length,4);
const marker=document.querySelector(`.marker[data-id="${lotB}"]`);
const polygon=document.querySelector(`.lotPoly[data-poly-id="${lotB}"]`);
assert(marker&&polygon,'Faltan objetos del lote trasladado en el mapa');
assert.equal(marker.hasAttribute('title'),false);
assert.equal(polygon.hasAttribute('title'),false);
assert(marker.getAttribute('aria-label'));
assert(polygon.getAttribute('aria-label'));
assert.equal(document.querySelector('#mapViewport')?.hasAttribute('title'),false);
assert(document.querySelector('#mapViewport')?.getAttribute('aria-label'));

value(`state.view='rodeos';render()`);
await wait(35);
const locate=[...document.querySelectorAll('[data-rodeo-locate]')].find(button=>button.dataset.rodeoLocate==='Rodeo Transferencia Demo');
assert(locate,'Falta Ubicar en la tabla de rodeos');
locate.click();
await wait(35);
assert.equal(value('state.view'),'map');
assert.equal(value('String(state.selectedId)'),lotB);
assert.equal(value('state.search'),'Rodeo Transferencia Demo');

value(`state.view='pastoreo';state.plannerRows='all';state.plannerRestLens='all';state.plannerStart=addDays(today(),-10);state.plannerEnd=addDays(today(),10);render()`);
await wait(50);
const occupiedCell=document.querySelector('.grazingCell.hasPeriod');
assert(occupiedCell,'El Gantt debe mostrar el traslado vigente');
assert.equal(occupiedCell.hasAttribute('title'),false);
assert(occupiedCell.getAttribute('aria-label'),'El detalle del Gantt debe seguir disponible por ARIA');

// Un doble clic no debe generar dos comandos distintos con el mismo efecto.
value(`
  clearTimeout(saveTimer);saveTimer=null;
  state=buildInitialState();state.grazingPeriods=[];state.movements=[];
  for(const lot of state.lots){lot.events=[];lot.cattle={...(lot.cattle||{}),category:'',rodeo:'',heads:'',entryDate:'',lastExit:'',avgWeightKg:''};}
  recentUiCattleCommands.clear();
  recordCattleMovement({action:'entrada',destinationId:${JSON.stringify(lotC)},category:'Novillos Demo',rodeo:'Rodeo Doble Clic',heads:9,date:today(),source:'map_entry'});
  window.__doubleSubmitMessage='';
  try{recordCattleMovement({action:'entrada',destinationId:${JSON.stringify(lotC)},category:'Novillos Demo',rodeo:'Rodeo Doble Clic',heads:9,date:today(),source:'map_entry'});}
  catch(error){window.__doubleSubmitMessage=error.message;}
`);
assert.equal(value('state.movements.length'),1);
assert.match(value('window.__doubleSubmitMessage'),/ya se está procesando/);

assert.equal(browserErrors.length,0,`Errores de navegador: ${browserErrors.join(' | ')}`);
dom.window.close();
console.log('OK · v1.3.2 · descanso vs objetivo · Ubicar/Traer rodeo · persistencia Gantt · ficha contextual · ARIA sin tooltip nativo · fixture público');
process.exit(0);
