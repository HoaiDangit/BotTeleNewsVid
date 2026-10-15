import test from 'node:test';
import assert from 'node:assert/strict';
import {editorialRequest,reviewScript} from './editorial-policy.mjs';
const job={title:'Tin công nghệ',url:'https://vietnamnet.vn/test.html',excerpt:'Nguồn thông tin chưa đối chiếu.'};
const draft={scenes:[{text:'Theo vietnamnet.vn, đây là thông tin về một sản phẩm mới. Các khả năng sử dụng thực tế cần được kiểm tra thêm. Bản nháp cần duyệt. Nguồn: vietnamnet.vn. Giọng đọc tổng hợp.'}]};
test('no external visual or music defaults, source treated as data',()=>{const r=editorialRequest(job,'[test]');assert.equal(r.visualMode,'none');assert.equal(r.audioMode,'voice-only');assert.equal(r.templateId,'creative/free-style');assert.match(r.context,/Không tuyên bố đã kiểm chứng/);});
test('valid draft still requires human fact and rights review',()=>{const r=reviewScript(job,draft);assert.equal(r.status,'draft-needs-human-review');assert.equal(r.independentlyVerified,false);assert.equal(r.rightsCleared,false);});
test('missing attribution, copied text and external assets block delivery',()=>{assert.equal(reviewScript(job,{scenes:[]}).status,'blocked');const excerpt=Array.from({length:24},(_,i)=>'từ'+i).join(' ');assert.equal(reviewScript({...job,excerpt},{scenes:[{text:draft.scenes[0].text+' '+excerpt}]}).status,'blocked');assert.equal(reviewScript(job,{scenes:[{...draft.scenes[0],image:'remote.jpg'}]}).status,'blocked');});
