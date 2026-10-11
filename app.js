(() => {
 'use strict';
 const B=window.PQ_BASE,G=window.PQ_GEOMETRY,KEY='phuquoc-personal-2026-v1';
 const $=id=>document.getElementById(id), esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const modes={walk:'도보',car:'차량 · 셔틀',stay:'이동 없음',flight:'항공',cable:'케이블카',boat:'스피드보트'};
 const status={confirmed:'확정',planned:'방문 예정',check:'확인 필요'};
 const eventsById=Object.fromEntries(B.days.flatMap(d=>d.events.map(e=>[e.id,e])));
 const empty=()=>({v:1,tripId:B.tripId,overrides:{},extras:[],checked:{},dayNotes:{}});
 const invariant={tripId:B.tripId,reservations:B.reservations,days:B.days.map(d=>({id:d.id,events:d.events.map(e=>({id:e.id,title:e.title,place:e.place??null,mode:e.mode,status:e.status,time:e.fixedTime?e.time:null,zone:e.zone??null}))}))};
 const canon=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 const safeObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>!['__proto__','constructor','prototype'].includes(k));
 const assert=(v,m)=>{if(!v)throw Error(m)};
 const textValue=(v,max)=>typeof v==='string'&&v.length<=max;
 const dayIds=new Set(B.days.map(d=>d.id)),checkIds=new Set(B.checklist.map(c=>c.id));
 function validateState(s){
  assert(safeObject(s)&&s.v===1&&s.tripId===B.tripId,'이 여행의 백업 파일이 아닙니다.');
  assert(Object.keys(s).every(k=>['v','tripId','overrides','extras','checked','dayNotes'].includes(k)),'지원하지 않는 데이터 항목이 있습니다.');
  assert(safeObject(s.overrides)&&safeObject(s.checked)&&safeObject(s.dayNotes)&&Array.isArray(s.extras),'백업 구조를 확인하세요.');
  assert(s.extras.length<=100,'추가 일정은 최대 100개입니다.');
  for(const [id,o] of Object.entries(s.overrides)){
   const base=eventsById[id];assert(base&&safeObject(o),'알 수 없는 기본 일정입니다.');
   assert(Object.keys(o).every(k=>['time','note'].includes(k)),'고정 일정 필드는 변경할 수 없습니다.');
   assert(o.note===undefined||textValue(o.note,3000),'메모가 너무 깁니다.');
   assert(o.time===undefined||textValue(o.time,50),'시간 형식을 확인하세요.');
   assert(!base.fixedTime||o.time===undefined||o.time===base.time,'고정 항공시간은 변경할 수 없습니다.');
  }
  const ids=new Set();
  for(const e of s.extras){
   assert(safeObject(e)&&Object.keys(e).every(k=>['id','day','after','title','time','place','query','mode','note'].includes(k)),'추가 일정 구조를 확인하세요.');
   assert(typeof e.id==='string'&&/^extra-[a-z0-9-]+$/.test(e.id)&&!ids.has(e.id),'추가 일정 식별자가 중복되거나 잘못되었습니다.');ids.add(e.id);
   assert(dayIds.has(e.day),'여행 기간 밖의 일정입니다.');
   assert(e.after===''||B.days.find(d=>d.id===e.day).events.some(b=>b.id===e.after),'추가 위치를 확인하세요.');
   assert(textValue(e.title,100)&&e.title.trim()&&textValue(e.time,50)&&textValue(e.note,3000)&&textValue(e.query,200),'일정 이름·시간·메모를 확인하세요.');
   assert(e.place===''||Object.hasOwn(B.places,e.place),'장소를 확인하세요.');
   assert(['car','walk','boat','cable','stay'].includes(e.mode),'이동수단을 확인하세요.');
   assert(!/typhoon|타이푼/i.test(e.title+' '+e.query),'Typhoon World는 인수인계에서 제외한 일정입니다.');
  }
  for(const [id,val] of Object.entries(s.checked))assert(checkIds.has(id)&&typeof val==='boolean','확인 체크 데이터가 잘못되었습니다.');
  for(const [id,val] of Object.entries(s.dayNotes))assert(dayIds.has(id)&&textValue(val,3000),'날짜 메모가 잘못되었습니다.');
  return structuredClone(s);
 }
 let state=empty(),selected=B.days[0].id,currentView='plan',activeEvent=null,editing=null,toastTimer;
 try{const raw=localStorage.getItem(KEY);if(raw)state=validateState(JSON.parse(raw));}
 catch(e){$('storage-warning').hidden=false;$('storage-warning').textContent='기존 저장 내용을 불러오지 못했습니다. 기본 일정을 표시합니다. 기존 데이터는 덮어쓰기 전에 백업을 확인하세요. '+e.message;}
 function save(){
  try{localStorage.setItem(KEY,JSON.stringify(state));$('save-state').textContent='방금 저장됨 · 이 브라우저';}
  catch(e){$('storage-warning').hidden=false;$('storage-warning').textContent='브라우저 저장을 사용할 수 없습니다. 화면을 닫기 전에 JSON 백업을 내려받으세요.';}
 }
 function toast(t){$('toast').textContent=t;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3300);}
 function currentDay(){return B.days.find(d=>d.id===selected);}
 const activityFor=e=>window.PQ_BOOKINGS.eventUpdates?.[e.id]||window.PQ_BOOKINGS.activities?.find(a=>a.eventId===e.id);
 const dayPrep=d=>window.PQ_BOOKINGS.prepUpdates?.[d.id]||d.prep;
 function dayEvents(day,s=state){
  const out=s.extras.filter(e=>e.day===day.id&&e.after==='').map(e=>({...e,custom:true,status:'planned'}));
  for(const e of day.events){const a=activityFor(e);out.push({...e,...(a?{title:a.title||e.title,status:a.status||'confirmed',query:a.query||e.query}:{}),time:s.overrides[e.id]?.time??a?.time??e.time,personal:s.overrides[e.id]?.note??''});out.push(...s.extras.filter(x=>x.day===day.id&&x.after===e.id).map(x=>({...x,custom:true,status:'planned'})));}
  return out;
 }
 function getPlace(e){return e?.place?{...B.places[e.place],...G.places[e.place],id:e.place}:e?.query?{name:e.title,query:e.query,region:e.custom?'추가':'위치 확인 중'}:null;}
 const searchLink=p=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.query||p.name)+(p.googlePlaceId?'&query_place_id='+encodeURIComponent(p.googlePlaceId):'');
 function direction(from,to,mode){return 'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(from.query||from.name)+'&destination='+encodeURIComponent(to.query||to.name)+'&travelmode='+(mode==='walk'?'walking':'driving')+(from.googlePlaceId?'&origin_place_id='+encodeURIComponent(from.googlePlaceId):'')+(to.googlePlaceId?'&destination_place_id='+encodeURIComponent(to.googlePlaceId):'');}
 function getLegs(day){
  const out=[];let prev=day.start?getPlace({place:day.start}):null,prevName=prev?.name;
  for(const e of dayEvents(day)){
   const to=getPlace(e);
   if(e.mode!=='flight'&&(prevName||['boat','cable'].includes(e.mode))&&!(prev&&to&&prev.id===to.id)&&e.mode!=='stay'){
    const route=prev&&to?G.routes.find(r=>r.from===prev.id&&r.to===to.id&&r.mode===e.mode):null;
    out.push({eventId:e.id,from:prev,to,fromName:prevName||'출발지 미정',toName:to?.name||e.title,mode:e.mode,route});
   }
   prev=to;prevName=to?.name||e.title;
  }
  return out;
 }
 function timeWarnings(day,s=state){
  const warnings=[];let last=null;
  for(const e of dayEvents(day,s)){
   if(e.zone==='한국')continue;
   const match=/^(\d{1,2}):(\d{2})$/.exec(e.time);
   if(match){const minute=+match[1]*60+(+match[2]);if(+match[1]>23||+match[2]>59){warnings.push(e.title+' 시간 형식을 확인하세요.');continue;}
    if(last&&minute<last.minute)warnings.push(e.title+'의 시간이 앞선 '+last.title+'보다 이릅니다. 방문 순서는 유지됩니다.');last={minute,title:e.title};
   }
   if(day.id==='2026-11-07'&&e.custom&&e.place&&B.places[e.place].region!=='남부')warnings.push('11/7은 호핑 후 남부에서 쉬는 원칙입니다. 추가 장소와 충돌합니다.');
  }
  return warnings;
 }
 const unresolvedPlaces=new Set(['sen','bun','kingkong']);
 const shortNames={
  'd1-flight':'한국 출발','d1-arrive':'푸꾸옥 도착','d1-hotel':'빈펄 체크인',
  'd2-safari':'사파리','d2-wonders':'씨쉘 아쿠아리움','d2-pool':'수영장 & 해변','d2-grand':'그랜드월드','d2-return':'빈펄 복귀',
  'd3-checkout':'빈펄 체크아웃','d3-airport':'공항 드랍','d3-sen':'나항센 후보','d3-noska':'노스카 체크인','d3-walk':'선셋타운 산책','d3-return':'노스카 복귀',
  'd4-cable':'케이블카역','d4-aqua':'혼똔 · 물놀이','d4-cableback':'케이블카 복귀','d4-shower':'샤워 & 휴식','d4-massage':'남부 마사지','d4-sunset':'선셋 카페','d4-market':'야시장','d4-show':'키스 오브 더 씨','d4-return':'노스카 복귀',
  'd5-pickup':'투어 픽업','d5-islands':'3섬 호핑','d5-return':'샤워 & 휴식','d5-evening':'선셋타운 산책','d5-night':'노스카 복귀',
  'd6-checkout':'노스카 체크아웃','d6-bun':'분꽈이 점심','d6-walk':'즈엉동 산책','d6-shop':'킹콩마트','d6-spa':'마사지 & 샤워','d6-airport':'공항 도착 목표','d6-flight':'푸꾸옥 출발','d7-arrive':'한국 도착'
 };
 const briefs={
  'd1-flight':'한국 현지 18:00 출발. 항공편명 확인이 필요해요.',
  'd1-arrive':'수하물을 찾고 픽업 미팅. 베트남은 한국보다 2시간 느려요.',
  'd1-hotel':'늦은 체크인 후 푹 쉬기. 공항 픽업 배차는 확인 중이에요.',
  'd2-safari':'사파리 차량 체험부터! 숙소 셔틀 시간은 확인해요.',
  'd2-wonders':'씨쉘 아쿠아리움 중심으로. 타이푼 워터파크는 제외해요.',
  'd2-pool':'리조트에서 물놀이하고, 샤워와 환복 후 다시 출발.',
  'd2-grand':'베니스 운하와 야경 산책. 공연은 당일 운영을 확인해요.',
  'd2-return':'복귀 셔틀 막차를 챙기고 숙소로 돌아와요.',
  'd3-checkout':'조식 후 체크아웃. 공항 드랍 시간을 먼저 확인해요.',
  'd3-airport':'호텔 드랍을 이용할 계획. 배차는 아직 미확정이에요.',
  'd3-sen':'쌀국수·반쎄오 점심 후보. 지점과 캐리어 처리를 확인해요.',
  'd3-noska':'남부에서 3박 시작! 이른 체크인 가능 여부는 확인해요.',
  'd3-walk':'선셋타운에서 가벼운 저녁과 노을 산책.',
  'd3-return':'노스카로 돌아와 쉬어가는 시간.',
  'd4-cable':'노스카에서 도보 이동 계획. 실제 운행시간은 확인해요.',
  'd4-aqua':'물놀이·점심·휴식. 케이블카 포함권 조건을 확인해요.',
  'd4-cableback':'막차 직전까지 머물지 않기. 마지막 운행은 확인 중.',
  'd4-shower':'호텔에서 샤워와 환복. 저녁 외출 전 충분히 쉬어요.',
  'd4-massage':'업체는 고르는 중. 선셋과 시간이 겹치지 않게 조정해요.',
  'd4-sunset':'선셋타운 안에서 고를 예정. 장소와 좌석은 아직 미정.',
  'd4-market':'야시장 구경과 먹거리. 먹고 싶은 메뉴 판매점을 확인해요.',
  'd4-show':'공연·불꽃놀이 계획. 당일 운영과 티켓은 확인 중이에요.',
  'd4-return':'공연 후 걸어서 숙소로. 계단과 출입구를 확인해요.',
  'd5-pickup':'호텔 앞 또는 인근 집결. 업체 선정 후 확정해요.',
  'd5-islands':'스노클링·해변·점심. 업체, 방문 섬과 순서는 미정이에요.',
  'd5-return':'16–17시 복귀 예상. 투어 종료와 호텔 도착은 달라요.',
  'd5-evening':'남부에서 저녁과 산책. 중부로 올라가지 않아요.',
  'd5-night':'오늘도 남부에서 푹 쉬어요.',
  'd6-checkout':'체크아웃 후 중부로. 마사지숍 사전 짐 보관은 확인 중.',
  'd6-bun':'분꽈이로 점심. 즈엉동 지점 주소를 먼저 확정해요.',
  'd6-walk':'로컬 거리와 카페 산책. 딘까우는 여유가 있으면.',
  'd6-shop':'과자·후추·소스·기념품. 지점과 이동시간은 확인해요.',
  'd6-spa':'90–120분 마사지. 짐 보관·샤워·공항 샌딩이 필요해요.',
  'd6-airport':'20:00–20:30 도착 목표. 차량 예약 시간은 아니에요.',
  'd6-flight':'베트남 현지 23:15 출발. 귀국 항공시간은 고정이에요.',
  'd7-arrive':'한국 현지 06:35. 여행의 여운을 안고 집으로 ♡'
 };

 const updatedNotes={
 'd1-flight':'제주항공 7C2315 · 인천(ICN) → 푸꾸옥(PQC). 한국 현지 18:00 출발 확정. 알림에 위탁수하물 기본 15kg 표기.',
 'd1-arrive':'푸꾸옥(PQC) 도착 22:15는 기존 인수인계 기준. 새 제주항공 알림에는 출발시각만 표기. 입국·수하물 수령 후 픽업 미팅.',
 'd1-hotel':'예약 메일: 11/3 15:00 체크인 시작, 11/5 12:00 체크아웃. Deluxe (twin) · 객실 1개 · 성인 2명. 실제 체크인은 22:15 착륙 이후이며 자정을 넘을 수 있음. 공항 이동은 특별 요청으로 남겨져 있으나 배차 확정은 아님.',
 'd3-checkout':'예약 메일 기준 11/5 12:00까지 체크아웃. 호텔 공항 드랍 시간·배차는 따로 확인. 조식 후 이동 준비.',
 'd3-noska':'예약 메일 기준 11/5 14:00부터 체크인, 11/8 12:00까지 체크아웃. Window Suite Fireworks Ocean View · 1객실 · 3박 · 성인 2명. 이른 체크인과 특별 요청은 별도 확인.',
 'd6-checkout':'예약 메일 기준 11/8 12:00까지 체크아웃. 오전에 나가는 기존 계획은 유지. YUJU SPA의 짐 보관 가능 답변은 확인했으며, 점심 전 맡길 수 있는지와 예약 날짜·방문 지점은 추가 확인해요.',
 'd6-flight':'제주항공 7C2316 · 푸꾸옥(PQC) → 인천(ICN). 베트남 현지 23:15 출발 확정. 위탁수하물 기본 15kg 표기.',
 'd7-arrive':'인천(ICN) 도착. 한국 현지 11/9 06:35는 기존 인수인계 기준이며 새 항공 알림에는 도착시각이 없음.'
 };
 const displayNote=e=>activityFor(e)?.note||updatedNotes[e.id]||e.note;
 Object.assign(briefs,{'d1-flight':'제주항공 7C2315 · 인천 출발. 위탁수하물 기본 15kg.','d1-hotel':'빈펄 Deluxe (twin) · 2박. 늦은 체크인과 공항 픽업 배차 확인.','d3-checkout':'11/5 12:00까지 체크아웃. 공항 드랍 시간은 확인해요.','d3-noska':'14:00부터 체크인. Window Suite Fireworks Ocean View · 3박.','d6-checkout':'11/8 12:00까지 체크아웃. 오전 출발 계획은 그대로예요.','d6-flight':'제주항공 7C2316 · 인천행. 위탁수하물 기본 15kg.','d7-arrive':'인천 도착! 한국 현지 06:35는 기존 인수인계 기준이에요.'});
 const iconFor=e=>({safari:'paw',wonders:'fish',vinpearl:'bed',noska:'bed',grand:'castle',sen:'food',bun:'food',kingkong:'bag',duong:'walk',cable:'cable',aqua:'palm',sunset:'sun',market:'food',kiss:'star',airport:'plane'}[e.place]||(/massage|spa/.test(e.id)?'flower':/sunset/.test(e.id)?'sun':e.mode==='flight'?'plane':e.mode==='boat'?'boat':e.mode==='car'?'car':'star'));
 const smallTitle=e=>activityFor(e)?.name||shortNames[e.id]||e.title;
 const brief=e=>activityFor(e)?.brief||briefs[e.id]||e.note||'새로 더한 여행 조각이에요.';
 function renderDates(){
  $('date-nav').innerHTML=B.days.map((d,i)=>`<button data-day="${d.id}" class="${selected===d.id?'active':''}" aria-pressed="${selected===d.id}" aria-label="11월 ${Number(d.id.slice(-2))}일 ${d.weekday}요일 ${d.title}"><small>DAY ${String(i+1).padStart(2,'0')}</small><strong>11.${d.id.slice(-2)}</strong><em>${d.weekday}</em></button>`).join('');
 }
 function renderPlan(){
  const d=currentDay(),evs=dayEvents(d);if(!evs.some(e=>e.id===activeEvent))activeEvent=evs[0].id;renderDates();
  $('day-kicker').textContent=`DAY ${String(B.days.indexOf(d)+1).padStart(2,'0')} / ${d.region}`;
  $('day-title').textContent=d.title;$('day-intro').textContent=d.intro;
  const stickers=[['plane','여행 시작!'],['paw','북부 탐험'],['bag','남부로 이사'],['palm','물놀이 DAY'],['boat','바다 모험'],['save','추억 저장'],['heart','다녀왔어요']];
  const st=stickers[B.days.indexOf(d)];$('day-sticker').innerHTML=pixelIcon(st[0],22)+esc(st[1]);
  $('stay').innerHTML=`<span>${pixelIcon('bed',18)} ${esc(d.stay)}</span><span>11월 ${Number(d.id.slice(-2))}일 ${d.weekday}요일</span>`;
  $('prep').innerHTML=dayPrep(d).map(p=>`<li>${esc(p)}</li>`).join('');$('day-note').value=state.dayNotes[d.id]||'';
  $('quest-count').textContent=evs.length;
  $('timeline').innerHTML=evs.map((e,i)=>{const p=getPlace(e);return `<article class="event ${activeEvent===e.id?'active':''}" data-id="${esc(e.id)}"><details class="quest-details"><summary class="quest-summary"><span class="quest-time"><span class="quest-number">QUEST ${String(i+1).padStart(2,'0')}</span><strong>${esc(e.time||'시간 미정')}</strong><small>${e.zone?esc(e.zone)+' 현지':e.fixedTime?'확정 시간':'계획 시간대'}</small></span><div class="quest-content"><div class="quest-heading"><span class="quest-icon" aria-hidden="true">${pixelIcon(iconFor(e),22)}</span><h3>${esc(e.title)}</h3><span class="badge ${e.status}">${e.custom?'추가 일정':status[e.status]}</span></div><p class="event-brief">${esc(brief(e))}</p>${e.personal?'<span class="quest-note-marker">♡ 메모 있음</span>':''}</div><span class="quest-chevron" aria-hidden="true"></span></summary><div class="quest-expanded"><p class="event-note">${esc(displayNote(e))}</p>${e.personal?`<p class="personal-note">♡ ${esc(e.personal)}</p>`:''}<span class="transport">${pixelIcon(e.mode==='stay'?'bed':e.mode==='flight'?'plane':e.mode,16)} ${esc(modes[e.mode])}${p?.region?' · '+esc(p.region):''}</span><div class="event-actions"><button data-spot="${esc(e.id)}">지도에서 보기</button>${p?`<a class="place-link" href="${esc(searchLink(p))}" target="_blank" rel="noopener">${unresolvedPlaces.has(e.place)?'지점 검색':'Google 지도'} ↗</a>`:''}<button class="edit-button" data-edit="${esc(e.id)}">${e.fixedTime?'메모 편집':'시간 · 메모 편집'}</button></div></div></details></article>`}).join('');
  const warnings=timeWarnings(d);$('conflicts').hidden=!warnings.length;$('conflicts').textContent=warnings.join(' ');
  renderLegs();renderAdventure();
 }
 function validLandLeg(l){return ['car','walk'].includes(l.mode)&&l.from&&l.to&&!unresolvedPlaces.has(l.from.id)&&!unresolvedPlaces.has(l.to.id);}
 function renderLegs(){
  const legs=getLegs(currentDay());
  $('legs').innerHTML=legs.length?legs.map(l=>{const land=['car','walk'].includes(l.mode);return `<div class="leg"><div class="leg-top"><span class="leg-title">${esc(l.fromName)} → ${esc(l.toName)}</span>${validLandLeg(l)?`<a href="${esc(direction(l.from,l.to,l.mode))}" target="_blank" rel="noopener">길찾기 ↗</a>`:l.to&&unresolvedPlaces.has(l.to.id)?`<a href="${esc(searchLink(l.to))}" target="_blank" rel="noopener">지점 검색 ↗</a>`:''}</div><p>${esc(modes[l.mode])} · ${l.route?`${(l.route.distance/1000).toFixed(1)}km / 약 ${Math.ceil(l.route.duration/60)}분 · 교통·대기 미포함`:land?(validLandLeg(l)?'Google 지도에서 경로·시간 확인':'지점·업체 선택 후 경로 확인'):l.mode==='cable'?'케이블카 구간 · 도로 경로 미사용':l.mode==='boat'?'해상 구간 · 업체·기상에 따라 변경':'이동 확인'}</p></div>`}).join(''):'<div class="leg"><p>이 날은 현지 도로 이동 구간이 없어요. 항공시간을 확인해 주세요.</p></div>';
 }
 function renderAdventure(){
  const d=currentDay(),evs=dayEvents(d),idx=Math.max(0,evs.findIndex(e=>e.id===activeEvent)),e=evs[idx];activeEvent=e.id;
  PQMap.setDay({dayId:d.id,events:evs,activeId:activeEvent,onSelect:focusStop});
  $('map-town').hidden=!evs.some(ev=>G.places[ev.place]?.region==='남부');
  const unplaced=evs.map((ev,i)=>({e:ev,i})).filter(x=>!G.places[x.e.place]);
  $('unplaced-spots').hidden=!unplaced.length;
  $('unplaced-spots').innerHTML=unplaced.length?'<span class="pending-label">지도 밖 · 위치 확인 중인 장소</span>'+unplaced.map(x=>`<button data-focus="${esc(x.e.id)}" class="${x.e.id===activeEvent?'active':''}" aria-pressed="${x.e.id===activeEvent}">${pixelIcon(iconFor(x.e),15)} ${x.i+1}. ${esc(smallTitle(x.e))} <span>· ${x.e.zone==='한국'?'인천 · 지도 범위 밖':unresolvedPlaces.has(x.e.place)?'지점 확인':activityFor(x.e)?'핀 위치 확인 중':'위치 미정'}</span></button>`).join(''):'';
  $('time-trail').innerHTML=evs.map((ev,i)=>`<button class="trail-stop ${ev.id===activeEvent?'active':''}" data-focus="${esc(ev.id)}" aria-pressed="${ev.id===activeEvent}"><span class="trail-top">${pixelIcon(iconFor(ev),18)} STOP ${String(i+1).padStart(2,'0')}</span><strong>${esc(smallTitle(ev))}</strong><small>${esc(ev.time||'시간 미정')}${ev.zone?' · '+esc(ev.zone):''}</small></button>`).join('');
  const p=getPlace(e),leg=getLegs(d).find(l=>l.eventId===e.id);let mapAction='';
  if(leg&&validLandLeg(leg))mapAction=`<a class="google-button" href="${esc(direction(leg.from,leg.to,leg.mode))}" target="_blank" rel="noopener">${pixelIcon('map',17)} ${leg.mode==='walk'?'도보':'차량'} 길찾기 ↗</a>`;
  else if(p)mapAction=`<a class="google-button" href="${esc(searchLink(p))}" target="_blank" rel="noopener">${pixelIcon('map',17)} ${unresolvedPlaces.has(e.place)?'지점 검색':'Google 장소'} ↗</a>`;
  else mapAction=`<span class="focus-missing">${e.mode==='flight'?(e.id==='d1-flight'?'ICN → PQC · 7C2315':'PQC → ICN · 7C2316'):'장소 확정 후 지도 연결'}</span>`;
  $('stop-focus').innerHTML=`<div class="focus-top"><span class="focus-order">STOP ${String(idx+1).padStart(2,'0')} / ${String(evs.length).padStart(2,'0')}</span><span class="focus-controls"><button data-step="-1" aria-label="이전 장소" ${idx===0?'disabled':''}>←</button><button data-step="1" aria-label="다음 장소" ${idx===evs.length-1?'disabled':''}>→</button></span></div><div class="focus-icon">${pixelIcon(iconFor(e),42)}</div><p class="focus-time">${esc(e.time||'시간 미정')} <small>${e.zone?esc(e.zone)+' 현지':'계획 시간대'}</small></p><h2 class="focus-title">${esc(smallTitle(e))}</h2><p class="focus-note">${esc(brief(e))}</p><div class="focus-actions">${mapAction}${p&&G.places[e.place]?`<button class="text-button" data-locate="${esc(e.id)}">이 장소 확대 ⌖</button>`:''}<button class="text-button" data-jump="${esc(e.id)}">상세 일정 ↓</button></div>`;
  document.querySelectorAll('#timeline .event').forEach(el=>el.classList.toggle('active',el.dataset.id===activeEvent));
 }
 function focusStop(id){if(!dayEvents(currentDay()).some(e=>e.id===id))return;activeEvent=id;const trailX=$('time-trail').scrollLeft;renderAdventure();$('time-trail').scrollLeft=trailX;const stop=$('time-trail').querySelector('.active');if(stop){const left=stop.offsetLeft-$('time-trail').offsetLeft;if(left<trailX||left+stop.offsetWidth>trailX+$('time-trail').clientWidth)$('time-trail').scrollTo({left:Math.max(0,left-24),behavior:'smooth'});}}

 function renderResearch(){
  $('candidates').innerHTML=B.candidates.filter(c=>!window.PQ_BOOKINGS.activities?.some(a=>a.id===c.id)).map(c=>`<article class="candidate"><p class="eyebrow">${esc(c.group)}</p><span class="badge check">${esc(c.tag)} · 미예약</span><h3>${esc(c.name)}</h3><p class="price">${esc(c.price)}</p><dl><dt>공개 안내에서 확인</dt><dd>${esc(c.facts)}</dd><dt>아직 확인할 것</dt><dd>${esc(c.unknown)}</dd><dt>동선과 조건을 고려한 제안</dt><dd>${esc(c.assessment)}</dd></dl><a href="${esc(c.url)}" target="_blank" rel="noopener">공식 안내 확인 ↗</a><p style="margin:12px 0 0;font-size:10px">확인일 2026.09.30 · 11월 여행일 적용 여부 재확인</p></article>`).join('');
 }
 function renderChecks(){
  $('remaining').textContent=B.checklist.filter(c=>!state.checked[c.id]).length;
  const done=B.checklist.filter(c=>state.checked[c.id]).length;
  $('check-progress').innerHTML=`<span>${pixelIcon('heart',20)} ${done} / ${B.checklist.length} 완료</span><progress max="${B.checklist.length}" value="${done}" aria-label="준비 완료 진행률"></progress><span>${Math.round(done/B.checklist.length*100)}%</span>`;
  $('checklist').innerHTML=B.checklist.map(c=>({...c,...window.PQ_BOOKINGS.checklistUpdates?.[c.id]})).map(c=>`<div class="check-item ${state.checked[c.id]?'done':''}"><input type="checkbox" id="check-${c.id}" data-check="${c.id}" ${state.checked[c.id]?'checked':''}><label for="check-${c.id}"><strong>${esc(c.title)}</strong><span class="badge ${c.priority==='우선'?'check':''}">${esc(c.priority)}</span><p>${esc(c.detail)}</p></label></div>`).join('');
  $('reservations').innerHTML=[...B.reservations,...(window.PQ_BOOKINGS.activities||[]).map(a=>({label:a.name,date:a.date,detail:a.people+'명'+(a.price?' · '+a.price:''),status:'예약 확정'}))].map(r=>`<div class="reservation"><div><strong>${esc(r.label)}</strong><span>${esc(r.date)} · ${esc(r.detail)}</span></div><span class="badge">${esc(r.status)}</span></div>`).join('');
 }

 function renderBookings(){
  const R=window.PQ_BOOKINGS;
  $('booking-cards').innerHTML=(R.activities||[]).map(a=>`<article class="desk-window booking-card" data-booking="${esc(a.id)}"><div class="window-bar pink-bar"><span>${pixelIcon(a.icon||'flower',20)} ${esc(a.name)}</span><span class="badge confirmed">예약 확정</span></div><div class="window-body"><p class="eyebrow">예약 확인 ${esc(a.checkedAt)}</p><h3>${esc(a.name)} · ${a.people}명</h3>${a.price?`<p class="room-label">${esc(a.price)} · ${a.people}인 합계</p>`:''}${a.tip?`<p>${esc(a.tip)}</p>`:''}<div class="booking-times"><div><small>예약 날짜</small><strong>${esc(a.date)}</strong></div><div><small>시작 시각</small><strong>${esc(a.time)}</strong></div></div><p>${esc(a.course)}</p><p class="booking-note">${esc(a.placement)}</p><div class="booking-tags">${a.features.map(v=>`<span>${esc(v)}</span>`).join('')}</div><details open><summary>이용 안내 · 확인할 내용 +</summary><ul>${a.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></details><div class="actions">${(a.places?a.places.map(place=>getPlace({place})):[a]).map(p=>`<a class="google-button" href="${esc(searchLink(p))}" target="_blank" rel="noopener">${esc(p.name)} · Google 지도 ↗</a>`).join('')}</div></div></article>`).join('')+R.flights.map(f=>`<article class="desk-window booking-card"><div class="window-bar pink-bar"><span>${pixelIcon('plane',20)} ${f.airline} ${f.flight}</span><span class="badge confirmed">예약 확인</span></div><div class="window-body"><p class="eyebrow">${esc(f.date)}</p><h3>${esc(f.from)} → ${esc(f.to)}</h3><div class="booking-times"><div><small>출발</small><strong>${esc(f.departure)}</strong></div><div><small>도착</small><strong>${esc(f.arrival)}</strong></div></div><p>${pixelIcon('bag',19)} ${esc(f.baggage)}</p><p class="booking-note">${esc(f.arrivalSource)}</p></div></article>`).join('')+R.hotels.map(h=>`<article class="desk-window booking-card"><div class="window-bar mint-bar"><span>${pixelIcon('bed',20)} ${h.id==='vinpearl'?'북부 · 2박':'남부 · 3박'}</span><span class="badge confirmed">예약 확인</span></div><div class="window-body"><h3>${esc(h.name)}</h3><p class="room-label">${esc(h.room)}</p><p class="muted">객실 ${h.rooms}개 · 성인 ${h.adults}명</p><div class="booking-times"><div><small>체크인 시작</small><strong>${esc(h.checkIn)}</strong></div><div><small>체크아웃 마감</small><strong>${esc(h.checkOut)}</strong></div></div><p>${esc(h.address)}</p><p class="booking-note">예약 메일에 표시된 혜택</p><div class="booking-tags">${h.benefits.map(v=>`<span>${esc(v)}</span>`).join('')}</div><details><summary>특별 요청 · 확인할 내용 +</summary><p>${esc(h.requests.join(' / '))}</p><ul>${h.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></details><a class="google-button" href="${esc(searchLink(getPlace({place:h.id})))}" target="_blank" rel="noopener">정확한 호텔 지도 ↗</a></div></article>`).join('');
 }
 function showView(v){currentView=v;document.querySelectorAll('.view').forEach(e=>e.hidden=e.id!=='view-'+v);$('route-panel').hidden=v!=='plan';$('map-evidence').hidden=v!=='plan';document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===v);b.setAttribute('aria-pressed',String(b.dataset.view===v));});$('mobile-map').classList.toggle('active',v==='plan');if(v==='plan')requestAnimationFrame(()=>PQMap.refresh());}
 function openEditor(id){
  const d=currentDay();editing=id?dayEvents(d).find(e=>e.id===id):null;
  const custom=!editing||editing.custom;$('editor-title').textContent=editing?'시간과 메모 편집':'새 일정 추가';
  $('editor-help').textContent=custom?'추가 일정은 핵심 순서 사이에 넣을 수 있습니다.':'핵심 일정은 고정입니다. 세부시간과 개인 메모를 덧붙일 수 있습니다. 항공시간은 편집할 수 없습니다.';
  $('edit-title').value=editing?.title||'';$('edit-title').disabled=!custom;$('edit-time').value=editing?.time||'';$('edit-time').disabled=!!editing?.fixedTime;
  $('edit-note').value=editing?(custom?editing.note:editing.personal)||'':'';
  $('edit-place').innerHTML='<option value="">새 장소 / 장소 없음</option>'+Object.entries(B.places).map(([k,p])=>`<option value="${k}">${esc(p.name)}</option>`).join('');$('edit-place').value=editing?.place||'';
  $('edit-query').value=editing?.query||'';$('edit-mode').value=editing?.mode||'walk';
  $('edit-after').innerHTML='<option value="">첫 일정 앞</option>'+d.events.map(e=>`<option value="${e.id}">${esc(e.title)} 뒤</option>`).join('');$('edit-after').value=editing?.after??d.events.at(-1).id;
  ['place-field','query-field','mode-field','after-field'].forEach(x=>$(x).hidden=!custom);
  $('delete-event').hidden=!editing?.custom;$('edit-error').hidden=true;$('editor').showModal();
 }
 function exportBackup(auto=false){
  const file={schema:'phuquoc.personal/1',exportedAt:new Date().toISOString(),baseline:invariant,state};
  const a=document.createElement('a'),blob=new Blob([JSON.stringify(file,null,2)],{type:'application/json'});a.href=URL.createObjectURL(blob);a.download=`phuquoc-${auto?'before-import-':''}${new Date().toISOString().replace(/[:.]/g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  if(!auto)toast('JSON 백업을 내려받았습니다.');
 }
 function printAll(){
  $('print-content').innerHTML=`<h1>푸꾸옥 · 2026.11.03–11.09</h1><p>성인 2명 · 5박 7일 · 현지시간(한국은 +2시간) · 확정 일정 유지</p>${B.days.map(d=>`<section><h2>11/${Number(d.id.slice(-2))} (${d.weekday}) ${esc(d.title)}</h2><p>${esc(d.intro)}</p>${dayEvents(d).map(e=>`<article><strong>${esc(e.time)} ${e.zone?esc(e.zone):''} · ${esc(e.title)} [${status[e.status]}]</strong><p>${esc(displayNote(e))}</p>${e.personal?`<p>메모: ${esc(e.personal)}</p>`:''}</article>`).join('')}<p>챙길 것: ${esc(dayPrep(d).join(' / '))}</p><p>${esc(state.dayNotes[d.id]||'')}</p></section>`).join('')}`;window.print();
 }
 $('date-nav').addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(!b)return;selected=b.dataset.day;activeEvent=null;showView('plan');renderPlan();$('time-trail').scrollLeft=0;});
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{showView(b.dataset.view);$('view-'+b.dataset.view).scrollIntoView({block:'start',behavior:'smooth'});}));
 document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();selected=B.days[0].id;activeEvent=null;showView('plan');renderPlan();window.scrollTo({top:0,behavior:'smooth'});});
 $('backup-top').onclick=()=>{showView('backup');window.scrollTo({top:0,behavior:'smooth'});};$('add-event').onclick=()=>openEditor(null);
 $('timeline').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(b){openEditor(b.dataset.edit);return;}const spot=e.target.closest('[data-spot]');if(spot){focusStop(spot.dataset.spot);$('pixel-scene').scrollIntoView({block:'start',behavior:'smooth'});}});
 ['unplaced-spots','time-trail'].forEach(id=>$(id).addEventListener('click',e=>{const b=e.target.closest('[data-focus]');if(b)focusStop(b.dataset.focus);}));
 $('stop-focus').addEventListener('click',e=>{const step=e.target.closest('[data-step]'),jump=e.target.closest('[data-jump]'),locate=e.target.closest('[data-locate]');if(locate)PQMap.focus(locate.dataset.locate,true);if(step){const evs=dayEvents(currentDay()),i=evs.findIndex(ev=>ev.id===activeEvent);const next=evs[i+Number(step.dataset.step)];if(next)focusStop(next.id);}if(jump){const card=[...document.querySelectorAll('#timeline .event')].find(el=>el.dataset.id===jump.dataset.jump);if(card){card.querySelector('.quest-details').open=true;card.scrollIntoView({block:'center',behavior:'smooth'});}}});
 document.querySelectorAll('[data-map-mode]').forEach(b=>b.onclick=()=>PQMap.fit(b.dataset.mapMode));
 $('show-routes').onclick=()=>{$('route-drawer').open=true;$('route-drawer').scrollIntoView({block:'start',behavior:'smooth'});};
 $('day-note').addEventListener('input',e=>{state.dayNotes[selected]=e.target.value;save();});
 $('checklist').addEventListener('change',e=>{const id=e.target.dataset.check;if(!id)return;state.checked[id]=e.target.checked;save();renderChecks();});
 $('editor-close').onclick=()=>$('editor').close();
 $('event-form').addEventListener('submit',e=>{
  e.preventDefault();const next=structuredClone(state);
  if(!editing||editing.custom){const item={id:editing?.id||'extra-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),day:selected,after:$('edit-after').value,title:$('edit-title').value.trim(),time:$('edit-time').value.trim(),place:$('edit-place').value,query:$('edit-query').value.trim(),mode:$('edit-mode').value,note:$('edit-note').value};if(editing)next.extras[next.extras.findIndex(x=>x.id===editing.id)]=item;else next.extras.push(item);}
  else next.overrides[editing.id]={...(editing.fixedTime?{}:{time:$('edit-time').value.trim()}),note:$('edit-note').value};
  try{state=validateState(next);save();renderPlan();$('editor').close();toast('일정을 저장했습니다.');}catch(err){$('edit-error').textContent=err.message;$('edit-error').hidden=false;}
 });
 $('delete-event').onclick=()=>{if(!editing?.custom)return;state.extras=state.extras.filter(x=>x.id!==editing.id);save();renderPlan();$('editor').close();toast('추가 일정을 삭제했습니다.');};
 $('mobile-map').onclick=()=>{showView('plan');$('route-panel').scrollIntoView({behavior:'smooth',block:'start'});};
 $('export').onclick=()=>exportBackup();$('import-open').onclick=()=>$('import-file').click();
 $('import-file').addEventListener('change',async e=>{
  const f=e.target.files[0];if(!f)return;
  try{assert(f.size<2_000_000,'2MB 이하 JSON만 가져올 수 있습니다.');const data=JSON.parse(await f.text());assert(data.schema==='phuquoc.personal/1','지원하지 않는 백업 형식입니다.');assert(canon(data.baseline)===canon(invariant),'항공·숙소·핵심 일정이 현재 기준과 다릅니다. 가져오기를 중단했습니다.');const next=validateState(data.state);exportBackup(true);state=next;save();renderPlan();renderChecks();$('backup-result').textContent='가져오기 완료. 이전 편집 내용은 before-import JSON 파일로 내려받았습니다.';toast('백업을 가져왔습니다.');}
  catch(err){$('backup-result').textContent='가져오기 실패: '+err.message;toast('백업을 확인하세요. 기존 내용은 유지했습니다.');}
  e.target.value='';
 });
 $('print').onclick=printAll;
 renderPlan();renderResearch();renderChecks();renderBookings();showView('plan');
 window.PQ_TEST={validateState,timeWarnings,dayEvents,getLegs,baseline:invariant,getState:()=>structuredClone(state)};
})();
