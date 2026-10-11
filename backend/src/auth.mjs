import {betterAuth} from 'better-auth';
import {APIError} from 'better-auth/api';
import {getMigrations} from 'better-auth/db/migration';

const instances=new WeakMap();
export const allowedEmail=(env,email)=>String(env.LOGIN_ALLOWED_EMAILS||'').split(',').some(value=>value.trim().toLowerCase()===String(email||'').toLowerCase()&&value.trim());
export async function inviteValid(env,email,token){
 if(!allowedEmail(env,email)||!token||token.length>256)return false;
 let invites;try{invites=JSON.parse(env.LOGIN_INVITES_JSON||'[]');}catch{return false;}
 if(!Array.isArray(invites))return false;
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
 const hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
 return invites.some(i=>String(i.email).toLowerCase()===email.toLowerCase()&&i.tokenHash===hash&&Date.parse(i.expiresAt)>Date.now());
}
export async function getAuth(env){
 if(!env.DB||!env.BETTER_AUTH_SECRET||!env.SITE_ORIGIN)throw Error('Email login is not configured');
 const key=[env.SITE_ORIGIN,env.BETTER_AUTH_SECRET,env.LOGIN_ALLOWED_EMAILS,env.LOGIN_INVITES_JSON].join('\n');
 const cached=instances.get(env.DB);if(cached?.key===key)return cached.promise;
 const promise=(async()=>{
  const options={
   appName:'Phu Quoc Pocket Trip',baseURL:env.SITE_ORIGIN,secret:env.BETTER_AUTH_SECRET,database:env.DB,
   trustedOrigins:[env.SITE_ORIGIN],
   emailAndPassword:{enabled:true,minPasswordLength:15,maxPasswordLength:128,autoSignIn:true},
   user:{modelName:'pq_auth_user'},account:{modelName:'pq_auth_account'},verification:{modelName:'pq_auth_verification'},
   session:{modelName:'pq_auth_session',expiresIn:60*60*24*7,updateAge:60*60*24,cookieCache:{enabled:false}},
   advanced:{cookiePrefix:'pq-trip',useSecureCookies:new URL(env.SITE_ORIGIN).protocol==='https:'},
   rateLimit:{enabled:true,storage:'database',modelName:'pq_auth_rate_limit',window:60,max:30,customRules:{'/sign-in/email':{window:60,max:5},'/sign-up/email':{window:60,max:3}}},
   databaseHooks:{user:{create:{before:async(user,context)=>{
    if(!await inviteValid(env,user.email,context?.headers?.get('x-invite-token')))throw new APIError('FORBIDDEN',{message:'유효한 초대 링크로만 계정을 만들 수 있습니다.'});
    return {data:{...user,emailVerified:false}};
   }}}},
   telemetry:{enabled:false},logger:{level:'error'}
  };
  // Better Auth owns only its prefixed tables. Existing trip data is never migrated.
  const migrations=await getMigrations(options);await migrations.runMigrations();
  return betterAuth(options);
 })();
 instances.set(env.DB,{key,promise});
 try{return await promise;}catch(error){instances.delete(env.DB);throw error;}
}
export async function identity(request,env){
 if(!request.headers.has('cookie'))return {authenticated:false,canEdit:false};
 const session=await (await getAuth(env)).api.getSession({headers:request.headers});
 if(!session)return {authenticated:false,canEdit:false};
 return {authenticated:true,canEdit:allowedEmail(env,session.user.email),displayName:session.user.email};
}
