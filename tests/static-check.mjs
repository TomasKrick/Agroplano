import {access, readFile, readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {basename, extname, join, relative} from 'node:path';
import vm from 'node:vm';

const ROOT=process.cwd();
const required=[
  'app/index.html','app/i18n.js','app/demo-data.js','app/config.js','app/cloud-sync.js',
  'app/manifest.webmanifest','app/sw.js','app/assets/plano-demo.svg','app/assets/plano-demo-en.svg',
  'app/assets/icon.svg','app/assets/icon-192.png','app/assets/icon-512.png',
  'README.md','docs/DATOS_FICTICIOS.md','docs/PRIVACIDAD_Y_SEPARACION.md',
  'docs/SUPABASE_OPCIONAL.md','package.json','package-lock.json',
  'supabase/migrations/001_agroplano_shared_state.sql',
  'desktop/package.json','desktop/package-lock.json','desktop/scripts/copy-app.mjs',
  'desktop/src-tauri/Cargo.toml','desktop/src-tauri/build.rs',
  'desktop/src-tauri/src/main.rs','desktop/src-tauri/tauri.conf.json',
  'desktop/src-tauri/capabilities/default.json',
  '.github/workflows/build-windows.yml','.github/workflows/verify.yml',
  '.github/workflows/pages.yml'
];
for(const path of required)await access(path);
for(const path of [
  'desktop/src-tauri/icons/icon.svg','desktop/src-tauri/icons/icon.ico',
  'desktop/src-tauri/icons/32x32.png','desktop/src-tauri/icons/128x128.png',
  'desktop/src-tauri/icons/128x128@2x.png'
])await access(path);

const read=path=>readFile(path,'utf8');
const readBinary=path=>readFile(path);
function assert(condition,message){if(!condition)throw new Error(message);}
async function assertPng(path,width,height){
  const bytes=await readBinary(path);
  const signature=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  assert(bytes.length>100&&bytes.subarray(0,8).equals(signature),`${path} debe ser un PNG válido y no vacío`);
  assert(bytes.readUInt32BE(16)===width&&bytes.readUInt32BE(20)===height,`${path} debe medir ${width}x${height}`);
}
await Promise.all([
  assertPng('app/assets/icon-192.png',192,192),
  assertPng('app/assets/icon-512.png',512,512),
  assertPng('desktop/src-tauri/icons/32x32.png',32,32),
  assertPng('desktop/src-tauri/icons/128x128.png',128,128),
  assertPng('desktop/src-tauri/icons/128x128@2x.png',256,256)
]);
const ico=await readBinary('desktop/src-tauri/icons/icon.ico');
assert(ico.length>100&&ico[0]===0&&ico[1]===0&&ico[2]===1&&ico[3]===0,'desktop/src-tauri/icons/icon.ico debe ser un ICO válido y no vacío');

const [html,i18nSource,demoSource,configSource,cloudSource,copyScript,workflow,verifyWorkflow,pagesWorkflow,sql,cargo]=await Promise.all([
  'app/index.html','app/i18n.js','app/demo-data.js','app/config.js','app/cloud-sync.js',
  'desktop/scripts/copy-app.mjs','.github/workflows/build-windows.yml',
  '.github/workflows/verify.yml','.github/workflows/pages.yml',
  'supabase/migrations/001_agroplano_shared_state.sql',
  'desktop/src-tauri/Cargo.toml'
].map(read));
const rootPackage=JSON.parse(await read('package.json'));
const desktopPackage=JSON.parse(await read('desktop/package.json'));
const tauriConfig=JSON.parse(await read('desktop/src-tauri/tauri.conf.json'));
const manifest=JSON.parse(await read('app/manifest.webmanifest'));

function includesAll(source,values,scope){
  for(const value of values)assert(source.includes(value),`${scope}: falta ${value}`);
}

// Identidad visible y aplicación integral.
includesAll(html,[
  'AgroPlano Gestión Demo','v1.3.0','DATOS FICTICIOS','NO USAR PARA OPERAR',
  './i18n.js','./demo-data.js','./config.js','./cloud-sync.js','assets/plano-demo.svg','assets/plano-demo-en.svg',
  'id="languageSelect"','>English<','>Español<'
],'Aplicación');
includesAll(i18nSource,[
  'agroplano_demo_language_v1','DEFAULT_LOCALE = "en"','window.AgroPlanoI18n',
  'setLocale','getLocale','SYNTHETIC DATA'
],'Interfaz bilingüe');
for(const id of ['viewMap','viewHacienda','viewRodeos','viewPastoreo','viewCiclo','viewDashboard','viewCultivos','viewTable','viewHistorial','viewAgenda']){
  assert(new RegExp(`id=["']${id}["']`).test(html),`Falta la pestaña integral ${id}`);
}
for(const fn of ['renderMapView','renderHaciendaView','renderRodeosView','renderPastoreoView','renderCycleView','renderDashboardView','renderCultivosView','renderTableView','renderHistorialView','renderAgendaView']){
  assert(new RegExp(`function\\s+${fn}\\s*\\(`).test(html),`Falta el módulo ${fn}`);
}

// Operación ganadera conectada: cinco acciones visibles, bajas parciales y
// anulación auditable. Estos tokens forman un contrato mínimo de interfaz y
// evitan que una actualización vuelva a registrar ventas/mortandad como simples
// comentarios sin impacto en existencias.
includesAll(html,[
  'function recordCattleMovement','function movementUndoEligibility','function annulCattleMovement',
  'function recordInventoryReduction','function restoreCattleTransaction','function requireDateInput',
  'function claimUiCattleCommand','recentUiCattleCommands','La operación ya se está procesando',
  "action:'entrada'","action:'mover'","action:'venta'","action:'mortandad'",'data-undo-movement',
  'annulledAt','annulmentReason','currentOccupancies','refreshLotCurrentCattleProjection',
  'data-map-cattle-action="entry"','data-map-cattle-action="move"',
  'data-map-cattle-action="exit"','data-map-cattle-action="sale"',
  'data-map-cattle-action="mortality"','data-map-cattle-form="entry"',
  'id="guideSaleCount"','id="guideSaleBuyer"','id="guideSaleDestination"',
  'id="guideSaleDte"','id="guideMortalityCount"','id="guideMortalityReason"'
],'Movimientos de hacienda');
assert(/\['entrada','salida','mover'\]\.includes\(kind\)/.test(html),'El motor de traslados debe limitarse a entrada, salida y movimiento');
assert(/\['venta','mortandad'\]\.includes\(kind\)/.test(html),'Venta y mortandad deben usar el motor de reducción de inventario');
assert(/\['salida','mover','venta','mortandad'\]\.includes\(m\.type\)/.test(html),'Anular debe restaurar salidas, ventas, mortandad y movimientos');
assert(/<option value="venta">[^<]*(?:Venta|venta)/.test(html),'Hacienda debe ofrecer Venta en su selector');
assert(/<option value="mortandad">[^<]*(?:Mortandad|mortandad)/.test(html),'Hacienda debe ofrecer Mortandad en su selector');

// Eventos: estados explícitos y compatibles con registros viejos, filtros y
// una vista analítica que no confunde hechos directos con cumplimiento del plan.
includesAll(html,[
  'function eventStatus','function setEventStatus','EVENT_STATUS_VALUES','FACTUAL_EVENT_KINDS',
  'data-event-mode="pending"','data-event-mode="all"','data-event-mode="analysis"',
  'id="agFrom"','id="agTo"','id="agLot"','id="agType"','id="agHerd"',
  'id="agCategory"','id="agResp"','id="agStatus"','id="agSearch"',
  'Cumplimiento verificable','Eventos por tipo','Estado del trabajo',
  'Evolución por mes','Pendientes por responsable','data-event-realize'
],'Eventos operativos');

// Catálogos editables y selectores de una sola acción.
for(const fn of ['catalogSelectOptions','addCatalogItem','renameCatalogItem','toggleCatalogItem','setCropCatalogKind','renderCatalogModal']){
  assert(new RegExp(`function\\s+${fn}\\s*\\(`).test(html),`Falta gestión de catálogos: ${fn}`);
}
includesAll(html,[
  'data-catalog-tab="categories"','data-catalog-tab="herds"','data-catalog-tab="crops"',
  'id="sheetMovCat"','id="sheetMovRodeo"','id="sheetCropCurrent"'
],'Catálogos y selectores');

// Gantt de decisión: plazo anual, zoom, filtros, eventos, orden y referencias.
includesAll(html,[
  'El Gantt admite hasta 366 días','id="gpLastYear"','id="gpScale"',
  'id="gpZoomOut"','id="gpZoomIn"','id="gpExpand"','id="gpFilterHerd"',
  'id="gpFilterCategory"','id="gpFilterEvent"','id="gpFilterStatus"',
  'id="gpSort"','id="gpSortDir"','id="gpRows"','id="grazingTooltip"',
  'Referencias de colores · rodeos y eventos','Rayado = planificado','Borde rojo = revisar',
  "label:'Servicio'","label:'Vacunación'","label:'Parición'","label:'Yerra'","label:'Tacto'","label:'Venta'"
],'Planificación de pastoreo');
includesAll(html,[
  'function plannerRestLensMatch','function plannerRestLensMeta','id="gpRestLens"',
  'Descanso vs objetivo','plannerRestLens','plannerScrollLeft','plannerExpanded',
  'function currentRodeoPlacements','function locateRodeoOnMap',
  'data-rodeo-locate','data-rodeo-bring','id="rodeoTransferConfirm"',
  'function renderLotContextIndicators','contextIndicatorGrid'
],'Operación contextual v1.2');
includesAll(html,[
  'function normalizeInfrastructureType','DEMO_MAP_SPACE','DEFAULT_CYCLE_START',
  'DEFAULT_PLANNER_START','DEFAULT_DASHBOARD_START'
],'Defaults y tipología sintéticos');
assert(/class="marker visualMarker [^"]*"[^>]*aria-label="[^"]+"/.test(html),'Los lotes del mapa deben conservar un nombre accesible');
assert(!/class="marker visualMarker [^"]*"[^>]*title=/.test(html),'El marcador de lote no debe reintroducir tooltip nativo');
assert(!/class="grazingCell[^"]*"[^>]*title=/.test(html),'El Gantt debe usar ARIA y su tooltip contextual, no el tooltip nativo');
assert(/<option value="fit"[^>]*>Ajustar al ancho/.test(html),'El Gantt debe poder verse completo ajustado al ancho');
assert(/plannerSort:\s*['"]decision['"]/.test(html),'El Gantt debe tener orden operativo inicial');

// Diseño manejable en notebook 1366x768 y mapa navegable.
includesAll(html,[
  '@media(max-width:1450px)','@media(max-height:700px)','100dvh',
  '.mapViewport','overflow:auto','touch-action:none','cursor:grab',
  'fitMapToViewport','mapFitActive',
  'function scheduleShowLotHover','function moveLotHoverWithPointer',
  'function positionLotHoverCard','function suppressLotHover'
],'Responsive');
assert(/\.lotHoverCard\s*\{[\s\S]*?width:\s*310px\s*!important;[\s\S]*?max-height:\s*(?:min\()?340px[\s\S]*?pointer-events:\s*none\s*!important;/m.test(html),'El hover debe ser compacto (310x340), no bloquear el mapa y seguir al cursor');
assert(!/\.lotHoverCard\s*\{[\s\S]{0,240}?width:\s*470px\s*!important;/m.test(html),'No debe reaparecer el hover ancho que cubría el mapa');
assert(/addEventListener\(['"]pointermove['"][\s\S]{0,220}?moveLotHoverWithPointer/.test(html),'El hover debe acompañar la posición actual del cursor');
assert(/\.lotPoly\.dimmed\s*,\s*\.marker\.visualMarker\.dimmed\s*\{[^}]*pointer-events:\s*auto/.test(html),'Un lote atenuado por Resaltar debe seguir aceptando clic y hover');
assert(!/\.lotPoly\.dimmed\s*,\s*\.marker\.visualMarker\.dimmed\s*\{[^}]*pointer-events:\s*none/.test(html),'Resaltar no puede bloquear la selección de lotes atenuados');
assert(/\.lotPoly\.selectedPoly\.dimmed\s*\{[^}]*stroke-opacity:\s*1/.test(html),'La selección debe permanecer claramente visible aunque el lote esté atenuado');
const clearSelectionBody=(html.match(/function clearSelectionIfFilteredOut\s*\(\)\s*\{([\s\S]*?)\n\}/)||[])[1]||'';
assert(clearSelectionBody&&!clearSelectionBody.includes('!matchesVisualFilter(lot)'),'El resaltado visual no debe cerrar la ficha seleccionada');
const mainWindow=tauriConfig.app?.windows?.[0];
assert(mainWindow?.width===1366&&mainWindow?.height===768,'La ventana Tauri debe abrir a 1366x768');
assert(mainWindow?.minWidth<=900&&mainWindow?.minHeight<=560,'La ventana debe poder reducirse sin bloquear notebooks');

// Identidad separada del instalable.
assert(rootPackage.name==='agroplano-demo'&&rootPackage.version==='1.3.0','La identidad npm raíz debe ser agroplano-demo v1.3.0');
assert(rootPackage.private===true,'El paquete debe estar protegido contra publicación npm accidental');
assert(rootPackage.author==='Tomás Krick'&&rootPackage.license==='MIT','El paquete raíz debe declarar autor y licencia MIT');
assert(desktopPackage.name==='agroplano-demo-desktop'&&desktopPackage.version==='1.3.0','La identidad npm de escritorio debe ser propia y v1.3.0');
assert(desktopPackage.author==='Tomás Krick'&&desktopPackage.license==='MIT','El paquete de escritorio debe declarar autor y licencia MIT');
assert(desktopPackage.scripts?.build==='tauri build','El build de escritorio debe compilar Tauri');
assert(tauriConfig.productName==='AgroPlano Demo'&&tauriConfig.version==='1.3.0','El instalador debe tener marca y versión propias');
assert(tauriConfig.identifier==='com.agroplano.demo','El identificador Tauri debe ser com.agroplano.demo');
assert(mainWindow?.title?.includes('AgroPlano Demo')&&mainWindow.title.includes('SYNTHETIC DATA'),'La ventana debe identificar claramente la demo');
const targets=tauriConfig.bundle?.targets||[];
assert(tauriConfig.bundle?.active===true&&['nsis','msi'].every(target=>targets.includes(target)),'El build Windows debe producir NSIS y MSI');
assert(/^name\s*=\s*"agroplano_demo"\s*$/m.test(cargo)&&/^version\s*=\s*"1\.3\.0"\s*$/m.test(cargo),'La identidad Rust debe ser agroplano_demo v1.3.0');
assert(/^authors\s*=\s*\["Tomás Krick"\]\s*$/m.test(cargo)&&/^license\s*=\s*"MIT"\s*$/m.test(cargo),'Cargo debe declarar autor y licencia MIT');
assert(manifest.name?.includes('AgroPlano')&&manifest.name?.includes('Demo'),'El manifiesto PWA debe conservar la identidad genérica');

const csp=tauriConfig.app?.security?.csp||'';
includesAll(csp,["default-src 'self'","connect-src 'self' https://*.supabase.co wss://*.supabase.co","object-src 'none'","frame-ancestors 'none'"],'CSP');

// Nube opcional, aislada y sin secretos incluidos.
includesAll(configSource,[
  'window.AGROPLANO_CLOUD','enabled: false','supabaseUrl: ""','supabaseAnonKey: ""','workspaceId: ""'
],'Configuración local segura');
includesAll(cloudSource,[
  'window.AGROPLANO_CLOUD','window.AgroPlanoCloud','agroplano-demo-cloud-v1',
  'agroplano_demo_cloud_workspace','postgres_changes','app_documents','workspace_members',
  'agroplano_backend_identity','agroplano-gestion-demo','WRONG_BACKEND',
  "role === \"admin\" || role === \"editor\"","role === \"viewer\""
],'Sincronización genérica');
includesAll(copyScript,[
  'AGROPLANO_SUPABASE_URL','AGROPLANO_SUPABASE_PUBLISHABLE_KEY','AGROPLANO_WORKSPACE_ID',
  'Use únicamente la publishable/anon key'
],'Configuración del instalador');
assert(!/process\.env\.(?!AGROPLANO_)/.test(copyScript),'El empaquetado no debe leer variables de otro producto');

for(const [pattern,message] of [
  [/workflow_dispatch:/,'La compilación Windows debe poder iniciarse manualmente'],
  [/pull_request:[\s\S]*branches:[\s\S]*main/,'Los cambios destinados a main deben compilar antes de fusionarse'],
  [/runs-on:\s*windows-latest/,'El instalador debe compilarse en Windows'],
  [/actions\/checkout@v7/,'Debe usar checkout v7'],
  [/actions\/setup-node@v7/,'Debe usar setup-node v7'],
  [/node-version:\s*["']24["']/,'Debe usar Node 24'],
  [/actions\/upload-artifact@v7/,'Debe usar upload-artifact v7'],
  [/name:\s*agroplano-gestion-demo-windows/,'El artefacto debe tener nombre propio'],
  [/agroplano_demo\.exe/,'El ejecutable debe tener nombre propio'],
  [/vars\.AGROPLANO_SUPABASE_URL/,'La nube opcional debe usar variables propias de AgroPlano'],
  [/vars\.AGROPLANO_SUPABASE_PUBLISHABLE_KEY/,'La publishable key debe venir de variables propias de AgroPlano']
])assert(pattern.test(workflow),message);
assert(!/\$\{\{\s*secrets\./.test(workflow),'La compilación no debe incrustar secretos privilegiados');
assert(/npm (?:test|run check)/.test(verifyWorkflow),'El workflow de verificación debe ejecutar las pruebas');
includesAll(pagesWorkflow,[
  'actions/configure-pages@v6','actions/upload-pages-artifact@v5',
  'actions/deploy-pages@v5','path: app','pages: write','id-token: write'
],'Demo pública');

// Backend multiusuario propio: RLS, roles, historial y concurrencia optimista.
for(const fragment of [
  'create table if not exists public.workspaces','create table if not exists public.workspace_members',
  'create table if not exists public.app_documents','create table if not exists public.app_document_versions',
  'create table if not exists public.app_mutations','role in (\'admin\',\'editor\',\'viewer\')',
  'enable row level security','create_workspace_with_state','set_workspace_member_by_email',
  'commit_app_state','validate_agroplano_state','editor_state_is_append_only',
  'agroplano_backend_identity','is distinct from \'admin\'','debe quedar al menos un administrador',
  'alter publication supabase_realtime add table public.app_documents'
])assert(sql.toLowerCase().includes(fragment.toLowerCase()),`Migración Supabase incompleta: falta ${fragment}`);

// Ejecutar el fixture sin navegador para validar estructura y coherencia.
const fixtureContext={window:{}};
vm.runInNewContext(demoSource,fixtureContext,{filename:'app/demo-data.js'});
const demo=fixtureContext.window.AGROPLANO_DEMO;
assert(demo&&typeof demo==='object','demo-data.js debe exponer window.AGROPLANO_DEMO');
assert(demo.meta?.dataOrigin==='synthetic'&&demo.meta?.privacyClass==='public_demo','El fixture debe declararse sintético y public_demo');
assert(demo.map?.isSynthetic===true&&demo.map?.asset==='assets/plano-demo.svg','El plano debe estar declarado como sintético');
assert(demo.lots?.length===24,`Se esperaban 24 lotes sintéticos y hay ${demo.lots?.length||0}`);
assert(new Set(demo.lots.map(lot=>lot.id)).size===24,'Los 24 IDs de lote deben ser únicos');
assert(demo.lots.every(lot=>String(lot.id).startsWith('demo-lot-')&&lot.dataOrigin==='synthetic'&&lot.points?.length>=3),'Todos los lotes deben ser sintéticos y tener geometría propia');
assert(demo.herds?.length===8&&demo.herds.every(item=>item.dataOrigin==='synthetic'),'Se esperan 8 rodeos sintéticos');
assert(demo.categories?.length>=10&&demo.categories.every(item=>item.dataOrigin==='synthetic'),'Se esperan al menos 10 categorías sintéticas');
assert(demo.crops?.length>=15&&demo.crops.every(item=>item.dataOrigin==='synthetic'),'Se esperan al menos 15 cultivos sintéticos');
assert(demo.events?.length>=15&&demo.events.every(item=>item.dataOrigin==='synthetic'),'Se esperan eventos sintéticos para los filtros');
assert(demo.periods?.length>200&&demo.periods.every(item=>item.dataOrigin==='synthetic'),'Se espera un historial sintético amplio para los indicadores');
const activeByLot=new Map();
for(const period of demo.periods.filter(p=>p.status==='real'&&p.startDate<=demo.meta.demoToday&&(!p.endDateExclusive||p.endDateExclusive>demo.meta.demoToday))){
  const set=activeByLot.get(period.lotId)||new Set();set.add(period.herdId||period.herdCode);activeByLot.set(period.lotId,set);
}
assert([...activeByLot.values()].some(set=>set.size>=2),'El fixture debe probar dos rodeos simultáneos en un lote');

// Plano coherente: el fondo es artificial y los 24 perímetros viven en el
// dataset/overlay interactivo (evita duplicar geometría en dos fuentes).
const svg=await read('app/assets/plano-demo.svg');
assert(/viewBox=["']0 0 1000 650["']/.test(svg),'El SVG debe usar el espacio artificial 1000x650');
assert(svg.includes('PLANO SINTÉTICO')&&svg.includes('SIN ESCALA'),'El fondo debe advertir que es un plano sintético y sin escala');
for(const sector of ['SECTOR AURORA','SECTOR BRÚJULA','SECTOR CAÑADA','SECTOR DELTA'])assert(svg.includes(sector),`Falta el sector artificial ${sector}`);
assert(new Set(demo.lots.map(lot=>JSON.stringify(lot.points))).size===24,'Cada lote debe tener un perímetro artificial diferente');

// Sintaxis de todos los scripts ejecutables.
for(const path of ['app/demo-data.js','app/config.js','app/cloud-sync.js','app/sw.js','desktop/scripts/copy-app.mjs','tests/dom-smoke.mjs']){
  const result=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
  assert(result.status===0,`JavaScript inválido en ${path}:\n${result.stderr}`);
}
const inlineScripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match=>match[1]).filter(source=>source.trim());
for(const [index,source] of inlineScripts.entries()){
  const result=spawnSync(process.execPath,['--check','--input-type=commonjs'],{input:source,encoding:'utf8'});
  assert(result.status===0,`Script inline ${index+1} inválido:\n${result.stderr}`);
}

// Inventario completo de lo publicable. Primero se rechazan formatos que no
// pertenecen al código fuente; después se leen únicamente formatos de texto.
async function allFiles(root){
  const output=[];
  for(const entry of await readdir(root,{withFileTypes:true})){
    if(['.git','node_modules','target','dist'].includes(entry.name))continue;
    const path=join(root,entry.name);
    if(entry.isDirectory())output.push(...await allFiles(path));
    else output.push(path);
  }
  return output;
}
const inventory=await allFiles(ROOT);
const forbiddenExtensions=new Set(['.csv','.xls','.xlsx','.pdf','.zip','.db','.sqlite','.sqlite3','.pem','.p12','.bak','.exe','.msi']);
const allowedBinaryAssets=new Set([
  'app/assets/icon-192.png','app/assets/icon-512.png',
  'desktop/src-tauri/icons/icon.ico','desktop/src-tauri/icons/32x32.png',
  'desktop/src-tauri/icons/128x128.png','desktop/src-tauri/icons/128x128@2x.png'
]);
const textExtensions=new Set(['.html','.css','.js','.mjs','.json','.toml','.rs','.yml','.yaml','.md','.sql','.svg','.webmanifest','.gitignore']);
for(const path of inventory){
  const rel=relative(ROOT,path).replaceAll('\\','/'),name=basename(path).toLowerCase(),extension=extname(name).toLowerCase();
  const isText=textExtensions.has(extension)||name==='.gitignore'||name==='license';
  assert(!(name==='.env'||name.startsWith('.env.')),`Archivos publicables: ${rel} es una configuración de entorno`);
  assert(!forbiddenExtensions.has(extension),`Archivos publicables: ${rel} usa un formato no permitido`);
  if(!isText)assert(allowedBinaryAssets.has(rel),`Archivos publicables: ${rel} no pertenece a la allowlist de íconos`);
}
const publicPaths=inventory.filter(path=>textExtensions.has(extname(path).toLowerCase())||['.gitignore','license'].includes(basename(path).toLowerCase()));
const privacyPatterns=[
  {pattern:/https:\/\/[a-z0-9-]{8,}\.supabase\.co/i,label:'URL concreta de Supabase'},
  {pattern:/eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{10,}/,label:'JWT'},
  {pattern:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,label:'clave privada'},
  {pattern:/\bgh[pousr]_[a-zA-Z0-9]{20,}\b/,label:'token GitHub'},
  {pattern:/\b(?:latitude|longitude|latitud|longitud)\s*[:=]\s*-?\d{1,3}\.\d{4,}/i,label:'coordenada geográfica'}
];
for(const path of publicPaths){
  const source=await read(path);
  for(const {pattern,label} of privacyPatterns){
    assert(!pattern.test(source),`Privacidad: ${relative(ROOT,path)} contiene ${label} (${pattern})`);
  }
}
assert(demo.lots.every(lot=>/^(?:AU|BR|CA|DE)-\d{2}$/.test(lot.code)),'Los códigos de lote deben pertenecer únicamente al esquema artificial de la demo');
assert(!/window\.CAMPO_DEMO\b/.test(demoSource+html),'No debe quedar el alias temporal del prototipo anterior');
assert(!/(?:STORAGE_KEY|SYNC_CHANNEL_NAME|DB_NAME)\s*=\s*['"](?!agroplano[_-]demo)/.test(html+cloudSource),'Persistencia y canales deben usar namespace propio');

console.log(`OK · AgroPlano Demo v1.3.0 · ${demo.lots.length} lotes · ${demo.herds.length} rodeos · app integral bilingüe, instalador y backend aislados · privacidad verificada`);
