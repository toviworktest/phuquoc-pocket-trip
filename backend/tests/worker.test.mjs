import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import worker from '../dist/server/index.js';
import {testDB} from './d1-adapter.mjs';
const origin='https://planner.test',email='editor@example.test',token='test-invitation-token-not-a-production-secret';
function fixture(){
 const DB=testDB(),env={DB,SITE_ORIGIN:origin,BETTER_AUTH_SECRET:'test-only-secret-7JD6kwqhANSkXYYpq0MDmvSW',LOGIN_ALLOWED_EMAILS:email,LOGIN_INVITES_JSON:JSON.stringify([{email,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+3600000).toISOString()}])};
 const call=(path,method='GET',body,extra={})=>worker.fetch(new Request(origin+path,{method,headers:{...(['PUT','POST'].includes(method)?{'Content-Type':'application/json',Origin:origin,'X-Planner-Write':'1'}:{}),'X-Forwarded-For':'192.0.2.1',...extra},...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)})}),env);
 return {DB,env,call};
}
const password='A long test password only 456!';
async function signup(call){const r=await call('/api/auth/sign-up/email','POST',{email,password,name:'Test'}, {'X-Invite-Token':token});assert.equal(r.status,200,await r.clone().text());const cookies=r.headers.getSetCookie();assert(cookies.some(x=>/httponly/i.test(x)&&/secure/i.test(x)));return cookies.map(x=>x.split(';')[0]).join('; ');}
test('Invitation, email login, sessions, editor authorization, fixed itinerary and conflict protection',async()=>{
 const {DB,env,call}=fixture();try{
  const fakeHeaders={'oai-authenticated-user-id':'fake','oai-authenticated-user-email':email};
  assert.deepEqual(await (await call('/api/session','GET',undefined,fakeHeaders)).json(),{authenticated:false,canEdit:false});
  const response=await call('/api/state'),initial=await response.json();assert.equal(response.headers.get('Access-Control-Allow-Origin'),'*');assert.equal(initial.version,0);
  const cookie=await signup(call),owner={Cookie:cookie};
  assert.equal((await (await call('/api/session','GET',undefined,owner)).json()).canEdit,true);
  const stored=await DB.prepare('SELECT password FROM pq_auth_account LIMIT 1').first();assert(stored.password);assert.notEqual(stored.password,password);
  const state=structuredClone(initial.state);state.dayNotes['2026-11-03']='공유 메모 <img src=x onerror=alert(1)>';state.checked.pickup=true;state.checked['entry-form']=true;state.checked['gift-coconut-coffee']=true;
  const payload={version:0,state};assert.equal((await call('/api/state','PUT',payload)).status,401);assert.equal((await call('/api/state','PUT',payload,fakeHeaders)).status,401);
  env.LOGIN_ALLOWED_EMAILS='';assert.equal((await call('/api/state','PUT',payload,owner)).status,403);env.LOGIN_ALLOWED_EMAILS=email;
  assert.equal((await call('/api/state','PUT',payload,{...owner,Origin:'https://attacker.test'})).status,403);
  assert.equal((await call('/api/state','PUT',payload,{...owner,'Content-Type':'text/plain'})).status,415);
  const invalid=structuredClone(payload);invalid.state.overrides['d1-flight']={time:'19:00'};assert.equal((await call('/api/state','PUT',invalid,owner)).status,400);
  invalid.state.overrides={'d1-flight':{title:'changed'}};assert.equal((await call('/api/state','PUT',invalid,owner)).status,400);
  assert.equal((await call('/api/state','PUT','x'.repeat(512001),owner)).status,413);
  const saved=await call('/api/state','PUT',payload,owner);assert.equal(saved.status,200);assert.equal(saved.headers.get('Access-Control-Allow-Origin'),null);assert.equal((await saved.json()).version,1);
  assert.equal((await call('/api/state','PUT',payload,owner)).status,409);
  const publicState=await (await call('/api/state')).json();assert.equal(publicState.state.dayNotes['2026-11-03'],state.dayNotes['2026-11-03']);assert.equal(publicState.version,1);assert.deepEqual(publicState.state.checked,state.checked);
  assert.equal((await call('/api/auth/sign-out','POST',{},owner)).status,200);
  assert.equal((await (await call('/api/session','GET',undefined,owner)).json()).authenticated,false);
  assert.equal((await call('/api/auth/sign-in/email','POST',{email,password:'wrong-password'})).status,401);
  const login=await call('/api/auth/sign-in/email','POST',{email,password});assert.equal(login.status,200);
  const loggedIn={Cookie:login.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ')};
  const change=await call('/api/auth/change-password','POST',{currentPassword:password,newPassword:password+' changed',revokeOtherSessions:true},loggedIn);assert.equal(change.status,200);
  assert.equal((await call('/api/auth/sign-in/email','POST',{email,password:password+' changed'})).status,200);
  assert.equal((await call('/private/예약정보.json')).status,404);assert.equal((await call('/.openai/hosting.json')).status,404);
  const html=await (await call('/')).text();assert(html.includes('href="/login"'));assert(!html.includes('signin-with-chatgpt'));assert(!html.includes(email));
 }finally{DB.close();}
});
test('Signup requires invitation; expired/unapproved/cross-origin requests fail and attempts are rate limited',async()=>{
 const {DB,env,call}=fixture();try{
  const body={email,password,name:'Test'};
  assert.equal((await call('/api/auth/sign-up/email','POST',body)).status,403);
  assert.equal((await call('/api/auth/sign-up/email','POST',{...body,email:'stranger@example.test'},{'X-Invite-Token':token})).status,403);
  env.LOGIN_INVITES_JSON=JSON.stringify([{email,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:'2020-01-01T00:00:00Z'}]);
  assert.equal((await call('/api/auth/sign-up/email','POST',body,{'X-Invite-Token':token})).status,403);
  assert.equal((await call('/api/auth/sign-up/email','POST',body,{'X-Invite-Token':token})).status,429);
  assert.equal((await call('/api/auth/sign-in/email','POST',body,{Origin:'https://attacker.test'})).status,403);
  assert.equal((await call('/api/auth/update-user','POST',{name:'attack'})).status,404);assert.equal((await call('/api/state','OPTIONS')).status,405);
  assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM pq_auth_user').first()).n,0);
 }finally{DB.close();}
});
