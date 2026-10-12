/* Shared planner state lives in the GitHub repository (data/state.json); no separate login server.
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
   localStorage.setItem(TOKEN_KEY,token);canEdit=true;$('cloud-token').value='';await loadState(true);
  }catch(e){token='';canEdit=false;status(e.status===401?'토큰을 확인하지 못했어요. 만료일과 복사한 값을 확인해 주세요.':e.message,true);refreshControls();}
 }
 window.PQ_CLOUD={canEdit:()=>loaded&&canEdit&&!busy&&!blocked,save:markDirty,refreshControls};
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
  await loadState(true);if(tokenProblem)status(tokenProblem,true);refreshControls();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!dirty)loadState();});
  setInterval(()=>{if(!document.hidden&&!dirty)loadState();},60000);
 });
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
})();
