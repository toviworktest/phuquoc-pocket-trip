import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=new URL('./',import.meta.url),read=p=>fs.readFile(new URL(p,root),'utf8');
const esc=x=>x.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const dataURL=async(p,type)=>`data:${type};base64,${(await fs.readFile(new URL(p,root))).toString('base64')}`;
// Tailwind v4 CLI compiles app.css against the classes used in index.html/app.js/map-board.js.
async function tailwind(){
 const cli=path.join(path.dirname(createRequire(import.meta.url).resolve('@tailwindcss/cli/package.json')),'dist/index.mjs');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pq-tw-')),out=path.join(dir,'app.css');
 try{execFileSync(process.execPath,[cli,'-i',fileURLToPath(new URL('app.css',root)),'-o',out,'--minify'],{cwd:fileURLToPath(root),stdio:['ignore','ignore','pipe']});return await fs.readFile(out,'utf8');}
 finally{await fs.rm(dir,{recursive:true,force:true});}
}
let html=await read('index.html');
for(const file of ['vendor/leaflet.css','map.css','app.css']){
 let css=file==='app.css'?await tailwind():await read(file);
 // DivIcons are vectors; default image markers and layer switcher are unused.
 if(file==='vendor/leaflet.css')css=css.replace(/url\(images\/[^)]+\)/g,'none');
 html=html.replace(`<link rel="stylesheet" href="${file}">`,()=>'<style>'+css.replace(/<\/style/gi,'<\\/style')+'</style>');
}
for(const file of ['vendor/leaflet.js','geometry.js','geography.js','bookings.js','data.js','photos.js','icons.js','map-board.js','app.js']){
 let js=(await read(file)).replace(/\/\/# sourceMappingURL=.*$/gm,'');
 if(file==='photos.js')for(const [,p] of js.matchAll(/"src":"(assets\/photos\/[a-z]+\.webp)"/g))js=js.replace(`"src":"${p}"`,`"src":"${await dataURL(p,'image/webp')}"`);
 html=html.replace(`<script src="${file}"></script>`,()=>`<script>\n${js.replace(/<\/script/gi,'<\\/script')}\n</script>`);
}
const leafletLicense=await read('vendor/LEAFLET-LICENSE.txt');
html=html.replace('__LEAFLET_LICENSE__',()=>esc(leafletLicense));
if(/<script[^>]+src=|<link[^>]+rel="stylesheet"|assets\/photos\//i.test(html))throw Error('Unbundled asset');
await fs.writeFile(new URL('여행플래너.html',root),html);
await fs.writeFile(new URL('공유용_여행플래너.html',root),html);
// Publish only this whitelist directory, never the project root or private/.
const publish=new URL('publish/',root);await fs.mkdir(publish,{recursive:true});
await fs.writeFile(new URL('index.html',publish),html);
await fs.writeFile(new URL('robots.txt',publish),'User-agent: *\nDisallow: /\n');
await fs.writeFile(new URL('_headers',publish),'/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n');
const files=await fs.readdir(publish);if(files.some(f=>!['index.html','robots.txt','_headers'].includes(f)))throw Error('Unexpected file in publish directory; inspect before publishing');
console.log('Built offline geographic planner + private-data-free publish folder: '+Math.round(Buffer.byteLength(html)/1024)+' KB');
