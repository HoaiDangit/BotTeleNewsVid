import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import worker from './worker.deploy.mjs';
import {filename,outputPath,studioSnapshot} from './video-agent.mjs';
function database(){const db=new DatabaseSync(':memory:');const prepare=(q,v=[])=>({bind:(...values)=>prepare(q,values),first:async()=>db.prepare(q).get(...v)||null,all:async()=>({results:db.prepare(q).all(...v)}),run:async()=>({meta:{changes:Number(db.prepare(q).run(...v).changes)}})});return{prepare,batch:async a=>{for(const x of a)await x.run();}};}
const hash=async s=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))).toString('hex');
test('queue isolates owner, claims once, sends to stored chat, names by source and VN time, rejects duplicate upload',async()=>{
  const actual=globalThis.fetch, sent=[];let multipart='';
  const env={DB:database(),TELEGRAM_BOT_TOKEN:'fake',VIDEO_AGENT_SHA256:await hash('agent')};const pending=[],ctx={waitUntil:p=>pending.push(p)};
  globalThis.fetch=async(url,o)=>{if(url.endsWith('/sendVideo')){multipart=await new Response(o.body).text();return Response.json({ok:true,result:{message_id:77}});}if(url.includes('api.telegram.org')){sent.push(JSON.parse(o.body));return Response.json({ok:true,result:true});}if(url==='https://vietnamnet.vn/new-article.html')return new Response('<html><h1>Bài mới ngoài kho tin</h1><article><p>'+('Nội dung bài báo đã được xác minh từ trang nguồn. '.repeat(12))+'</p></article></html>',{headers:{'content-type':'text/html'}});return new Response('<rss></rss>');};
  const api=(route,opts={})=>worker.fetch(new Request('https://test/render/'+route,{method:opts.method||'POST',headers:{Authorization:'Bearer agent',...opts.headers},body:opts.method==='GET'?undefined:opts.body||'{}'}),env,ctx);
  try{
    assert.equal((await worker.fetch(new Request('https://test/render/ping'),env,ctx)).status,403);
    assert.equal((await api('ping',{method:'GET'})).status,200);
    await env.DB.prepare("INSERT INTO state VALUES('owner','123')").run();
    await env.DB.prepare('INSERT INTO articles(url,title,summary) VALUES(?,?,?)').bind('https://example.com/news','Công nghệ AI mới','RSS summary').run();
    const secret=await hash('fake:webhook');
    const message=async(id,chat,text)=>{await worker.fetch(new Request('https://test/telegram',{method:'POST',headers:{'X-Telegram-Bot-Api-Secret-Token':secret},body:JSON.stringify({update_id:id,message:{chat:{id:chat,type:'private'},text}})}),env,ctx);await Promise.all(pending.splice(0));};
    await message(1,999,'/video https://example.com/news');
    assert.equal((await env.DB.prepare('SELECT COUNT(*) n FROM video_jobs').first()).n,0);
    await message(2,123,'/video https://example.com/news');
    await message(3,123,'/video https://example.com/news');
    assert.equal((await env.DB.prepare('SELECT COUNT(*) n FROM video_jobs').first()).n,1);
    const first=await (await api('claim')).json();assert.equal(first.job.chat,'123');assert.equal(first.job.status,'running');
    const second=await (await api('claim')).json();assert.equal(second.job.id,first.job.id);assert.equal(second.resume,true);
    assert.equal((await api('upload',{headers:{'x-job-id':'v2','content-length':'50000001'},body:'x'})).status,413);
    const uploaded=await api('upload',{headers:{'x-job-id':'v2','content-length':'3'},body:'mp4'});assert.equal(uploaded.status,200);
    const result=await uploaded.json();assert.match(result.filename,/^cong-nghe-ai-moi__\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.mp4$/);
    assert.ok(multipart.includes('name="chat_id"\r\n\r\n123\r\n'));assert.ok(multipart.includes('Nguồn: https://example.com/news'));
    assert.equal((await api('upload',{headers:{'x-job-id':'v2','content-length':'3'},body:'mp4'})).status,409);
    assert.equal((await env.DB.prepare("SELECT status FROM video_jobs WHERE id='v2'").first()).status,'done');
    assert.equal((await (await api('claim')).json()).job,null);
    await message(4,123,'/video https://vietnamnet.vn/new-article.html');
    const direct=await env.DB.prepare("SELECT * FROM video_jobs WHERE id='v4'").first();assert.equal(direct.title,'Bài mới ngoài kho tin');assert.ok(direct.excerpt.length>300);
    await message(5,123,'/video https://127.0.0.1/private');assert.equal(await env.DB.prepare("SELECT * FROM video_jobs WHERE id='v5'").first(),null);
  }finally{globalThis.fetch=actual;}
});
test('local paths and filenames cannot escape app output, VN timestamp crosses day',()=>{
  assert.throws(()=>outputPath('C:/app','../../secret'));
  assert.equal(filename('Đổi mới: AI / Công nghệ',Date.parse('2026-10-14T20:30:00Z')),'doi-moi-ai-cong-nghe__2026-10-15_03-30-00.mp4');
});
test('SSE progress reader handles chunked UTF-8 JSON and closes the connection',async()=>{
  const actual=globalThis.fetch;let cancelled=false;const bytes=new TextEncoder().encode('data: '+JSON.stringify({active:false,step:'completed',outputVideo:{title:'Công nghệ'}})+'\n\n');
  globalThis.fetch=async()=>new Response(new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=7)c.enqueue(bytes.slice(i,i+7));},cancel(){cancelled=true;}}));
  try{assert.equal((await studioSnapshot('http://127.0.0.1:4000')).outputVideo.title,'Công nghệ');assert.equal(cancelled,true);}finally{globalThis.fetch=actual;}
});
