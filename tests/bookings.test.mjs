import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
async function planner(){
 const els={},context={window:{},structuredClone,localStorage:{getItem:()=>null},document:{getElementById:id=>els[id]??={}},pixelIcon:()=>''};
 vm.createContext(context);for(const name of ['data.js','bookings.js','geometry.js'])vm.runInContext(await fs.readFile(new URL(name,root),'utf8'),context);
 const app=await fs.readFile(new URL('app.js',root),'utf8');
 vm.runInContext(app.slice(0,app.indexOf(" $('date-nav').addEventListener"))+' window.fixture={dayEvents,empty,displayNote,brief,dayPrep,renderBookings,renderChecks,baseline:invariant};})();',context);
 return {B:context.window.PQ_BASE,R:context.window.PQ_BOOKINGS,api:context.window.fixture,els};
}
test('Confirmed ticket overlays preserve dates, times, order, saved notes, and backup baseline',async()=>{
 const {B,R,api}=await planner(),before=JSON.stringify(B),state=api.empty();state.overrides['d2-safari']={time:'09:30',note:'내 메모'};
 for(const d of B.days){const events=api.dayEvents(d,state);assert.deepEqual(Array.from(events,e=>e.id),Array.from(d.events,e=>e.id));for(const e of events){assert.equal(e.time,state.overrides[e.id]?.time??(e.id==='d6-spa'?'예약 시각 확인 중':d.events.find(x=>x.id===e.id).time));assert(e.title);}}
 const d2=api.dayEvents(B.days[1],state);assert.equal(d2[0].status,'confirmed');assert.equal(d2[1].status,'confirmed');assert.equal(d2[0].personal,'내 메모');
 const d4=api.dayEvents(B.days[3],state);for(const id of ['d4-cable','d4-cableback','d4-show'])assert.equal(d4.find(e=>e.id===id).status,'confirmed');
 const aqua=d4.find(e=>e.id==='d4-aqua');assert.equal(aqua.status,'planned');assert.match(api.displayNote(aqua),/입장은 사진에서 포함 여부를 확인할 수 없어/);assert.match(api.brief(aqua),/런치 뷔페 2인 예약 확정/);
 assert(!api.displayNote(d4.find(e=>e.id==='d4-show')).includes('아직 예매 확정 아님'));assert.equal(JSON.stringify(B),before);assert.equal(api.baseline.days[1].events[0].status,'planned');
 assert.equal(R.activities.length,4);assert.equal(R.activities.find(a=>a.id==='vinpearl-combo').date,'2026-11-04 (수)');assert(R.activities.slice(0,3).every(a=>a.people===2));
});
test('Reservation cards, summary, prep and checklist include correct tickets without leaking payment records',async()=>{
 const {api,els,B,R}=await planner();api.renderBookings();api.renderChecks();
 const cards=els['booking-cards'].innerHTML;for(const id of ['vinpearl-combo','honthom-cable-lunch','kiss-of-the-sea','yuju'])assert(cards.includes('data-booking="'+id+'"'));
 assert(cards.includes('신장 100cm 이상 2명'));assert(cards.includes('뷔페'));assert(!cards.includes('undefined'));assert(R.activities.slice(0,3).every(a=>!Object.hasOwn(a,'price')));
 assert(els.reservations.innerHTML.includes('사파리 + 빈원더스'));assert(!els.reservations.innerHTML.includes('undefined'));assert(els.checklist.innerHTML.includes('왕복+런치 뷔페 성인 2명 예약 확정'));
 assert(api.dayPrep(B.days[1]).some(x=>x.includes('바우처')));assert(api.dayPrep(B.days[3]).some(x=>x.includes('런치 뷔페')));
});
