import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,join,normalize} from 'node:path';

const root=join(process.cwd(),'app');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};

createServer(async(req,res)=>{
  try{
    const requested=req.url==='/'?'/index.html':decodeURIComponent(req.url.split('?')[0]);
    const path=normalize(join(root,requested));
    if(!path.startsWith(root))throw new Error('Ruta inválida');
    const info=await stat(path);if(!info.isFile())throw new Error('No es archivo');
    res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-store'});
    res.end(await readFile(path));
  }catch{
    res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});res.end('No encontrado');
  }
}).listen(4173,'127.0.0.1',()=>console.log('AgroPlano Demo: http://localhost:4173'));
