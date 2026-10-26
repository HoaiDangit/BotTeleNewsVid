import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
export function sketchPlan(job,variant=0){
 if(job.kind==='workout')return {width:1080,height:1350,theme:'fitness',heading:'VẬN ĐỘNG & THỂ LỰC',variant,forecast:false,label:'ẢNH MINH HỌA • PHÁC HỌA',subtitle:'KHÔNG PHẢI HƯỚNG DẪN TƯ THẾ'};
 const text=norm(job.title+' '+(job.excerpt||''));
 const themes=[[/\b(sinh trac hoc|ngan hang|deepfake|lua dao|bao mat|quyen rieng tu)\b/,'security','AN TOÀN & BẢO MẬT'],[/\b(ai|gemini|chatgpt|robot|chip|internet|cong nghe)\b/,'technology','CÔNG NGHỆ & ĐỜI SỐNG'],[/\b(suc khoe|dich benh|benh vien|vaccine|health)\b/,'health','SỨC KHỎE CỘNG ĐỒNG'],[/\b(giao duc|hoc sinh|sinh vien|hoc phi|education)\b/,'education','GIÁO DỤC & TƯƠNG LAI'],[/\b(moi truong|khi hau|thien tai|forest|climate|nang luong)\b/,'environment','MÔI TRƯỜNG & ĐỜI SỐNG'],[/\b(kinh te|thu nhap|lam phat|doanh nghiep|gia|economy|business)\b/,'economy','KINH TẾ & CUỘC SỐNG'],[/\b(du lich|tourism|travel)\b/,'travel','KHÁM PHÁ & DU LỊCH'],[/\b(am nhac|ca si|album|music)\b/,'music','ÂM NHẠC & VĂN HÓA']];
 const found=themes.find(([re])=>re.test(text));return {width:1080,height:1350,theme:found?.[1]||'society',heading:found?.[2]||'XÃ HỘI & ĐỜI SỐNG',variant,forecast:/\b(du bao|kich ban|du doan|forecast|prediction)\b/.test(text),label:'ẢNH MINH HỌA • PHÁC HỌA',subtitle:variant?'TÁC ĐỘNG ĐẾN CUỘC SỐNG':'GÓC NHÌN THEO CHỦ ĐỀ'};
}
export async function drawSketch(job,archive,variant=0){
 if(process.platform!=='win32')throw Error('Local sketches currently require Windows');
 const plan=sketchPlan(job,variant),input=path.join(archive,'sketch-'+variant+'.json'),output=path.join(archive,'sketch-'+variant+'.png');
 fs.writeFileSync(input,JSON.stringify(plan));const renderer=fileURLToPath(new URL('SketchRenderer.exe',import.meta.url));
 if(!fs.existsSync(renderer))throw Error('Thiếu SketchRenderer.exe; biên dịch SketchRenderer.cs trước khi chạy.');
 await new Promise((resolve,reject)=>{const child=spawn(renderer,[path.resolve(input),path.resolve(output)],{windowsHide:true,stdio:['ignore','ignore','pipe']});let error='';const timer=setTimeout(()=>child.kill(),20000);child.stderr.on('data',x=>error+=x);child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('exit',code=>{clearTimeout(timer);code===0?resolve():reject(Error('Sketch renderer failed: '+error.slice(0,200)));});});
 return {bytes:fs.readFileSync(output),plan};
}
