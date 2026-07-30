# Cambios

## Próxima versión

- Sin cambios pendientes.

## 1.3.2 — 30/07/2026

- Completa la localización de responsables sintéticos y del contador dividido
  del Gantt detectados durante la revisión visual de la demo publicada.
- Elimina 90 solapes artificiales del plan sintético, conserva un único caso
  deliberado para demostrar validación y añade una regresión específica.
- Localiza el análisis de Eventos, días y códigos del Gantt, rangos de fechas
  y opciones de rodeo sin duplicar sus nombres.
- Renueva la caché offline para que navegadores y celulares reciban el pulido
  inmediatamente.

## 1.3.1 — 30/07/2026

### Pulido de la edición pública

- Completa el inglés de textos dinámicos, catálogos, abreviaturas del mapa,
  ayudas y atributos de accesibilidad en las diez vistas.
- Corrige el contraste de las acciones principales de Eventos y agrega
  nombres contextuales para lectores de pantalla.
- Asocia etiquetas con sus controles, identifica columnas de acciones y
  permite ordenar tablas mediante teclado.
- Fija el reloj de la demo al escenario sintético para que KPIs, vencimientos
  y capturas sigan siendo reproducibles.
- Captura fechas inválidas desde los formularios sin errores no controlados ni
  cambios parciales.
- Amplía la regresión bilingüe para detectar texto mixto, atributos `alt`,
  etiquetas incompletas y pérdida de contraste.

## 1.3.0 — 29/07/2026

### Interfaz internacional

- Agrega una interfaz bilingüe English / Español con inglés como idioma inicial
  de la demo pública.
- Conserva la elección de idioma únicamente en cada dispositivo; no modifica
  catálogos, movimientos, datos compartidos ni archivos importados.
- Traduce las diez vistas, ayudas, estados, accesibilidad, diálogos y el panel
  de sincronización en el límite de presentación.
- Incorpora un plano sintético rotulado en inglés y mantiene el plano español
  cuando se elige Español.
- Agrega una regresión de ambos idiomas y del cambio persistente durante la
  navegación.

## 1.2.0 — 29/07/2026

### Decisión y navegación operativa

- Agrega una lente **Descanso vs objetivo** al Gantt para separar ocupados, lotes listos, cercanos al objetivo, en descanso y sin dato actual.
- Conserva la lente, el orden, los filtros, el zoom, el modo ampliado y la posición horizontal del Gantt entre guardados.
- Incorpora **Ubicar** y **Traer…** en Rodeos. El traslado usa el mismo movimiento transaccional que Hacienda, cerrando origen y abriendo destino como una sola operación.

### Contexto y accesibilidad

- La ficha del lote presenta cuatro indicadores compactos: ocupación, descanso versus objetivo, próxima acción e integridad.
- Los objetos principales del mapa y las celdas del Gantt conservan su descripción accesible mediante `aria-label` sin mostrar el tooltip nativo del navegador.
- Generaliza la clasificación de infraestructura y elimina ejemplos o condiciones que no pertenecen al dataset sintético.

### Verificación y distribución

- Agrega regresiones sintéticas para la lente de descanso, Ubicar/Traer rodeo, persistencia del Gantt, indicadores contextuales y accesibilidad.
- Bloquea el doble envío accidental de una misma operación ganadera desde la interfaz.
- Valida que los íconos PWA y Windows tengan formato, dimensiones y contenido reales.
- Refuerza el escaneo de privacidad de los archivos publicables.
- Publica documentación English-first, licencia MIT y despliegue reproducible de la demo web.
- No cambia la migración compartida ni requiere ejecutar SQL adicional.

## 1.1.0 — 15/07/2026

### Mapa y lectura rápida

- La ficha rápida aparece cerca del cursor y acompaña el recorrido dentro del lote sin capturar el puntero.
- Resume identidad, superficie, estado, rodeos simultáneos, cabezas, antigüedad y la alerta o el próximo evento relevante.
- Prueba distintas posiciones y se mantiene dentro del área visible, incluso junto a los bordes.
- Se oculta al arrastrar, desplazar o hacer zoom; en pantallas táctiles el toque abre directamente la ficha completa.
- Agrega activación de lotes por `Enter` o barra espaciadora y cierre por `Escape`.

### Movimientos ganaderos desde el mapa

- Presenta cinco acciones independientes: **Ingresar rodeo**, **Mover a otro lote**, **Retirar del campo**, **Venta realizada** y **Mortandad**.
- Cada acción abre sólo sus propios campos y explica el efecto antes de confirmar.
- Una entrada nueva comienza vacía y suma otro rodeo sin reemplazar los grupos que ya ocupan el lote.
- Mover actualiza origen y destino como una sola operación; retirar exige motivo y confirmación.
- Venta permite registrar cantidad, comprador, destino y referencia DT-e; mortandad exige causa o **Sin determinar**.
- Cuando conviven varios rodeos, la operación se aplica al período exacto elegido.

### Ventas, mortandad y eventos

- Venta y mortandad descuentan parcial o totalmente las cabezas del rodeo exacto y conservan la trazabilidad de existencias antes y después.
- Una venta puede registrar comprador, destino y referencia DT-e; la mortandad conserva la causa informada.
- Un evento planificado llamado **Venta** no modifica stock hasta completar **Venta realizada**.
- El centro de **Eventos** separa pendientes, todos los registros y análisis, con filtros por fecha, lote, tipo, rodeo, categoría, responsable, estado y texto.
- Resume vencimientos y ventanas próximas sin afirmar que una tarea no ocurrió cuando sólo falta confirmarla.
- Indicadores incorpora un control de consistencia entre existencias, ocupaciones abiertas, identidades de rodeo y bajas registradas.

### Consistencia y distribución

- Rechaza fechas inválidas en lugar de sustituirlas silenciosamente por la fecha actual.
- Restaura el estado completo si una operación falla a mitad de camino, evitando traslados o inventarios parciales.
- Entrar hacienda en un lote agrícola conserva la agricultura y cambia el uso a **Mixto**.
- Ajusta paneles, tablas, mapa, ficha y Gantt para resoluciones habituales de escritorio y portátil, incluida 1366×768.
- Mantiene identidad, almacenamiento, variables, ejecutable e instaladores propios de AgroPlano Gestión Demo.
- No cambia la migración compartida ni requiere ejecutar SQL adicional.
- La actualización se instala encima de la versión anterior en cada computadora, sin borrar los datos de la aplicación.

## 1.0.0 — 14/07/2026

- Primera versión pública con identidad propia, plano, geometría y carga inicial completamente ficticios.
- Incluye mapa, hacienda, rodeos, pastoreo, cultivos, ciclo anual, indicadores, historial, agenda y catálogos editables.
- Agrega instaladores Windows propios y sincronización multiusuario opcional mediante infraestructura exclusiva.
