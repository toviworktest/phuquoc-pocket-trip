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
