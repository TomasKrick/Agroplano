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
  url:'http://agroplano-v110.test/',
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
    window.URL.createObjectURL=()=>"blob:agroplano-v110-test";
    window.URL.revokeObjectURL=()=>{};
    window.HTMLElement.prototype.scrollIntoView=function(){};
    window.HTMLElement.prototype.scrollTo=function(){};
  }
});

const w=dom.window;
const {document,Event,MouseEvent}=w;
const wait=(ms=30)=>new Promise(resolve=>w.setTimeout(resolve,ms));
const value=expression=>w.eval(expression);
const json=expression=>JSON.parse(w.eval(`JSON.stringify(${expression})`));
const click=selector=>{
  const element=document.querySelector(selector);
  assert(element,`No existe ${selector}`);
  element.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  return element;
};
const change=(selector,next)=>{
  const element=document.querySelector(selector);
  assert(element,`No existe ${selector}`);
  element.value=next;
  element.dispatchEvent(new Event('change',{bubbles:true}));
  return element;
};

await wait(180);
assert.equal(browserErrors.length,0,`Errores al iniciar: ${browserErrors.join(' | ')}`);
assert.equal(w.AGROPLANO_DEMO?.meta?.privacyClass,'public_demo','La regresión debe usar solamente el fixture public_demo');

const lotA='demo-lot-01',lotB='demo-lot-02',lotC='demo-lot-03';
function reset(){
  value(`
    clearTimeout(saveTimer);saveTimer=null;
    state=buildInitialState();state.grazingPeriods=[];state.movements=[];
    state.currentUser='Administrador Demo QA';state.view='map';state.selectedId=${JSON.stringify(lotA)};
    state.eventMode='pending';state.agFilter={from:'',to:'',lot:'all',type:'all',resp:'all',herd:'all',category:'all',status:'all',search:''};
    for(const lot of state.lots){
      lot.events=[];lot.use='sin_manejo';
      lot.cattle={...(lot.cattle||{}),category:'',rodeo:'',heads:'',entryDate:'',lastExit:'',avgWeightKg:''};
      lot.history={...(lot.history||{}),previousRodeo:''};
      lot.crop={...(lot.crop||{}),nextTask:'',nextTaskDate:''};
    }
  `);
}
function entry(id,lotId,herd,heads,dateExpression='addDays(today(),-10)'){
  return json(`recordCattleMovement({commandId:${JSON.stringify(id)},action:'entrada',destinationId:${JSON.stringify(lotId)},category:${JSON.stringify(herd)},rodeo:${JSON.stringify(herd)},heads:${heads},date:${dateExpression},source:'qa_v110'}).movement`);
}
function reduce(id,action,lotId,periodId,heads,extras=''){
  return json(`recordInventoryReduction({commandId:${JSON.stringify(id)},action:${JSON.stringify(action)},originId:${JSON.stringify(lotId)},periodId:${JSON.stringify(periodId)},heads:${heads},date:addDays(today(),-2),source:'qa_v110',${extras}})`);
}
function inventorySnapshot(){
  return value(`JSON.stringify({periods:state.grazingPeriods,movements:state.movements,herds:state.herds,lots:state.lots.map(l=>({id:l.id,use:l.use,cattle:l.cattle,history:l.history,events:l.events}))})`);
}

// Mapa: cinco acciones explícitas, formularios por intención y hover compacto.
reset();
const mapEntry=entry('qa_map_entry',lotA,'Rodeo QA Mapa',21);
value(`state.view='map';state.selectedId=${JSON.stringify(lotA)};render()`);
await wait(50);
const actionNames=[...document.querySelectorAll('[data-map-cattle-action]')].map(node=>node.dataset.mapCattleAction);
assert.deepEqual(actionNames,['entry','move','exit','sale','mortality'],'Mapa debe exponer exactamente las cinco acciones operativas');
assert.equal(document.querySelectorAll('[data-map-cattle-form][hidden]').length,5,'Los formularios deben empezar cerrados');
click('[data-map-cattle-action="sale"]');
assert.equal(document.querySelector('[data-map-cattle-form="sale"]').hidden,false,'Venta no abre su formulario');
assert.deepEqual([...document.querySelectorAll('[data-map-cattle-form]:not([hidden])')].map(x=>x.dataset.mapCattleForm),['sale'],'Elegir una acción no debe abrir formularios ajenos');
assert(document.querySelector('#guideSaleCount')&&document.querySelector('#guideSaleBuyer')&&document.querySelector('#guideSaleDte'),'Faltan datos operativos en Venta');
click('[data-map-cattle-action="mortality"]');
assert.deepEqual([...document.querySelectorAll('[data-map-cattle-form]:not([hidden])')].map(x=>x.dataset.mapCattleForm),['mortality'],'Mortandad debe reemplazar al formulario anterior');
assert(document.querySelector('#guideMortalityCount')&&document.querySelector('#guideMortalityReason'),'Faltan cantidad o causa en Mortandad');

const marker=document.querySelector(`.marker[data-id="${lotA}"]`);
assert(marker,'No se encontró el marcador para probar el hover');
value(`clearTimeout(lotHoverReleaseTimer);lotHoverSuppressed=false;showLotHover(getLot(${JSON.stringify(lotA)}),{clientX:240,clientY:220},document.querySelector('.marker[data-id=${JSON.stringify(lotA)}]'))`);
await wait(20);
const hover=document.querySelector('#lotHoverCard');
assert(hover,'No se creó el hover del lote');
const hoverStyle=w.getComputedStyle(hover);
assert(hover?.classList.contains('visible'),'El hover no aparece para un puntero fino');
assert.equal(hover.getAttribute('aria-hidden'),'false','El hover visible no debe quedar oculto para accesibilidad');
assert.equal(hoverStyle.pointerEvents,'none','El hover no debe capturar el mouse ni bloquear el mapa');
assert.equal(hoverStyle.width,'310px','El hover debe conservar el ancho compacto');
assert.match(hover.textContent,/Rodeo QA Mapa/,'El hover no muestra el rodeo actual');
assert.match(hover.textContent,/21 cab\./,'El hover no muestra la cantidad clave');

// Resaltar es visual: el lote atenuado sigue seleccionado y operable.
value(`state.colorMode='hacienda';state.categoryFilter={mode:'hacienda',value:'hacienda:'+normKey('Rodeo QA Mapa')};state.selectedId=${JSON.stringify(lotC)};render()`);
await wait(30);
const dimMarker=document.querySelector(`.marker[data-id="${lotC}"]`);
const dimPoly=document.querySelector(`.lotPoly[data-poly-id="${lotC}"]`);
assert.equal(value('String(state.selectedId)'),lotC,'Aplicar Resaltar cerró una ficha seleccionada');
assert(dimMarker?.classList.contains('dimmed')&&dimMarker.classList.contains('selected'),'El marcador seleccionado no conserva ambos estados');
assert(dimPoly?.classList.contains('dimmed')&&dimPoly.classList.contains('selectedPoly'),'El polígono seleccionado no conserva ambos estados');
assert.equal(w.getComputedStyle(dimMarker).pointerEvents,'auto','Un marcador atenuado dejó de recibir clic/hover');
dimMarker.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
assert.equal(value('String(state.selectedId)'),lotC,'El lote atenuado no se puede seleccionar');

// Venta parcial: descuenta cabezas, conserva continuación, detalles y ledger.
reset();
const saleBase=entry('qa_sale_base',lotA,'Novillos QA',21);
const partial=reduce('qa_sale_partial','venta',lotA,saleBase.toPeriodId,6,"buyer:'Comprador ficticio',destination:'Destino ficticio',dte:'DTE-DEMO-1',note:'Pesaje de prueba'");
assert.equal(partial.beforeHeads,21);assert.equal(partial.afterHeads,15);assert.equal(partial.removedHeads,6);
assert(partial.continuationPeriod&&partial.closedPeriod.id!==partial.continuationPeriod.id,'La venta parcial debe crear una continuación');
assert.equal(partial.closedPeriod.endDateExclusive,value('addDays(today(),-2)'));
assert.equal(partial.continuationPeriod.startDate,value('addDays(today(),-2)'));
assert.equal(value(`Number(getLot(${JSON.stringify(lotA)}).cattle.heads)`),15);
const partialAudit=json(`({movement:state.movements.find(m=>m.id==='qa_sale_partial'),event:getLot(${JSON.stringify(lotA)}).events.find(e=>e.meta?.operationId==='qa_sale_partial'),opens:currentOccupancies(${JSON.stringify(lotA)})})`);
assert.equal(partialAudit.movement.type,'venta');assert.equal(partialAudit.movement.heads,6);
assert.deepEqual(partialAudit.movement.details,{buyer:'Comprador ficticio',destination:'Destino ficticio',dte:'DTE-DEMO-1'});
assert.equal(partialAudit.event.meta.kind,'cattle_sale');assert.equal(partialAudit.event.status,'realizado');assert.equal(partialAudit.opens.length,1);

// Venta total y anulación: cierra, queda auditada y puede restaurarse.
reset();
const totalBase=entry('qa_total_base',lotA,'Vacas QA',7);
const total=reduce('qa_sale_total','venta',lotA,totalBase.toPeriodId,7,"buyer:'Comprador ficticio'");
assert.equal(total.afterHeads,0);assert.equal(total.continuationPeriod,null);
assert.equal(value(`currentOccupancies(${JSON.stringify(lotA)}).length`),0);
assert.equal(value(`movementUndoEligibility('qa_sale_total').ok`),true);
value(`annulCattleMovement('qa_sale_total','Cantidad incorrecta en prueba')`);
assert.equal(value(`Number(getLot(${JSON.stringify(lotA)}).cattle.heads)`),7);
assert.equal(value(`eventStatus(getLot(${JSON.stringify(lotA)}).events.find(e=>e.meta?.operationId==='qa_sale_total'))`),'anulado');
assert(value(`state.movements.find(m=>m.id==='qa_sale_total').annulledAt`).length>10,'La anulación de venta no quedó auditada');

// Mortandad usa el mismo ledger reversible y no afecta otro rodeo simultáneo.
reset();
const deathBase=entry('qa_death_base',lotA,'Vaquillonas QA',8);
entry('qa_other_herd',lotA,'Toros QA',4,'addDays(today(),-9)');
const death=reduce('qa_death_partial','mortandad',lotA,deathBase.toPeriodId,3,"reason:'Accidente ficticio',note:'Parte QA'");
assert.equal(death.afterHeads,5);
const deathAudit=json(`({movement:state.movements.find(m=>m.id==='qa_death_partial'),event:getLot(${JSON.stringify(lotA)}).events.find(e=>e.meta?.operationId==='qa_death_partial'),opens:currentOccupancies(${JSON.stringify(lotA)})})`);
assert.equal(deathAudit.movement.type,'mortandad');assert.equal(deathAudit.movement.details.reason,'Accidente ficticio');
assert.equal(deathAudit.event.status,'realizado');assert.equal(deathAudit.opens.find(p=>p.herdCode==='Toros QA').heads,4);
value(`annulCattleMovement('qa_death_partial','Parte duplicado')`);
const deathUndo=json(`({opens:currentOccupancies(${JSON.stringify(lotA)}),movement:state.movements.find(m=>m.id==='qa_death_partial'),event:getLot(${JSON.stringify(lotA)}).events.find(e=>e.meta?.operationId==='qa_death_partial')})`);
assert.equal(deathUndo.opens.find(p=>p.herdCode==='Vaquillonas QA').heads,8);
assert.equal(deathUndo.opens.find(p=>p.herdCode==='Toros QA').heads,4);
assert(deathUndo.movement.annulledAt&&deathUndo.event.meta.annulled,'Mortandad anulada debe conservar ledger y evento');

// Fechas inválidas, sobregiros y fallos intermedios no dejan mutaciones.
reset();
const validBase=entry('qa_valid_base',lotA,'Rodeo Validación QA',14);
let before=inventorySnapshot();
value(`(()=>{const input=document.createElement('input');input.id='qa_invalid_date';input.value='99/99/2026';document.body.appendChild(input);return true})()`);
assert.throws(()=>value(`readDateInput('#qa_invalid_date',today())`),/Fecha inválida/i);
assert.equal(value(`document.querySelector('#qa_invalid_date').value`),'99/99/2026','La fecha inválida no debe reemplazarse silenciosamente por hoy');
assert.throws(()=>value(`recordInventoryReduction({action:'venta',originId:${JSON.stringify(lotA)},periodId:${JSON.stringify(validBase.toPeriodId)},heads:2,date:'99/99/2026'})`),/Fecha inválida/i);
assert.equal(inventorySnapshot(),before,'Una fecha inválida modificó inventario, eventos o ledger');
assert.throws(()=>value(`recordInventoryReduction({action:'mortandad',originId:${JSON.stringify(lotA)},periodId:${JSON.stringify(validBase.toPeriodId)},heads:15,date:addDays(today(),-2)})`),/tiene 14/i);
assert.equal(inventorySnapshot(),before,'Un sobregiro dejó datos parciales');
before=inventorySnapshot();
assert.throws(()=>value(`(()=>{const original=recordGrazingStart;recordGrazingStart=(lot,args)=>{if(String(lot.id)===${JSON.stringify(lotB)})throw new Error('fallo inducido QA');return original(lot,args)};try{return recordCattleMovement({action:'mover',originId:${JSON.stringify(lotA)},destinationId:${JSON.stringify(lotB)},periodId:${JSON.stringify(validBase.toPeriodId)},date:addDays(today(),-2)})}finally{recordGrazingStart=original}})()`),/fallo inducido QA/);
assert.equal(inventorySnapshot(),before,'Un movimiento fallido dejó cambios en origen, destino, períodos o ledger');

// Eventos: modelo de estado, filtros, confirmación y análisis.
reset();
const statusModel=json(`(()=>{const legacy=normalizeEvent({id:'legacy',date:addDays(today(),-2),type:'Servicio',title:'Servicio pendiente',done:false,meta:{}},0,${JSON.stringify(lotA)}),explicit=normalizeEvent({id:'explicit',date:today(),type:'Vacunación',title:'Vacunación',status:'Realizado',meta:{}},1,${JSON.stringify(lotA)});return {legacyHasStatus:Object.prototype.hasOwnProperty.call(legacy,'status'),legacy:eventStatus(legacy),explicit:eventStatus(explicit),factual:eventStatus({date:today(),type:'Venta',done:false,meta:{kind:'cattle_sale'}}),plannedSale:eventStatus({date:today(),type:'Venta',done:false,meta:{kind:'evento_ganadero'}}),annulled:eventStatus({date:today(),type:'Servicio',done:false,meta:{annulled:true}})}})()`);
assert.deepEqual(statusModel,{legacyHasStatus:false,legacy:'planificado',explicit:'realizado',factual:'realizado',plannedSale:'planificado',annulled:'anulado'});
value(`
  getLot(${JSON.stringify(lotA)}).events=[
    {id:'due_plan',date:addDays(today(),-3),type:'Servicio',title:'Servicio a confirmar',notes:'Tarea vencida',done:false,meta:{responsable:'Responsable Demo A',rodeo:'Rodeo Norte Demo',category:'Vacas'}},
    {id:'done_plan',date:addDays(today(),-4),type:'Vacunación',title:'Vacunación confirmada',notes:'Planificada y hecha',done:true,completedAt:new Date().toISOString(),meta:{responsable:'Responsable Demo B',rodeo:'Rodeo Norte Demo',category:'Vacas'}},
    {id:'future_plan',date:addDays(today(),5),type:'Tacto',title:'Tacto programado',notes:'Próxima tarea',done:false,meta:{responsable:'Responsable Demo A',rodeo:'Rodeo Sur Demo',category:'Vaquillonas'}},
    {id:'performed_sale',date:addDays(today(),-1),type:'Venta',title:'Venta realizada',notes:'Hecho directo',done:false,meta:{kind:'cattle_sale',heads:10,rodeo:'Rodeo Sur Demo',category:'Novillos'}},
    {id:'annulled_event',date:addDays(today(),-2),type:'Yerra',title:'Registro anulado',status:'anulado',done:true,meta:{annulled:true,annulmentReason:'Carga duplicada'}}
  ];state.view='agenda';state.eventMode='pending';render()
`);
await wait(50);
assert.deepEqual([...document.querySelectorAll('[data-event-mode]')].map(x=>x.textContent.trim()),['Pendientes','Todos','Análisis']);
assert(document.querySelector('#agHerd')&&document.querySelector('#agCategory')&&document.querySelector('#agStatus')&&document.querySelector('#agSearch'),'Faltan filtros de eventos');
let rows=[...document.querySelectorAll('.eventsTable tbody tr')].map(x=>x.textContent.replace(/\s+/g,' ').trim());
assert.equal(rows.length,2);assert(rows.some(x=>x.includes('Servicio a confirmar')));assert(rows.some(x=>x.includes('Tacto programado')));
const realizedButton=[...document.querySelectorAll('[data-event-realize]')].find(button=>button.closest('tr')?.textContent.includes('Tacto programado'));
assert(realizedButton,'No se puede confirmar un evento planificado');realizedButton.click();await wait(40);
assert.equal(value(`eventStatus(getLot(${JSON.stringify(lotA)}).events.find(e=>e.id==='future_plan'))`),'realizado');
click('[data-event-mode="all"]');await wait(40);
assert.deepEqual(new Set([...document.querySelectorAll('.eventState')].map(x=>x.textContent.trim())),new Set(['Planificado','Realizado','Anulado']));
change('#agHerd','Rodeo Sur Demo');await wait(40);
assert.match(document.querySelector('.eventsTable').textContent,/Tacto programado/);assert.match(document.querySelector('.eventsTable').textContent,/Venta realizada/);assert.doesNotMatch(document.querySelector('.eventsTable').textContent,/Vacunación confirmada/);
click('#agClear');await wait(35);click('[data-event-mode="analysis"]');await wait(40);
assert.deepEqual([...document.querySelectorAll('.eventAnalysisCard h3')].map(x=>x.textContent.trim()),['Eventos por tipo','Estado del trabajo','Evolución por mes','Pendientes por responsable']);
assert.match(document.querySelector('.eventAnalysisNote')?.textContent||'',/cumplimiento/i);
assert.equal(document.querySelector('.eventsTable'),null,'Análisis debe priorizar sus gráficos sobre la tabla transaccional');

assert.equal(browserErrors.length,0,`Errores de navegador: ${browserErrors.join(' | ')}`);
dom.window.close();
console.log('OK · v1.1.0 · Mapa 5 acciones/hover/resaltado · ventas y mortandad reversibles · validaciones/rollback · Eventos filtros/estados/análisis · fixture público');
