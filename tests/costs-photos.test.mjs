import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
async function planner(stored=null){
 const els={},context={window:{},structuredClone,URL,localStorage:{getItem:key=>key==='phuquoc-costs-2026-v1'?stored:null},document:{getElementById:id=>els[id]??={}},pixelIcon:()=>''};
 vm.createContext(context);for(const name of ['data.js','bookings.js','geometry.js','photos.js'])vm.runInContext(await fs.readFile(new URL(name,root),'utf8'),context);
 const app=await fs.readFile(new URL('app.js',root),'utf8');
 vm.runInContext(app.slice(0,app.indexOf(" $('date-nav').addEventListener"))+' window.fixture={validateCosts,emptyCosts,costOf,bookingItems,renderBookings,getCosts:()=>costs};})();',context);
 return {api:context.window.fixture,R:context.window.PQ_BOOKINGS,P:context.window.PQ_PHOTOS,els};
}

test('Booking cards follow the trip order, each with a cost field; ticket prices stay out of public data',async()=>{
 const {api,R,els}=await planner();api.renderBookings();
 assert.deepEqual(Array.from(api.bookingItems(),b=>b.id),['outbound','vinpearl','vinpearl-combo','noska','honthom-cable-lunch','kiss-of-the-sea','yuju','inbound']);
 const html=els['booking-cards'].innerHTML;
 assert.equal((html.match(/data-booking="/g)||[]).length,8);assert.equal((html.match(/data-cost="/g)||[]).length,8);
 assert(!html.includes('undefined'));assert(els['cost-summary'].innerHTML.includes('8건 중 1건 입력'));
 assert.deepEqual({...api.costOf('yuju')},{amount:1500000,currency:'VND'});assert.equal(api.costOf('outbound'),null);
 assert(R.activities.slice(0,3).every(a=>!Object.hasOwn(a,'price')));
});

test('Cost records are validated on load and import; bad data never replaces the default',async()=>{
 const {api}=await planner(),ok=api.emptyCosts();
 ok.items.outbound={amount:612000,currency:'KRW'};ok.items.yuju=null;
 assert.deepEqual(JSON.parse(JSON.stringify(api.validateCosts(ok))),JSON.parse(JSON.stringify(ok)));
 for(const bad of [
  {...ok,items:{nope:{amount:1,currency:'KRW'}}},
  {...ok,items:{outbound:{amount:-1,currency:'KRW'}}},
  {...ok,items:{outbound:{amount:1,currency:'EUR'}}},
  {...ok,items:{outbound:{amount:1,currency:'KRW',note:'x'}}},
  {...ok,rates:{USD:0,VND:0.055}},
  {...ok,extra:true},
  JSON.parse('{"v":1,"items":{"__proto__":{"amount":1,"currency":"KRW"}},"rates":{"USD":1400,"VND":0.055}}')
 ])assert.throws(()=>api.validateCosts(bad));
 const loaded=await planner(JSON.stringify(ok));assert.equal(loaded.api.getCosts().items.outbound.amount,612000);assert.equal(loaded.api.costOf('yuju'),null);
 const broken=await planner('{"v":1,"items":{"outbound":{"amount":"lots"}}}');assert.deepEqual(JSON.parse(JSON.stringify(broken.api.getCosts())),JSON.parse(JSON.stringify(api.emptyCosts())));
});

test('Every place photo is a small local WebP with Commons attribution and a free licence',async()=>{
 const {P}=await planner(),app=await fs.readFile(new URL('app.js',root),'utf8');
 for(const [key,p] of Object.entries(P)){
  assert.match(p.src,new RegExp(`^assets/photos/${key}\\.webp$`));
  const size=(await fs.stat(new URL(p.src,root))).size;assert(size<60_000,key+' is '+size+' bytes');
  assert.match(p.source,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);assert(p.author.trim()&&p.caption.trim());
  assert.match(p.license,/^(CC0|CC BY(-SA)? [234]\.0)$/);if(p.license!=='CC0')assert.match(p.licenseUrl,/^https:\/\/creativecommons\.org\/licenses\//);
 }
 for(const [,key] of app.matchAll(/:'([a-z]+)'/g))if(['flight','airport','beach','safari','wonders','grand','cable','aqua','sunsettown','kissbridge','kissshow','nighttown','kem','anthoi','duong','sunset'].includes(key))assert(P[key],'missing photo '+key);
 const built=await fs.readFile(new URL('publish/index.html',root),'utf8');
 assert(!built.includes('assets/photos/'));assert(built.includes('data:image/webp;base64,'));
});
