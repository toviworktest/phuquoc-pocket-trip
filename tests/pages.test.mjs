import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
test('Public site reads shared state from the GitHub repo, edits only via a GitHub token, and leaks no secrets',async()=>{
 const html=await fs.readFile(new URL('public-site/index.html',root),'utf8');
 const config=JSON.parse(await fs.readFile(new URL('pages.config.json',root),'utf8'));
 assert(html.includes('window.PQ_GITHUB='+JSON.stringify(config.github)));
 assert(html.includes("fetch('https://api.github.com'+path"));assert(html.includes("fetch('state.json?t='"));assert(html.includes("credentials:'omit'"));
 assert(!/chatgpt\.site|\/api\/state|PQ_PUBLIC_SITE|signin-with-chatgpt/.test(html));
 assert(!html.includes('LOGIN_INVITES_JSON'));assert(!html.includes('BETTER_AUTH_SECRET'));assert(!/github_pat_[A-Za-z0-9]{20}|ghp_[A-Za-z0-9]{20}/.test(html));
 assert(!/[a-z0-9._%+-]+@(naver|gmail)\.com/i.test(html));assert(html.includes('YUJU SPA'));
 assert.equal(await fs.readFile(new URL('public-site/state.json',root),'utf8'),await fs.readFile(new URL(config.github.path,root),'utf8'));
});
test('Shared state file in the repository passes the planner validator',async()=>{
 const ctx={window:{},structuredClone,localStorage:{getItem:()=>null},document:{getElementById:()=>({})},pixelIcon:()=>''};vm.createContext(ctx);
 for(const name of ['data.js','bookings.js','geometry.js'])vm.runInContext(await fs.readFile(new URL(name,root),'utf8'),ctx);
 const app=await fs.readFile(new URL('app.js',root),'utf8');
 vm.runInContext(app.slice(0,app.indexOf(" $('date-nav').addEventListener"))+' window.fixture={validateState};})();',ctx);
 const state=JSON.parse(await fs.readFile(new URL('data/state.json',root),'utf8'));
 assert.doesNotThrow(()=>ctx.window.fixture.validateState(state));
 assert.throws(()=>ctx.window.fixture.validateState({...state,tripId:'other'}));
 assert.throws(()=>ctx.window.fixture.validateState({...state,overrides:{'d1-flight':{time:'19:00'}}}));
});
test('Shared costs are encrypted with the cost passphrase; the published box holds no plain amounts',async()=>{
 const win={addEventListener(){},PQ_GITHUB:{owner:'o',repo:'r',branch:'main',path:'data/state.json',costsPath:'data/costs.json'}};
 const ctx={window:win,localStorage:{getItem:()=>null},crypto:globalThis.crypto,TextEncoder,TextDecoder,btoa,atob,document:{}};vm.createContext(ctx);
 vm.runInContext(await fs.readFile(new URL('github-sync.js',root),'utf8'),ctx);
 const c=win.PQ_COST_CRYPTO,costs={v:1,items:{outbound:{amount:612000,currency:'KRW'}},rates:{USD:1400,VND:0.055}};
 const box=await c.seal('tripcost2026',costs);
 assert.equal(Object.keys(box).join(),'v,salt,iter,iv,data');assert(box.iter>=100000);assert(!JSON.stringify(box).includes('612000'));
 assert.deepEqual(JSON.parse(JSON.stringify(await c.open('tripcost2026',box))),costs);
 await assert.rejects(()=>c.open('wrong-pass',box));
 const config=JSON.parse(await fs.readFile(new URL('pages.config.json',root),'utf8'));
 try{const shared=JSON.parse(await fs.readFile(new URL(config.github.costsPath,root),'utf8'));assert.equal(Object.keys(shared).join(),'v,salt,iter,iv,data');assert(!/"amount"|KRW|VND|USD/.test(JSON.stringify(shared)));}
 catch(e){if(e.code!=='ENOENT')throw e;}
});
