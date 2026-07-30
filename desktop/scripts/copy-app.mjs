import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../../app/", import.meta.url);
const destinationUrl = new URL("../dist/", import.meta.url);
const source = fileURLToPath(sourceUrl);
const destination = fileURLToPath(destinationUrl);

await access(new URL("index.html", sourceUrl));
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });

const cloudUrl = String(process.env.AGROPLANO_SUPABASE_URL || "").trim();
const cloudKey = String(process.env.AGROPLANO_SUPABASE_PUBLISHABLE_KEY || "").trim();
const workspaceId = String(process.env.AGROPLANO_WORKSPACE_ID || "").trim();
if (cloudUrl || cloudKey) {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cloudUrl)) {
    throw new Error("AGROPLANO_SUPABASE_URL no tiene formato de URL pública de Supabase");
  }
  if (cloudKey.length < 20 || /service[_-]?role/i.test(cloudKey)) {
    throw new Error("Use únicamente la publishable/anon key del proyecto Supabase de AgroPlano");
  }
  const config = `window.AGROPLANO_CLOUD = ${JSON.stringify({
    enabled: true,
    supabaseUrl: cloudUrl.replace(/\/$/, ""),
    supabaseAnonKey: cloudKey,
    workspaceId,
    documentKey: "main",
    appName: "AgroPlano Gestión"
  }, null, 2)};\n`;
  await writeFile(new URL("config.js", destinationUrl), config, "utf8");
  console.log("Modo nube de AgroPlano habilitado para este instalador");
} else {
  console.log("Modo local: no se proporcionó configuración Supabase de AgroPlano");
}

console.log(`Aplicación demo copiada a ${destination}`);
