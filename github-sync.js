/* Shared planner state lives in the GitHub repository (data/state.json); no separate login server.
   Costs are shared separately, encrypted with a passphrase (data/costs.json; see the cost section below).
   Anyone reads the deployed copy (./state.json). Editing needs a fine-grained GitHub token that the
   owner creates for this repository only (Contents: read & write). The token stays in this browser's
   localStorage and is sent only to api.github.com. Each shared save is one commit, so Git history is
   the backup. The file sha is the version: a stale sha is rejected by GitHub (conflict). */
(() => {
 const $=id=>document.getElementById(id);
 const cfg=window.PQ_GITHUB,TOKEN_KEY='phuquoc-github-token',repoPath=`/repos/${cfg.owner}/${cfg.repo}`;
 let token='',login='',canEdit=false,sha=null,dirty=false,busy=false,loaded=false,blocked=false;
 try{token=localStorage.getItem(TOKEN_KEY)||'';}catch{}
 const encode=text=>{const bytes=new TextEncoder().encode(text);let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(bin);};
 const decode=b64=>new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g,'')),c=>c.charCodeAt(0)));
 async function github(path,options={}){
  const r=await fetch('https://api.github.com'+path,{...options,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+token,...options.headers}});
  let body=null;try{body=await r.json();}catch{}
  if(!r.ok){const e=Error(body?.message||'GitHub 요청을 완료하지 못했어요.');e.status=r.status;throw e;}
  return body;
 }
 function refreshControls(){
  const editable=loaded&&canEdit&&!busy&&!blocked;
  document.querySelectorAll('[data-edit],#add-event,#import-open').forEach(el=>{el.hidden=!editable;});
  document.querySelectorAll('#day-note,#checklist input').forEach(el=>el.disabled=!editable);
  $('cloud-save').hidden=!canEdit;$('cloud-save').disabled=!loaded||!dirty||busy||blocked;$('cloud-reload').disabled=busy;
  $('cloud-signout').hidden=!token;$('cloud-token-form').hidden=canEdit;
  $('check-signin').hidden=canEdit;
  $('cloud-person').textContent=canEdit?`${login||'GitHub'} · 편집 가능`:'누구나 보기 · 편집은 GitHub 연결';
  document.body.classList.toggle('cloud-readonly',!editable);
 }
 function status(message,error=false){if(error||dirty)$('cloud-panel').open=true;$('cloud-status').textContent=message;$('cloud-status').classList.toggle('error',error);$('save-state').textContent=message;}
 function markDirty(){if(!loaded||!canEdit)return;dirty=true;status('수정 중 · 위의 공유 저장을 눌러 GitHub에 저장하세요.');refreshControls();}
 async function loadState(force=false){
  if(busy||(!force&&dirty))return;
  try{
   let state;
   if(canEdit){const file=await github(`${repoPath}/contents/${cfg.path}?ref=${encodeURIComponent(cfg.branch)}`);state=JSON.parse(decode(file.content));if(file.sha!==sha||force)window.PQ_APP.setState(state);sha=file.sha;}
   else{const r=await fetch('state.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('공유 일정을 불러오지 못했어요. 기본 일정을 보여드려요.');state=await r.json();window.PQ_APP.setState(state);}
   dirty=false;loaded=true;blocked=false;
   status(canEdit?'GitHub와 연결됨 · 메모와 체크를 수정하고 공유 저장을 누르세요.':'함께 보는 일정 · 로그인 없이 둘러보세요.');
  }catch(e){status(e.status===401?'GitHub 토큰이 만료됐거나 잘못됐어요. 이 기기 편집을 해제하고 새 토큰을 연결하세요.':e.message,true);}
  refreshControls();
 }
 async function saveShared(){
  if(!loaded||!canEdit||!dirty||busy||blocked)return;
  const state=window.PQ_APP.getState();busy=true;refreshControls();status('GitHub에 저장 중…');
  try{
   const result=await github(`${repoPath}/contents/${cfg.path}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Update shared trip notes',content:encode(JSON.stringify(state,null,1)+'\n'),sha,branch:cfg.branch})});
   sha=result.content.sha;dirty=false;status('공유 저장 완료 · 1–2분 뒤 다른 기기에도 보여요.');
  }catch(e){
   if(e.status===409||e.status===422){blocked=true;status('다른 기기에서 먼저 저장했어요. 백업을 내려받고 최신 내용을 불러와 주세요.',true);}
   else if(e.status===401||e.status===403||e.status===404){status('이 토큰으로 저장할 수 없어요. 이 저장소의 Contents 읽기·쓰기 권한을 확인해 주세요. 초안은 화면에 남아 있어요.',true);}
   else status(e.message+' 초안은 이 화면에 남아 있어요.',true);
  }finally{busy=false;refreshControls();}
 }
 async function connect(newToken){
  token=newToken.trim();if(!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(token)){token='';status('GitHub 토큰 형식이 아니에요. github_pat_로 시작하는 값을 붙여 넣으세요.',true);return;}
  try{const repo=await github(repoPath);if(!repo.permissions?.push)throw Object.assign(Error('이 토큰은 저장소 쓰기 권한이 없어요.'),{status:403});
   try{login=(await github('/user')).login||'';}catch{login='';}
   localStorage.setItem(TOKEN_KEY,token);canEdit=true;$('cloud-token').value='';await loadState(true);await loadCosts();
  }catch(e){token='';canEdit=false;status(e.status===401?'토큰을 확인하지 못했어요. 만료일과 복사한 값을 확인해 주세요.':e.message,true);refreshControls();}
 }
 // Shared costs: amounts are AES-GCM encrypted with a passphrase both phones enter once ("비용 암호").
 // data/costs.json (and the deployed ./costs.json) hold only {v,salt,iter,iv,data}. Cost edits on an editing phone are
 // saved automatically; edits made since the last sync win over the remote copy when merging.
 const COSTPASS_KEY='phuquoc-cost-pass',ITER=310000,te=new TextEncoder(),td=new TextDecoder();
 const b64=u8=>{let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode(...u8.subarray(i,i+0x8000));return btoa(s);};
 const unb64=s=>Uint8Array.from(atob(String(s).replace(/\s/g,'')),c=>c.charCodeAt(0));
 const costCrypto={
  async key(pass,salt,iter){const base=await crypto.subtle.importKey('raw',te.encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:unb64(salt),iterations:iter,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);},
  async seal(pass,value,salt=b64(crypto.getRandomValues(new Uint8Array(16)))){const iv=crypto.getRandomValues(new Uint8Array(12)),k=await costCrypto.key(pass,salt,ITER);return {v:1,salt,iter:ITER,iv:b64(iv),data:b64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,te.encode(JSON.stringify(value)))))};},
  async open(pass,box){const k=await costCrypto.key(pass,box.salt,box.iter);return JSON.parse(td.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(box.iv)},k,unb64(box.data))));}
 };
 window.PQ_COST_CRYPTO=costCrypto;
 let costPass='',costSha=null,costBox=null,costTimer=null,costSaving=false,costMsg='',applyingCosts=false;const pending=new Set();
 try{costPass=localStorage.getItem(COSTPASS_KEY)||'';}catch{}
 function mergeCosts(remote,local){
  const items={...remote.items};for(const [id,v] of Object.entries(local.items))if(!Object.hasOwn(items,id))items[id]=v;
  let rates=remote.rates;
  for(const id of pending){if(id==='*'){Object.assign(items,local.items);rates=local.rates;}else if(id==='rates')rates=local.rates;else if(Object.hasOwn(local.items,id))items[id]=local.items[id];}
  return {...remote,items,rates};
 }
 async function fetchCostBox(){
  if(canEdit){try{const f=await github(`${repoPath}/contents/${cfg.costsPath}?ref=${encodeURIComponent(cfg.branch)}`);costSha=f.sha;return JSON.parse(decode(f.content));}catch(e){if(e.status===404){costSha=null;return null;}throw e;}}
  const r=await fetch('costs.json?t='+Date.now(),{cache:'no-store'});return r.ok?await r.json():null;
 }
 async function loadCosts(){
  if(!window.PQ_COSTS||!cfg.costsPath||costSaving||costTimer)return;
  try{
   costBox=await fetchCostBox();
   if(costBox&&costPass){
    const local=window.PQ_COSTS.get(),merged=mergeCosts(await costCrypto.open(costPass,costBox),local);
    applyingCosts=true;try{window.PQ_COSTS.set(merged);}finally{applyingCosts=false;}
    if(canEdit&&(JSON.stringify(merged)!==JSON.stringify(await costCrypto.open(costPass,costBox))))scheduleCostSave();
    else costMsg=canEdit?'비용 공유 중 · 수정하면 자동으로 저장돼요':'비용 공유 보기 중 · 이 폰은 편집 연결 전이라 수정은 이 기기에만 남아요';
   }
  }catch(e){if(e.name==='OperationError'){costPass='';try{localStorage.removeItem(COSTPASS_KEY);}catch{}costMsg='저장된 비용 암호가 맞지 않아요. 다시 입력해 주세요.';}else costMsg='비용을 불러오지 못했어요: '+e.message;}
  renderCostSync();
 }
 function scheduleCostSave(){clearTimeout(costTimer);costMsg='비용 저장 대기 중…';renderCostSync();costTimer=setTimeout(()=>{costTimer=null;saveCosts();},1200);}
 async function saveCosts(retry=true){
  if(!canEdit||!costPass||!window.PQ_COSTS)return;
  costSaving=true;const sent=new Set(pending);
  try{
   const box=await costCrypto.seal(costPass,window.PQ_COSTS.get(),costBox?.salt);
   const result=await github(`${repoPath}/contents/${cfg.costsPath}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Update shared trip costs (encrypted)',content:encode(JSON.stringify(box,null,1)+'\n'),...(costSha?{sha:costSha}:{}),branch:cfg.branch})});
   costSha=result.content.sha;costBox=box;for(const id of sent)pending.delete(id);costMsg='비용 공유 저장됨 ✓ 다른 폰에서 새로고침하면 보여요';
  }catch(e){
   if((e.status===409||e.status===422)&&retry){costSaving=false;costTimer=null;await loadCosts();return saveCosts(false);}
   costMsg='비용을 공유 저장하지 못했어요. 이 기기에는 남아 있어요. ('+e.message+')';
  }finally{costSaving=false;renderCostSync();}
 }
 function costsChanged(id='*'){if(applyingCosts)return;pending.add(id);if(canEdit&&costPass&&loaded)scheduleCostSave();else renderCostSync();}
 function renderCostSync(){
  const box=$('cost-sync');if(!box||!window.PQ_COSTS)return;box.hidden=false;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if(costPass)box.innerHTML=`<p class="cost-sync-title">🔒 비용 공유 중 · 두 폰에서 같이 봐요</p><p class="cost-sync-msg" role="status">${esc(costMsg||'암호화해서 저장돼요.')}</p><button type="button" class="btn" data-cost-forget>이 폰에서 비용 암호 지우기</button>`;
  else if(costBox)box.innerHTML=`<p class="cost-sync-title">다른 폰에서 공유한 비용이 있어요</p><form class="cost-sync-form" data-cost-open><div class="cost-input"><input type="password" autocomplete="off" placeholder="비용 암호" aria-label="비용 암호" required><button class="primary shrink-0">열기</button></div></form><p class="cost-sync-msg" role="status">${esc(costMsg)}</p>`;
  else if(canEdit)box.innerHTML=`<p class="cost-sync-title">비용을 두 폰에서 같이 보려면 비용 암호를 정해요</p><form class="cost-sync-form" data-cost-setup><input type="password" autocomplete="new-password" placeholder="비용 암호 (6자 이상)" aria-label="비용 암호" minlength="6" required><div class="cost-input"><input type="password" autocomplete="new-password" placeholder="한 번 더" aria-label="비용 암호 확인" required><button class="primary shrink-0">공유 시작</button></div></form><p class="cost-sync-msg" role="status">${esc(costMsg||'같은 암호를 다른 폰에도 한 번 입력하면 돼요. 암호를 잊으면 공유된 비용은 열 수 없어요.')}</p>`;
  else box.innerHTML=`<p class="cost-sync-title">비용 공유</p><p class="cost-sync-msg">편집 연결한 폰에서 비용 암호를 정하면 두 폰에서 같이 볼 수 있어요.</p>`;
 }
 async function useCostPass(pass,confirmPass){
  if(pass.length<6){costMsg='비용 암호는 6자 이상으로 정해 주세요.';return renderCostSync();}
  if(confirmPass!==undefined&&pass!==confirmPass){costMsg='두 암호가 달라요.';return renderCostSync();}
  if(costBox){try{await costCrypto.open(pass,costBox);}catch{costMsg='비용 암호가 맞지 않아요.';return renderCostSync();}}
  costPass=pass;try{localStorage.setItem(COSTPASS_KEY,pass);}catch{}
  if(!costBox)pending.add('*');costMsg='';await loadCosts();if(!costBox&&canEdit)await saveCosts();
 }
 window.PQ_CLOUD={canEdit:()=>loaded&&canEdit&&!busy&&!blocked,save:markDirty,refreshControls,costsChanged};
 window.addEventListener('DOMContentLoaded',async()=>{
  $('cloud-save').onclick=saveShared;
  $('account-open').hidden=false;
  const openPanel=()=>{$('cloud-panel').open=true;$('cloud-panel').scrollIntoView({block:'start',behavior:'instant'});$('cloud-panel').querySelector('summary').focus({preventScroll:true});};
  $('account-open').onclick=openPanel;
  $('check-signin').href='#cloud-panel';$('check-signin').onclick=e=>{e.preventDefault();openPanel();};
  $('cloud-reload').onclick=()=>{if(dirty&&!confirm('아직 공유 저장하지 않은 수정이 있어요. 최신 내용을 불러오면 이 화면의 초안을 대체합니다. 계속할까요?'))return;loadState(true);};
  $('cloud-signout').onclick=()=>{if(dirty&&!confirm('공유 저장하지 않은 수정이 있어요. 이 기기의 GitHub 연결을 해제할까요?'))return;localStorage.removeItem(TOKEN_KEY);location.reload();};
  $('cloud-token-form').addEventListener('submit',e=>{e.preventDefault();connect($('cloud-token').value);});
  let tokenProblem='';
  if(token){try{const repo=await github(repoPath);canEdit=!!repo.permissions?.push;if(!canEdit)tokenProblem='저장된 GitHub 토큰에 쓰기 권한이 없어요. 새 토큰을 연결해 주세요.';try{login=(await github('/user')).login||'';}catch{}}catch(e){canEdit=false;tokenProblem=e.status===401?'저장된 GitHub 토큰이 만료됐어요. 이 기기 편집을 해제하고 새 토큰을 연결해 주세요.':'GitHub에 연결하지 못했어요. 보기 전용으로 불러왔어요.';}}
  if(canEdit)$('cloud-panel').open=true;
  const costArea=$('cost-sync');
  if(costArea){
   costArea.addEventListener('submit',e=>{e.preventDefault();const inputs=e.target.querySelectorAll('input');if(e.target.matches('[data-cost-setup]'))useCostPass(inputs[0].value,inputs[1].value);else useCostPass(inputs[0].value);});
   costArea.addEventListener('click',e=>{if(!e.target.closest('[data-cost-forget]'))return;if(!confirm('이 폰에서 비용 암호를 지울까요? 다시 입력하면 공유된 비용을 볼 수 있어요.'))return;costPass='';try{localStorage.removeItem(COSTPASS_KEY);}catch{}costMsg='';renderCostSync();});
  }
  await loadState(true);if(tokenProblem)status(tokenProblem,true);refreshControls();await loadCosts();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!dirty){loadState();loadCosts();}});
  setInterval(()=>{if(!document.hidden&&!dirty){loadState();loadCosts();}},60000);
 });
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
})();
