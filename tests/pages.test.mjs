import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
test('Public viewer uses anonymous reads, email management, and contains no auth secrets',async()=>{
 const html=await fs.readFile(new URL('../public-site/index.html',import.meta.url),'utf8');
 const config=JSON.parse(await fs.readFile(new URL('../pages.config.json',import.meta.url),'utf8'));
 assert(html.includes('window.PQ_PUBLIC_SITE={"origin":'+JSON.stringify(config.managementOrigin)+'}'));
 assert(html.includes("publicSite.origin+'/login'"));assert(html.includes("credentials:publicSite?'omit':'same-origin'"));
 assert(!html.includes('signin-with-chatgpt'));assert(!html.includes('LOGIN_INVITES_JSON'));assert(!html.includes('BETTER_AUTH_SECRET'));
 assert(!/[a-z0-9._%+-]+@naver\.com/i.test(html));assert(html.includes('YUJU SPA'));
});
