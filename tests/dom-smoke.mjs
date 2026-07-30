import {readFile} from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';

const read=path=>readFile(path,'utf8');
const [index,i18nSource,demoSource,configSource,cloudSource]=await Promise.all([
  'app/index.html','app/i18n.js','app/demo-data.js','app/config.js','app/cloud-sync.js'
].map(read));
const safeInline=source=>source.replace(/<\/script/gi,'<\\/script');
let html=index
  .replace('<script src="./i18n.js"></script>',`<script>${safeInline(i18nSource)}</script>`)
  .replace('<script src="./demo-data.js"></script>',`<script>${safeInline(demoSource)}</script>`)
  .replace('<script src="./config.js"></script>',`<script>${safeInline(configSource)}</script>`)
  .replace('<script src="./cloud-sync.js"></script>',`<script>${safeInline(cloudSource)}</script>`);

const browserErrors=[];
const virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',error=>browserErrors.push(`jsdom: ${error.message}`));
virtualConsole.on('error',(...values)=>browserErrors.push(`console.error: ${values.map(String).join(' ')}`));

class BroadcastChannelStub{
  constructor(name){this.name=name;this.onmessage=null;}
  postMessage(){}
  close(){}
}

const dom=new JSDOM(html,{
  runScripts:'dangerously',
  pretendToBeVisual:true,
  url:'http://agroplano.test/',
  virtualConsole,
  beforeParse(window){
    window.localStorage.setItem('agroplano_demo_language_v1','es');
    Object.defineProperty(window,'innerWidth',{configurable:true,value:1366});
    Object.defineProperty(window,'innerHeight',{configurable:true,value:768});
    Object.defineProperty(window,'devicePixelRatio',{configurable:true,value:1});
    window.confirm=()=>true;
    window.prompt=(_message,initial='')=>initial||'Respuesta de prueba';
    window.alert=()=>{};
    window.scrollTo=()=>{};
    window.requestAnimationFrame=callback=>window.setTimeout(()=>callback(Date.now()),0);
    window.cancelAnimationFrame=id=>window.clearTimeout(id);
    window.matchMedia=query=>({matches:false,media:query,onchange:null,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return false;}});
    window.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
    window.BroadcastChannel=BroadcastChannelStub;
    window.URL.createObjectURL=()=>"blob:agroplano-test";
    window.URL.revokeObjectURL=()=>{};
    window.HTMLElement.prototype.scrollIntoView=function(){};
    window.HTMLElement.prototype.scrollTo=function(){};
  }
});

await new Promise(resolve=>dom.window.setTimeout(resolve,180));

const {document,Event,MouseEvent}=dom.window;
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const click=selector=>{
  const element=document.querySelector(selector);
  assert(element,`No existe ${selector}`);
  element.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  return element;
};
const change=(selector,value)=>{
  const element=document.querySelector(selector);
  assert(element,`No existe ${selector}`);
  element.value=value;
  element.dispatchEvent(new Event('change',{bubbles:true}));
  return element;
};
const appState=expression=>dom.window.eval(expression);
const wait=(ms=20)=>new Promise(resolve=>dom.window.setTimeout(resolve,ms));

assert(browserErrors.length===0,`Errores al iniciar: ${browserErrors.join(' | ')}`);
assert(dom.window.AGROPLANO_DEMO?.meta?.privacyClass==='public_demo','No cargó el fixture public_demo');
assert(dom.window.AGROPLANO_DEMO?.lots?.length===24,'No cargó los 24 lotes sintéticos');
assert(dom.window.AgroPlanoCloud?.isConfigured?.()===false,'La prueba local no debe conectarse a una nube');
assert(document.querySelector('#viewMap.primary'),'Mapa debe ser la vista inicial');
assert(document.querySelector('.mapViewport'),'El mapa no renderizó su viewport navegable');
assert(document.querySelector('.mapImg')?.getAttribute('src')==='assets/plano-demo.svg','El mapa no usa el plano artificial');
assert(document.querySelectorAll('.lotPoly').length===24,'El mapa no renderizó 24 polígonos');
assert(document.querySelectorAll('.marker[data-id^="demo-lot-"]').length===24,'El mapa no renderizó 24 marcadores');
assert(document.querySelector('#zoom')&&document.querySelector('#fitMap'),'Faltan zoom o ajuste del mapa');

// Todas las pestañas de la aplicación integral deben renderizar contenido real.
const views=[
  ['#viewHacienda','.haciendaView','#sheetMovAction','Hacienda'],
  ['#viewRodeos','.rodeosView','[data-rodeo-locate]','Rodeos'],
  ['#viewPastoreo','.plannerView','.timelineShell','Pastoreo'],
  ['#viewCiclo','.listView','#cycleApply','Ciclo anual'],
  ['#viewDashboard','.dashboardView','.decisionItem','Tablero de control ganadero'],
  ['#viewCultivos','.listView','#sheetCropSave','Cultivos'],
  ['#viewTable','.listView','th[data-sort]',''],
  ['#viewHistorial','.historyView','.movementLedger','Historial'],
  ['#viewAgenda','.eventsView','#agClear','Eventos']
];
for(const [button,root,detail,text] of views){
  click(button);await wait();
  assert(document.querySelector(root),`${text}: no renderizó ${root}`);
  assert(document.querySelector(detail),`${text}: no renderizó ${detail}`);
  if(text)assert(document.querySelector('#main').textContent.includes(text),`${text}: falta el título visible`);
  assert(document.querySelector(button).classList.contains('primary'),`${text}: la pestaña no queda activa`);
}

// Gantt: período amplio, ocupaciones, referencias, eventos, zoom, filtros y orden.
click('#viewPastoreo');await wait(40);
assert(Number(document.querySelector('.timelineShell')?.dataset.dayCount)>250,'El Gantt inicial no muestra un plazo largo');
assert(document.querySelectorAll('.timeline tbody tr[data-lot-id]').length>=20,'El Gantt no renderizó los lotes con actividad');
assert(document.querySelectorAll('.grazingCell.hasPeriod').length>100,'El Gantt no renderizó ocupaciones reales/planificadas');
assert(document.querySelectorAll('[data-event-filter]').length>=7,'El Gantt no renderizó referencias filtrables de eventos');
for(const label of ['Servicio','Vacunación','Parición','Yerra','Tacto','Venta']){
  assert([...document.querySelectorAll('[data-event-filter]')].some(node=>node.textContent.includes(label)),`Falta la referencia ${label}`);
}
assert(document.querySelector('#grazingTooltip'),'Falta el tooltip de las celdas ocupadas');

const zoomBefore=Number(appState('state.plannerZoom'));
click('#gpZoomIn');await wait();
assert(Number(appState('state.plannerZoom'))>zoomBefore,'El botón de zoom del Gantt no cambia la escala');
click('#gpExpand');await wait();
assert(document.querySelector('.plannerView.expanded'),'El Gantt no puede ampliarse');
click('#gpExpand');await wait();
assert(!document.querySelector('.plannerView.expanded'),'El Gantt ampliado no puede volver a la vista normal');

change('#gpFilterEvent','servicio');await wait(30);
assert(appState("state.plannerFilter.event")==='servicio','El filtro de eventos no se aplicó');
assert(document.querySelector('.eventFocusStrip'),'El filtro de servicio no muestra su resumen');
assert(document.querySelectorAll('.dayHead.eventDayHead').length>0,'El filtro de servicio no marca días de evento');
change('#gpSort','number');await wait();
change('#gpSortDir','desc');await wait();
assert(appState("state.plannerSort")==='number'&&appState("state.plannerSortDir")==='desc','El orden del Gantt no se conserva');
click('#gpLastYear');await wait(50);
const annualDays=Number(document.querySelector('.timelineShell')?.dataset.dayCount);
assert(annualDays>=365&&annualDays<=366,`Últimos 12 meses debe mostrar 365/366 días y mostró ${annualDays}`);
assert(document.querySelector('.timelineShell.fitRange'),'Últimos 12 meses debe ajustarse al ancho');

// Aislar dos áreas artificiales para probar el flujo ganadero sin tocar fixtures históricos.
appState(`
  state.grazingPeriods=state.grazingPeriods.filter(p=>!['area_demo_carga','area_demo_manga'].includes(String(p.lotId)));
  state.movements=[];
  for(const id of ['area_demo_carga','area_demo_manga']){
    const lot=getLot(id);lot.cattle={category:'',rodeo:'',heads:'',entryDate:'',lastExit:'',avgWeightKg:''};lot.events=[];
  }
`);
const entryDate=appState('addDays(today(),-2)');
const moveDate=appState('addDays(today(),-1)');
const saleDate=appState('today()');
appState(`recordCattleMovement({commandId:'qa-entry-a',action:'entrada',destinationId:'area_demo_carga',category:'Novillitos',rodeo:'Rodeo QA Alfa',heads:21,date:'${entryDate}',source:'qa'})`);
appState(`recordCattleMovement({commandId:'qa-entry-b',action:'entrada',destinationId:'area_demo_carga',category:'Vacas con cría',rodeo:'Rodeo QA Beta',heads:13,date:'${entryDate}',source:'qa'})`);
assert(appState("currentOccupancies('area_demo_carga').length")===2,'Un lote debe admitir dos rodeos distintos simultáneos');
assert(appState("Number(getLot('area_demo_carga').cattle.heads)")===34,'La proyección del lote debe sumar las cabezas de ambos rodeos');

const betaPeriod=appState("currentOccupancies('area_demo_carga').find(p=>p.herdCode==='Rodeo QA Beta').id");
appState(`recordCattleMovement({commandId:'qa-move-b',action:'mover',originId:'area_demo_carga',destinationId:'area_demo_manga',periodId:'${betaPeriod}',date:'${moveDate}',source:'qa'})`);
assert(appState("currentOccupancies('area_demo_carga').length")===1,'Mover un rodeo no debe retirar al otro del lote origen');
assert(appState("currentOccupancies('area_demo_manga').some(p=>p.herdCode==='Rodeo QA Beta')")===true,'El rodeo movido no aparece en el destino');

const alphaPeriod=appState("currentOccupancies('area_demo_carga').find(p=>p.herdCode==='Rodeo QA Alfa').id");
appState(`recordInventoryReduction({commandId:'qa-sale-a',action:'venta',originId:'area_demo_carga',periodId:'${alphaPeriod}',heads:21,date:'${saleDate}',note:'Venta de prueba',source:'qa'})`);
assert(appState("currentOccupancies('area_demo_carga').length")===0,'La venta debe retirar sólo el rodeo seleccionado');
assert(appState("state.movements.find(m=>m.id==='qa-sale-a')?.type")==='venta','La venta debe quedar en el libro como venta, no como comentario');
assert(appState("getLot('area_demo_carga').events.some(e=>e.type==='Venta'&&e.meta?.operationId==='qa-sale-a')")===true,'La venta debe quedar trazable como evento Venta');

appState("annulCattleMovement('qa-sale-a','Anulación automática de QA')");
assert(appState("state.movements.find(m=>m.id==='qa-sale-a')?.annulledAt")?.length>10,'La anulación debe quedar auditada');
assert(appState("currentOccupancies('area_demo_carga').some(p=>p.herdCode==='Rodeo QA Alfa')")===true,'Anular la venta debe restaurar el rodeo vendido');
assert(appState("getLot('area_demo_carga').events.some(e=>e.meta?.operationId==='qa-sale-a'&&e.meta?.annulled)")===true,'Los eventos vinculados deben quedar anulados, no borrados');

// Catálogos: agregar, renombrar, desactivar y ofrecer en selectores.
const categoryId=appState("addCatalogItem('categories','Categoría QA Temporal').id");
const herdId=appState("addCatalogItem('herds','Rodeo QA Catálogo').id");
const cropId=appState("addCatalogItem('crops','Cultivo QA Temporal','agricultura').id");
appState(`renameCatalogItem('categories','${categoryId}','Categoría QA Renombrada')`);
appState(`toggleCatalogItem('herds','${herdId}')`);
appState(`setCropCatalogKind('${cropId}','ganaderia')`);
assert(appState(`state.cattleCategories.find(x=>x.id==='${categoryId}').name`)==='Categoría QA Renombrada','No se renombró la categoría');
assert(appState(`state.herds.find(x=>x.id==='${herdId}').active`)===false,'No se desactivó el rodeo conservando historial');
assert(appState(`state.cropCatalog.find(x=>x.id==='${cropId}').kind`)==='ganaderia','No se editó el tipo del cultivo');
assert(appState("catalogSelectOptions('categories','','').includes('Categoría QA Renombrada')")===true,'La categoría nueva no aparece en el selector');
assert(appState("catalogSelectOptions('herds','','').includes('Rodeo QA Catálogo')")===false,'Un rodeo inactivo no debe aparecer en cargas nuevas');

// Historial refleja las operaciones conectadas y ofrece anulación auditable.
click('#viewHistorial');await wait(30);
assert(document.querySelector('.movementLedger'),'Historial no renderizó el libro de movimientos');
assert(document.querySelector('#main').textContent.includes('Venta'),'Historial no identifica la venta');
assert(document.querySelector('#main').textContent.includes('Anulado'),'Historial no muestra el estado anulado');

assert(browserErrors.length===0,`Errores de navegador: ${browserErrors.join(' | ')}`);
dom.window.close();
console.log('OK · DOM 1366x768 · 10 vistas · Gantt anual/filtros/zoom · multi-rodeo · entrada/mover/venta/anulación · catálogos');
