/*
 * AgroPlano public demo · lightweight presentation-only internationalization.
 *
 * The operational state keeps its stable Spanish/domain values. This layer only
 * translates rendered text and accessibility attributes, so changing language
 * cannot rewrite catalogues, movements, imports, exports, or cloud data.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "agroplano_demo_language_v1";
  var DEFAULT_LOCALE = "en";
  var locale = readLocale();
  var observer = null;
  var originalText = new WeakMap();
  var translatedText = new WeakMap();
  var originalAttributes = new WeakMap();
  var translatedAttributes = new WeakMap();
  var observedAttributes = ["aria-label", "placeholder", "title", "alt"];

  var EN = Object.freeze({
    "AgroPlano Gestión Demo": "AgroPlano Management Demo",
    "AgroPlano Gestión · DEMO": "AgroPlano Management · DEMO",
    "AgroPlano Gestión · DEMO · v1.3.1": "AgroPlano Management · DEMO · v1.3.1",
    "DATOS FICTICIOS": "SYNTHETIC DATA",
    "NO USAR PARA OPERAR": "NOT FOR PRODUCTION USE",
    "v1.3.1 · DATOS FICTICIOS · NO USAR PARA OPERAR": "v1.3.1 · SYNTHETIC DATA · NOT FOR PRODUCTION USE",
    "Secciones principales": "Main sections",
    "Mapa": "Map",
    "Hacienda": "Livestock",
    "Rodeos": "Herds",
    "Pastoreo": "Grazing",
    "Ciclo anual": "Annual cycle",
    "Indicadores": "Dashboard",
    "Cultivos": "Crops",
    "Tabla": "Table",
    "Historial": "History",
    "Eventos": "Events",
    "Más ▾": "More ▾",
    "Guía de uso": "User guide",
    "Cómo usar AgroPlano": "How to use AgroPlano",
    "Categorías, rodeos y cultivos": "Categories, herds, and crops",
    "Exportar JSON": "Export JSON",
    "Importar JSON": "Import JSON",
    "CSV lotes": "Lots CSV",
    "CSV historial": "History CSV",
    "Importar CSV": "Import CSV",
    "Plantilla CSV": "CSV template",
    "Mover marcadores": "Move markers",
    "+ Lote": "+ Lot",
    "Agregar un lote al establecimiento": "Add a lot to the farm",
    "Cambiar fondo": "Change background",
    "Fondo original": "Original background",
    "Reset datos": "Reset data",
    "Buscar lote, código, cultivo, categoría, nota…": "Search lot, code, crop, category, note…",
    "Buscar lotes y registros": "Search lots and records",
    "Zoom mapa": "Map zoom",
    "Alejar el mapa": "Zoom map out",
    "Zoom del mapa": "Map zoom",
    "Acercar el mapa": "Zoom map in",
    "Ajustar": "Fit",
    "Ver el plano completo, tanto en ancho como en alto": "Fit the full map to width and height",
    "Volver al 100%": "Return to 100%",
    "Arrastrá para mover · Ctrl+rueda para zoom": "Drag to pan · Ctrl+wheel to zoom",
    "Usuario local": "Local user",
    "Usuario y permisos": "User and permissions",
    "guardado en este equipo": "saved on this device",
    "guardando…": "saving…",
    "Preparando…": "Preparing…",
    "Abrir estado de datos compartidos": "Open shared-data status",
    "Exportar respaldo JSON ahora": "Export a JSON backup now",
    "Cerrar ✕": "Close ✕",
    "Catálogos compartidos para todas las computadoras.": "Catalogues shared across all devices.",
    "Categorías": "Categories",
    "Cultivos": "Crops",
    "Antes de cambiar estos catálogos, todas las computadoras deben tener instalada esta versión o una posterior. Renombrar pide confirmación y actualiza las referencias vinculadas; desactivar conserva todo el historial.": "Before changing these catalogues, every device must have this version or a newer one. Renaming requires confirmation and updates linked references; deactivating preserves the full history.",
    "AgroPlano Gestión · Guía": "AgroPlano Management · Guide",
    "Esta instalación contiene únicamente un establecimiento, un plano y datos inventados.": "This installation contains only one farm, one map, and synthetic data.",
    "Sirve para probar el flujo completo sin exponer información de un campo real.": "It demonstrates representative public-edition workflows without exposing data from a real farm.",
    "El mapa": "The map",
    "Pasá el cursor sobre un lote para ver su situación. Hacé clic o tocá para abrir la ficha. Podés buscar, colorear por estado, hacienda, cultivo, agua, problemas, descanso o calidad, acercar, alejar, arrastrar y usar": "Hover over a lot to see its status. Click or tap to open its record. You can search, colour by status, livestock, crop, water, issues, rest, or quality, zoom, pan, and use",
    "para recuperar el plano completo.": "to restore the full map.",
    "Movimientos de hacienda": "Livestock movements",
    "Desde": "From",
    "o desde la ficha registrá entrada, salida/venta, traslado o mortandad. Una operación actualiza en conjunto el mapa, los rodeos, el Gantt, los indicadores y el historial. Si hay dos rodeos en un lote, elegí exactamente cuál querés mover o retirar.": "or the lot record, register an entry, exit/sale, transfer, or mortality. One operation updates the map, herds, Gantt, dashboard, and history together. If two herds share a lot, choose exactly which one to move or remove.",
    "Pastoreo e indicadores": "Grazing and dashboard",
    "permite ver hasta 366 días, alternar entre vista diaria y ajuste al ancho, ampliar, hacer zoom, ordenar y filtrar por rodeo, categoría o evento.": "shows up to 366 days, switches between a daily view and fit-to-width, expands, zooms, sorts, and filters by herd, category, or event.",
    "resume ocupación, descanso, cabeza-días, presión por hectárea, tendencias, prioridades, eventos y plan versus registros reales.": "summarises occupancy, rest, head-days, pressure per hectare, trends, priorities, events, and plan versus actual records.",
    "Cultivos, historial y eventos": "Crops, history, and events",
    "En": "In",
    "cargá siembra, antecesor y próxima labor.": "record planting, previous crop, and the next task.",
    "conserva eventos y movimientos; un Administrador puede anular una operación segura indicando motivo, sin borrarla.": "preserves events and movements; an Administrator can reverse an eligible operation with a reason, without deleting it.",
    "reúne tareas, responsables y vencimientos, permite confirmar lo realizado y ofrece un análisis por tipo, lote y responsable.": "brings together tasks, owners, and due dates, confirms completed work, and analyses activity by type, lot, and owner.",
    "Catálogos y respaldo": "Catalogues and backup",
    "Más → Categorías, rodeos y cultivos": "More → Categories, herds, and crops",
    "el Administrador puede agregar, renombrar, desactivar o reactivar opciones. Exportá JSON periódicamente como respaldo adicional y usá los CSV para análisis externo.": "an Administrator can add, rename, deactivate, or reactivate options. Export JSON periodically as an additional backup and use CSV files for external analysis.",
    "Usuarios": "Users",
    "En modo local la app funciona completa en una computadora. Al conectarla a un proyecto Supabase propio de AgroPlano, Administradores y Editores pueden modificar, los Lectores sólo consultar y los cambios se sincronizan entre equipos.": "Core public-edition workflows run locally on one device. When connected to a dedicated AgroPlano Supabase project, Administrators and Editors can make changes, Viewers can only read, and changes sync across devices.",
    "Importante": "Important",
    "Todo lo precargado es ficticio y está marcado como demostración. Los indicadores ayudan a priorizar revisiones; no reemplazan la observación del potrero ni una recomendación agronómica o veterinaria.": "All preloaded content is synthetic and clearly marked as a demo. Indicators help prioritise reviews; they do not replace field observation or agronomic or veterinary advice.",

    "Lotes": "Lots",
    "Ocupados": "Occupied",
    "Pronto disp.": "Target met",
    "Descansando": "Resting",
    "Cultivo": "Crop",
    "Regeneración": "Regeneration",
    "Cabezas": "Heads",
    "Hectáreas": "Hectares",
    "Próx. 30 días": "Next 30 days",
    "Días ocup. ciclo": "Occupied days",
    "Ocupado": "Occupied",
    "Objetivo de descanso alcanzado": "Rest target reached",
    "Sin manejo": "Unmanaged",
    "Pintar por": "Colour by",
    "Qué hay ahora": "Current content",
    "Estado": "Status",
    "Uso": "Use",
    "Agri/Ganadería": "Crop/Livestock",
    "Aguadas": "Water points",
    "Problemas": "Issues",
    "Días descanso": "Rest days",
    "Ocupación anual": "Annual occupancy",
    "Calidad": "Quality",
    "Resaltar": "Highlight",
    "Todos": "All",
    "Todas": "All",
    "Descanso": "Rest",
    "Ganadería": "Livestock",
    "Agricultura": "Agriculture",
    "Mixto": "Mixed",
    "Infraestructura": "Infrastructure",
    "Sin calidad": "No quality data",
    "Excelente": "Excellent",
    "Muy bueno": "Very good",
    "Bueno": "Good",
    "Regular": "Fair",
    "Bajo": "Low",
    "Problema": "Issue",
    "Aguada operativa": "Operational water point",
    "Revisar": "Review",
    "Operativo": "Operational",
    "Disponible": "Available",
    "Camino interno": "Internal road",
    "Corrales": "Corrals",
    "Operaciones": "Operations",
    "Área": "Area",
    "Lote": "Lot",
    "Ref.": "Ref.",
    "Hay ahora": "Current content",
    "Categoría visual": "Visual category",
    "Antes": "Previous",
    "Próximo": "Next",
    "Ver en mapa": "View on map",
    "Editar": "Edit",
    "Filtrar": "Filter",
    "Limpiar": "Clear",
    "Buscar": "Search",
    "Elegir": "Select",
    "Elegir lote": "Select lot",
    "Elegir categoría": "Select category",
    "Elegir rodeo": "Select herd",
    "Elegir cultivo": "Select crop",
    "Acción": "Action",
    "Registrar": "Record",
    "Cargar": "Save",
    "Fecha": "Date",
    "Nota": "Note",
    "Código": "Code",
    "Superficie": "Area",
    "Recursos": "Resources",
    "Acciones": "Actions",
    "Quitar": "Remove",
    "Quitar filtro": "Remove filter",
    "Uso ant.": "Previous use",
    "Acceso": "Access",
    "Sombra": "Shade",
    "Rodeo asociado": "Associated herd",
    "dd/mm/aaaa": "mm/dd/yyyy",
    "Tipo": "Type",
    "Responsable": "Owner",
    "Registró": "Recorded by",
    "Planificado": "Planned",
    "Realizado": "Completed",
    "Realizada": "Completed",
    "Registrar venta": "Record sale",
    "Modo de eventos": "Event view",
    "Anulado": "Reversed",
    "Pendientes": "Pending",
    "Análisis": "Analysis",
    "Vencidos": "Overdue",
    "confirmados": "confirmed",
    "sin confirmar": "unconfirmed",
    "Hoy": "Today",
    "Próximos 7 días": "Next 7 days",
    "Próximos 14 días": "Next 14 days",
    "Próximos 30 días": "Next 30 days",
    "incluye hoy": "includes today",
    "ventana operativa": "operational window",
    "para organizar": "for planning",
    "Realizados": "Completed",
    "Cumplimiento verificable": "Verifiable completion",
    "Cobertura cab.": "Headcount coverage",
    "Coincidencia": "Match",
    "Real sin plan": "Actual without plan",
    "combinaciones": "combinations",
    "cabezas s/d": "headcount unavailable",
    "Revisar remanente, agua y condición; los días solos no prueban sobrepastoreo.": "Check residual forage, water, and condition; days alone do not prove overgrazing.",
    "La ausencia de registro no demuestra que no ocurrió: abrir el Gantt y conciliar plan versus ejecución.": "A missing record does not prove the work did not occur: open the Gantt and reconcile the plan with actual execution.",

    "Vista operativa por categoría, rodeo, cabezas, entrada, salida y descanso.": "Operational view by category, herd, headcount, entry, exit, and rest.",
    "Cabezas totales": "Total heads",
    "según lotes filtrados": "across filtered lots",
    "Lotes ocupados": "Occupied lots",
    "con cabezas actuales": "with current livestock",
    "ternero, vaca, vaquillona, etc.": "calves, cows, heifers, etc.",
    "identificados": "identified",
    "Registrar movimientos y bajas de hacienda": "Record livestock movements and reductions",
    "Entradas, traslados, ventas realizadas y mortandad": "Entries, transfers, completed sales, and mortality",
    "Entró hacienda": "Livestock entered",
    "Salió un rodeo": "A herd exited",
    "Mover un rodeo": "Move a herd",
    "Venta realizada": "Completed sale",
    "Mortandad": "Mortality",
    "Lote destino": "Destination lot",
    "Lote origen": "Origin lot",
    "Rodeo a mover / retirar": "Herd to move / remove",
    "Sin rodeo elegido": "No herd selected",
    "Destino": "Destination",
    "Categoría": "Category",
    "Rodeo": "Herd",
    "Cabezas a descontar": "Heads to remove",
    "Comprador (opcional)": "Buyer (optional)",
    "Destino (opcional)": "Destination (optional)",
    "Referencia DT-e (opcional)": "DT-e reference (optional)",
    "Nota / causa (opcional)": "Note / cause (optional)",
    "Fecha efectiva": "Effective date",
    "Entrada": "Entry",
    "Última salida": "Last exit",
    "Cultivo gan/agr": "Crop type",
    "Sin hacienda": "No livestock",
    "Sin cultivo": "No crop",
    "Cultivo agricultura": "Arable crop",
    "Cultivo ganadería": "Forage crop",
    "Cultivo mixto": "Mixed crop",
    "histórico": "historical",
    "Anterior: —": "Previous: —",
    "Sombra: —": "Shade: —",
    "Deslizá horizontalmente dentro de la tabla para ver las columnas secundarias.": "Scroll horizontally inside the table to see secondary columns.",

    "Ubicación actual y recorrido cronológico desde los períodos reales.": "Current location and chronological route from actual periods.",
    "Cabezas actuales": "Current heads",
    "en ocupaciones abiertas": "in open occupancies",
    "actuales e históricos": "current and historical",
    "Lotes actuales": "Current lots",
    "sin duplicar salidas": "without duplicate exits",
    "Pasadas": "Past visits",
    "períodos reales": "actual periods",
    "Registrar evento ganadero": "Record livestock event",
    "Sanidad, tacto, servicio, pesada y otros": "Health, pregnancy check, breeding, weighing, and others",
    "Lote / área": "Lot / area",
    "General del lote": "General lot event",
    "Evento": "Event",
    "Comienzo de parición": "Calving start",
    "Revisión de toros": "Bull inspection",
    "Destete": "Weaning",
    "Vacunación obligatoria": "Required vaccination",
    "Yerra": "Branding",
    "Inicio servicio": "Breeding start",
    "Fin servicio": "Breeding end",
    "Venta": "Sale",
    "Encierre de terminación": "Finishing confinement",
    "Tacto": "Pregnancy check",
    "Pesada": "Weighing",
    "Sanidad / tratamiento": "Health / treatment",
    "Revisión de agua": "Water inspection",
    "Revisión de alambrado": "Fence inspection",
    "El recorrido se ordena por fecha. Un lote liberado queda en el historial, pero deja de figurar como ubicación actual.": "The route is ordered by date. A released lot remains in history but is no longer shown as a current location.",
    "Pasó por": "Visited",
    "Encierres": "Confinements",
    "recorrido cronológico": "chronological route",
    "Ubicar": "Locate",
    "Traer…": "Move here…",
    "Deslizá horizontalmente dentro de la tabla para ver el recorrido y columnas secundarias.": "Scroll horizontally inside the table to see the route and secondary columns.",

    "Pastoreo · vista de decisión": "Grazing · decision view",
    "Qué lote estuvo ocupado, cuándo y durante cuánto tiempo. Los KPIs usan ocupación real; el Gantt también muestra el plan.": "Which lot was occupied, when, and for how long. KPIs use actual occupancy; the Gantt also shows the plan.",
    "filas visibles": "visible rows",
    "Ampliar Gantt": "Expand Gantt",
    "Ver análisis completo": "View full analysis",
    "Lotes con ocupación real en el plazo": "Lots with actual occupancy in range",
    "Ocupados hoy": "Occupied today",
    "Objetivo guardado por lote · 45 días por defecto": "Target saved by lot · 45 days by default",
    "A revisar en el plazo": "Needs review in range",
    "← Anterior": "← Previous",
    "Hasta inclusive": "Through",
    "Rango rápido": "Quick range",
    "Personalizado": "Custom",
    "Visualización": "View",
    "Diario · desplazar": "Daily · scroll",
    "Ajustar al ancho": "Fit to width",
    "Evento rápido": "Quick event",
    "Todos los eventos": "All events",
    "Servicio": "Breeding",
    "Vacunación": "Vaccination",
    "Parición": "Calving",
    "Zoom Gantt": "Gantt zoom",
    "Aplicar plazo": "Apply range",
    "Filtros y opciones de visualización": "Filters and view options",
    "Buscar lote": "Search lot",
    "Filas": "Rows",
    "Con actividad en el plazo": "With activity in range",
    "Todos los lotes": "All lots",
    "Descanso vs objetivo": "Rest vs target",
    "Ocupados ahora": "Currently occupied",
    "Objetivo alcanzado": "Target reached",
    "Cerca del objetivo": "Near target",
    "En descanso bajo objetivo": "Resting below target",
    "Sin dato actual": "No current data",
    "Orden": "Sort",
    "Prioridad operativa": "Operational priority",
    "Número de lote": "Lot number",
    "Código / planilla": "Code / record",
    "Ocupación actual": "Current occupancy",
    "Días en el plazo": "Days in range",
    "Última ocupación": "Last occupancy",
    "Primer evento visible": "First visible event",
    "Dirección": "Direction",
    "Recomendada": "Recommended",
    "Ascendente ↑": "Ascending ↑",
    "Descendente ↓": "Descending ↓",
    "Columnas de eventos": "Event columns",
    "Mostrar": "Show",
    "Ocultar": "Hide",
    "Plan / real": "Plan / actual",
    "Ambos": "Both",
    "Real": "Actual",
    "Siguiente →": "Next →",
    "Últimos 12 meses": "Last 12 months",
    "Hoy + 3 meses": "Today + 3 months",
    "CSV pastoreo": "Grazing CSV",
    "Mostrando": "Showing",
    "▾ Referencias de colores · rodeos y eventos": "▾ Colour key · herds and events",
    "Rayado = planificado": "Hatched = planned",
    "Borde rojo = revisar": "Red border = review",
    "Eventos · clic para filtrar": "Events · click to filter",
    "La columna vertical marca el día completo.": "The vertical column marks the full day.",
    "Lote · código": "Lot · code",

    "Días de ocupación por lote, descanso actual, regeneración, encierres y mortandades.": "Occupied days by lot, current rest, regeneration, confinements, and mortality.",
    "Inicio ciclo": "Cycle start",
    "Fin ciclo": "Cycle end",
    "Aplicar ciclo": "Apply cycle",
    "Días ocupación": "Occupied days",
    "suma lote-ciclo": "sum of lot-days",
    "Lotes en descanso": "Resting lots",
    "con última salida": "with a last exit",
    "vienen de agricultura": "coming from agriculture",
    "cabezas registradas": "recorded heads",
    "Ocupación ciclo": "Cycle occupancy",
    "Descanso actual": "Current rest",
    "Cultivo/antecesor": "Crop/previous",
    "ocupación en el ciclo": "occupancy in cycle",
    "descanso actual": "current rest",
    "— desde inicio": "— since start",
    "viene de Agricultura": "from Agriculture",

    "Tablero de control ganadero": "Livestock operations dashboard",
    "Ocupaciones actuales más largas, situación actual, prioridades, tendencias y análisis procesados a partir de los registros compartidos.": "Longest current occupancies, current situation, priorities, trends, and analysis computed from shared records.",
    "Abrir Gantt filtrado": "Open filtered Gantt",
    "Hasta": "To",
    "Comparar": "Compare",
    "Período anterior": "Previous period",
    "Sin comparación": "No comparison",
    "Actualizar": "Update",
    "Limpiar filtros": "Clear filters",
    "Viendo:": "Viewing:",
    "Todos los lotes · Todos los rodeos · Todas las categorías": "All lots · All herds · All categories",
    "Situación actual": "Current situation",
    "Inventario registrado ahora, respetando lote, rodeo y categoría elegidos.": "Inventory recorded now, respecting the selected lot, herd, and category.",
    "sin duplicar convivencia": "without double-counting shared lots",
    "Ha ocupadas": "Occupied ha",
    "superficie única actual": "unique current area",
    "Prioridades y oportunidades": "Priorities and opportunities",
    "Señales explicables para revisar hoy. No diagnostican estado del pasto sin una medición de campo.": "Explainable signals to review today. They do not diagnose pasture condition without field measurement.",
    "Abrir →": "Open →",
    "Días-lote ocupados": "Occupied lot-days",
    "días únicos, sin duplicar rodeos simultáneos": "unique days, without double-counting simultaneous herds",
    "Cabeza-días registrados": "Recorded head-days",
    "Presión acumulada registr.": "Recorded cumulative pressure",
    "Estadía media registrada": "Recorded average stay",
    "Lotes utilizados": "Lots used",
    "Registros y consistencia": "Records and consistency",
    "Evolución del período": "Trend over the period",
    "Bloques comparables dentro del plazo; línea punteada = período anterior de igual duración.": "Comparable blocks within the range; dotted line = previous period of equal duration.",
    "Cabezas registradas promedio por día": "Average recorded heads per day",
    "Suma de cabezas-días del bloque dividida por sus días. Depende de la cobertura de cabezas.": "The block's head-days divided by its days. Depends on headcount coverage.",
    "Período elegido": "Selected period",
    "Lotes ocupados promedio por día": "Average occupied lots per day",
    "Días-lote del bloque divididos por sus días. Un lote con dos rodeos cuenta una vez.": "The block's lot-days divided by its days. A lot with two herds counts once.",
    "Mapa temporal de ocupación y descanso": "Occupancy and rest heatmap",
    "Cada celda indica cuántos días estuvo ocupado el lote dentro del bloque.": "Each cell shows how many days the lot was occupied within the block.",
    "Ver en Gantt": "View in Gantt",
    "Descanso o sin ocupación registrada": "Rest or no recorded occupancy",
    "Parte ocupada del bloque": "Occupied portion of block",
    "Clic para aislar un lote": "Click to isolate a lot",
    "Descanso histórico entre visitas": "Historical rest between visits",
    "Entradas del plazo comparadas con el objetivo calendario guardado por lote.": "Entries in range compared with the calendar target saved for each lot.",
    "alcanzaron objetivo": "reached target",
    "Eventos ganaderos del plazo": "Livestock events in range",
    "Servicio, vacunación, parición, yerra, tacto y venta.": "Breeding, vaccination, calving, branding, pregnancy checks, and sales.",
    "En el plazo": "In range",
    "Pasados sin marcar": "Past and unconfirmed",
    "“Pasado sin marcar” significa que falta confirmar el registro; no afirma que la tarea no se haya realizado.": "“Past and unconfirmed” means the record still needs confirmation; it does not claim the task was not completed.",
    "Control de consistencia": "Consistency check",
    "Compara inventario, ocupaciones abiertas y bajas registradas.": "Compares inventory, open occupancies, and recorded reductions.",
    "Sin diferencias": "No differences",
    "✓ Inventario consistente": "✓ Inventory consistent",
    "Las ocupaciones abiertas, la ficha de Hacienda y los descuentos registrados coinciden.": "Open occupancies, the Livestock record, and recorded reductions agree.",
    "Análisis detallado del período": "Detailed period analysis",
    "Abrir rankings, categorías, plan y recorrido": "Open rankings, categories, plan, and route",
    "Permanencias actuales por rodeo": "Current stays by herd",
    "Cada rodeo se muestra por separado cuando conviven en un lote.": "Each herd is shown separately when multiple herds share a lot.",
    "Días ocupados por lote": "Occupied days by lot",
    "Días únicos dentro del rango y filtro.": "Unique days within the selected range and filter.",

    "Vista agrícola: cultivo actual, antecesor, próximo cultivo/labor, calidad y recursos.": "Crop view: current crop, previous crop, next crop/task, quality, and resources.",
    "Lotes agrícolas": "Crop lots",
    "con cultivo actual": "with a current crop",
    "Cultivos distintos": "Distinct crops",
    "según lote": "by lot",
    "Labores próximas": "Upcoming tasks",
    "cargadas": "recorded",
    "Calidades": "Quality classes",
    "clases usadas": "classes used",
    "Cargar cultivo desde planilla": "Record crop from table",
    "Para cargar soja, trigo, verdeo u otro cultivo sin ir al mapa lote por lote.": "Record soy, wheat, forage, or another crop without opening each lot on the map.",
    "Cultivo actual": "Current crop",
    "Siguiente / labor": "Next / task",
    "Antecesor / labor": "Previous crop / task",
    "Antecesor opcional": "Optional previous crop",

    "Rodeo / categoría": "Herd / category",
    "Movimiento": "Movement",
    "Movimiento de hacienda": "Livestock movement",
    "Movimientos de hacienda": "Livestock movements",
    "Un Administrador puede anular el último movimiento relacionado. El registro no se borra: queda marcado para auditoría.": "An Administrator can reverse the latest related movement. The record is not deleted; it remains marked for audit.",
    "No hay movimientos para este filtro.": "No movements match this filter.",
    "Registro detallado": "Detailed record",
    "Registro sintético de demostración": "Synthetic demo record",
    "Vacunación planificada": "Planned vaccination",
    "Vacunación general": "General vaccination",
    "Venta programada": "Planned sale",
    "Vacunación de otoño": "Autumn vaccination",
    "Yerra anual": "Annual branding",
    "Tacto de vientres": "Pregnancy check",
    "Fin de servicio": "Breeding end",
    "Venta de terminación": "Finishing sale",
    "Control de servicio": "Breeding check",
    "Inicio de servicio": "Breeding start",
    "Vacunación de terneros": "Calf vaccination",
    "Control de parición": "Calving check",
    "Inicio de parición": "Calving start",
    "Vacunación reproductiva": "Reproductive vaccination",
    "Tacto planificado": "Planned pregnancy check",
    "Inicio de servicio planificado": "Planned breeding start",
    "Inicio de parición planificado": "Planned calving start",

    "Planificación, hechos realizados y análisis operativo en un solo lugar.": "Planning, completed work, and operational analysis in one place.",
    "Lote / área": "Lot / area",
    "Tipo / rodeo": "Type / herd",
    "Estado / plazo": "Status / due",
    "Labor agrícola": "Crop task",
    "Rotación": "Rotation",
    "Objetivo calendario de descanso": "Calendar rest target",
    "Revisar cobertura": "Review cover",
    "Monitorear lote": "Monitor lot",
    "Gantt": "Gantt",
    "Marcar realizada": "Mark completed",

    "Enero": "January",
    "Febrero": "February",
    "Marzo": "March",
    "Abril": "April",
    "Mayo": "May",
    "Junio": "June",
    "Julio": "July",
    "Agosto": "August",
    "Septiembre": "September",
    "Octubre": "October",
    "Noviembre": "November",
    "Diciembre": "December",

    "Datos compartidos": "Shared data",
    "Solo en este equipo": "On this device only",
    "La nube todavía no está configurada.": "Cloud sync is not configured yet.",
    "Ahora funciona sólo en este equipo.": "It currently runs only on this device.",
    "Para compartir entre computadoras, configurá Supabase en app/config.js y ejecutá la migración SQL. No pegues una clave service_role.": "To share across devices, configure Supabase in app/config.js and run the SQL migration. Never paste a service_role key.",
    "Abrir puesta en marcha": "Open setup guide",
    "Correo": "Email",
    "Contraseña": "Password",
    "Tu contraseña": "Your password",
    "Ingresar": "Sign in",
    "Enviar enlace por correo": "Email a sign-in link",
    "Sólo pueden ingresar cuentas creadas por la empresa. El enlace por correo no crea usuarios nuevos.": "Only accounts created by the organisation can sign in. The email link does not create new users.",
    "Primera configuración": "First-time setup",
    "Nombre": "Name",
    "Crear base compartida": "Create shared database",
    "Salir": "Sign out",
    "Establecimiento": "Farm",
    "Permiso": "Permission",
    "Versión": "Version",
    "Sin correo": "No email",
    "Sincronizar ahora": "Sync now",
    "Instalar en esta computadora": "Install on this device",
    "Administrar usuarios": "Manage users",
    "Correo ya creado": "Existing account email",
    "Solo lectura": "View only",
    "Administrador": "Administrator",
    "Editor": "Editor",
    "Agregar o cambiar permiso": "Add or change permission",
    "Configuración inicial": "Initial setup",
    "Sin rol": "No role",
    "Acceso retirado": "Access removed",
    "Conexión inestable": "Unstable connection",
    "Sin internet": "Offline",
    "No se pudo actualizar": "Could not update",
    "Conectando…": "Connecting…",
    "Ingresando…": "Signing in…",
    "Revisá tu correo": "Check your email",
    "Creando base compartida…": "Creating shared database…",
    "Guardando en la nube…": "Saving to cloud…",
    "Cambio pendiente…": "Pending change…",
    "Necesita atención": "Needs attention",
    "Nube no disponible": "Cloud unavailable",
    "⚠ Sin respaldo · exportar JSON": "⚠ No backup · export JSON",

    "Status de sincronización: Solo en este equipo": "Sync status: On this device only",
    "Estado de sincronización: Solo en este equipo": "Sync status: On this device only",
    "Estado de sincronización": "Sync status",
    "Plano agropecuario ficticio de demostración": "Synthetic farm map for demonstration",
    "Configurá la nube para compartir entre computadoras.": "Configure cloud sync to share across devices.",
    "Plano interactivo. Arrastrá para mover; usá más, menos o Ajustar para cambiar el zoom. Con teclado usá más, menos, cero y flechas.": "Interactive map. Drag to pan; use plus, minus, or Fit to change zoom. With a keyboard, use plus, minus, zero, and the arrow keys.",
    "Manga y corrales": "Handling yard and corrals",
    "Área operativa ficticia para movimientos, sanidad y carga.": "Synthetic operational area for movements, health work, and loading.",
    "Infraestructura ficticia.": "Synthetic infrastructure.",
    "área operativa para hacienda y eventos": "operational area for livestock and events",
    "Galpón demo": "Demo shed",
    "Manga Central": "Central handling yard",
    "Aguada A": "Water point A",
    "Aguada B": "Water point B",
    "Aguada C": "Water point C",
    "Aguada D": "Water point D",
    "Punto de agua ficticio.": "Synthetic water point.",

    "Entrada: elegí lote, categoría/rodeo, cabezas y fecha.": "Entry: select a lot, category/herd, headcount, and date.",
    "Un lote puede contener varios rodeos. Elegí": "A lot can contain several herds. Select",
    "el rodeo exacto": "the exact herd",
    ": los demás permanecen intactos. Una": ": the others remain unchanged. A",
    "o una": "or a",
    "descuenta cabezas; una venta futura se planifica en Eventos y no cambia existencias hasta confirmarla. La referencia DT-e es solo informativa: esta app no emite ni reemplaza el documento oficial.": "removes heads; a future sale is planned in Events and does not change inventory until it is confirmed. The DT-e reference is informational only: this app neither issues nor replaces the official document.",
    "nombre o razón social": "name or legal name",
    "establecimiento / frigorífico": "farm / processing plant",
    "número o referencia": "number or reference",
    "observación de la operación": "operation note",
    "cantidad": "quantity",
    "cantidad vendida / muerta": "heads sold / lost",
    "Mostrar todos en esta planilla": "Show all in this table",
    "Filtrar planilla por": "Filter table by",

    "Entradas, salidas, traslados y mortandad se cargan desde": "Entries, exits, transfers, and mortality are recorded from",
    "o la ficha del lote porque modifican el estado actual.": "or the lot record because they change current state.",

    "KPIs e insights globales; los filtros siguientes afectan el Gantt y la tabla. Una permanencia larga no implica por sí sola sobrepastoreo: confirmá forraje, agua y condición antes de mover hacienda.": "Global KPIs and insights; the filters below affect the Gantt and table. A long stay does not by itself imply overgrazing: check forage, water, and condition before moving livestock.",
    "Incluye solapes, validaciones pendientes o datos esenciales faltantes.": "Includes overlaps, pending validations, or missing essential data.",
    "Vista diaria: desplazá horizontalmente y pasá el cursor por cualquier bloque ocupado para ver el detalle.": "Daily view: scroll horizontally and hover over any occupied block to see details.",
    "Vista general ajustada: la identificación ocupa una sola columna y el Gantt usa el resto del ancho. Pasá el cursor por una ocupación para ver fechas, días, categoría, rodeo y cabezas.": "Fit overview: identification uses one column and the Gantt uses the remaining width. Hover over an occupancy to see dates, days, category, herd, and headcount.",
    "Agregar o editar un período": "Add or edit a period",
    "Plegado para que la visualización sea la protagonista": "Collapsed to keep the visualisation in focus",
    "Agregar período": "Add period",
    "“Hasta” incluye ese día. Pueden convivir varios rodeos distintos en el mismo lote; el mismo rodeo no puede duplicarse ni estar en dos lotes. Un plan siempre necesita fecha final.": "“Through” includes that day. Several different herds can share one lot; the same herd cannot be duplicated or occupy two lots. A plan always needs an end date.",
    "Registros exactos del plazo": "Exact records in range",
    "Días en rango": "Days in range",
    "Duración": "Duration",
    "En curso": "Ongoing",
    "Ocupación real ficticia generada para la demostración.": "Synthetic actual occupancy generated for the demo.",
    "Plan ficticio usado para comparar planificación y ejecución.": "Synthetic plan used to compare planning and execution.",
    "En Diario · desplazar también cambia el ancho de cada día": "In Daily · scroll, this also changes each day's width",
    "Mostrar solamente Servicio": "Show Breeding only",
    "Mostrar solamente Vacunación": "Show Vaccination only",
    "Mostrar solamente Parición": "Show Calving only",
    "Mostrar solamente Yerra": "Show Branding only",
    "Mostrar solamente Tacto": "Show Pregnancy check only",
    "Mostrar solamente Venta": "Show Sale only",
    "Número de lote, código de planilla, referencia de plano y hectáreas": "Lot number, record code, map reference, and hectares",
    "Zoom del Gantt": "Gantt zoom",
    "TÓ": "OB",
    "vacío = en curso": "blank = ongoing",
    "Ejemplo sintético de registro a revisar": "Synthetic example record to review",
    "Observación": "Note",
    "Cab.": "Heads",

    "Pensado para ciclos tipo 30/06/2026 a 30/06/2027. Los días de ocupación salen de entradas, salidas y movimientos registrados. Si todavía no hay historial estructurado, usa la entrada actual cargada en el lote.": "Designed for cycles such as 06/30/2026 to 06/30/2027. Occupied days come from recorded entries, exits, and movements. If structured history is not available yet, the current entry recorded for the lot is used.",

    "Las ocupaciones abiertas se cuentan sólo hasta hoy.": "Open occupancies are counted only through today.",
    "Esto no prueba que no se haya realizado: conviene confirmar o cerrar el registro.": "This does not prove it was not completed: confirm or close the record.",
    "Cabeza-días/ha con al menos 80% de cobertura. No equivale a capacidad de carga ni diagnostica sobrepastoreo.": "Head-days/ha with at least 80% coverage. This is not carrying capacity and does not diagnose overgrazing.",
    "Tiempo de cada categoría en cada lote": "Time spent by each category in each lot",
    "Días, participación, pasadas y cabeza-días. Categorías simultáneas se miden por separado.": "Days, share, visits, and head-days. Simultaneous categories are measured separately.",
    "% ocupación lote": "% lot occupancy",
    "Último día": "Last day",
    "Objetivo calendario; verificar siempre la condición del lote.": "Calendar target; always check lot condition.",
    "Coincidencia diaria por lote + rodeo, sólo hasta hoy.": "Daily match by lot + herd, only through today.",
    "Presión acumulada registrada": "Recorded cumulative pressure",
    "Recorrido por rodeo": "Route by herd",
    "Días únicos, cabeza-días y diversidad de lotes.": "Unique days, head-days, and lot diversity.",

    "próxima labor opcional": "optional next task",
    "Maíz grano": "Grain maize",
    "Sorgo granífero": "Grain sorghum",
    "Maíz para silo": "Silage maize",

    "El modo Pendientes muestra sólo planificados": "Pending mode shows planned items only",
    "evento, lote, nota…": "event, lot, note…"
  });

  var PATTERNS_EN = [
    [/^Estado de sincronización: (.+)$/u, "Sync status: $1"],
    [/^Status de sincronización: (.+)$/u, "Sync status: $1"],
    [/^Registrar venta: (.+)$/u, "Record sale: $1"],
    [/^Marcar realizada: (.+)$/u, "Mark completed: $1"],
    [/^Ver en mapa: (.+)$/u, "View on map: $1"],
    [/^Ver en Gantt: (.+)$/u, "View in Gantt: $1"],
    [/^Mostrando (\d+) de (\d+) lotes(.*)$/u, "Showing $1 of $2 lots$3"],
    [/^Uso ant\.: (.+)$/u, "Previous use: $1"],
    [/^Acceso: (.+)$/u, "Access: $1"],
    [/^Sombra: (.+)$/u, "Shade: $1"],
    [/^Rodeo asociado: (.+)$/u, "Associated herd: $1"],
    [/^libre desde (.+)$/u, "free since $1"],
    [/^Revisar ficha de recursos: (.+)$/u, "Review the resources record for $1"],
    [/^(.+?) lleva (\d+) días en Lote (.+)$/u, "$1 has occupied Lot $3 for $2 days"],
    [/^(\d+)% de días con todas las cabezas conocidas$/u, "$1% of days with complete headcount data"],
    [/^(\d+) ocupaciones sin dato$/u, "$1 occupancies without headcount data"],
    [/^(\d+) combinaciones$/u, "$1 combinations"],
    [/^(\d+) días planificados futuros todavía no evaluados\.$/u, "$1 future planned days have not been evaluated yet."],
    [/^(\d+) días planificados sin coincidencia real registrada$/u, "$1 planned days without a matching actual record"],
    [/^(.+?) · (.+?) · desde (.+)\. Revisar remanente, agua y condición; los días solos no prueban sobrepastoreo\.$/u, "$1 · $2 · since $3. Check residual forage, water, and condition; days alone do not prove overgrazing."],
    [/^Lote (\d+)$/u, "Lot $1"],
    [/^Lote (\d+)(\s*·.*)$/u, "Lot $1$2"],
    [/^Lote ([A-Za-z0-9-]+)$/u, "Lot $1"],
    [/^(\d+) lotes$/u, "$1 lots"],
    [/^(\d+) rodeos$/u, "$1 herds"],
    [/^(\d+) cabezas$/u, "$1 heads"],
    [/^(\d+(?:[.,]\d+)?) días$/u, "$1 days"],
    [/^En (\d+) d$/u, "In $1 d"],
    [/^Vencido hace (\d+) d$/u, "$1 d overdue"],
    [/^Última: (.+)$/u, "Last: $1"],
    [/^Último: (.+)$/u, "Last: $1"],
    [/^Siembra: (.+)$/u, "Planted: $1"],
    [/^Siembra (.+)$/u, "Planted $1"],
    [/^Ant\. (.+)$/u, "Prev. $1"],
    [/^ant\. (.+)$/u, "prev. $1"],
    [/\bant\. /gu, "prev. "],
    [/^Sig\. (.+)$/u, "Next $1"],
    [/^Rodeo: (.+)$/u, "Herd: $1"],
    [/^Uso: (.+)$/u, "Use: $1"],
    [/^Cultivo: (.+)$/u, "Crop: $1"],
    [/^Hacienda: (.+)$/u, "Livestock: $1"],
    [/^Regeneración: (.+)$/u, "Regeneration: $1"],
    [/^Respaldo: hace (\d+) días$/u, "Backup: $1 days ago"],
    [/^⚠ Respaldo: hace (\d+) días$/u, "⚠ Backup: $1 days ago"],
    [/^Próximo(?:s)? (\d+) días$/u, "Next $1 days"],
    [/^(\d+) d ocupación$/u, "$1 d occupied"],
    [/(\d+) d ocupado/gu, "$1 d occupied"],
    [/^(\d+) d descanso$/u, "$1 d rest"],
    [/(\d+) d ocupados/gu, "$1 occupied days"],
    [/^(\d+) cab\.$/u, "$1 heads"],
    [/^(\d+) cab\.(.*)$/u, "$1 heads$2"],
    [/(\d+(?:[.,]\d+)?) días-lote/gu, "$1 lot-days"],
    [/(\d+(?:[.,]\d+)?) días reales/gu, "$1 actual days"],
    [/(\d+(?:[.,]\d+)?) días ocupados/gu, "$1 occupied days"],
    [/(\d+(?:[.,]\d+)?) días planificados/gu, "$1 planned days"],
    [/(\d+(?:[.,]\d+)?) días configurados/gu, "$1 configured days"],
    [/(\d+(?:[.,]\d+)?) días calendario/gu, "$1 calendar days"],
    [/(\d+(?:[.,]\d+)?) días/gu, "$1 days"],
    [/(\d+(?:[.,]\d+)?) cab\./gu, "$1 heads"],
    [/(\d+) lotes/gu, "$1 lots"],
    [/(\d+) rodeos/gu, "$1 herds"],
    [/(\d+) períodos/gu, "$1 periods"],
    [/(\d+) registros/gu, "$1 records"],
    [/(\d+) eventos/gu, "$1 events"],
    [/(\d+) pasadas/gu, "$1 visits"],
    [/(\d+) lotes ocupados sin agua confirmada o con problema abierto/gu, "$1 occupied lots without confirmed water or with an open issue"],
    [/(\d+) lote ocupado sin agua confirmada o con problema abierto/gu, "$1 occupied lot without confirmed water or with an open issue"],
    [/(\d+)\/(\d+) descansos alcanzaron el objetivo calendario/gu, "$1/$2 rests reached the calendar target"],
    [/(\d+)\/(\d+) descansos alcanzaron objetivo/gu, "$1/$2 rests reached target"],
    [/Mediana: (\d+) días\. Cumplir días no garantiza disponibilidad de forraje\./gu, "Median: $1 days. Meeting the day count does not guarantee forage availability."],
    [/Mediana: (\d+) days\. Cumplir días no garantiza disponibilidad de forraje\./gu, "Median: $1 days. Meeting the day count does not guarantee forage availability."],
    [/Mediana: (\d+) days\. Cumplir days no garantiza disponibilidad de forraje\./gu, "Median: $1 days. Meeting the day count does not guarantee forage availability."],
    [/(\d+)% de días planificados transcurridos tienen coincidencia registrada/gu, "$1% of elapsed planned days have a recorded match"],
    [/(\d+)% datos/gu, "$1% data coverage"],
    [/\bSin real registrado\b/gu, "No actual record"],
    [/\bdesde (\d{2}\/\d{2}\/\d{4})\b/gu, "since $1"],
    [/\ben (\d+)d\b/gu, "in $1d"],
    [/\bLote (\d+) lleva (\d+) days ocupado\b/gu, "Lot $1 has been occupied for $2 days"],
    [/\bLote (\d+) fue uno de los más ocupados del plazo\b/gu, "Lot $1 was among the most occupied in the range"],
    [/\b(\d+) lots alcanzaron su descanso objetivo guardado\b/gu, "$1 lots reached their saved rest target"],
    [/\b(\d+) lots alcanzaron el objetivo calendario de descanso\b/gu, "$1 lots reached the calendar rest target"],
    [/\b(\d+) lots alcanzarán el objetivo dentro de (\d+) days\b/gu, "$1 lots will reach the target within $2 days"],
    [/\b(\d+) records del plazo necesitan revisión\b/gu, "$1 records in range need review"],
    [/\b(\d+) records requieren revisión\b/gu, "$1 records need review"]
  ];

  /*
   * Exact labels are also valid building blocks inside generated copy and ARIA
   * descriptions. Longest-first matching prevents a short label (for example
   * “Cultivo”) from consuming a richer phrase (“Sin cultivo”) too early.
   */
  var EN_FRAGMENTS = Object.keys(EN)
    .sort(function (a, b) { return b.length - a.length; })
    .map(function (source) { return [source, EN[source]]; });

  /*
   * These fragments cover composed text nodes such as
   * “Lote 4 · Descanso · Descansando”. They are deliberately presentation-only.
   */
  var FRAGMENTS_EN = [
    ["Objetivo de días de descanso alcanzado", "Rest-day target reached"],
    ["Objetivo de descanso alcanzado", "Rest target reached"],
    ["Objetivo calendario de descanso", "Calendar rest target"],
    ["Objetivo calendario", "Calendar target"],
    ["objetivo calendario", "calendar target"],
    ["objetivo previsto", "expected target"],
    ["alcanzaron su descanso objetivo guardado", "reached their saved rest target"],
    ["alcanzaron el objetivo calendario de descanso", "reached the calendar rest target"],
    ["alcanzarán el objetivo dentro de", "will reach the target within"],
    ["verificar disponibilidad de pasto antes de asignar", "check forage availability before assigning"],
    ["verificar siempre la condición del lote", "always check lot condition"],
    ["verificar condición", "check condition"],
    ["Es una de las rachas actuales más largas.", "This is one of the longest current stays."],
    ["Mayor descanso:", "Longest rest:"],
    ["Comparación:", "Comparison:"],
    ["Primero:", "First:"],
    ["Mediana:", "Median:"],
    ["objetivo", "target"],
    ["mayor", "longest"],
    ["Mayor", "Longest"],
    ["fue uno de los más ocupados del plazo", "was among the most occupied in the range"],
    ["no tuvieron ocupación real en el período transcurrido", "had no actual occupancy in the elapsed period"],
    ["necesitan revisión", "need review"],
    ["requieren revisión", "need review"],
    ["del universo no-infra transcurrido", "of elapsed non-infrastructure capacity"],
    ["Con actividad · todos los rodeos · todos los eventos", "With activity · all herds · all events"],
    ["Con actividad", "With activity"],
    ["todos los rodeos", "all herds"],
    ["todos los eventos", "all events"],
    ["todos los lotes", "all lots"],
    ["todos los lotes productivos", "all productive lots"],
    ["del plazo", "in range"],
    ["en el plazo", "in range"],
    ["En el plazo", "In range"],
    ["período transcurrido", "elapsed period"],
    ["período anterior", "previous period"],
    ["Período anterior", "Previous period"],
    ["período elegido", "selected period"],
    ["Período elegido", "Selected period"],
    ["períodos reales", "actual periods"],
    ["Períodos reales", "Actual periods"],
    ["plan versus ejecución", "plan versus execution"],
    ["Plan / real", "Plan / actual"],
    ["plan / real", "plan / actual"],
    ["planificación y ejecución", "planning and execution"],
    ["planificación", "planning"],
    ["Planificación", "Planning"],
    ["ocupación real", "actual occupancy"],
    ["Ocupación real", "Actual occupancy"],
    ["ocupaciones reales", "actual occupancies"],
    ["Ocupaciones reales", "Actual occupancies"],
    ["ocupaciones abiertas", "open occupancies"],
    ["Ocupaciones abiertas", "Open occupancies"],
    ["ocupación actual", "current occupancy"],
    ["Ocupación actual", "Current occupancy"],
    ["ocupación en el ciclo", "occupancy in cycle"],
    ["ocupación en el período", "occupancy in the period"],
    ["ocupación lote", "lot occupancy"],
    ["ocupación", "occupancy"],
    ["Ocupación", "Occupancy"],
    ["días-lote", "lot-days"],
    ["cabeza-días", "head-days"],
    ["Cabeza-días", "Head-days"],
    ["días únicos", "unique days"],
    ["Días únicos", "Unique days"],
    ["días configurados", "configured days"],
    ["días calendario", "calendar days"],
    ["días reales", "actual days"],
    ["días planificados", "planned days"],
    ["días ocupados", "occupied days"],
    ["Días ocupados", "Occupied days"],
    ["hasta hoy", "through today"],
    ["Hasta hoy", "Through today"],
    ["en curso", "ongoing"],
    ["En curso", "Ongoing"],
    ["desde salida", "since exit"],
    ["desde inicio", "since start"],
    ["Desde inicio", "Since start"],
    ["libre desde", "free since"],
    ["entrada actual", "current entry"],
    ["Entrada actual", "Current entry"],
    ["entrada", "entry"],
    ["Entrada", "Entry"],
    ["salidas", "exits"],
    ["Salidas", "Exits"],
    ["salida", "exit"],
    ["Salida", "Exit"],
    ["movimientos registrados", "recorded movements"],
    ["Movimientos registrados", "Recorded movements"],
    ["movimientos", "movements"],
    ["Movimientos", "Movements"],
    ["mismo rodeo", "same herd"],
    ["varios rodeos", "several herds"],
    ["rodeos simultáneos", "simultaneous herds"],
    ["simultáneos", "simultaneous"],
    ["sin rodeo", "no herd"],
    ["Sin rodeo", "No herd"],
    ["sin categoría", "no category"],
    ["Sin categoría", "No category"],
    ["sin cabezas", "no headcount"],
    ["Sin cabezas", "No headcount"],
    ["sin dato", "no data"],
    ["Sin dato", "No data"],
    ["sin datos", "no data"],
    ["Sin datos", "No data"],
    ["sin registro", "no record"],
    ["Sin registro", "No record"],
    ["sin confirmar", "unconfirmed"],
    ["Sin confirmar", "Unconfirmed"],
    ["sin plan", "without plan"],
    ["Sin plan", "Without plan"],
    ["sin comparación", "no comparison"],
    ["Sin comparación", "No comparison"],
    ["sin diferencias", "no differences"],
    ["Sin diferencias", "No differences"],
    ["sin agua", "without water"],
    ["Sin agua", "Without water"],
    ["sin fecha", "no date"],
    ["Sin fecha", "No date"],
    ["sin título", "untitled"],
    ["Sin título", "Untitled"],
    ["todos los", "all"],
    ["Todas las", "All"],
    ["todos", "all"],
    ["todas", "all"],
    ["Todos", "All"],
    ["Todas", "All"],

    ["Recría Norte", "North Backgrounding"],
    ["Vientres Delta", "Delta Breeding Cows"],
    ["Terneros Horizonte", "Horizon Calves"],
    ["Terminación Sur", "South Finishing"],
    ["Toros Órbita", "Orbit Bulls"],
    ["Vacas Umbral", "Threshold Cows"],
    ["Recría Faro", "Beacon Backgrounding"],
    ["Vientres Prisma", "Prism Breeding Cows"],
    ["Vaquillonas de reposición", "Replacement heifers"],
    ["Vacas con cría", "Cows with calves"],
    ["Vacas preñadas", "Pregnant cows"],
    ["Vacas vacías", "Open cows"],
    ["Recría liviana", "Light backgrounding"],
    ["Recría pesada", "Heavy backgrounding"],
    ["Terneras", "Female calves"],
    ["Novillos", "Steers"],
    ["Novillitos", "Steers"],
    ["Terneros", "Calves"],
    ["Toros", "Bulls"],

    ["Cultivo de cobertura", "Cover crop"],
    ["Pastura perenne", "Perennial pasture"],
    ["Pastura consociada", "Mixed pasture"],
    ["Verdeo de invierno", "Winter forage"],
    ["Verdeo de verano", "Summer forage"],
    ["Regeneración natural", "Natural regeneration"],
    ["Regeneración espontánea", "Natural regeneration"],
    ["Campo natural", "Native grassland"],
    ["Ryegrass anual", "Annual ryegrass"],
    ["Avena forrajera", "Forage oats"],
    ["Avena", "Oats"],
    ["Colza", "Canola"],
    ["Moha", "Foxtail millet"],
    ["Sorgo forrajero", "Forage sorghum"],
    ["Sorgo granífero", "Grain sorghum"],
    ["Maíz para silo", "Silage maize"],
    ["Maíz grano", "Grain maize"],
    ["Maíz", "Maize"],
    ["Soja", "Soybean"],
    ["Trigo", "Wheat"],
    ["Girasol", "Sunflower"],
    ["Cebada", "Barley"],
    ["Barbecho", "Fallow"],
    ["Raigrás", "Ryegrass"],
    ["Monte", "Tree cover"],
    ["Cañada", "Creek"],
    ["Brújula", "Compass"],

    ["Inicio de parición planificado", "Planned calving start"],
    ["Inicio de servicio planificado", "Planned breeding start"],
    ["Tacto planificado", "Planned pregnancy check"],
    ["Vacunación planificada", "Planned vaccination"],
    ["Comienzo de parición", "Calving start"],
    ["Inicio de parición", "Calving start"],
    ["Control de parición", "Calving check"],
    ["Vacunación obligatoria", "Required vaccination"],
    ["Vacunación reproductiva", "Reproductive vaccination"],
    ["Vacunación de terneros", "Calf vaccination"],
    ["Vacunación de otoño", "Autumn vaccination"],
    ["Vacunación general", "General vaccination"],
    ["Inicio de servicio", "Breeding start"],
    ["Fin de servicio", "Breeding end"],
    ["Control de servicio", "Breeding check"],
    ["Inicio servicio", "Breeding start"],
    ["Fin servicio", "Breeding end"],
    ["Tacto de vientres", "Pregnancy check"],
    ["Venta de terminación", "Finishing sale"],
    ["Venta programada", "Planned sale"],
    ["Yerra anual", "Annual branding"],
    ["Vacunación", "Vaccination"],
    ["Parición", "Calving"],
    ["Servicio", "Breeding"],
    ["Yerra", "Branding"],
    ["Tacto", "Pregnancy check"],

    ["Plano:", "Map:"],
    ["Planilla:", "Record:"],
    ["Superficie:", "Area:"],
    ["Número de lote", "Lot number"],
    ["código de planilla", "record code"],
    ["referencia de plano", "map reference"],
    ["plano o planilla", "map or record"],
    ["Plano", "Map"],
    ["planilla", "table"],
    ["Planilla", "Table"],
    ["superficie", "area"],
    ["Superficie", "Area"],
    ["hectáreas", "hectares"],
    ["Hectáreas", "Hectares"],

    ["de lotes usados por el filtro", "of lots used by the filter"],
    ["de todos los lotes productivos", "of all productive lots"],
    ["del lote seleccionado", "of the selected lot"],
    ["filtro actual", "current filter"],
    ["Filtro actual", "Current filter"],
    ["con filtros", "after filters"],
    ["según lotes filtrados", "across filtered lots"],
    ["con dato", "with data"],
    ["con cabezas actuales", "with current livestock"],
    ["con problema abierto", "with an open issue"],
    ["con todas las cabezas conocidas", "with all headcounts known"],
    ["con última salida", "with a last exit"],
    ["con cultivo actual", "with a current crop"],
    ["por categoría", "by category"],
    ["por rodeo", "by herd"],
    ["por lote", "by lot"],
    ["por tipo", "by type"],
    ["por responsable", "by owner"],
    ["por separado", "separately"],
    ["con", "with"],
    ["Con", "With"],
    ["abrir tabla", "open table"],
    ["en cada lote", "in each lot"],
    ["cada lote", "each lot"],
    ["cada rodeo", "each herd"],
    ["este lote", "this lot"],
    ["este filtro", "this filter"],
    ["este plazo", "this range"],
    ["este período", "this period"],
    ["del rango", "in range"],
    ["en el rango", "in range"],
    ["dentro del rango", "within the range"],
    ["en toda la base", "across the full dataset"],
    ["filas visibles", "visible rows"],
    ["filas", "rows"],
    ["Filas", "Rows"],
    ["visibles", "visible"],
    ["ajustado", "fit"],
    ["diario", "daily"],
    ["Diario", "Daily"],
    ["meses", "months"],
    ["mes", "month"],
    ["año", "year"],
    ["bloques", "blocks"],
    ["intervalos", "intervals"],
    ["solapes", "overlaps"],
    ["incompletos", "incomplete"],
    ["críticas", "critical"],
    ["para completar", "to complete"],
    ["tareas debidas", "due tasks"],
    ["faltan", "remaining"],
    ["Faltan", "Missing"],
    ["conocidas", "known"],
    ["actuales", "current"],
    ["Actuales", "Current"],
    ["históricos", "historical"],
    ["Históricos", "Historical"],
    ["transcurrido", "elapsed"],
    ["futuros", "future"],
    ["todavía", "still"],
    ["Todavía", "Not yet"],
    ["registrada", "recorded"],
    ["registradas", "recorded"],
    ["registrado", "recorded"],
    ["registrados", "recorded"],
    ["siembra", "planted"],
    ["Siembra", "Planted"],
    ["agua confirmada", "confirmed water"],
    ["fecha pasada", "past date"],
    ["sin marcar", "unconfirmed"],
    ["Sin marcar", "Unconfirmed"],
    ["Verificar disponibilidad de pasto antes de asignar", "Check forage availability before assigning"],
    ["descansos alcanzaron objetivo", "rests reached target"],
    ["mínimo", "minimum"],
    ["Sin real registrado", "No actual record"],
    ["Registro", "Record"],
    ["registros", "records"],
    ["Registros", "Records"],
    ["eventos", "events"],
    ["Eventos", "Events"],
    ["categorías", "categories"],
    ["Categorías", "Categories"],
    ["categoría", "category"],
    ["Categoría", "Category"],
    ["responsable", "owner"],
    ["Responsable", "Owner"],
    ["condición", "condition"],
    ["Condición", "Condition"],
    ["forraje", "forage"],
    ["agua", "water"],
    ["Agua", "Water"],
    ["pasto", "forage"],
    ["lote", "lot"],
    ["Lote", "Lot"],
    ["lotes", "lots"],
    ["Lotes", "Lots"],
    ["rodeo", "herd"],
    ["Rodeo", "Herd"],
    ["rodeos", "herds"],
    ["Rodeos", "Herds"],
    ["cabezas", "heads"],
    ["Cabezas", "Heads"],
    ["cultivo", "crop"],
    ["Cultivo", "Crop"],
    ["cultivos", "crops"],
    ["Cultivos", "Crops"],
    ["descanso", "rest"],
    ["Descanso", "Rest"],
    ["historial", "history"],
    ["Historial", "History"],
    ["revisión", "review"],
    ["Revisión", "Review"],
    ["revisar", "review"],
    ["Revisar", "Review"],
    ["confirmar", "confirm"],
    ["Confirmar", "Confirm"],
    ["cargada", "recorded"],
    ["cargadas", "recorded"],
    ["cargado", "recorded"],
    ["cargados", "recorded"],
    ["cargar", "record"],
    ["Cargar", "Record"],
    ["editar", "edit"],
    ["Editar", "Edit"],
    ["mostrar", "show"],
    ["Mostrar", "Show"],
    ["filtrar", "filter"],
    ["Filtrar", "Filter"],
    ["buscar", "search"],
    ["Buscar", "Search"],
    ["anterior", "previous"],
    ["Anterior", "Previous"],
    ["siguiente", "next"],
    ["Siguiente", "Next"],
    ["fecha", "date"],
    ["Fecha", "Date"],
    ["hasta", "through"],
    ["Hasta", "Through"],
    ["desde", "from"],
    ["Desde", "From"],
    ["actual", "actual"],
    ["Actual", "Actual"],
    ["ahora", "now"],
    ["Ahora", "Now"],
    ["plazo", "range"],
    ["Plazo", "Range"],
    ["duración", "duration"],
    ["Duración", "Duration"],
    ["observación", "note"],
    ["Observación", "Note"],
    ["opcional", "optional"],
    ["Opcional", "Optional"],
    ["demostración", "demo"],
    ["Demostración", "Demo"],
    ["ficticia", "synthetic"],
    ["ficticio", "synthetic"],
    ["Ficticia", "Synthetic"],
    ["Ficticio", "Synthetic"],
    ["configurados", "configured"],
    ["configuradas", "configured"],
    ["demás", "other"],
    ["venta futura", "future sale"],
    ["Venta futura", "Future sale"],
    ["venta realizada", "completed sale"],
    ["Venta realizada", "Completed sale"],
    ["mortandad", "mortality"],
    ["Mortandad", "Mortality"],
    ["días", "days"],
    ["Días", "Days"],
    ["día", "day"],
    ["Día", "Day"],

    ["Objetivo de descanso alcanzado", "Rest target reached"],
    ["Movimiento de hacienda", "Livestock movement"],
    ["Días ocupación", "Occupied days"],
    ["Descanso actual", "Current rest"],
    ["Sin responsable", "Unassigned"],
    ["Sin cultivo", "No crop"],
    ["Sin hacienda", "No livestock"],
    ["Sin manejo", "Unmanaged"],
    ["Hacienda", "Livestock"],
    ["Ocupados", "Occupied"],
    ["Ocupado", "Occupied"],
    ["Descansando", "Resting"],
    ["Regeneración", "Regeneration"],
    ["Agricultura", "Agriculture"],
    ["Ganadería", "Livestock"],
    ["Evento", "Event"],
    ["Estado", "Status"],
    ["Calidad", "Quality"],
    ["Problemas", "Issues"],
    ["Problema", "Issue"],
    ["Próximo", "Next"],
    ["Anterior", "Previous"],
    ["Entrada", "Entry"],
    ["Salida", "Exit"],
    ["Venta", "Sale"],
    ["Planificado", "Planned"],
    ["Realizado", "Completed"],
    ["Realizada", "Completed"],
    ["Anulado", "Reversed"],
    ["Pendiente", "Pending"],
    ["Vencido", "Overdue"],
    ["Mapa", "Map"],
    ["Fecha", "Date"]
  ];
  var compiledFragmentsEn = null;
  var fragmentValuesEn = null;

  function readLocale() {
    try {
      var saved = String(localStorage.getItem(STORAGE_KEY) || "").toLowerCase();
      if (saved === "es" || saved === "en") return saved;
    } catch (_) {}
    return DEFAULT_LOCALE;
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, function (match) {
      return "\\" + match;
    });
  }

  function translateFragments(value) {
    if (!compiledFragmentsEn) {
      fragmentValuesEn = Object.create(null);
      EN_FRAGMENTS.concat(FRAGMENTS_EN).forEach(function (entry) {
        if (!Object.prototype.hasOwnProperty.call(fragmentValuesEn, entry[0])) {
          fragmentValuesEn[entry[0]] = entry[1];
        }
      });
      var sources = Object.keys(fragmentValuesEn).sort(function (a, b) { return b.length - a.length; });
      compiledFragmentsEn = new RegExp(
        "(^|[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ])(" + sources.map(escapeRegExp).join("|") + ")(?=$|[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ])",
        "g"
      );
    }
    return value.replace(compiledFragmentsEn, function (_match, prefix, source) {
      return prefix + fragmentValuesEn[source];
    });
  }

  function translateCore(value) {
    if (locale !== "en") return value;
    var translated = Object.prototype.hasOwnProperty.call(EN, value) ? EN[value] : value;
    for (var i = 0; i < PATTERNS_EN.length; i += 1) {
      translated = translated.replace(PATTERNS_EN[i][0], PATTERNS_EN[i][1]);
    }
    return translateFragments(translated);
  }

  function translate(value) {
    var source = String(value == null ? "" : value);
    if (!source || locale !== "en") return source;
    var leading = (source.match(/^\s*/) || [""])[0];
    var trailing = (source.match(/\s*$/) || [""])[0];
    var core = source.slice(leading.length, source.length - trailing.length);
    return leading + translateCore(core) + trailing;
  }

  function shouldSkip(node) {
    var element = node && node.nodeType === 1 ? node : node && node.parentElement;
    return !!(element && element.closest && element.closest("script,style,template,[data-i18n-skip]"));
  }

  function translateTextNode(node, refresh) {
    if (!node || shouldSkip(node)) return;
    var current = node.nodeValue || "";
    var previousTranslation = translatedText.get(node);
    var source = originalText.get(node);
    if (refresh || source === undefined || (previousTranslation !== undefined && current !== previousTranslation)) {
      source = current;
      originalText.set(node, source);
    }
    if (locale === "es") {
      node.nodeValue = source;
      translatedText.delete(node);
      return;
    }
    var next = translate(source);
    node.nodeValue = next;
    translatedText.set(node, next);
  }

  function attributeMaps(element) {
    var originals = originalAttributes.get(element);
    var translated = translatedAttributes.get(element);
    if (!originals) {
      originals = {};
      originalAttributes.set(element, originals);
    }
    if (!translated) {
      translated = {};
      translatedAttributes.set(element, translated);
    }
    return { originals: originals, translated: translated };
  }

  function translateAttribute(element, attribute, refresh) {
    if (!element || !element.hasAttribute(attribute) || shouldSkip(element)) return;
    var maps = attributeMaps(element);
    var current = element.getAttribute(attribute) || "";
    if (refresh || maps.originals[attribute] === undefined ||
        (maps.translated[attribute] !== undefined && current !== maps.translated[attribute])) {
      maps.originals[attribute] = current;
    }
    var source = maps.originals[attribute];
    if (locale === "es") {
      element.setAttribute(attribute, source);
      delete maps.translated[attribute];
      return;
    }
    var next = translate(source);
    element.setAttribute(attribute, next);
    maps.translated[attribute] = next;
  }

  function collectTextNodes(root) {
    var nodes = [];
    if (!root) return nodes;
    if (root.nodeType === 3) nodes.push(root);
    var documentRef = root.ownerDocument || document;
    if (root.nodeType === 1 || root.nodeType === 9 || root.nodeType === 11) {
      var walker = documentRef.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      var current;
      while ((current = walker.nextNode())) nodes.push(current);
    }
    return nodes;
  }

  function collectElements(root) {
    if (!root) return [];
    var elements = [];
    if (root.nodeType === 1) elements.push(root);
    if (root.querySelectorAll) elements = elements.concat(Array.prototype.slice.call(root.querySelectorAll("[aria-label],[placeholder],[title],[alt]")));
    return elements;
  }

  function observe() {
    if (!observer || !document.documentElement) return;
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      characterDataOldValue: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: observedAttributes
    });
  }

  function apply(root, options) {
    var refresh = !!(options && options.refresh);
    if (!root) root = document;
    if (observer) observer.disconnect();
    collectTextNodes(root).forEach(function (node) { translateTextNode(node, refresh); });
    collectElements(root).forEach(function (element) {
      observedAttributes.forEach(function (attribute) {
        if (element.hasAttribute(attribute)) translateAttribute(element, attribute, refresh);
      });
    });
    document.documentElement.lang = locale === "es" ? "es-AR" : "en";
    var select = document.getElementById("languageSelect");
    if (select && select.value !== locale) select.value = locale;
    observe();
  }

  function setLocale(nextLocale) {
    var next = String(nextLocale || "").toLowerCase() === "es" ? "es" : "en";
    if (next === locale) {
      apply(document);
      return;
    }
    locale = next;
    try { localStorage.setItem(STORAGE_KEY, locale); } catch (_) {}
    apply(document);
    document.dispatchEvent(new CustomEvent("agroplano:languagechange", {
      detail: { locale: locale }
    }));
  }

  function formatDate(value, fallback) {
    var match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return fallback === undefined ? "—" : fallback;
    return locale === "en"
      ? match[2] + "/" + match[3] + "/" + match[1]
      : match[3] + "/" + match[2] + "/" + match[1];
  }

  function init() {
    observer = new MutationObserver(function (mutations) {
      observer.disconnect();
      mutations.forEach(function (mutation) {
        if (mutation.type === "characterData") translateTextNode(mutation.target, true);
        if (mutation.type === "attributes") translateAttribute(mutation.target, mutation.attributeName, true);
        if (mutation.type === "childList") {
          Array.prototype.forEach.call(mutation.addedNodes || [], function (node) {
            collectTextNodes(node).forEach(function (textNode) { translateTextNode(textNode, false); });
            collectElements(node).forEach(function (element) {
              observedAttributes.forEach(function (attribute) {
                if (element.hasAttribute(attribute)) translateAttribute(element, attribute, false);
              });
            });
          });
        }
      });
      observe();
    });
    apply(document);
  }

  var nativeDialogs = {
    alert: typeof window.alert === "function" ? window.alert.bind(window) : null,
    confirm: typeof window.confirm === "function" ? window.confirm.bind(window) : null,
    prompt: typeof window.prompt === "function" ? window.prompt.bind(window) : null
  };
  if (nativeDialogs.alert) window.alert = function (message) { return nativeDialogs.alert(translate(message)); };
  if (nativeDialogs.confirm) window.confirm = function (message) { return nativeDialogs.confirm(translate(message)); };
  if (nativeDialogs.prompt) window.prompt = function (message, initial) { return nativeDialogs.prompt(translate(message), initial); };

  window.AgroPlanoI18n = Object.freeze({
    apply: apply,
    formatDate: formatDate,
    getLocale: function () { return locale; },
    setLocale: setLocale,
    t: translate,
    storageKey: STORAGE_KEY
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
