# Puesta en marcha

## Opción A: usar AgroPlano sólo en una computadora

No requiere configuración adicional.

1. Instale y abra la aplicación.
2. Confirme que el estado diga **Sólo en este equipo**.
3. Pruebe las funciones con la carga ficticia.
4. Exporte JSON periódicamente para conservar respaldos.

Los cambios quedan únicamente en esa computadora.

## Opción B: compartir datos entre computadoras

Use un proyecto Supabase nuevo y exclusivo.

### 1. Preparar la base

1. Cree el proyecto Supabase.
2. Abra **SQL Editor**.
3. Copie y ejecute `supabase/migrations/001_agroplano_shared_state.sql`.
4. Compruebe que finalice sin errores.

### 2. Crear las cuentas

1. Abra **Authentication → Users**.
2. Cree un usuario por persona.
3. Use correos individuales y contraseñas temporales seguras.
4. No comparta una cuenta entre varias personas.

### 3. Configurar la compilación

En **GitHub → Settings → Secrets and variables → Actions → Variables**, cree:

- `AGROPLANO_SUPABASE_URL`: URL pública del proyecto.
- `AGROPLANO_SUPABASE_PUBLISHABLE_KEY`: publishable/anon key pública.
- `AGROPLANO_WORKSPACE_ID`: opcional; puede dejarse vacío en la primera creación.

No configure una clave con privilegios de servidor, una contraseña de base ni un token personal.

### 4. Compilar e instalar

1. Ejecute el workflow **Compilar AgroPlano Gestión Demo Windows**.
2. Descargue `agroplano-gestion-demo-windows`.
3. Instale esa misma versión en todas las computadoras.
4. Abra la aplicación e ingrese con el primer usuario.

### 5. Crear la base compartida

El primer usuario sin establecimiento verá **Primera configuración**.

1. Exporte un JSON de respaldo de la carga visible.
2. Escriba el nombre del establecimiento de prueba.
3. Presione **Crear base compartida**.
4. Espere que aparezca **Todo sincronizado**.

Ese primer usuario queda como Administrador.

### 6. Dar acceso a otras personas

1. Abra el estado **Datos compartidos**.
2. Despliegue **Administrar usuarios**.
3. Escriba el correo que ya existe en Supabase Authentication.
4. Elija el permiso:
   - **Administrador:** datos, catálogos, anulaciones y usuarios.
   - **Editor:** datos operativos.
   - **Solo lectura:** consulta sin guardar.
5. Presione **Agregar o cambiar permiso**.
6. Repita por cada persona.

### 7. Probar tiempo real

1. Abra dos computadoras con usuarios distintos.
2. Confirme que ambas digan **Todo sincronizado** o **Solo lectura · actualizado**.
3. Desde un Editor o Administrador registre una entrada de prueba.
4. Compruebe que el otro equipo reciba el cambio automáticamente.
5. Verifique mapa, Hacienda, Pastoreo, Historial e Indicadores.
6. Anule la prueba con un Administrador si corresponde.

No hace falta presionar actualizar durante el funcionamiento normal. **Sincronizar ahora** sirve para reintentar después de una desconexión o verificar manualmente el estado.

Para actualizar a `v1.3.3`, instale el nuevo MSI/EXE sobre la versión anterior
en cada equipo. La edición pública abre un espacio local nuevo para cargar el
fixture sintético corregido; el estado anterior queda intacto bajo su clave
histórica. Esta versión no requiere una migración SQL adicional.

## Antes de empezar una carga real

- Asegúrese de que todos tengan la misma versión.
- Defina quiénes serán Administradores, Editores y usuarios de consulta.
- Reemplace la carga ficticia por una base limpia y validada.
- Revise catálogos, lotes, unidades y fechas.
- Defina cómo se corrigen errores y quién puede anular movimientos.
- Defina frecuencia, responsable y ubicación de los respaldos JSON.
- Haga una prueba completa de entrada, traslado, salida/venta y convivencia de dos rodeos.

Consulte también [Supabase opcional](SUPABASE_OPCIONAL.md), [Instalación y actualización](INSTALACION_Y_ACTUALIZACION.md) y [Guía de uso](GUIA_DE_USO.md).
