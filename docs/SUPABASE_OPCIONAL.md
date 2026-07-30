# Sincronización opcional con Supabase

AgroPlano funciona completo en modo local. Para usar cuentas y actualización en tiempo real entre computadoras se necesita un proyecto Supabase **nuevo y exclusivo** para esta aplicación.

## Componentes

- Supabase Authentication identifica a cada persona.
- Row Level Security limita el acceso al establecimiento asignado.
- Las funciones SQL validan permisos, versión e idempotencia al guardar.
- Realtime avisa a las sesiones abiertas cuando existe una versión nueva.
- La aplicación conserva un borrador local si se interrumpe la conexión y evita reemplazar silenciosamente versiones en conflicto.

## Instalación resumida

1. Cree un proyecto Supabase vacío.
2. En **SQL Editor**, ejecute `supabase/migrations/001_agroplano_shared_state.sql`.
3. En **Authentication → Users**, cree una cuenta por persona.
4. En las variables de GitHub Actions configure:
   - `AGROPLANO_SUPABASE_URL`;
   - `AGROPLANO_SUPABASE_PUBLISHABLE_KEY`;
   - `AGROPLANO_WORKSPACE_ID`, opcional en la primera compilación.
5. Ejecute **Compilar AgroPlano Gestión Demo Windows**.
6. Instale el artefacto nuevo en todas las computadoras.
7. El primer usuario inicia sesión y crea la base compartida; queda como Administrador.
8. Desde **Datos compartidos → Administrar usuarios**, asigne `Administrador`, `Editor` o `Solo lectura` a las demás cuentas ya creadas.

## Permisos

| Rol | Consultar | Editar operación | Catálogos | Anular movimientos | Administrar usuarios |
| --- | --- | --- | --- | --- | --- |
| Administrador | Sí | Sí | Sí | Sí | Sí |
| Editor | Sí | Sí | No | No | No |
| Solo lectura | Sí | No | No | No | No |

## Qué sucede cuando alguien guarda

1. La aplicación envía el estado con la versión que tenía abierta.
2. La función transaccional valida permiso y versión.
3. Si coincide, crea una versión nueva y registra la mutación.
4. Realtime notifica a los demás equipos conectados.
5. Las otras sesiones cargan la versión nueva y actualizan sus vistas.

En condiciones normales es automático. El botón **Sincronizar ahora** se usa para reintentar o comprobar después de una desconexión.

Si dos equipos generan cambios incompatibles desde la misma versión, la aplicación no pisa uno de ellos en silencio: conserva el borrador y pide descargarlo antes de adoptar la versión de la nube.

## Credenciales

La publishable/anon key es una credencial pública del cliente; la protección depende de Authentication, RLS y las funciones de la migración. Nunca use:

- una clave con privilegios de servidor;
- una contraseña de base de datos;
- un token personal de GitHub;
- variables, usuarios o URLs de otro entorno.

## Actualizaciones del programa

La sincronización actualiza datos, no código. Una versión nueva requiere instalar el MSI/EXE nuevo sobre la versión anterior en cada computadora. No borre los datos de la aplicación durante la actualización.

Procedimiento detallado: [Puesta en marcha](PUESTA_EN_MARCHA.md).
