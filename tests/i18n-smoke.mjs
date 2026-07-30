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
  if(!/Not implemented: (navigation|HTMLCanvasElement|window\.(?:alert|confirm|prompt))/.test(String(error))){
    browserErrors.push(`jsdom: ${error.message}`);
  }
});
virtualConsole.on('error',(...values)=>browserErrors.push(`console.error: ${values.map(String).join(' ')}`));

const dom=new JSDOM(html,{
  runScripts:'dangerously',
  pretendToBeVisual:true,
  url:'http://agroplano-i18n.test/',
  virtualConsole,
  beforeParse(window){
    window.confirm=()=>true;
    window.prompt=(_message,initial='')=>initial||'Test';
    window.alert=()=>{};
    window.scrollTo=()=>{};
    window.requestAnimationFrame=callback=>window.setTimeout(()=>callback(Date.now()),0);
    window.cancelAnimationFrame=id=>window.clearTimeout(id);
    window.matchMedia=query=>({matches:false,media:query,onchange:null,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return false;}});
    window.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
    window.BroadcastChannel=class{postMessage(){}close(){}};
    window.URL.createObjectURL=()=>'blob:agroplano-i18n-test';
    window.URL.revokeObjectURL=()=>{};
    window.HTMLElement.prototype.scrollIntoView=function(){};
    window.HTMLElement.prototype.scrollTo=function(){};
  }
});

const w=dom.window;
const {document,Event,MouseEvent}=w;
const wait=(ms=30)=>new Promise(resolve=>w.setTimeout(resolve,ms));
const click=selector=>{
  const element=document.querySelector(selector);
  assert(element,`Missing ${selector}`);
  element.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  return element;
};
const chooseLanguage=async language=>{
  const select=document.querySelector('#languageSelect');
  select.value=language;
  select.dispatchEvent(new Event('change',{bubbles:true}));
  await wait(40);
};
const spanishUiFragment=/[¿¡]|\b(?:lotes?|rodeos?|hacienda|cabezas?|cultivos?|ocupaci[oó]n|ocupad[oa]s?|descansos?|d[ií]as?|desde|hasta|plazo|fecha|entradas?|salidas?|venta|mortandad|movimientos?|categor[ií]as?|estado|eventos?|historial|mapa|todos|todas|sin|para|por|con|del|una?|incluye|mayor|faltan?|primero|s[oó]lo|cada|dentro|cu[aá]l|otros?|otras?|viene[ns]?|uso|cargad[oa]s?|datos|filtros|condici[oó]n|agua|forraje|pasto|abiert[oa]s?|objetivo|alcanzar(?:on|[aá]n)?|m[aá]s|menos|muestra|tiene[ns]?|mismo|misma|varios?|puede[ns]?|tareas?|trabajo|registro|tabla|filas?|opcional|disponibilidad|comparaci[oó]n|registrad[oa]s?|planificad[oa]s?|realizad[oa]s?|anulad[oa]s?|pendientes?|reales?|revisar|cargar|editar|mostrar|filtrar|buscar|anterior|siguiente|superficie|responsable|calidad|problemas?|agr[ií]col[ao]s?|ganader[oa]s?|siembra|labor|ubicaci[oó]n|recorrido|per[ií]odos?|an[aá]lisis|gesti[oó]n|operativ[oa]s?|galp[oó]n|configurad[oa]s?|verificar|observaci[oó]n|duraci[oó]n|curso|plano|planilla|eleg[ií]|demostraci[oó]n|fictici[oa]s?|simult[aá]neos?|confirmad[oa]s?|pasad[oa]s?|marcar|asignar|m[ií]nimo|quitar|acceso|lleva|ficha|remanente|guardando|sincronizaci[oó]n|antecesor|asociad[oa]|sombra|monte|terneras|novillos|colza|avena|moha|anual|combinaciones|cobertura|coincidencia|evaluad[oa]s?|libre|equipo|sanidad|administraci[oó]n)\b|\bant\./iu;
const englishResidues=root=>{
  const values=[];
  const record=(kind,value)=>{
    const normalized=String(value||'').replace(/\s+/g,' ').trim();
    if(normalized&&spanishUiFragment.test(normalized))values.push(`${kind}: ${normalized}`);
  };
  const walker=document.createTreeWalker(root,w.NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
    if(node.parentElement?.closest('script,style,template,[data-i18n-skip]'))continue;
    record('text',node.nodeValue);
  }
  for(const element of root.querySelectorAll('[aria-label],[title],[placeholder],[alt]')){
    for(const attribute of ['aria-label','title','placeholder','alt']){
      if(element.hasAttribute(attribute))record(attribute,element.getAttribute(attribute));
    }
  }
  return [...new Set(values)];
};
const assertEnglishView=selector=>{
  const residues=englishResidues(document.querySelector('#main'));
  assert.deepEqual(residues,[],`${selector} left Spanish or mixed UI in English mode:\n${residues.join('\n')}`);
};
const assertEnglishChrome=()=>{
  const residues=[
    ...englishResidues(document.querySelector('.topbar')),
    ...englishResidues(document.querySelector('.subbar'))
  ];
  assert.deepEqual(residues,[],`Global application chrome left Spanish or mixed UI in English mode:\n${residues.join('\n')}`);
};

await wait(220);
assert.equal(browserErrors.length,0,`Browser errors: ${browserErrors.join(' | ')}`);
assert(w.AgroPlanoI18n,'The i18n API did not load');
assert.equal(w.AgroPlanoI18n.getLocale(),'en','The public demo must default to English');
assert.equal(document.documentElement.lang,'en');
assert.equal(document.querySelector('#languageSelect')?.value,'en');
assert.equal(document.querySelector('#viewMap')?.textContent.trim(),'Map');
assert.equal(document.querySelector('#viewHacienda')?.textContent.trim(),'Livestock');
assert.equal(document.querySelector('.mapImg')?.getAttribute('src'),'assets/plano-demo-en.svg');
assert.equal(document.querySelector('.mapImg')?.getAttribute('alt'),'Synthetic farm map for demonstration');
assert.match(document.querySelector('#syncStatus')?.getAttribute('aria-label')||'',/^Sync status:/);
assert.match(document.querySelector('#activeWorkspaceMeta')?.textContent||'',/SYNTHETIC DATA/);
assert.deepEqual(
  [...document.querySelectorAll('#respList option')].map(option=>({value:option.value,label:option.textContent.trim()})),
  [
    {value:'Equipo Ganadería',label:'Livestock team'},
    {value:'Equipo Agricultura',label:'Crop team'},
    {value:'Sanidad',label:'Animal health'},
    {value:'Administración',label:'Administration'}
  ],
  'Owner suggestions must be localized without changing their stored values'
);
assert.equal(w.AgroPlanoI18n.formatDate('2026-07-14'),'07/14/2026');
assert.equal(w.AgroPlanoI18n.t('⚠ Respaldo: hace 7 días'),'⚠ Backup: 7 days ago');
assertEnglishView('#viewMap');
assertEnglishChrome();

const sharedBefore=JSON.stringify(w.eval('sharedCloudPayload()'));
const englishViews=[
  ['#viewHacienda','Livestock'],
  ['#viewRodeos','Herds'],
  ['#viewPastoreo','Grazing · decision view'],
  ['#viewCiclo','Annual cycle'],
  ['#viewDashboard','Livestock operations dashboard'],
  ['#viewCultivos','Crops'],
  ['#viewTable','Lots'],
  ['#viewHistorial','History'],
  ['#viewAgenda','Events']
];
for(const [selector,label] of englishViews){
  click(selector);
  await wait(25);
  assert(document.querySelector('#main')?.textContent.includes(label),`${selector} did not render its English heading: ${label}`);
  if(selector==='#viewHacienda')assert.equal(document.querySelector('.dateInput')?.getAttribute('placeholder'),'mm/dd/yyyy');
  if(selector==='#viewPastoreo'){
    assert.match(document.querySelector('.plannerVisualHead .plannerRowsBadge')?.textContent.replace(/\s+/g,' ').trim()||'',/^Showing \d+ of \d+ lots/);
    assert([...document.querySelectorAll('.dayHead small')].every(day=>/^[SMTWF]$/.test(day.textContent.trim())),'English Gantt must use English weekday initials');
    assert([...document.querySelectorAll('.eventCode')].every(code=>!/^(?:SER|PAR|YER|TAC|VTA)$/.test(code.textContent.trim())),'English Gantt must not expose Spanish event codes');
    assert([...document.querySelectorAll('#gpFilterHerd option:not([value="all"])')].every(option=>!option.textContent.includes(' · ')),'Synthetic herd filters must not duplicate translated names');
  }
  if(selector==='#viewDashboard'){
    assert.equal(document.querySelector('.dashboardDetailFold .dashPanel:nth-of-type(5) h3')?.textContent.trim(),'Plan vs. recorded activity');
    assert([...document.querySelectorAll('#dashHerd option:not([value="all"])')].every(option=>!option.textContent.includes(' · ')),'Dashboard herd filters must not duplicate translated names');
    assert.match(document.querySelector('.occupancyHeatmap th[title]')?.getAttribute('title')||'',/\bto\b/);
  }
  assertEnglishView(selector);
}

click('#viewAgenda');
await wait(25);
click('[data-event-mode="analysis"]');
await wait(25);
assert.match(document.querySelector('.eventAnalysisNote')?.textContent.replace(/\s+/g,' ').trim()||'',/^How to interpret this: Compliance includes only tasks/);
assertEnglishView('#viewAgenda analysis');
click('[data-event-mode="pending"]');
await wait(25);
const eventModeButtons=[...document.querySelectorAll('[data-event-mode]')];
assert(eventModeButtons.length===3&&eventModeButtons.every(button=>button.hasAttribute('aria-pressed')),'Event modes must expose their selected state');
assert.equal(eventModeButtons.filter(button=>button.getAttribute('aria-pressed')==='true').length,1,'Exactly one event mode must be selected');
const completedButton=document.querySelector('[data-event-realize]');
assert(completedButton,'The synthetic fixture must expose a completable event');
assert.match(completedButton.getAttribute('aria-label')||'',/^Mark completed:/);
const completedStyle=w.getComputedStyle(completedButton);
assert.notEqual(completedStyle.backgroundColor,'rgb(255, 255, 255)','Primary event actions must not render white text on white');
assert([...document.querySelectorAll('#main th')].every(th=>th.textContent.trim()),'Every data-table column must have a visible header');
assert([...document.querySelectorAll('#main .field > label')].every(label=>label.htmlFor&&document.getElementById(label.htmlFor)),'Rendered form labels must identify their controls');

await chooseLanguage('es');
assert.equal(w.AgroPlanoI18n.getLocale(),'es');
assert.equal(document.documentElement.lang,'es-AR');
assert.equal(document.querySelector('#viewMap')?.textContent.trim(),'Mapa');
assert.equal(document.querySelector('#viewHacienda')?.textContent.trim(),'Hacienda');
click('#viewMap');
await wait(25);
assert.equal(document.querySelector('.mapImg')?.getAttribute('src'),'assets/plano-demo.svg');
assert.match(document.querySelector('#activeWorkspaceMeta')?.textContent||'',/DATOS FICTICIOS/);
assert.equal(w.AgroPlanoI18n.formatDate('2026-07-14'),'14/07/2026');
assert.equal(w.localStorage.getItem('agroplano_demo_language_v1'),'es');

await chooseLanguage('en');
assert.equal(document.querySelector('#viewMap')?.textContent.trim(),'Map');
assert.equal(document.querySelector('.mapImg')?.getAttribute('src'),'assets/plano-demo-en.svg');
assert.equal(w.localStorage.getItem('agroplano_demo_language_v1'),'en');
assert.equal(JSON.stringify(w.eval('sharedCloudPayload()')),sharedBefore,'Changing language must not alter shared operational data');

assert.equal(browserErrors.length,0,`Browser errors after language changes: ${browserErrors.join(' | ')}`);
dom.window.close();
console.log('OK · i18n · English default · Español persistent selector · 10 views · localized map · shared state unchanged');
process.exit(0);
