# Colaborar con AgroPlano

Las contribuciones son bienvenidas siempre que mantengan el proyecto
reproducible, neutral y libre de información operativa real.

## Antes de empezar

1. Abra un issue breve para cambios amplios o que modifiquen el modelo de datos.
2. Trabaje en una rama enfocada y evite cambios no relacionados.
3. Instale dependencias con `npm ci`.
4. Use sólo fixtures, nombres, geometrías y capturas sintéticas.

## Requisitos para un pull request

- Explicar el problema y el comportamiento esperado.
- Agregar o ajustar pruebas cuando cambie el funcionamiento.
- Ejecutar `npm test` y declarar el resultado.
- Revisar que no haya credenciales, datos personales, coordenadas, respaldos,
  binarios de prueba ni rutas locales.
- Mantener desactivada y vacía la configuración remota predeterminada.
- Documentar cualquier cambio de migración, permisos o almacenamiento.

No se aceptan exportaciones de usuarios, capturas de sistemas operativos ni
fragmentos que contengan información exclusiva, identificadores o reglas
sensibles de proyectos confidenciales.

## Estilo de cambios

Prefiera commits pequeños con mensajes que expliquen la intención. No
reformatee archivos completos si el cambio no lo requiere. Conserve la interfaz
bilingüe —inglés por defecto y español seleccionable— y priorice accesibilidad
por teclado, mensajes claros y diseño adaptable.

## Seguridad

No informe vulnerabilidades mediante un pull request público. Use el canal
privado indicado en [SECURITY.md](SECURITY.md).

Al enviar una contribución acepta que se distribuya bajo la licencia indicada
en `LICENSE`.
