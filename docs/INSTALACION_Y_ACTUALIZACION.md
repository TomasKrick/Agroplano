# Instalación y actualización en Windows

## Descargar el instalador desde GitHub

1. Entre al repositorio con una cuenta que tenga acceso.
2. Abra la pestaña **Actions**.
3. En la columna izquierda elija **Build AgroPlano Management Demo for Windows**.
4. Presione **Run workflow** y confirme la rama `main`.
5. Espere que el flujo termine con un círculo verde.
6. Abra esa ejecución.
7. En **Artifacts**, descargue `agroplano-gestion-demo-windows`.
8. Descomprima el ZIP antes de ejecutar cualquier archivo.

El workflow también se ejecuta automáticamente cuando un pull request hacia `main` modifica la aplicación, el escritorio, sus manifiestos o el propio workflow. Ese resultado sirve para validar el cambio antes de fusionarlo. Para distribuir una versión definitiva, ejecute manualmente el workflow sobre `main` y descargue el artefacto de esa ejecución.

El artefacto puede contener:

- un instalador NSIS `.exe`;
- un instalador Windows `.msi`;
- el ejecutable `agroplano_demo.exe`.

Para la mayoría de los usuarios conviene instalar el `.exe` o `.msi`.

## Primera instalación en cada computadora

1. Cierre versiones anteriores de AgroPlano.
2. Ejecute el instalador.
3. Si Windows muestra una advertencia por editor desconocido, confirme sólo si el archivo proviene de la ejecución oficial del repositorio y el workflow terminó en verde.
4. Complete el asistente de instalación.
5. Abra **AgroPlano Gestión Demo** desde el menú Inicio.
6. Compruebe que el encabezado muestre la versión esperada y **DATOS FICTICIOS**.
7. En modo compartido, inicie sesión con el usuario asignado a esa persona; no comparta contraseñas.
8. Verifique que el estado indique **Todo sincronizado** o **Solo lectura · actualizado**.

La instalación se realiza una vez por computadora. Cada persona debe usar su propia cuenta para que el historial identifique quién realizó cada cambio.

## Actualizar una instalación existente

1. Exporte un JSON de respaldo.
2. Cierre la aplicación en esa computadora.
3. Descargue el artefacto de la nueva ejecución verde.
4. Ejecute el nuevo `.exe` o `.msi` sobre la instalación anterior.
5. **No elija borrar los datos de la aplicación** durante la actualización.
6. Abra la aplicación y confirme el número de versión.
7. Inicie sesión si se solicita y espere **Todo sincronizado**.
8. Haga una prueba de lectura y, con un usuario Editor o Administrador, una carga controlada.

La actualización del instalador no es automática. Supabase sincroniza registros y catálogos, no reemplaza el código instalado.

Para esta actualización, confirme que el encabezado muestre `v1.3.2`. No necesita ejecutar una migración SQL nueva.

## Orden recomendado para varios equipos

1. Compile y pruebe la versión nueva en una computadora de prueba.
2. Verifique mapa, Hacienda, Pastoreo, Indicadores, Eventos, Historial y sincronización.
3. Detenga temporalmente las cargas operativas.
4. Actualice todas las computadoras.
5. Confirme que todas muestran la misma versión.
6. Reanude las cargas.

Esto es especialmente importante antes de renombrar catálogos o usar funciones incorporadas recientemente.

## Si la aplicación funciona sólo en este equipo

El instalador fue compilado sin configuración de nube o no puede conectarse. Revise:

- que las variables `AGROPLANO_SUPABASE_URL` y `AGROPLANO_SUPABASE_PUBLISHABLE_KEY` estén definidas en el repositorio;
- que la compilación se haya ejecutado después de configurar las variables;
- que la migración SQL se haya aplicado en el proyecto correcto;
- que haya internet y la fecha/hora de Windows sean correctas;
- que el usuario exista en Supabase Authentication y tenga acceso al establecimiento.

No pegue credenciales privilegiadas en la aplicación. Corrija la configuración y genere un instalador nuevo.

## Desinstalar

Use **Configuración de Windows → Aplicaciones → Aplicaciones instaladas → AgroPlano Gestión Demo → Desinstalar**.

Antes de desinstalar:

1. Confirme que no haya cambios pendientes.
2. Exporte JSON si necesita conservar la base local.
3. No elija borrar datos si piensa reinstalar y todavía necesita ese respaldo local.

Desinstalar una computadora no elimina la base compartida ni las cuentas del backend.
