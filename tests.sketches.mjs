import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {sketchPlan,drawSketch} from './sketch-images.mjs';import {licensedImages} from './licensed-images.mjs';
test('sketch topic and forecast labels follow source without copying article title',()=>{const p=sketchPlan({title:'Dự báo AI thay đổi việc làm'});assert.equal(p.theme,'technology');assert.equal(p.forecast,true);assert.equal(sketchPlan({title:'Vaccine sức khỏe cộng đồng'}).theme,'health');assert.equal(sketchPlan({title:'Chủ đề khác'}).theme,'society');assert.ok(!p.heading.includes('thay đổi việc làm'));});
test('local renderer produces PNG and missing photos fall back to two audited sketches',{skip:process.platform!=='win32'},async()=>{
 const root=path.resolve('.bridge','sketch-tests');fs.mkdirSync(root,{recursive:true});const a=await drawSketch({title:'AI'},root,1);assert.equal(a.bytes.subarray(1,4).toString(),'PNG');
 const real=globalThis.fetch;let uploads=0;
 globalThis.fetch=async(url,opts)=>{assert.match(String(url),/^http:\/\/127\.0\.0\.1:4000\/api\/user-images/);assert.equal(opts.headers['Content-Type'],'image/png');uploads++;return Response.json({id:'sketch-'+uploads+'.png'});};
 try{const m=await licensedImages({appRoot:root,studio:'http://127.0.0.1:4000'},{id:'v123',title:'Chủ đề khác',url:'https://example.com/article'});assert.equal(m.assets.length,2);assert.equal(uploads,2);assert.ok(m.assets.every(x=>x.license==='Local procedural sketch'&&/^[0-9a-f]{64}$/.test(x.sha256)));}finally{globalThis.fetch=real;}
});
