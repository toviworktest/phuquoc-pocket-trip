import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFile(path.join(root,p),'utf8');
await import('../build.mjs');
// The legacy Sites (email login) build is still produced so it can be redeployed, but GitHub Pages no longer depends on it.
await fs.mkdir(path.join(root,'backend/src'),{recursive:true});
await fs.copyFile(path.join(root,'publish/index.html'),path.join(root,'backend/src/planner.html'));
await import('../backend/build.mjs');
const config=JSON.parse(await read('pages.config.json')),gh=config.github;
if(!gh||![gh.owner,gh.repo,gh.branch,gh.path,gh.costsPath].every(v=>typeof v==='string'&&/^[\w.\/-]+$/.test(v)))throw Error('pages.config.json github owner/repo/branch/path are required.');
// Shared state must pass the same validator the app uses before it is published.
const shared=await read(gh.path),built=await read('backend/built-preview.html');
const app=[...built.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(x=>x.includes('const B=window.PQ_BASE'));
const ctx={window:{},structuredClone};vm.createContext(ctx);vm.runInContext(await read('data.js'),ctx);
vm.runInContext(app.slice(app.indexOf(' const eventsById='),app.indexOf(' let state=empty()')).replace(/^/,'const B=window.PQ_BASE;')+'\nwindow.check=validateState;',ctx);
ctx.window.check(JSON.parse(shared));
// Shared costs must stay an encrypted box (passphrase-derived AES-GCM); never publish plain amounts.
let costsBox=null;try{costsBox=await read(gh.costsPath);}catch(e){if(e.code!=='ENOENT')throw e;}
if(costsBox!==null){const box=JSON.parse(costsBox);if(Object.keys(box).join()!=='v,salt,iter,iv,data'||box.v!==1||!(box.iter>=100000)||![box.salt,box.iv,box.data].every(x=>typeof x==='string'&&/^[A-Za-z0-9+/=]+$/.test(x)))throw Error(gh.costsPath+' must be an encrypted cost box');}
// Swap the Sites login client for the GitHub-backed one.
let html=built;
const cloud=await read('backend/src/cloud.js'),sync=await read('github-sync.js');
if(!html.includes(cloud))throw Error('Sites client not found in built preview');
html=html.replace(cloud,()=>sync.replace(/<\/script/gi,'<\\/script'));
html=html.replace('<body>',()=>'<body><script>window.PQ_GITHUB='+JSON.stringify(gh)+';</script>');
const panel=/<details id="cloud-panel"[\s\S]*?<\/details>/;
if(!panel.test(html))throw Error('Shared panel markup missing');
html=html.replace(panel,()=>`<details id="cloud-panel" class="cloud-bar"><summary class="cloud-summary"><span id="cloud-person" class="cloud-person">공유 일정 불러오는 중…</span><span class="cloud-entry">편집 · 새로고침 <span aria-hidden="true">⌄</span></span></summary><div class="cloud-actions"><button id="cloud-save" hidden>공유 저장</button><button id="cloud-reload">최신 내용 ↻</button><button id="cloud-signout" hidden>이 기기 편집 해제</button></div><form id="cloud-token-form" class="cloud-token"><label for="cloud-token">편집하려면 이 기기에 GitHub 토큰을 한 번 연결해요</label><div class="cost-input"><input id="cloud-token" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="github_pat_…"><button type="submit" class="primary shrink-0">연결</button></div><p class="cloud-help"><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">토큰 만들기 ↗</a> · 저장소 <b>${gh.owner}/${gh.repo}</b>만 선택, 권한은 Contents 읽기·쓰기. 토큰은 이 기기 브라우저에만 저장돼요.</p></form><p id="cloud-status" class="cloud-status" role="status">일정은 누구나 보고, GitHub를 연결한 기기에서만 수정할 수 있어요.</p></details>`);
html=html.replace(/<p id="cloud-privacy">[\s\S]*?<\/p>/,'<p id="cloud-privacy">공유 저장한 메모·체크는 공개 GitHub 저장소에 기록되고 이 링크를 여는 사람에게 보여요. 예약번호·여권번호는 적지 마세요. 비용은 비용 암호로 암호화해서 저장해요.</p>');
for(const [from,to] of [['보기 전용 · 로그인 후 완료 체크 ↗','보기 전용 · GitHub 연결 후 완료 체크'],['로그인 · 공유 관리','편집 연결 · 공유 저장'],['공유 저장과 Google 길찾기에는 인터넷이 필요해요. 로그인 없이 일정을 볼 수 있고, 허용된 계정만 내용을 수정할 수 있어요.','공유 저장과 Google 길찾기에는 인터넷이 필요해요. 로그인 없이 일정을 볼 수 있고, GitHub를 연결한 기기만 내용을 수정할 수 있어요.']])html=html.replace(from,to);
if(/chatgpt\.site|\/api\/state|\/login/.test(html.replace(/https:\/\/github\.com\/settings[^"]*/g,'')))throw Error('Public site still references the Sites server');
const output=path.join(root,'public-site');await fs.rm(output,{recursive:true,force:true});await fs.mkdir(output,{recursive:true});
await fs.writeFile(path.join(output,'index.html'),html);
await fs.writeFile(path.join(output,'state.json'),shared);
if(costsBox!==null)await fs.writeFile(path.join(output,'costs.json'),costsBox);
await fs.writeFile(path.join(output,'.nojekyll'),'');
await fs.copyFile(path.join(root,'publish/robots.txt'),path.join(output,'robots.txt'));
console.log('Built GitHub Pages site with GitHub-backed shared state ('+gh.path+').');
