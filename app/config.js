/*
 * Configuración pública opcional de AgroPlano.
 *
 * La aplicación funciona completa en modo local con enabled=false.
 * Para habilitar usuarios y sincronización, use EXCLUSIVAMENTE un proyecto
 * Supabase propio de esta aplicación. La publishable/anon key es pública por
 * diseño; nunca coloque service_role, contraseñas ni secretos en este archivo.
 */
window.AGROPLANO_CLOUD = {
  enabled: false,
  supabaseUrl: "",
  supabaseAnonKey: "",
  workspaceId: "",
  documentKey: "main",
  appName: "AgroPlano Gestión"
};
