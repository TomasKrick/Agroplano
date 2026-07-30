# Política de privacidad y separación

Este repositorio contiene **AgroPlano Gestión Demo**, una edición pública técnicamente aislada. Su valor depende de que no pueda reconstruirse información privada a partir del código, los datos, los artefactos, la configuración o el historial.

La aplicación y el instalador tienen nombre, identificador, ejecutable y claves de almacenamiento propios. El modo compartido es opcional y sólo debe conectarse a infraestructura creada exclusivamente para AgroPlano.

## Reglas obligatorias

1. No copiar carpetas `.git`, exportaciones, bases, planillas, capturas ni instaladores de un entorno operativo.
2. No incorporar nombres de establecimientos o personas, correos, códigos de lotes, coordenadas, fechas, cantidades ni recorridos reales.
3. No incluir `.env`, contraseñas, claves privadas, credenciales con privilegios de servidor ni URLs de proyectos ajenos.
4. Todo backend de demostración debe ser independiente, con usuarios, tablas, políticas RLS, almacenamiento y variables propios.
5. Toda captura, video o instalador de esta versión debe mostrar de forma visible **DATOS FICTICIOS**.
6. Antes de publicar una versión, ejecutar `npm test`, revisar el diff completo y probar el instalador.
7. Si una credencial privada llega a un commit, debe rotarse; borrarla del archivo actual no elimina el riesgo del historial.
8. Los respaldos JSON y CSV producidos durante pruebas con información real no deben subirse al repositorio.

## Aislamiento técnico

- Aplicación: `AgroPlano Gestión Demo`.
- Identificador de escritorio: `com.agroplano.demo`.
- Ejecutable: `agroplano_demo.exe`.
- Variables de compilación: prefijo `AGROPLANO_`.
- Claves de almacenamiento, IndexedDB, canal de sincronización y caché PWA: espacio de nombres exclusivo `agroplano_demo`/`agroplano-demo`.
- Backend: tablas, funciones, canal Realtime y políticas definidos en la migración propia.

Instalar esta aplicación no reemplaza ni debería leer datos de otro programa. Del mismo modo, desinstalarla no autoriza borrar datos de otras aplicaciones.

## Lista previa a una publicación

- [ ] Revisar todos los archivos nuevos y modificados.
- [ ] Confirmar que el mapa no usa coordenadas geográficas.
- [ ] Confirmar que nombres, superficies, rodeos, eventos y recorridos son sintéticos.
- [ ] Confirmar que no existen URLs, tokens, correos ni artefactos operativos.
- [ ] Confirmar que el ejecutable, el instalador y el identificador corresponden a AgroPlano.
- [ ] Ejecutar `npm test` y resolver todos los errores.
- [ ] Verificar que el workflow de Windows termine en verde.
- [ ] Probar instalación, actualización y desinstalación en un equipo de prueba.
- [ ] Si se activa nube, usar usuarios de prueba y un proyecto vacío exclusivo.
- [ ] Activar protección de secretos y protección de rama antes de hacer público el repositorio.
- [ ] Definir licencia, soporte y responsabilidad antes de distribuirlo comercialmente.

## Si se incorporan datos reales

Deje de considerar ese backend y sus exportaciones como material demostrativo. Aplique control de acceso, copias de seguridad, retención, recuperación ante errores, baja de usuarios y revisión periódica de permisos. No publique capturas ni archivos sin una revisión explícita de privacidad.
