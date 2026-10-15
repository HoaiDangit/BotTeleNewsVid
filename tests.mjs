import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{parseFeed,timeRange,selectNews,norm,rank} from './worker.mjs';
test('activation form retains same-origin POST provenance without cross-site referrer leakage',async()=>{
  const response=await worker.fetch(new Request('https://x/activate'),{},{});
  assert.equal(response.headers.get('Referrer-Policy'),'same-origin');
  assert.match(await response.text(),/method="post" action="\/activate"/);
});
test('Vietnam calendar boundaries and invalid dates',()=>{
  assert.deepEqual(timeRange('14/10/2026',Date.parse('2026-10-15T00:00:00Z')),[Date.parse('2026-10-13T17:00:00Z'),Date.parse('2026-10-14T16:59:59.999Z')]);
  assert.throws(()=>timeRange('31/02/2026'));assert.throws(()=>timeRange('0h'));assert.throws(()=>timeRange('31d'));
  const n=Date.now();assert.deepEqual(timeRange('24h',n),[n-86400000,n]);
});
test('RSS parsing strips HTML, rejects unsafe URLs and future/undated articles',()=>{
  const now=Date.parse('2026-10-14T05:00:00Z');
  const article=(url,date)=>`<item><title>AI &amp; Việt Nam</title><link>${url}</link><pubDate>${date}</pubDate><description><![CDATA[<p>Mô tả</p>]]></description></item>`;
  const rows=parseFeed('<rss>'+article('https://example.org/a','Wed, 14 Oct 2026 04:00:00 GMT')+article('javascript:alert(1)','Wed, 14 Oct 2026 04:00:00 GMT')+article('https://example.org/b','Wed, 14 Oct 2027 04:00:00 GMT')+article('https://example.org/c','')+'</rss>',['Test','world'],now);
  assert.equal(rows.length,1);assert.equal(rows[0].title,'AI & Việt Nam');assert.equal(rows[0].summary,'Mô tả');assert.equal(rows[0].category,'tech');
});
test('ranking prioritizes AI and deduplicates same headlines',()=>{
  const now=Date.now(),base={summary:'',source:'x',published:now,category:'world'};
  const rows=[{...base,title:'AI Việt Nam',search:norm('AI Việt Nam'),category:'tech',url:'https://a'}, {...base,title:'AI Việt Nam',search:norm('AI Việt Nam'),category:'tech',url:'https://b'},...Array.from({length:14},(_,i)=>({...base,title:'Sự kiện '+i,search:'su kien '+i,url:'https://x/'+i}))];
  const result=selectNews(rows,10,now);assert.equal(result.length,10);assert.equal(result.filter(x=>x.title==='AI Việt Nam').length,1);assert.equal(result[0].category,'tech');assert.ok(rank(rows[0],now)>rank(rows[2],now));
});
test('public health does not expose secrets',async()=>{
  const res=await worker.fetch(new Request('https://x/health'),{DB:{},TELEGRAM_BOT_TOKEN:'secret',GEMINI_API_KEY:'key'},{});
  const text=await res.text();assert.ok(!text.includes('secret'));assert.ok(!text.includes('"key"'));assert.equal(JSON.parse(text).aiEnabled,false);
});
test('forged webhook is rejected before database access',async()=>{
  const res=await worker.fetch(new Request('https://x/telegram',{method:'POST',body:'{}'}),{TELEGRAM_BOT_TOKEN:'secret'},{});assert.equal(res.status,403);
});
test('activation rejects cross-origin posts and incorrect tokens',async()=>{
  const res=await worker.fetch(new Request('https://x/activate',{method:'POST',headers:{origin:'https://evil'},body:new URLSearchParams({token:'secret'})}),{TELEGRAM_BOT_TOKEN:'secret'},{});assert.equal(res.status,403);
  const bad=await worker.fetch(new Request('https://x/activate',{method:'POST',headers:{origin:'https://x'},body:new URLSearchParams({token:'bad'})}),{TELEGRAM_BOT_TOKEN:'secret'},{});assert.equal(bad.status,403);
});
