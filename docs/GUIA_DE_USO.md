# Guía de uso de AgroPlano Gestión Demo

Esta guía explica el recorrido cotidiano. Los datos que vienen cargados son ficticios y sirven para aprender sin riesgo.

## 1. Antes de empezar

1. Abra **AgroPlano Gestión Demo**.
2. Compruebe arriba que diga **DATOS FICTICIOS**.
3. Si usa modo compartido, mire el indicador de sincronización:
   - **Todo sincronizado:** puede trabajar normalmente.
   - **Solo lectura:** puede consultar, pero no guardar.
   - **Sin internet / cambio pendiente:** no cierre ni cambie de establecimiento hasta sincronizar o descargar el borrador.
4. Use **Más → Exportar JSON** antes de una carga importante o una prueba masiva.

## 2. Entender el mapa

- Pase el cursor sobre un lote: la ficha rápida aparece cerca del puntero y muestra número, código, superficie, estado, rodeos presentes, cabezas, días de ocupación y la alerta o el próximo evento más relevante.
- Haga clic o toque el lote para abrir la ficha completa.
- Use la búsqueda para encontrar un número, código, rodeo, categoría, cultivo o nota.
- Cambie la capa visual para colorear por ocupación, hacienda, cultivo, agua, descanso, calidad o problemas.
- Use `+`, `−` o la barra de zoom. Arrastre el plano para recorrerlo.
- Si pierde de vista una zona, presione **Ajustar** para volver a mostrar el plano completo.
- La ficha rápida se acomoda automáticamente cerca de los bordes y se oculta al arrastrar, desplazar o hacer zoom. No bloquea el clic ni el movimiento del mapa.
- Con teclado, enfoque un lote y use `Enter` o la barra espaciadora para abrirlo; `Escape` cierra la ficha rápida.

El color ayuda a priorizar, pero la ficha del lote y la fecha de consulta son la fuente del detalle.

## 3. Registrar movimientos de hacienda desde el mapa

Seleccione un lote en **Mapa**. Al comienzo de la ficha aparecen cinco acciones separadas; cada una abre solamente los campos necesarios. También puede consultar y completar movimientos desde **Hacienda**.

### Entrada

1. Presione **Ingresar rodeo**.
2. Seleccione la categoría y el rodeo desde las listas.
3. Indique cabezas, fecha y una nota si corresponde.
4. Guarde.

Una entrada empieza vacía y suma un rodeo nuevo: no reemplaza ni copia el que ya ocupa el lote. Si el lote estaba destinado sólo a agricultura, pasa a estado **Mixto** para conservar ambos usos.

### Traslado

1. Presione **Mover a otro lote**.
2. Si hay más de un rodeo, elija exactamente cuál se mueve.
3. Seleccione el lote de destino y la fecha.
4. Guarde.

El programa cierra la ocupación del lote de origen y abre otra en el destino como una única operación, sin borrar el recorrido anterior.

### Retiro del campo

1. Presione **Retirar del campo**.
2. Elija el rodeo exacto.
3. Indique la fecha y un motivo obligatorio.
4. Revise la advertencia y confirme.

Esta opción retira el rodeo completo sin un lote de destino. Si la causa es una operación comercial, use **Venta realizada**.

### Venta realizada

1. Presione **Venta realizada**.
2. Elija el rodeo y la cantidad vendida.
3. Indique fecha y, si están disponibles, comprador, destino y referencia DT-e.
4. Guarde.

La venta descuenta las cabezas del grupo elegido, cierra su ocupación si la cantidad llega a cero y deja la operación en el historial. La referencia DT-e es informativa: no emite ni reemplaza documentación oficial.

### Mortandad

1. Presione **Mortandad**.
2. Elija el rodeo y la cantidad.
3. Indique fecha y causa; si todavía no se conoce, seleccione **Sin determinar**.
4. Guarde.

La baja afecta sólo al rodeo seleccionado y conserva la causa para análisis y auditoría.

### Validaciones importantes

- Si conviven varios rodeos, elija siempre el período exacto antes de mover, retirar o descontar.
- Una fecha inválida se rechaza y no se reemplaza silenciosamente por la fecha actual.
- Si algún paso de un traslado o una baja falla, el programa restaura lotes, ocupaciones, rodeos y movimientos para no dejar el inventario a medias.

### Carga alternativa desde Hacienda

En **Hacienda → Registrar entrada, salida o traslado** también puede completar los flujos generales:

1. Elija la operación.
2. Seleccione el lote correspondiente.
3. Seleccione la categoría y el rodeo desde las listas.
4. Indique cabezas, fecha y una nota si corresponde.
5. Guarde.

Crear solamente un evento llamado “Venta” documenta o planifica una fecha, pero no descuenta animales: para modificar existencias debe completar **Venta realizada**.

### Dos rodeos en un mismo lote

Registre cada entrada por separado. El lote mostrará ambas ocupaciones y sumará las cabezas, pero el historial conservará categoría, rodeo, cantidad y fecha de cada grupo. Al trasladar o retirar, seleccione el grupo correcto.

## 4. Corregir un movimiento

1. Abra **Historial**.
2. Busque **Movimientos de hacienda**.
3. Localice el último movimiento relacionado.
4. Presione **Anular / volver atrás**.
5. Escriba un motivo claro y confirme.

Sólo un Administrador puede anular y el programa bloquea operaciones que ya tienen movimientos posteriores relacionados. La anulación no borra: deja fecha, usuario y motivo para auditoría.

## 5. Planificar y revisar pastoreo

Abra **Pastoreo**.

1. Defina fecha **Desde** y **Hasta**. Puede revisar hasta un año de una sola vez.
2. Elija cómo mostrar el plazo:
   - **Ajustar al ancho:** comprime todo el rango para una visión general.
   - **Vista diaria desplazable:** conserva ancho por día y permite recorrer horizontalmente.
3. Use el zoom del Gantt para agrandar o reducir los días.
4. Filtre por rodeo, categoría, estado real/planificado o tipo de evento.
5. Ordene los lotes por número, código, actividad u otros criterios disponibles.
6. Pase el cursor sobre una celda ocupada para ver lote, fecha, rodeo, categoría, cabezas y duración.
7. Si una celda contiene varios rodeos, abra **Registros del plazo** y elija el registro exacto.

Las barras continuas representan ocupaciones. Los eventos de una fecha se leen como marcas verticales y conservan su color de referencia.

## 6. Leer Indicadores

En **Indicadores**, primero elija rango, lote y categoría; luego presione **Actualizar**.

Revise especialmente:

- **Ocupaciones actuales más largas:** lotes que llevan más tiempo sin un día de descanso.
- **Días ocupados por lote:** intensidad de uso dentro del período.
- **Tiempo de cada categoría en cada lote:** días, pasadas y cabeza-días.
- **Descanso actual vs objetivo:** prioriza lotes próximos a completar el descanso configurado.
- **Plan versus registros reales:** compara lo planificado con lo cargado hasta hoy.
- **Cabeza-días/ha registrados:** presión acumulada sólo donde la cantidad tiene cobertura suficiente.
- **Recorrido por rodeo:** días, lotes visitados, registros y cabeza-días.
- **Consistencia del inventario:** diferencias entre Hacienda, ocupaciones abiertas, identidad de los rodeos y bajas registradas.
- **Registros a revisar:** faltantes de cabezas, rodeo o categoría que reducen la confiabilidad del tablero.

Un indicador no decide por sí solo. Úselo para formular preguntas, visitar los lotes prioritarios y registrar la observación resultante.

## 7. Cultivos y ciclo anual

En **Cultivos** puede cargar cultivo actual, fecha de siembra, antecesor y próxima labor. En **Ciclo anual** puede comparar ocupación, descanso, actividad ganadera y agrícola por lote.

Para cambiar las opciones disponibles, un Administrador abre **Más → Categorías, rodeos y cultivos**. Renombrar actualiza las referencias relacionadas; desactivar oculta una opción para cargas nuevas sin borrar el historial.

## 8. Eventos e historial

- **Eventos → Pendientes** reúne tareas vencidas y próximas para organizar el trabajo.
- **Eventos → Todos** permite filtrar por fecha, lote, tipo, rodeo, categoría, responsable, estado o texto.
- **Eventos → Análisis** resume la actividad por tipo, estado, mes y responsable.
- **Historial** conserva eventos realizados, problemas, labores y movimientos.
- Distinga **Planificado**, **Realizado** y **Anulado**. Marque una tarea como realizada cuando se complete.
- Escriba notas breves pero verificables: qué ocurrió, cantidad, responsable y observación relevante.

Un evento **Venta** planifica o documenta una fecha; sólo **Venta realizada** modifica las existencias. Del mismo modo, que un evento pasado siga abierto indica que falta confirmar el registro, no demuestra que el trabajo no se haya hecho.

## 9. Respaldos

- **Exportar JSON:** copia completa para recuperar o trasladar la base.
- **Importar JSON:** reemplaza/carga una base; haga un respaldo antes.
- **CSV lotes:** análisis de datos principales por lote.
- **CSV historial:** análisis externo de eventos.
- **Plantilla CSV:** formato de ejemplo para importación.

Con nube habilitada, el respaldo JSON sigue siendo recomendable: la sincronización no sustituye una política de copias de seguridad.

## 10. Rutina diaria sugerida

1. Confirme estado de sincronización y fecha.
2. Registre primero movimientos de hacienda.
3. Registre eventos sanitarios, productivos o agrícolas.
4. Revise Eventos pendientes y ocupaciones actuales largas.
5. Abra Pastoreo para validar el recorrido y el plan.
6. Corrija registros incompletos que aparezcan en Indicadores.
7. Exporte JSON con la periodicidad definida por la empresa.
