import {randomBytes,createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
const {values}=parseArgs({options:{email:{type:'string'},origin:{type:'string'},out:{type:'string'}}});
if(!values.email||!values.origin||!values.out)throw Error('Usage: node scripts/create-invite.mjs --email <approved-email> --origin <management-origin> --out <private-directory>');
const email=values.email.trim().toLowerCase(),origin=new URL(values.origin);
if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||origin.protocol!=='https:')throw Error('A valid email and HTTPS origin are required');
const token=randomBytes(32).toString('base64url'),expiresAt=new Date(Date.now()+7*24*3600000).toISOString();
const record={email,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt};
const url=origin.origin+'/login#'+new URLSearchParams({email,invite:token});
await fs.mkdir(values.out,{recursive:true});
// This directory must stay outside the public repo. Do not print the invitation URL.
await fs.writeFile(path.join(values.out,'invite-record.json'),JSON.stringify(record,null,2),{flag:'wx'});
const safe=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
await fs.writeFile(path.join(values.out,'관리자_처음_로그인.html'),`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>여행 플래너 관리자 초대</title><style>body{background:#e5f0e6;color:#294f50;font:16px/1.8 system-ui;max-width:620px;margin:60px auto;padding:24px}main{padding:28px;border:2px solid #81aa99;border-radius:24px;background:#fffdf2}a{display:block;background:#fac8d4;border-radius:14px;padding:16px;text-align:center;color:#543644;font-weight:bold;text-decoration:none}small{color:#687c73}</style><main><h1>우리 여행 관리 시작 ♡</h1><p>로그인 이메일: <b>${safe(email)}</b></p><p>아래 버튼에서 여행 플래너 전용 비밀번호를 처음 설정하세요. 이후에는 공개 여행 페이지의 ‘로그인하고 관리’를 이용하면 됩니다.</p><a href="${safe(url)}" rel="noreferrer">내 비밀번호 설정하기 →</a><p>초대 유효기간: ${safe(expiresAt)} (UTC)<br>비밀번호는 15자 이상으로 설정하세요.</p><small>이 파일은 계정을 만들 수 있는 초대장입니다. 공개 저장소나 공유 채팅에 올리지 마세요. 일반 여행 링크만 다른 사람에게 보내 주세요. 이미 비밀번호를 설정했다면 <a href="${origin.origin}/login">일반 로그인 열기</a></small></main></html>`,{flag:'wx'});
console.log('Created private invitation files. Apply invite-record.json to LOGIN_INVITES_JSON and allow the email before opening.');
