import http from 'node:http';
import fs from 'node:fs/promises';
const allowed=new Set(['index.html','robots.txt','state.json','costs.json']);
http.createServer(async(req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
 if(req.method!=='GET'||!allowed.has(name)){res.writeHead(404);res.end();return;}
 try{const text=await fs.readFile(new URL('../public-site/'+name,import.meta.url));res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.json')?'application/json; charset=utf-8':'text/plain','Cache-Control':'no-store'});res.end(text);}
 catch{res.writeHead(503);res.end('Run npm run build first.');}
}).listen(4178,'127.0.0.1',()=>console.log('Local: http://localhost:4178'));
