import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import worker from './worker.deploy.mjs';

function database(){
  const db=new DatabaseSync(':memory:');
  const prepare=(q,values=[])=>({
    bind:(...v)=>prepare(q,v),
    first:async()=>db.prepare(q).get(...values)||null,
    all:async()=>({results:db.prepare(q).all(...values)}),
    run:async()=>({meta:{changes:Number(db.prepare(q).run(...values).changes)}})
  });
  return {prepare,batch:async xs=>{const results=[];for(const x of xs)results.push(await x.run());return results;}};
}

test('scheduled collection, private pairing, timed digest, duplicate protection and search',async()=>{
  const realFetch=globalThis.fetch,sent=[],env={DB:database(),TELEGRAM_BOT_TOKEN:'test-token',AI_ENABLED:'false'};
  globalThis.fetch=async(url,options)=>{
    if(url.startsWith('https://api.telegram.org/')){
      const method=url.split('/').at(-1),body=JSON.parse(options.body);if(method==='sendMessage')sent.push(body);
      return Response.json({ok:true,result:method==='getMe'?{username:'testbot'}:true});
    }
    const rss='<rss>'+Array.from({length:20},(_,i)=>'<item><title>AI Company'+i+' launches chip'+i+'</title><link>https://example.org/'+i+'</link><pubDate>'+new Date(Date.now()-60000).toUTCString()+'</pubDate><description>Source description '+i+'</description></item>').join('')+'</rss>';
    return new Response(rss);
  };
  try{
    await worker.scheduled({scheduledTime:Date.parse('2026-10-14T01:03:00Z')},env,{});
    assert.equal((await env.DB.prepare('SELECT COUNT(*) n FROM articles').first()).n,20);
    const activation=await worker.fetch(new Request('https://bot.example/activate',{method:'POST',headers:{origin:'https://bot.example'},body:new URLSearchParams({token:'test-token'})}),env,{});
    assert.equal(activation.status,200);const code=(await activation.text()).match(/start=([a-z0-9]+)/)[1];
    const secret=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('test-token:webhook'))).toString('hex');
    let pending=[];const context={waitUntil:p=>pending.push(p)};
    async function message(id,chat,text){const response=await worker.fetch(new Request('https://bot.example/telegram',{method:'POST',headers:{'X-Telegram-Bot-Api-Secret-Token':secret},body:JSON.stringify({update_id:id,message:{chat:{id:chat,type:'private'},text}})}),env,context);assert.equal(response.status,200);await Promise.all(pending);pending=[];}
    await message(1,123,'/start wrong');assert.equal(sent.length,0);
    await message(2,123,'/start '+code);assert.equal(sent.length,1);
    await message(3,999,'/tin');assert.equal(sent.length,2);assert.match(sent.at(-1).text,/danh sách được phép/);
    await message(4,123,'/tim AI | 24h');assert.ok(sent.length>1);const before=sent.length;
    await message(4,123,'/tim AI | 24h');assert.equal(sent.length,before);
    await worker.scheduled({scheduledTime:Date.parse('2026-10-14T00:00:00Z')},env,{});
    const edition=await env.DB.prepare("SELECT * FROM editions WHERE id LIKE '%:am'").first();assert.equal(edition.status,'sent');assert.equal(JSON.parse(edition.urls).length,10);
    const after=sent.length;await worker.scheduled({scheduledTime:Date.parse('2026-10-14T00:00:00Z')},env,{});assert.equal(sent.length,after);
    assert.ok(sent.every(x=>['123','999'].includes(String(x.chat_id))&&x.text.length<=4000));
    const checks=[
      ['/start','NewsAutoBear'],['/help','/check_status'],['/tin','TIN TRONG KHO'],
      ['/tim','Ví dụ: /tim'],['/hoi','Ví dụ: /hoi'],['/hoi AI | 24h','Nguồn RSS'],
      ['/sang','BẢN TIN'],['/toi','Chưa có bản tin'],['/trangthai','Kho tin'],
      ['/nguon','VnExpress'],['/video','Gửi /video'],['/check_status','Máy dựng'],
      ['/video_status','Máy dựng'],['/check_status@testbot','Máy dựng'],
      ['/khong_ton_tai','Lệnh chưa hỗ trợ']
    ];
    for(let i=0;i<checks.length;i++){
      const n=sent.length;await message(100+i,123,checks[i][0]);
      assert.ok(sent.length>n,'No reply: '+checks[i][0]);
      assert.ok(sent.slice(n).some(m=>m.text.includes(checks[i][1])),checks[i][0]+' wrong reply');
      assert.equal((await env.DB.prepare('SELECT status FROM updates WHERE id=?').bind(100+i).first()).status,checks[i][0]==='/tim'?'failed':'done',checks[i][0]);
    }

    await message(200,999,'/myid');assert.match(sent.at(-1).text,/999/);
    await message(201,999,'/allow 777');assert.match(sent.at(-1).text,/chưa phải quản trị viên/);
    assert.equal(await env.DB.prepare("SELECT v FROM state WHERE k='access:777'").first(),null);
    await message(202,123,'/allow 999');assert.ok(await env.DB.prepare("SELECT v FROM state WHERE k='access:999'").first());
    await message(203,999,'/tin');assert.match(sent.at(-1).text,/TIN TRONG KHO/);
    await message(204,123,'/deny 123');assert.ok(await env.DB.prepare("SELECT v FROM state WHERE k='owner'").first());
    await message(205,123,'/users');assert.match(sent.at(-1).text,/999/);
    await message(206,999,'/video https://example.org/1');assert.equal((await env.DB.prepare("SELECT chat FROM video_jobs WHERE id='v206'").first()).chat,'999');
    await message(207,123,'/deny 999');assert.equal(await env.DB.prepare("SELECT v FROM state WHERE k='access:999'").first(),null);assert.equal((await env.DB.prepare("SELECT status FROM video_jobs WHERE id='v206'").first()).status,'cancelled');
    await message(208,999,'/tin');assert.match(sent.at(-1).text,/danh sách được phép/);
  }finally{globalThis.fetch=realFetch;}
});
