function inputMedia(message){
 const m=message.photo?.length||/^image\//.test(message.document?.mime_type||'')?message:message.reply_to_message||{};
 const photo=(m.photo||[]).filter(x=>!x.file_size||x.file_size<=6000000).at(-1);
 const d=m.document;
 const image=photo?{fileId:photo.file_id,mime:'image/jpeg',photo:true}:d&&/^image\/(jpeg|png|webp)$/.test(d.mime_type||'')?{fileId:d.file_id,mime:d.mime_type,photo:false}:null;
 if(!image)return [];
 if((d&&!photo&&d.file_size>6000000)||!/^[-\w]{1,512}$/.test(image.fileId))throw Error('Ảnh phải là JPEG/PNG/WebP và không quá 6 MB.');
 return [{...image,role:'both',source:'user-provided'}];
}
async function telegramFileBytes(e,fileId,max){
 const info=await telegram(e,'getFile',{file_id:fileId});
 if(info.file_size>max||!info.file_path||!/^[\w./-]+$/.test(info.file_path)||info.file_path.split('/').includes('..'))throw Error('Tệp vượt giới hạn hoặc không đọc được.');
 const r=await fetch('https://api.telegram.org/file/bot'+e.TELEGRAM_BOT_TOKEN+'/'+info.file_path,{redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Không tải được tệp Telegram.');
 const reader=r.body.getReader(),parts=[];let size=0;
 try{for(;;){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>max)throw Error('Tệp vượt giới hạn.');parts.push(x.value);}}finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}return bytes;
}
async function newsInput(e,raw,message){
 let all=raw;const doc=message.document;
 if(doc&&(doc.mime_type==='text/plain'||/\.txt$/i.test(doc.file_name||''))){if(doc.file_size>120000)throw Error('Tệp .txt tối đa 120 KB.');const bytes=await telegramFileBytes(e,doc.file_id,120000);const attached=new TextDecoder('utf-8',{fatal:true,ignoreBOM:false}).decode(bytes).replace(/^\uFEFF/,'');all+=(all?'\n\n':'')+attached;}
 const parsed=parseNewsText(all,message.entities||message.caption_entities||[]),payload={media:inputMedia(message),userText:parsed.userText,sources:[],inputHash:await sha(parsed.userText+'\n'+JSON.stringify(parsed.urls)),sourceType:'combined'};
 const results=await Promise.all(parsed.urls.map(async url=>{try{let a=await sql(e,'SELECT * FROM articles WHERE url=?',url).first();if(!a||a.summary.length<1000){try{a=await loadArticle(url);}catch(err){if(!a||a.summary.length<300)throw err;}}return {url:a.url||url,title:a.title,summary:a.summary,read:true};}catch{return {url,title:new URL(url).hostname,read:false,error:'Không đọc được nội dung trang; không coi là dữ kiện đã thu thập.'};}}));
 const readable=results.filter(x=>x.read);
 if(!readable.length&&parsed.providedLength<300)throw Error('Chưa đọc được đủ nội dung. Gửi thêm ít nhất 300 ký tự hoặc tệp .txt cùng các link nguồn.');
 const names=readable.map(x=>new URL(x.url).hostname);payload.sourceName=names.length?[...new Set(names)].join(', '):(parsed.sourceName||'Người dùng cung cấp');payload.noPage=!readable.length;
 const budget=Math.max(1000,Math.floor((36000-parsed.userText.length)/Math.max(1,readable.length)));
 payload.sources=results.map((x,i)=>({id:'S'+(i+1),url:x.url,title:x.title,read:x.read,...(!x.read?{error:x.error}:{characters:x.summary.length,truncated:x.summary.length>budget})}));
 const sections=['[TƯ LIỆU NGƯỜI GỬI — chưa kiểm chứng; giữ nguyên toàn bộ nội dung]\n'+parsed.userText,...results.map((x,i)=>'[S'+(i+1)+'] '+x.title+'\nURL: '+x.url+'\n'+(x.read?x.summary.slice(0,budget)+(x.summary.length>budget?'\n[Trích đoạn nguồn đã rút gọn để giới hạn dung lượng]':''):x.error))];
 const first=readable[0];const title=parsed.title|| (first?first.title+(readable.length>1?' · Tổng hợp '+readable.length+' bài':''):(raw.trim()?parsed.userText.split('\n')[0].slice(0,120):String(doc?.file_name||'Nội dung người dùng cung cấp').replace(/\.txt$/i,'')));
 return {article:{title:title.slice(0,250),url:first?.url||parsed.urls[0]||'https://t.me/newsautobeartalk_bot',summary:sections.join('\n\n'),socialSummary:'Tư liệu người gửi (trích): '+parsed.userText.slice(0,2000)+'\n'+readable.map(x=>x.title+'\n'+x.url+'\n'+x.summary.slice(0,1400)).join('\n\n')},payload};
}
