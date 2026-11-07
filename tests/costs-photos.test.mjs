import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
async function planner(stored=null){
 const els={},context={window:{},structuredClone,URL,localStorage:{getItem:key=>key==='phuquoc-costs-2026-v1'?stored:null,setItem(){}},document:{getElementById:id=>els[id]??={}},pixelIcon:()=>''};
 vm.createContext(context);for(const name of ['data.js','bookings.js','geometry.js','photos.js'])vm.runInContext(await fs.readFile(new URL(name,root),'utf8'),context);
 const app=await fs.readFile(new URL('app.js',root),'utf8');
 vm.runInContext(app.slice(0,app.indexOf(" $('date-nav').addEventListener"))+' window.fixture={validateCosts,emptyCosts,costOf,bookingItems,renderBookings,importSpend,getCosts:()=>costs};})();',context);
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

test('Trip spending is validated, imported idempotently and added to the trip total',async()=>{
 const {api,els}=await planner();
 const item=(id,amount,extra={})=>({id,date:'2026-11-05',title:'점심',category:'식당·카페',method:'현금',amount,currency:'VND',...extra});
 const ok=api.emptyCosts();ok.spend=[item('sp-a',475000,{time:'13:41'}),item('sp-b',138000,{note:'카페'})];
 assert.equal(api.validateCosts(ok).spend.length,2);
 for(const bad of [[item('sp-a',1),item('sp-a',2)],[item('sp-x',1,{category:'술집'})],[item('sp-x',1,{method:'포인트'})],[item('sp-x',-1)],[item('SP X',1)],[item('sp-x',1,{date:'2025-01-01'})],[item('sp-x',1,{time:'25:00'})],[item('sp-x',1,{extra:true})]])
  assert.throws(()=>api.validateCosts({...api.emptyCosts(),spend:bad}));
 const file=JSON.stringify({rates:{VND:0.0536},spend:[item('sp-1',650000),item('sp-2',1350000)]});
 const first=api.importSpend(file);assert.equal(first.added,2);assert.equal(first.updated,0);
 const again=api.importSpend(file);assert.equal(again.added,0);assert.equal(again.updated,2);
 assert.equal(api.getCosts().spend.length,2);assert.equal(api.getCosts().rates.VND,0.0536);
 assert.throws(()=>api.importSpend('not json'));assert.throws(()=>api.importSpend('{"spend":[]}'));
 api.renderBookings();const html=els['cost-summary'].innerHTML;
 assert(html.includes('여행 중 지출'));assert(html.includes('2건 · 200.0만동'));
 // 2,000,000동 × 0.0536 = 107,200원 spending + YUJU listed 1,500,000동 × 0.0536 = 80,400원 booking.
 assert(html.includes('107,200원'));assert(html.includes('80,400원'));assert(html.includes('187,600원'));
 assert(els.spend.innerHTML.includes('11/5 (목)'));assert(!els.spend.innerHTML.includes('undefined'));
});
