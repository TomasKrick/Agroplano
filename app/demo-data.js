/*
 * AGROPLANO · JUEGO DE DATOS SINTÉTICO
 * Origen: synthetic · privacy_class: public_demo
 *
 * Este archivo fue creado exclusivamente para la versión demostrativa.
 * Nombres, superficies, geometrías, rodeos, cultivos, eventos y recorridos
 * son ficticios y no representan a ningún establecimiento real.
 */
window.AGROPLANO_DEMO = (() => {
  'use strict';

  const DEMO_TODAY = '2026-07-13';
  const DATA_ORIGIN = 'synthetic';
  const GENERATOR_SEED = 'AGROPLANO-CAMPO-MODELO-2026';
  const MAP_SPACE = {width:1000,height:650};
  const MAP_ASSET = 'assets/plano-demo.svg';
  const DAY = 86400000;

  const parse = date => new Date(`${date}T12:00:00Z`);
  const iso = date => date.toISOString().slice(0,10);
  const addDays = (date,days) => iso(new Date(parse(date).getTime()+days*DAY));
  const cmp = (a,b) => parse(a)-parse(b);
  const norm = value => String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
  const round = (value,digits=2) => Number(Number(value).toFixed(digits));
  const centroid = points => {
    const total=points.reduce((acc,[x,y])=>[acc[0]+x,acc[1]+y],[0,0]);
    return [total[0]/points.length,total[1]/points.length];
  };
  const toPercentPoint = ([x,y]) => ({x:round(x/MAP_SPACE.width*100,3),y:round(y/MAP_SPACE.height*100,3)});

  const baseLots = [
    {id:'demo-lot-01',number:1,code:'AU-01',name:'Loma Clara',sector:'Aurora',areaHa:28.4,points:[[55,45],[255,54],[264,136],[66,132]]},
    {id:'demo-lot-02',number:2,code:'AU-02',name:'Algarrobo',sector:'Aurora',areaHa:31.2,points:[[66,136],[264,140],[258,228],[55,222]]},
    {id:'demo-lot-03',number:3,code:'AU-03',name:'La Posta',sector:'Aurora',areaHa:27.6,points:[[55,226],[258,232],[265,320],[64,314]]},
    {id:'demo-lot-04',number:4,code:'AU-04',name:'Bajo Norte',sector:'Aurora',areaHa:30.1,points:[[65,329],[264,334],[255,411],[55,405]]},
    {id:'demo-lot-05',number:5,code:'AU-05',name:'El Ombú',sector:'Aurora',areaHa:29.8,points:[[55,409],[255,415],[263,507],[67,500]]},
    {id:'demo-lot-06',number:6,code:'AU-06',name:'Puesto Viejo',sector:'Aurora',areaHa:26.4,points:[[67,504],[263,511],[250,606],[58,598]]},

    {id:'demo-lot-07',number:7,code:'BR-01',name:'Loma Azul',sector:'Brújula',areaHa:33.5,points:[[272,54],[497,45],[500,135],[267,136]]},
    {id:'demo-lot-08',number:8,code:'BR-02',name:'Las Tunas',sector:'Brújula',areaHa:28.2,points:[[268,140],[500,139],[499,226],[262,228]]},
    {id:'demo-lot-09',number:9,code:'BR-03',name:'El Molino',sector:'Brújula',areaHa:31.7,points:[[262,232],[499,230],[499,318],[269,320]]},
    {id:'demo-lot-10',number:10,code:'BR-04',name:'Media Luna',sector:'Brújula',areaHa:29.6,points:[[269,334],[499,330],[499,411],[259,411]]},
    {id:'demo-lot-11',number:11,code:'BR-05',name:'Cortadera',sector:'Brújula',areaHa:34.1,points:[[259,415],[499,415],[500,505],[267,507]]},
    {id:'demo-lot-12',number:12,code:'BR-06',name:'La Espera',sector:'Brújula',areaHa:27.9,points:[[267,511],[500,509],[500,606],[254,606]]},

    {id:'demo-lot-13',number:13,code:'CA-01',name:'Cañada Alta',sector:'Cañada',areaHa:25.8,points:[[524,46],[716,54],[721,136],[521,134]]},
    {id:'demo-lot-14',number:14,code:'CA-02',name:'Los Talas',sector:'Cañada',areaHa:30.3,points:[[521,138],[721,140],[713,226],[526,228]]},
    {id:'demo-lot-15',number:15,code:'CA-03',name:'El Mirador',sector:'Cañada',areaHa:32.4,points:[[526,232],[713,230],[722,318],[521,320]]},
    {id:'demo-lot-16',number:16,code:'CA-04',name:'Tres Lagunas',sector:'Cañada',areaHa:27.1,points:[[522,334],[723,332],[716,410],[525,411]]},
    {id:'demo-lot-17',number:17,code:'CA-05',name:'La Isla',sector:'Cañada',areaHa:29.9,points:[[525,415],[716,414],[722,504],[521,507]]},
    {id:'demo-lot-18',number:18,code:'CA-06',name:'Rincón Sur',sector:'Cañada',areaHa:35.2,points:[[521,511],[722,508],[714,606],[523,599]]},

    {id:'demo-lot-19',number:19,code:'DE-01',name:'Puerta Este',sector:'Delta',areaHa:31.6,points:[[728,55],[946,46],[951,135],[725,136]]},
    {id:'demo-lot-20',number:20,code:'DE-02',name:'El Cardal',sector:'Delta',areaHa:28.8,points:[[725,140],[951,139],[943,226],[718,228]]},
    {id:'demo-lot-21',number:21,code:'DE-03',name:'La Matera',sector:'Delta',areaHa:33.2,points:[[718,232],[943,230],[952,315],[726,319]]},
    {id:'demo-lot-22',number:22,code:'DE-04',name:'La Herradura',sector:'Delta',areaHa:30.5,points:[[726,334],[952,329],[947,411],[721,410]]},
    {id:'demo-lot-23',number:23,code:'DE-05',name:'Monte Chico',sector:'Delta',areaHa:26.9,points:[[721,414],[947,415],[953,505],[725,504]]},
    {id:'demo-lot-24',number:24,code:'DE-06',name:'Fondo Grande',sector:'Delta',areaHa:34.7,points:[[725,508],[953,509],[944,598],[718,606]]}
  ];

  const categories = [
    'Vacas con cría','Vacas preñadas','Vacas vacías','Vaquillonas de reposición',
    'Terneros','Terneras','Novillitos','Novillos','Toros','Recría liviana','Recría pesada'
  ].map((name,index)=>({id:`demo-category-${String(index+1).padStart(2,'0')}`,name,active:true,dataOrigin:DATA_ORIGIN}));

  const crops = [
    {name:'Soja',kind:'agricultura'},
    {name:'Maíz grano',kind:'agricultura'},
    {name:'Trigo',kind:'agricultura'},
    {name:'Girasol',kind:'agricultura'},
    {name:'Sorgo granífero',kind:'agricultura'},
    {name:'Cebada',kind:'agricultura'},
    {name:'Colza',kind:'agricultura'},
    {name:'Barbecho',kind:'mixto'},
    {name:'Pastura consociada',kind:'ganaderia'},
    {name:'Alfalfa',kind:'ganaderia'},
    {name:'Verdeo de invierno',kind:'ganaderia'},
    {name:'Verdeo de verano',kind:'ganaderia'},
    {name:'Avena',kind:'ganaderia'},
    {name:'Ryegrass anual',kind:'ganaderia'},
    {name:'Sorgo forrajero',kind:'ganaderia'},
    {name:'Maíz para silo',kind:'ganaderia'},
    {name:'Moha',kind:'ganaderia'},
    {name:'Regeneración natural',kind:'ganaderia'}
  ].map((item,index)=>({id:`demo-crop-${String(index+1).padStart(2,'0')}`,...item,active:true,dataOrigin:DATA_ORIGIN}));

  const herds = [
    {id:'demo-herd-01',code:'Recría Norte',name:'Recría Norte',category:'Vaquillonas de reposición',heads:78,color:'#5577a8',route:[1,2,3,4,5,6],minStay:8,maxStay:14,offset:0},
    {id:'demo-herd-02',code:'Vientres Delta',name:'Vientres Delta',category:'Vacas con cría',heads:120,color:'#2f7d48',route:[7,8,9,10,11,12],minStay:9,maxStay:15,offset:4},
    {id:'demo-herd-03',code:'Terneros Horizonte',name:'Terneros Horizonte',category:'Terneros',heads:96,color:'#c55b3b',route:[13,14,15,16,17,18],minStay:7,maxStay:12,offset:2},
    {id:'demo-herd-04',code:'Terminación Sur',name:'Terminación Sur',category:'Novillitos',heads:62,color:'#44835a',route:[19,20,21,22,23,24],minStay:7,maxStay:11,offset:7},
    {id:'demo-herd-05',code:'Toros Órbita',name:'Toros Órbita',category:'Toros',heads:18,color:'#667e8b',route:[7,8,9,10,11,12],minStay:9,maxStay:15,offset:4,activeStart:'2025-10-24',activeEnd:'2026-01-25'},
    {id:'demo-herd-06',code:'Vacas Umbral',name:'Vacas Umbral',category:'Vacas vacías',heads:84,color:'#b7792c',route:[1,3,5,2,4,6],minStay:8,maxStay:13,offset:19},
    {id:'demo-herd-07',code:'Recría Faro',name:'Recría Faro',category:'Recría liviana',heads:70,color:'#96713b',route:[13,16,14,17,15,18],minStay:7,maxStay:12,offset:17},
    {id:'demo-herd-08',code:'Vientres Prisma',name:'Vientres Prisma',category:'Vacas preñadas',heads:110,color:'#587f7d',route:[19,22,20,23,21,24],minStay:8,maxStay:14,offset:13}
  ].map(herd=>({...herd,active:true,dataOrigin:DATA_ORIGIN}));

  const eventTypes = [
    {id:'servicio',label:'Servicio',short:'SER',appType:'Inicio servicio',color:'#ef1717',text:'#ffffff'},
    {id:'vacunacion',label:'Vacunación',short:'VAC',appType:'Vacunación obligatoria',color:'#8b5ca8',text:'#ffffff'},
    {id:'paricion',label:'Parición',short:'PAR',appType:'Comienzo de parición',color:'#6387bd',text:'#ffffff'},
    {id:'yerra',label:'Yerra',short:'YER',appType:'Yerra',color:'#75c7df',text:'#173746'},
    {id:'tacto',label:'Tacto',short:'TAC',appType:'Tacto',color:'#b36f00',text:'#ffffff'},
    {id:'venta',label:'Venta',short:'VTA',appType:'Venta',color:'#00a848',text:'#ffffff'}
  ];

  const events = [
    {date:'2025-07-22',type:'vacunacion',title:'Vacunación reproductiva',lots:[]},
    {date:'2025-08-04',type:'paricion',title:'Inicio de parición',lots:[7,8,9,10,11,12]},
    {date:'2025-08-28',type:'paricion',title:'Control de parición',lots:[7,8,9,10,11,12]},
    {date:'2025-09-16',type:'vacunacion',title:'Vacunación de terneros',lots:[13,14,15,16,17,18]},
    {date:'2025-10-24',type:'servicio',title:'Inicio de servicio',lots:[7,8,9,10,11,12]},
    {date:'2025-11-14',type:'servicio',title:'Control de servicio',lots:[7,8,9,10,11,12]},
    {date:'2025-12-05',type:'servicio',title:'Control de servicio',lots:[7,8,9,10,11,12]},
    {date:'2025-12-12',type:'vacunacion',title:'Vacunación general',lots:[]},
    {date:'2025-12-18',type:'venta',title:'Venta de terminación',lots:[19,20,21,22,23,24]},
    {date:'2026-01-20',type:'servicio',title:'Fin de servicio',lots:[7,8,9,10,11,12]},
    {date:'2026-03-12',type:'tacto',title:'Tacto de vientres',lots:[7,8,9,10,11,12]},
    {date:'2026-04-09',type:'yerra',title:'Yerra anual',lots:[13,14,15,16,17,18]},
    {date:'2026-04-16',type:'vacunacion',title:'Vacunación de otoño',lots:[]},
    {date:'2026-05-14',type:'venta',title:'Venta programada',lots:[19,20,21,22,23,24]},
    {date:'2026-06-11',type:'vacunacion',title:'Vacunación general',lots:[]},
    {date:'2026-07-22',type:'vacunacion',title:'Vacunación planificada',lots:[]},
    {date:'2026-08-05',type:'paricion',title:'Inicio de parición planificado',lots:[7,8,9,10,11,12]},
    {date:'2026-10-23',type:'servicio',title:'Inicio de servicio planificado',lots:[7,8,9,10,11,12]},
    {date:'2027-03-11',type:'tacto',title:'Tacto planificado',lots:[7,8,9,10,11,12]}
  ].map((event,index)=>({
    id:`demo-event-${String(index+1).padStart(2,'0')}`,
    ...event,
    notes:'Registro ficticio para demostrar filtros y columnas de eventos.',
    wholeFarm:event.lots.length===0,
    dataOrigin:DATA_ORIGIN
  }));

  const infrastructure = [
    {id:'demo-infra-water-01',type:'water',x:302,y:102,label:'Aguada A',name:'Aguada A',code:'AG-A',notes:'Punto de agua ficticio.'},
    {id:'demo-infra-water-02',type:'water',x:438,y:276,label:'Aguada B',name:'Aguada B',code:'AG-B',notes:'Punto de agua ficticio.'},
    {id:'demo-infra-water-03',type:'water',x:606,y:470,label:'Aguada C',name:'Aguada C',code:'AG-C',notes:'Punto de agua ficticio.'},
    {id:'demo-infra-water-04',type:'water',x:846,y:256,label:'Aguada D',name:'Aguada D',code:'AG-D',notes:'Punto de agua ficticio.'},
    {id:'demo-infra-corral-01',type:'corral',x:840,y:552,label:'Manga y corrales',name:'Manga y corrales',code:'MANGA',notes:'Área operativa ficticia para movimientos, sanidad y carga.'},
    {id:'demo-infra-shed-01',type:'galpon',x:535,y:92,label:'Galpón demo',name:'Galpón demo',code:'GALPÓN',notes:'Infraestructura ficticia.'}
  ].map(item=>({...item,dataOrigin:DATA_ORIGIN}));

  function generatePeriods(){
    const rows=[];
    const horizon='2027-07-14';
    herds.forEach((herd,herdIndex)=>{
      let cursor=herd.activeStart||addDays('2025-07-14',herd.offset);
      const stop=herd.activeEnd||horizon;
      let index=0;
      while(cmp(cursor,stop)<0&&index<120){
        const span=herd.maxStay-herd.minStay+1;
        const duration=herd.minStay+((index*3+herdIndex*2)%span);
        const theoreticalEnd=cmp(addDays(cursor,duration),stop)>0?stop:addDays(cursor,duration);
        const lotId=`demo-lot-${String(herd.route[index%herd.route.length]).padStart(2,'0')}`;
        if(cmp(cursor,DEMO_TODAY)<=0){
          const open=cmp(theoreticalEnd,addDays(DEMO_TODAY,1))>0;
          rows.push({
            id:`period-${herd.id}-${index}`,lotId,herdId:herd.id,herdCode:herd.code,category:herd.category,heads:herd.heads,
            startDate:cursor,endDateExclusive:open?null:theoreticalEnd,status:'real',source:'demo_synthetic',
            notes:'Ocupación real ficticia generada para la demostración.',dataOrigin:DATA_ORIGIN
          });
          const plannedStart=addDays(cursor,(index+herdIndex)%4===0?-1:0);
          rows.push({
            id:`plan-${herd.id}-${index}`,lotId,herdId:herd.id,herdCode:herd.code,category:herd.category,heads:herd.heads,
            startDate:plannedStart,endDateExclusive:addDays(plannedStart,duration+((index+herdIndex)%5===0?1:0)),status:'planificado',source:'demo_synthetic',
            notes:'Plan ficticio usado para comparar planificación y ejecución.',dataOrigin:DATA_ORIGIN
          });
        }else{
          rows.push({
            id:`plan-${herd.id}-${index}`,lotId,herdId:herd.id,herdCode:herd.code,category:herd.category,heads:herd.heads,
            startDate:cursor,endDateExclusive:theoreticalEnd,status:'planificado',source:'demo_synthetic',
            notes:'Plan futuro ficticio.',dataOrigin:DATA_ORIGIN
          });
        }
        cursor=theoreticalEnd;
        index++;
      }
    });

    // Caso deliberado para probar una función importante: dos rodeos pueden
    // compartir un mismo lote sin sobrescribirse.
    const anchor=rows.find(period=>period.status==='real'&&period.herdId==='demo-herd-01'&&period.startDate<=DEMO_TODAY&&(!period.endDateExclusive||period.endDateExclusive>DEMO_TODAY));
    const companion=rows.find(period=>period.status==='real'&&period.herdId==='demo-herd-06'&&period.startDate<=DEMO_TODAY&&(!period.endDateExclusive||period.endDateExclusive>DEMO_TODAY));
    if(anchor&&companion)companion.lotId=anchor.lotId;
    return rows;
  }

  const periods=generatePeriods();

  const activeRealByLot = new Map();
  const completedRealByLot = new Map();
  for(const period of periods){
    if(period.status!=='real')continue;
    if(period.startDate<=DEMO_TODAY&&(!period.endDateExclusive||period.endDateExclusive>DEMO_TODAY)){
      if(!activeRealByLot.has(period.lotId))activeRealByLot.set(period.lotId,[]);
      activeRealByLot.get(period.lotId).push(period);
    }else if(period.endDateExclusive&&period.endDateExclusive<=addDays(DEMO_TODAY,1)){
      const previous=completedRealByLot.get(period.lotId);
      if(!previous||period.endDateExclusive>previous.endDateExclusive)completedRealByLot.set(period.lotId,period);
    }
  }

  const cropExamples = ['Soja','Maíz grano','Trigo','Girasol','Pastura consociada','Alfalfa'];
  const qualityCycle = ['excelente','muy_bueno','bueno','regular','bueno','muy_bueno'];

  function appEventType(event){
    if(event.type==='servicio'&&norm(event.title).includes('fin'))return 'Fin servicio';
    return eventTypes.find(type=>type.id===event.type)?.appType||'Otro';
  }

  function eventForLot(event,lot){
    const herd=event.type==='servicio'?herds.find(item=>item.id==='demo-herd-02'):null;
    return {
      id:`${event.id}-${lot.id}`,
      date:event.date,
      type:appEventType(event),
      title:event.title,
      notes:event.notes,
      done:event.date<DEMO_TODAY,
      createdAt:`${event.date}T12:00:00.000Z`,
      createdBy:'Equipo Demo',
      updatedAt:`${event.date}T12:00:00.000Z`,
      meta:{
        eventType:eventTypes.find(type=>type.id===event.type)?.label||event.type,
        eventStyle:event.type,
        rodeo:herd?.code||'',
        category:herd?.category||'',
        synthetic:true,
        dataOrigin:DATA_ORIGIN
      }
    };
  }

  const lots = baseLots.map(base=>{
    const active=activeRealByLot.get(base.id)||[];
    const last=completedRealByLot.get(base.id)||null;
    const [cx,cy]=centroid(base.points);
    const cropName=cropExamples[(base.number-1)%cropExamples.length];
    const agricultural=!active.length&&[4,10,16,22].includes(base.number);
    const regeneration=!active.length&&!agricultural&&[6,18].includes(base.number);
    const use=active.length?'ganaderia':agricultural?'agricultura':regeneration?'regeneracion':'descanso';
    const primary=active[0]||null;
    const applies=events.filter(event=>event.lots.length===0||event.lots.includes(base.number));
    const hasWater=[1,2,7,8,9,13,16,17,20,21,22,23].includes(base.number);
    return {
      ...base,
      x:round(cx,2),y:round(cy,2),
      polygon:base.points.map(toPercentPoint),
      xPercent:round(cx/MAP_SPACE.width*100,3),yPercent:round(cy/MAP_SPACE.height*100,3),
      areaGroup:base.sector,use,
      cattle:{
        category:primary?.category||'',rodeo:primary?.herdCode||'',heads:primary?.heads||'',entryDate:primary?.startDate||'',
        lastExit:primary?'':last?.endDateExclusive||'',avgWeightKg:primary?round(245+base.number*2.4,1):''
      },
      crop:{
        current:agricultural?cropName:regeneration?'Regeneración natural':'',
        sownDate:agricultural?'2026-05-18':regeneration?'2026-04-05':'',
        previous:agricultural?cropExamples[(base.number+1)%cropExamples.length]:'',
        next:agricultural?'Verdeo de verano':'',
        nextTask:agricultural?'Monitorear lote':regeneration?'Revisar cobertura':'',
        nextTaskDate:agricultural?'2026-07-20':regeneration?'2026-07-18':''
      },
      resources:{water:hasWater?'Disponible':'A revisar',shade:base.number%3===0?'Buena':'Parcial',fence:'Operativo',access:base.number%5===0?'Revisar después de lluvia':'Bueno'},
      quality:{class:qualityCycle[(base.number-1)%qualityCycle.length],score:68+(base.number*7)%29,notes:'Evaluación demostrativa sin valor productivo real.'},
      history:{previousUse:agricultural?'Ganadería':'Ganadería',previousCrops:cropExamples[(base.number+2)%cropExamples.length],previousRodeo:last?.herdCode||'',lastSeason:'2025/2026',notes:'Antecedente sintético.'},
      regeneration:{startDate:regeneration?'2026-04-05':'',previousCrop:regeneration?'Maíz grano':'',notes:regeneration?'Descanso y recuperación demostrativos.':''},
      rotation:{restTargetDays:35+(base.number%4)*10},
      events:applies.map(event=>eventForLot(event,base)),
      notes:active.length>1?'Ejemplo sintético de ocupación simultánea por más de un rodeo.':'Datos completamente ficticios para demostrar el flujo de trabajo.',
      maxStayDays:12,
      dataOrigin:DATA_ORIGIN
    };
  });

  const appInfrastructure = infrastructure.map(item=>({
    id:item.id,name:item.name,code:item.code,
    type:item.type==='water'?'aguada':item.type,
    x:round(item.x/MAP_SPACE.width*100,3),y:round(item.y/MAP_SPACE.height*100,3),
    notes:item.notes,resources:{water:item.type==='water'?'Disponible':'',shade:'',fence:item.type==='corral'?'Corrales':'',access:'Bueno'}
  }));

  const appDefaults = {
    mapAsset:MAP_ASSET,
    geometryVersion:'agroplano-demo-geometry-v1',
    lots:lots.map(lot=>({
      id:lot.id,number:String(lot.number),name:lot.name,code:lot.code,x:lot.xPercent,y:lot.yPercent,areaHa:lot.areaHa,areaGroup:lot.areaGroup,
      use:lot.use,cattle:{...lot.cattle},crop:{...lot.crop},resources:{...lot.resources},quality:{...lot.quality},history:{...lot.history},
      regeneration:{...lot.regeneration},rotation:{...lot.rotation},events:lot.events.map(event=>({...event,meta:{...event.meta}})),notes:lot.notes,
      polygon:lot.polygon.map(point=>({...point}))
    })),
    infrastructure:appInfrastructure,
    herds:herds.map(({id,code,name,color,active})=>({id,code,name,color,active})),
    cattleCategories:categories.map(({id,name,active})=>({id,name,active})),
    cropCatalog:crops.map(({id,name,kind,active})=>({id,name,kind,active})),
    grazingPeriods:periods.map(period=>({...period,status:period.status==='real'?'real':'planificado',createdAt:`${period.startDate}T12:00:00.000Z`,createdBy:'Equipo Demo',updatedAt:`${period.startDate}T12:00:00.000Z`,updatedBy:'Equipo Demo'})),
    movements:[],
    settings:{
      cycleStart:'2025-07-14',cycleEnd:'2026-07-13',
      plannerStart:'2025-07-14',plannerEnd:'2026-07-13',plannerMonths:12,
      dashboardStart:'2025-07-14',dashboardEnd:'2026-07-13'
    }
  };

  return {
    meta:{
      farmName:'Campo Modelo · DEMO',productName:'AgroPlano',demoToday:DEMO_TODAY,dataOrigin:DATA_ORIGIN,
      generatorSeed:GENERATOR_SEED,privacyClass:'public_demo',schemaVersion:'agroplano-demo-v1',
      disclaimer:'Todos los datos y la geometría son sintéticos; no representan un establecimiento real.'
    },
    map:{asset:MAP_ASSET,coordinateSpace:{...MAP_SPACE},renderSize:{width:1480,height:962},orientation:'north-up',isSynthetic:true},
    lots,herds,categories,crops,eventTypes,events,infrastructure,periods,movements:[],appDefaults,
    helpers:{addDays,parse,iso,cmp,norm,toPercentPoint}
  };
})();
