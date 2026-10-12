import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
async function planner(href='https://example.test/trip/?source=shared#check-group-0'){
 const els={},pushes=[],mapDays=[],location={};
 const setUrl=value=>{const url=new URL(value);location.href=url.href;location.search=url.search;};
 setUrl(href);
 function element(id){
  const active=new Set(),attributes={};
  return {id,dataset:{},hidden:false,innerHTML:'',attributes,
   classList:{toggle:(name,on)=>on?active.add(name):active.delete(name),contains:name=>active.has(name)},
   setAttribute:(name,value)=>attributes[name]=value,querySelectorAll:()=>[],
   focus(options){this.focusOptions=options;},scrollIntoView(){}};
 }
 const html=await fs.readFile(new URL('index.html',root),'utf8');
 const views=[...html.matchAll(/<section id="(view-[^"]+)"/g)].map(([,id])=>els[id]=element(id));
 const buttons=[...html.matchAll(/<nav class="(mobile-nav|view-nav)"[^>]*>([\s\S]*?)<\/nav>/g)].flatMap(([,nav,content])=>
  [...content.matchAll(/<button\b[^>]*data-view="([^"]+)"[^>]*>/g)].map(([,view])=>({...element(),dataset:{view},closest:selector=>selector==='.mobile-nav'&&nav==='mobile-nav'?{}:null})));
 const document={body:{dataset:{}},activeElement:null,getElementById:id=>els[id]??=element(id),querySelectorAll:selector=>selector==='.view'?views:selector==='[data-view]'?buttons:[]};
 const context={window:{},document,location,URL,URLSearchParams,structuredClone,pixelIcon:()=>'',localStorage:{getItem:()=>null},
  history:{pushState:(_state,_title,url)=>{pushes.push(String(url));setUrl(url);}},
  requestAnimationFrame:fn=>fn(),PQMap:{refresh(){},setDay:day=>mapDays.push(day.dayId)}};
 vm.createContext(context);
 for(const name of ['data.js','bookings.js','geometry.js'])vm.runInContext(await fs.readFile(new URL(name,root),'utf8'),context);
 const source=await fs.readFile(new URL('app.js',root),'utf8');
 vm.runInContext(source.slice(0,source.indexOf(" $('date-nav').addEventListener"))+` window.fixture={readNavigation,writeNavigation,showView,restoreNavigation,renderChecks,
  setNavigation:(day,view)=>{selected=day;currentView=view;},getNavigation:()=>({day:selected,view:currentView}),
  setChecked:(id,value)=>{state.checked[id]=value;},getState:()=>structuredClone(state)};})();`,context);
 return {api:context.window.fixture,B:context.window.PQ_BASE,els,buttons,document,location,pushes,mapDays,setUrl};
}
const plain=value=>JSON.parse(JSON.stringify(value));

test('Shared navigation accepts trip dates and known screens, rejecting untrusted route values',async()=>{
 const {api,B}=await planner();
 for(const day of B.days)for(const view of ['map','plan','bookings','research','checklist','backup','more'])
  assert.deepEqual(plain(api.readNavigation('?day='+day.id+'&view='+view)),{day:day.id,view});
 for(const query of ['', '?day=2027-01-01&view=unknown','?day=__proto__&view=constructor','?day=%3Cscript%3E&view=%3Cimg%20onerror%3Dalert(1)%3E','?day=%E0%A4%A&view=%00'])
  assert.deepEqual(plain(api.readNavigation(query)),{day:B.days[0].id,view:'map'});
 assert.deepEqual(plain(api.readNavigation('?day=2026-11-06&view=unknown')),{day:'2026-11-06',view:'map'});
 assert.deepEqual(plain(api.readNavigation('?day=unknown&view=checklist')),{day:B.days[0].id,view:'checklist'});
});

test('Navigation retains shared-link parameters and anchors without duplicate history or restore writes',async()=>{
 const {api,location,pushes,setUrl,mapDays}=await planner();
 const original=JSON.stringify(api.getState());
 api.setNavigation('2026-11-06','plan');api.writeNavigation();
 const first=location.href,url=new URL(first);
 assert.equal(url.searchParams.get('source'),'shared');assert.equal(url.hash,'#check-group-0');
 assert.equal(url.searchParams.get('day'),'2026-11-06');assert.equal(url.searchParams.get('view'),'plan');
 api.writeNavigation();assert.equal(pushes.length,1);
 api.setNavigation('2026-11-04','bookings');api.writeNavigation();assert.equal(pushes.length,2);
 setUrl(first);api.restoreNavigation();
 assert.deepEqual(plain(api.getNavigation()),{day:'2026-11-06',view:'plan'});
 assert.equal(mapDays.at(-1),'2026-11-06');assert.equal(pushes.length,2);
 setUrl(pushes[1]);api.restoreNavigation();
 assert.deepEqual(plain(api.getNavigation()),{day:'2026-11-04',view:'bookings'});
 assert.equal(pushes.length,2);assert.equal(JSON.stringify(api.getState()),original);
});

test('Mobile map and itinerary have separate selection, with one active bottom destination',async()=>{
 const {api,buttons,els,document}=await planner();
 const mobile=buttons.filter(button=>button.closest('.mobile-nav'));
 assert.equal(mobile.length,5);
 for(const view of ['map','plan','bookings','checklist','more','research','backup']){
  api.showView(view);
  const expected=['research','backup'].includes(view)?'more':view;
  assert.deepEqual(mobile.filter(button=>button.classList.contains('active')).map(button=>button.dataset.view),[expected]);
  assert.deepEqual(mobile.filter(button=>button.attributes['aria-pressed']==='true').map(button=>button.dataset.view),[expected]);
  assert.equal(document.body.dataset.screen,view);
  assert.equal(els['route-panel'].hidden,!['map','plan'].includes(view));
  assert.equal(els['day-header'].hidden,!['map','plan'].includes(view));
  assert.equal(els['view-plan'].hidden,!['map','plan'].includes(view));
 }
});

test('Re-rendering checklist keeps expanded details, completion and checkbox focus',async()=>{
 const {api,B,els,document}=await planner();
 api.renderChecks();
 const expandedId='check-details-entry-form';
 els.checklist.querySelectorAll=selector=>selector==='details[open]'?[{id:expandedId}]:[];
 document.activeElement={dataset:{check:'grab'}};
 api.setChecked('grab',true);api.renderChecks();
 const html=els.checklist.innerHTML;
 assert.equal((html.match(/class="check-details"/g)||[]).length,B.checklist.length);
 const details=[...html.matchAll(/<details\b[^>]*id="([^"]+)"([^>]*)>/g)];
 assert.equal(new Set(details.map(([,id])=>id)).size,B.checklist.length);
 assert.deepEqual(details.filter(([,id,attributes])=>/\bopen\b/.test(attributes)).map(([,id])=>id),[expandedId]);
 assert.match(html,/<input\b[^>]*id="check-grab"[^>]*\bchecked/);
 assert.deepEqual(plain(els['check-grab'].focusOptions),{preventScroll:true});
 assert.equal(api.getState().checked.grab,true);
 for(const label of html.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g))assert(!label[1].includes('<a '));
 assert(html.includes('https://prearrival.immigration.gov.vn/'));
});
