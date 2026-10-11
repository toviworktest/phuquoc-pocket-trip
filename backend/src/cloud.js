/* Shared state is authoritative on the server. No local notes are auto-published. */
(() => {
 const $=id=>document.getElementById(id);
 const publicSite=window.PQ_PUBLIC_SITE;
 let session={authenticated:false,canEdit:false},version=0,dirty=false,busy=false,loaded=false,blocked=false;
 function refreshControls(){
  const editable=loaded&&session.canEdit&&!busy&&!blocked;
  document.querySelectorAll('[data-edit],#add-event,#import-open').forEach(el=>{el.hidden=!editable;});
  document.querySelectorAll('#day-note,#checklist input').forEach(el=>el.disabled=!editable);
  $('cloud-save').hidden=!session.canEdit;$('cloud-save').disabled=!loaded||!dirty||busy||blocked;
  $('cloud-reload').disabled=busy;
  $('cloud-signin').hidden=session.authenticated;$('cloud-signout').hidden=!session.authenticated;
  $('cloud-password').hidden=!session.authenticated;
  $('cloud-person').textContent=session.authenticated?(session.displayName||'로그인됨')+(session.canEdit?' · 편집 가능':' · 보기 전용'):'누구나 보기 · 수정은 로그인';
  document.body.classList.toggle('cloud-readonly',!editable);
 }
 function status(message,error=false){$('cloud-status').textContent=message;$('cloud-status').classList.toggle('error',error);$('save-state').textContent=message;}
 function markDirty(){if(!loaded||!session.canEdit)return;dirty=true;status('수정 중 · 위의 공유 저장을 눌러 반영하세요.');refreshControls();}
 async function api(path,options={}){
  if(publicSite&&(path!=='/api/state'||(options.method||'GET')!=='GET'))throw Error('로그인하고 관리 화면에서 수정해 주세요.');
  const r=await fetch(publicSite?publicSite.origin+path:path,{...options,credentials:publicSite?'omit':'same-origin',cache:'no-store'});let body;try{body=await r.json()}catch{throw Error('서버 응답을 확인하지 못했어요. 잠시 후 다시 시도하세요.');}if(!r.ok){const e=Error(body.error||'요청을 완료하지 못했어요.');e.status=r.status;throw e;}return body;
 }
 async function loadState(force=false){
  if(busy||(!force&&dirty))return;
  try{const result=await api('/api/state');if(!loaded||result.version!==version||force){window.PQ_APP.setState(result.state);version=result.version;}
   dirty=false;loaded=true;blocked=false;status(session.canEdit?'공유 중 · 메모와 체크를 수정하고 저장할 수 있어요.':'함께 보는 일정 · 로그인 없이 둘러보세요.');refreshControls();
  }catch(e){status(e.message,true);refreshControls();}
 }
 async function saveShared(){
  if(!loaded||!session.canEdit||!dirty||busy||blocked)return;
  const state=window.PQ_APP.getState();busy=true;refreshControls();status('공유 저장 중…');
  try{const result=await api('/api/state',{method:'PUT',headers:{'Content-Type':'application/json','X-Planner-Write':'1'},body:JSON.stringify({version,state})});version=result.version;dirty=false;status('공유 저장 완료 ♡ 다른 기기에도 반영돼요.');}
  catch(e){
   if(e.status===409){blocked=true;status('다른 곳에서 먼저 수정했어요. 백업을 내려받고 최신 내용을 불러와 주세요.',true);}
   else if(e.status===401||e.status===403){session.canEdit=false;status('편집 권한을 확인하지 못했어요. 현재 초안을 백업한 뒤 다시 로그인해 주세요.',true);}
   else status(e.message+' 초안은 이 화면에 남아 있어요.',true);
  }finally{busy=false;refreshControls();}
 }
 window.PQ_CLOUD={canEdit:()=>loaded&&session.canEdit&&!busy&&!blocked,save:markDirty,refreshControls};
 window.addEventListener('DOMContentLoaded',async()=>{
  $('cloud-save').onclick=saveShared;
  $('cloud-reload').onclick=()=>{if(dirty&&!confirm('아직 공유 저장하지 않은 수정이 있어요. 최신 내용을 불러오면 이 화면의 초안을 대체합니다. 계속할까요?'))return;loadState(true);};
  $('cloud-signout').onclick=async()=>{if(dirty&&!confirm('공유 저장하지 않은 수정이 있어요. 로그아웃할까요?'))return;try{await api('/api/auth/sign-out',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});dirty=false;location.reload();}catch(e){status('로그아웃하지 못했어요. 다시 시도해 주세요.',true);}};
  if(publicSite){$('cloud-signin').href=publicSite.origin+'/login';$('cloud-signin').textContent='로그인하고 관리 ↗';}
  else try{session=await api('/api/session');}catch(e){status('로그인 상태를 확인하지 못했어요. 일정은 볼 수 있어요.',true);}
  await loadState(true);refreshControls();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!dirty)loadState();});
  setInterval(()=>{if(!document.hidden&&!dirty)loadState();},30000);
 });
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
})();
