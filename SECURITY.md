# Seguridad

## Versiones alcanzadas

Se revisa la última versión publicada. Las versiones anteriores y los forks no
reciben soporte garantizado.

## Cómo reportar una vulnerabilidad

Use la opción privada **Report a vulnerability** de GitHub Security Advisories.
No abra un issue, una discusión ni un pull request público con:

- credenciales o tokens;
- datos personales u operativos;
- instrucciones completas para explotar una falla;
- archivos de respaldo o capturas con información no ficticia.

Incluya, en lo posible, la versión afectada, el impacto, pasos mínimos para
reproducir el problema y una propuesta de mitigación. La recepción y el avance
se responderán según disponibilidad, sin prometer un plazo fijo.

## Modelo de seguridad

- El modo local no requiere autenticación ni un servicio externo.
- La sincronización remota es opcional y debe usar infraestructura exclusiva
  del despliegue.
- Las claves privadas, contraseñas y claves con privilegios de servidor no
  pertenecen al código cliente ni al repositorio.
- La configuración de referencia mantiene la sincronización desactivada y no
  contiene un backend preconfigurado.

Quien habilite un backend es responsable de configurar usuarios, políticas de
acceso, copias de seguridad, rotación de credenciales y monitoreo.

## Dependencias y compilaciones

Antes de distribuir una versión:

1. instale dependencias desde el archivo de bloqueo con `npm ci`;
2. ejecute `npm test`;
3. revise alertas de dependencias y el diff completo;
4. genere los instaladores desde una ejecución reproducible;
5. verifique los archivos resultantes en un entorno de prueba.

Si una credencial privada llega a un commit o artefacto, debe rotarse. Borrarla
del archivo actual no elimina la exposición previa.
