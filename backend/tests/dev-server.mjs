// Local, disposable test DB and test account only. Never deploy this file.
import http from 'node:http';
import {createHash} from 'node:crypto';
import worker from '../dist/server/index.js';
import {testDB} from './d1-adapter.mjs';
const origin='http://localhost:4176',DB=testDB(),email='editor@example.test',token='localhost-test-invite';
const env={DB,SITE_ORIGIN:origin,BETTER_AUTH_SECRET:'local-only-never-deploy-1d14a8e7ac44abc8de2c',LOGIN_ALLOWED_EMAILS:email,LOGIN_INVITES_JSON:JSON.stringify([{email,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:'2099-01-01T00:00:00Z'}])};
const seed=await worker.fetch(new Request(origin+'/api/auth/sign-up/email',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Invite-Token':token},body:JSON.stringify({email,password:'Local test password 2026!',name:'Local test'})}),env);
if(seed.status!==200)throw Error('Local test account setup failed');
http.createServer(async(req,res)=>{
 try{
  const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
  const chunks=[];for await(const chunk of req){chunks.push(chunk);if(chunks.reduce((n,b)=>n+b.length,0)>520000){res.writeHead(413);res.end();return;}}
  const body=chunks.length?Buffer.concat(chunks):undefined;
  const result=await worker.fetch(new Request(origin+req.url,{method:req.method,headers,...(body?{body,duplex:'half'}:{})}),env);
  const outgoing=Object.fromEntries(result.headers);const cookies=result.headers.getSetCookie();if(cookies.length)outgoing['set-cookie']=cookies;
  res.writeHead(result.status,outgoing);res.end(Buffer.from(await result.arrayBuffer()));
 }catch{res.writeHead(500);res.end('Local test server error');}
}).listen(4176,'127.0.0.1',()=>console.log('Local test: '+origin+' | editor@example.test | Local test password 2026!'));
