/* PAGE, B, empty(), validateState() are bundled from the identical planner source. */
import {getAuth,identity} from './auth.mjs';
const securityHeaders={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','X-Robots-Tag':'noindex, nofollow'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...securityHeaders,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Cookie'}});
async function initDB(db){
 await db.prepare('CREATE TABLE IF NOT EXISTS planner_state (id INTEGER PRIMARY KEY CHECK (id = 1), version INTEGER NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)').run();
 await db.prepare('INSERT OR IGNORE INTO planner_state (id, version, data, updated_at) VALUES (1, 0, ?, ?)').bind(JSON.stringify(empty()),new Date().toISOString()).run();
}
async function readJSON(request){
 const limit=512000;if(Number(request.headers.get('content-length')||0)>limit)throw Object.assign(Error('저장할 내용이 너무 큽니다.'),{status:413});
 const reader=request.body?.getReader();if(!reader)throw Object.assign(Error('저장할 내용이 없습니다.'),{status:400});
 let size=0,parts=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw Object.assign(Error('저장할 내용이 너무 큽니다.'),{status:413});}parts.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw Object.assign(Error('올바른 JSON 데이터가 아닙니다.'),{status:400});}
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),path=url.pathname;
  try{
   if(path.startsWith('/api/auth/')){
    const routes={'/api/auth/sign-up/email':'POST','/api/auth/sign-in/email':'POST','/api/auth/sign-out':'POST','/api/auth/get-session':'GET','/api/auth/change-password':'POST','/api/auth/ok':'GET'};
    if(routes[path]!==request.method)return json({error:'지원하지 않는 로그인 요청입니다.'},404);
    if(request.method==='POST'){
     if(request.headers.get('origin')!==env.SITE_ORIGIN)return json({error:'로그인 화면에서 다시 시도해 주세요.'},403);
     if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({error:'JSON 요청만 허용합니다.'},415);
     // Bound the auth body before the library parses it, including chunked requests.
     const body=await readJSON(request);if(JSON.stringify(body).length>8192)return json({error:'요청이 너무 큽니다.'},413);
     request=new Request(request,{body:JSON.stringify(body)});
    }
    const result=await (await getAuth(env)).handler(request),response=new Response(result.body,result);
    for(const [key,value]of Object.entries(securityHeaders))response.headers.set(key,value);
    response.headers.set('Cache-Control','no-store');return response;
   }
   if(path==='/login'&&request.method==='GET')return new Response(LOGIN_PAGE,{headers:{...securityHeaders,'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
   if(path==='/api/session'&&request.method==='GET')return json(await identity(request,env));
   if(path==='/api/state'){
    if(!['GET','PUT'].includes(request.method))return json({error:'지원하지 않는 요청입니다.'},405);
    if(request.method==='PUT'){
     const user=await identity(request,env);
     if(!user.authenticated)return json({error:'이메일 로그인이 필요합니다.'},401);
     if(!user.canEdit)return json({error:'이 계정에는 편집 권한이 없습니다.'},403);
     if(request.headers.get('origin')!==env.SITE_ORIGIN||request.headers.get('x-planner-write')!=='1')return json({error:'이 사이트에서 시작한 저장 요청만 허용합니다.'},403);
     if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({error:'JSON 형식으로 저장하세요.'},415);
     const body=await readJSON(request);
     if(!safeObject(body)||Object.keys(body).some(k=>!['version','state'].includes(k))||!Number.isSafeInteger(body.version)||body.version<0)return json({error:'저장 버전을 확인하세요.'},400);
     let next;try{next=validateState(body.state)}catch(e){return json({error:e.message},400)}
     if(!env.DB)return json({error:'공유 저장소를 연결하는 중입니다. 잠시 후 다시 시도하세요.'},503);
     await initDB(env.DB);const now=new Date().toISOString();
     const result=await env.DB.prepare('UPDATE planner_state SET data = ?, version = version + 1, updated_at = ? WHERE id = 1 AND version = ?').bind(JSON.stringify(next),now,body.version).run();
     if(result.meta.changes!==1)return json({error:'다른 곳에서 먼저 수정했습니다. 최신 내용을 불러와 다시 편집하세요.'},409);
     return json({version:body.version+1,updatedAt:now});
    }
    if(!env.DB)return json({error:'공유 저장소를 연결하는 중입니다. 잠시 후 다시 시도하세요.'},503);
    await initDB(env.DB);const row=await env.DB.prepare('SELECT version, data, updated_at FROM planner_state WHERE id = 1').first();
    const response=json({version:row.version,state:JSON.parse(row.data),updatedAt:row.updated_at});
    // Only anonymous public reads support CORS; authenticated writes remain same-origin.
    response.headers.set('Access-Control-Allow-Origin','*');
    return response;
   }
   if(path==='/robots.txt')return new Response('User-agent: *\nDisallow: /\n',{headers:{...securityHeaders,'Content-Type':'text/plain'}});
   if((path==='/'||path==='/index.html')&&['GET','HEAD'].includes(request.method))return new Response(request.method==='HEAD'?null:PAGE,{headers:{...securityHeaders,'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=0, must-revalidate'}});
   return json({error:'페이지를 찾을 수 없습니다.'},404);
  }catch(e){return json({error:e.status?e.message:'일시적으로 저장소에 연결하지 못했어요. 초안을 백업하고 다시 시도해 주세요.'},e.status||503);}
 }
};
