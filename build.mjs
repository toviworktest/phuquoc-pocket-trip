import fs from 'node:fs/promises';
const root=new URL('./',import.meta.url),read=p=>fs.readFile(new URL(p,root),'utf8');
const esc=x=>x.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const dataURL=async(p,type)=>`data:${type};base64,${(await fs.readFile(new URL(p,root))).toString('base64')}`;
let html=await read('index.html');
for(const file of ['vendor/leaflet.css','style.css','map.css','ui.css']){
 let css=await read(file);
 for(const font of ['Galmuri11.woff2','Galmuri11-Bold.woff2'])css=css.replaceAll('assets/'+font,await dataURL('assets/'+font,'font/woff2'));
 // DivIcons are vectors; default image markers and layer switcher are unused.
 if(file==='vendor/leaflet.css')css=css.replace(/url\(images\/[^)]+\)/g,'none');
 html=html.replace(`<link rel="stylesheet" href="${file}">`,()=>'<style>'+css+'</style>');
}
for(const file of ['vendor/leaflet.js','geometry.js','geography.js','bookings.js','data.js','icons.js','map-board.js','app.js']){
 const js=(await read(file)).replace(/\/\/# sourceMappingURL=.*$/gm,'');
 html=html.replace(`<script src="${file}"></script>`,()=>`<script>\n${js.replace(/<\/script/gi,'<\\/script')}\n</script>`);
}
const fontLicense=await read('assets/GALMURI-LICENSE.txt'),leafletLicense=await read('vendor/LEAFLET-LICENSE.txt');
html=html.replace('__GALMURI_LICENSE__',()=>esc(fontLicense));
html=html.replace('__LEAFLET_LICENSE__',()=>esc(leafletLicense));
if(/<script[^>]+src=|<link[^>]+rel="stylesheet"/i.test(html))throw Error('Unbundled asset');
await fs.writeFile(new URL('여행플래너.html',root),html);
await fs.writeFile(new URL('공유용_여행플래너.html',root),html);
// Publish only this whitelist directory, never the project root or private/.
const publish=new URL('publish/',root);await fs.mkdir(publish,{recursive:true});
await fs.writeFile(new URL('index.html',publish),html);
await fs.writeFile(new URL('robots.txt',publish),'User-agent: *\nDisallow: /\n');
await fs.writeFile(new URL('_headers',publish),'/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n');
const files=await fs.readdir(publish);if(files.some(f=>!['index.html','robots.txt','_headers'].includes(f)))throw Error('Unexpected file in publish directory; inspect before publishing');
console.log('Built offline geographic planner + private-data-free publish folder: '+Math.round(Buffer.byteLength(html)/1024)+' KB');
