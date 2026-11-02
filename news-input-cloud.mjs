function inputMedia(message){
 const m=message.photo?.length||message.document?message:message.reply_to_message||{};
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
 const parts=raw.split('|').map(x=>x.trim()),media=inputMedia(message),payload={media};let article;
 if(message.document&&(message.document.mime_type==='text/plain'||/\.txt$/i.test(message.document.file_name||''))){
  if(message.document.file_size>120000)throw Error('Tệp .txt tối đa 120 KB.');
  const bytes=await telegramFileBytes(e,message.document.file_id,120000);const summary=new TextDecoder('utf-8',{fatal:true,ignoreBOM:false}).decode(bytes).replace(/^\uFEFF/,'').trim();
  if(summary.length<300||summary.length>30000||!parts[0]||!parts[1])throw Error('Gửi tệp .txt UTF-8 và caption /video_tin Tên bài | Tên nguồn | Link nguồn (nếu có); nội dung 300–30000 ký tự.');
  const url=parts[2]?articleURL(parts[2]):'https://t.me/newsautobeartalk_bot';article={title:parts[0].slice(0,250),summary,url};Object.assign(payload,{sourceType:'provided',sourceName:parts[1].slice(0,100),noPage:!parts[2]});
 }else if(parts.length>=3&&!/^https:\/\//i.test(parts[0])){
  const summary=parts.slice(2).join(' | ');if(summary.length<300||summary.length>30000)throw Error('Nội dung tự nhập cần 300–30000 ký tự. Dùng /video_tin Tên bài | Tên nguồn | Nội dung.');
  article={title:parts[0].slice(0,250),summary,url:'https://t.me/newsautobeartalk_bot'};Object.assign(payload,{sourceType:'provided',sourceName:parts[1].slice(0,100),noPage:true});
 }else{
  const url=articleURL(parts[0]);
  if(parts.length>=4){const summary=parts.slice(3).join(' | ');if(summary.length<300||summary.length>30000)throw Error('Nội dung cần 300–30000 ký tự.');article={url,title:parts[1].slice(0,250),summary};Object.assign(payload,{sourceType:'provided',sourceName:parts[2].slice(0,100)});}
  else{article=await sql(e,'SELECT * FROM articles WHERE url=?',url).first();if(!article||article.summary.length<1000){try{article=await loadArticle(url);}catch(err){if(!article||article.summary.length<300)throw err;payload.sourceExcerpt=true;}} payload.sourceName=(parts[1]||new URL(article.url||url).hostname).slice(0,100);}
 }
 if(!article.title?.trim()||!payload.sourceName?.trim())throw Error('Cần tên bài và tên nguồn rõ ràng.');
 return {article,payload};
}
