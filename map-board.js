/* Geographic map: offline OSM vectors and verified public place coordinates.
   No generated raster, CSS percent positions, tiles, live tracking or synthetic routes. */
(() => {
 'use strict';
 const G=window.PQ_GEOMETRY,D=window.PQ_GEOGRAPHY,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const titles={airport:'푸꾸옥 공항',vinpearl:'빈펄 리조트',safari:'사파리',wonders:'빈원더스',grand:'그랜드월드',noska:'노스카',cable:'안토이역',aqua:'혼똔 · 아쿠아토피아',sunset:'선셋타운',market:'VUI-Fest 야시장',kiss:'키스 오브 더 씨',duong:'즈엉동'};
 const icons={airport:'plane',vinpearl:'bed',safari:'paw',wonders:'fish',grand:'castle',noska:'bed',cable:'cable',aqua:'palm',sunset:'sun',market:'food',kiss:'star',duong:'walk'};
 let map,markers,dayId,entries=[],activeId,onSelect,mode='day',visibleMarkerData=[];
 const allBounds=[[9.91,103.813],[10.465,104.105]],townBounds=[[10.0242,103.999],[10.0385,104.0108]];
 function init(){
  if(map)return;
  map=L.map('geo-map',{zoomControl:false,attributionControl:true,scrollWheelZoom:false,minZoom:9,maxZoom:18,zoomSnap:.25,maxBounds:[[9.83,103.68],[10.58,104.23]],maxBoundsViscosity:.7,preferCanvas:false});
  map.setView([10.18,103.97],10);
  map.attributionControl.setPrefix(false);map.attributionControl.addAttribution('© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a> · 좌표 <a href="https://www.google.com/maps/place/Phu+Quoc/" target="_blank" rel="noopener">Google</a>');
  const renderer=L.svg();renderer.addTo(map);
  const svg=renderer._container,ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs');
  defs.innerHTML='<pattern id="pixel-land" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#cfdfb4"/><path d="M3 8h4v4H3zM18 20h3v3h-3z" fill="#a5c895" opacity=".6"/><path d="M20 5h4v2h-4z" fill="#e5ecc4"/></pattern>';svg.prepend(defs);
  L.geoJSON(D.land,{renderer,interactive:false,smoothFactor:0,style:{color:'#6c947e',weight:2,fillColor:'url(#pixel-land)',fillOpacity:1}}).addTo(map);
  L.geoJSON(D.roads,{renderer,interactive:false,smoothFactor:0,style:f=>({color:['trunk','primary'].includes(f.properties.kind)?'#faf0bb':'#faf6df',weight:['trunk','primary'].includes(f.properties.kind)?3:1.5,opacity:.9,lineCap:'square'})}).addTo(map);
  L.geoJSON(D.cable,{renderer,interactive:false,smoothFactor:0,style:{color:'#9270af',weight:3,dashArray:'5 5',opacity:.85}}).addTo(map);
  L.control.zoom({position:'topright',zoomInTitle:'지도 확대',zoomOutTitle:'지도 축소'}).addTo(map);
  L.control.scale({imperial:false,position:'bottomleft',maxWidth:90}).addTo(map);
  markers=L.layerGroup().addTo(map);
  map.on('zoomend moveend',renderMarkers);
  new ResizeObserver(()=>{map.invalidateSize({pan:false});}).observe(document.getElementById('geo-map'));
 }
 function placeGroups(){const byPlace=new Map();entries.forEach((e,i)=>{if(!G.places[e.place])return;if(!byPlace.has(e.place))byPlace.set(e.place,{id:e.place,p:G.places[e.place],events:[]});byPlace.get(e.place).events.push({e,i});});return [...byPlace.values()];}
 function renderMarkers(){
  if(!map||!markers||!map._loaded)return;markers.clearLayers();visibleMarkerData=[];
  const groups=placeGroups(),clusters=[],labels=[];
  for(const g of groups){const point=map.latLngToLayerPoint([g.p.lat,g.p.lon]);const c=clusters.find(c=>c.groups.some(a=>map.latLngToLayerPoint([a.p.lat,a.p.lon]).distanceTo(point)<42));if(c)c.groups.push(g);else clusters.push({groups:[g]});}
  for(const c of clusters){
   if(c.groups.length>1){
    const lat=c.groups.reduce((s,g)=>s+g.p.lat,0)/c.groups.length,lon=c.groups.reduce((s,g)=>s+g.p.lon,0)/c.groups.length,isActive=c.groups.some(g=>g.events.some(x=>x.e.id===activeId));
    const html=`<button type="button" class="geo-cluster ${isActive?'active':''}" aria-label="${esc(c.groups.map(g=>titles[g.id]).join(', '))} ${c.groups.length}곳 확대">${pixelIcon('map',19)}<b>${c.groups.length}곳</b><small>눌러서 확대</small></button>`;
    const marker=L.marker([lat,lon],{icon:L.divIcon({className:'geo-marker-wrap',html,iconSize:[72,54],iconAnchor:[36,27]}),keyboard:false}).addTo(markers);
    marker.on('click',()=>{mode='detail';map.fitBounds(L.latLngBounds(c.groups.map(g=>[g.p.lat,g.p.lon])),{padding:[68,78],maxZoom:17,animate:false});updateStatus();});
    visibleMarkerData.push({cluster:true,places:c.groups.map(g=>g.id),lat,lon});
   }else{
    const g=c.groups[0],active=g.events.find(x=>x.e.id===activeId),target=active||g.events[0],numbers=g.events.map(x=>x.i+1).join('·'),label=titles[g.id]||g.id;
    const html=`<button type="button" class="geo-pin ${active?'active':''}" data-map-place="${esc(g.id)}" aria-label="${esc(numbers+'번 '+label)}"><span class="geo-pin-box">${pixelIcon(icons[g.id],20)}<b>${numbers}</b></span><span class="geo-pin-dot"></span></button>`;
    const marker=L.marker([g.p.lat,g.p.lon],{icon:L.divIcon({className:'geo-marker-wrap',html,iconSize:[46,44],iconAnchor:[23,44]}),keyboard:false,zIndexOffset:active?1000:0}).addTo(markers);
    marker.on('click',()=>onSelect?.(target.e.id));
    marker.bindTooltip(`<b>${esc(label)}</b>${active?`<span>${esc([...new Set(g.events.map(x=>x.e.time||'시간 미정'))].join(' / '))}</span>`:''}`,{permanent:true,direction:active?'top':'bottom',offset:active?[0,-44]:[0,6],className:'geo-place-label '+(active?'selected':'')});
    labels.push({tooltip:marker.getTooltip(),active:!!active});
    visibleMarkerData.push({cluster:false,place:g.id,lat:g.p.lat,lon:g.p.lon,eventIds:g.events.map(x=>x.e.id)});
   }
  }
  arrangeLabels(labels);updateStatus();
 }
 function arrangeLabels(labels){
  // Move labels, never the coordinate anchors. Avoid covering other pins or text.
  const frame=map.getContainer().getBoundingClientRect(),taken=[...document.querySelectorAll('#geo-map .geo-pin-box,#geo-map .geo-cluster')].map(e=>e.getBoundingClientRect());
  const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left)+3)*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)+3);
  for(const {tooltip,active} of labels.sort((a,b)=>Number(b.active)-Number(a.active))){
   const options=active?[['top',[0,-44]],['right',[23,-24]],['left',[-23,-24]],['bottom',[0,7]]]:[['bottom',[0,7]],['left',[-23,-24]],['right',[23,-24]],['top',[0,-44]]];
   let best,score=Infinity;
   for(const [direction,offset] of options){tooltip.options.direction=direction;tooltip.options.offset=L.point(offset);tooltip.update();const r=tooltip.getElement().getBoundingClientRect(),outside=Math.max(0,frame.left+4-r.left)+Math.max(0,r.right-frame.right+4)+Math.max(0,frame.top+4-r.top)+Math.max(0,r.bottom-frame.bottom+4),cost=outside*10000+taken.reduce((s,b)=>s+overlap(r,b),0);if(cost<score){score=cost;best={direction,offset};}}
   tooltip.options.direction=best.direction;tooltip.options.offset=L.point(best.offset);tooltip.update();taken.push(tooltip.getElement().getBoundingClientRect());
  }
 }
 function updateStatus(){
  const names={all:'푸꾸옥 전체',day:'오늘의 동선',town:'선셋타운 확대',detail:'장소 확대'};
  document.getElementById('scene-label').textContent=(names[mode]||'오늘의 동선')+' · 북쪽 ↑';
  document.getElementById('geo-zoom-hint').textContent=visibleMarkerData.some(m=>m.cluster)?'겹친 장소는 묶었어요. 숫자를 누르면 확대돼요.':'핀 끝점이 실제 좌표예요. 두 손가락으로 확대할 수 있어요.';
  document.querySelectorAll('[data-map-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mapMode===mode);b.setAttribute('aria-pressed',String(b.dataset.mapMode===mode));});
 }
 function fit(which='day'){
  init();mode=which;map.invalidateSize({pan:false});
  if(which==='all')map.fitBounds(allBounds,{padding:[22,26],animate:false});
  else if(which==='town')map.fitBounds(townBounds,{padding:[48,66],maxZoom:16,animate:false});
  else {const groups=placeGroups();if(groups.length>=2){map.fitBounds(groups.map(g=>[g.p.lat,g.p.lon]),{padding:[68,85],maxZoom:15.5,animate:false});}else if(groups.length===1){map.setView([groups[0].p.lat,groups[0].p.lon],12,{animate:false});}else{mode='all';map.fitBounds(allBounds,{padding:[22,26],animate:false});}}
  renderMarkers();
 }
 function setDay(options){init();const changed=dayId!==options.dayId;dayId=options.dayId;entries=options.events;activeId=options.activeId;onSelect=options.onSelect;if(changed)fit(dayId==='2026-11-03'?'all':'day');else renderMarkers();}
 function focus(id,zoom=false){activeId=id;const e=entries.find(x=>x.id===id),p=G.places[e?.place];if(p&&zoom){mode='detail';map.setView([p.lat,p.lon],p.region==='남부'&&p.lat>10.01?16:14,{animate:false});}renderMarkers();}
 function refresh(){if(map){map.invalidateSize({pan:false});renderMarkers();}}
 window.PQMap={setDay,fit,focus,refresh,audit:()=>({projection:map?.options.crs.code,zoom:map?.getZoom(),mode,markers:structuredClone(visibleMarkerData),bounds:map?.getBounds().toBBoxString()})};
})();
