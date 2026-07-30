# Diseño de los datos ficticios

La carga inicial representa un establecimiento de demostración completamente inventado. No corresponde a una empresa, un campo ni un plano real.

Los datos permiten recorrer y verificar todas las funciones sin conectar una base externa. En modo local se pueden editar libremente; si se habilita un backend exclusivo, la misma carga puede usarse para probar usuarios y sincronización.

## Plano

- 24 lotes agrupados en cuatro sectores artificiales.
- Dos áreas operativas adicionales para representar manga y corrales.
- Coordenadas locales dentro de un `viewBox` SVG de 1000 × 650.
- Caminos, aguadas, monte e infraestructura puramente ilustrativos.
- Códigos, superficies, formas y posiciones no derivados de cartografía real.

## Actividad simulada

- Ocho rodeos con categorías y cantidades inventadas.
- Catálogos sintéticos de categorías ganaderas y cultivos.
- Ocupaciones reales históricas y planes futuros reproducibles.
- Un caso válido de dos rodeos diferentes ocupando el mismo lote al mismo tiempo.
- Eventos de servicio, vacunación, parición, yerra, tacto y venta.
- Tareas, responsables, alertas y registros a revisar de ejemplo.

Los datos se generan siempre igual para que las capturas, pruebas y explicaciones sean comparables entre instalaciones.

## Qué se puede evaluar con esta carga

- Que una entrada, salida/venta o traslado se refleje en todas las vistas.
- Que dos rodeos puedan coexistir y luego moverse de forma independiente.
- Que el Gantt muestre ocupaciones, planes y eventos en rangos cortos o de hasta un año.
- Que los filtros por lote, rodeo, categoría y evento devuelvan resultados coherentes.
- Que el historial conserve la trazabilidad y una anulación segura no borre el registro.
- Que los indicadores respondan al rango y a los filtros elegidos.
- Que los roles y la sincronización funcionen cuando se habilita un backend de prueba.

## Interpretación responsable

Los indicadores son ejemplos de apoyo a decisiones. Cabeza-días/ha expresa presión **registrada**, pero no equivale por sí sola a capacidad de carga ni diagnostica sobrepastoreo. Los descansos son calendarios y deben contrastarse con disponibilidad de forraje, estado del suelo, clima, objetivo productivo y observación de campo.

Antes de usar AgroPlano en una operación real se debe iniciar una base limpia, revisar catálogos, roles, lotes y procedimientos de respaldo, y validar las reglas de trabajo con responsables agronómicos, ganaderos y veterinarios.
