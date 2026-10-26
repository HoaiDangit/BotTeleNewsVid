function workoutParts(day){const rows=dailyWorkouts(day);return ['5 BÀI TẬP THAM KHẢO · '+day+'\n'+WORKOUT_NOTE,...rows.map((w,i)=>(i+1)+'. '+w.title+'\n'+w.benefit+'\n'+w.steps+'\nMức tập: '+w.dose+'\nNguồn: '+w.url+'\nTạo video: /video_tap '+(i+1))];}
async function workoutDigest(e,scheduled=false,idOverride){
 const id=idOverride||await get(e,'owner');if(!id)return;
 const day=localDay(Date.now()),key=day+':workouts',parts=workoutParts(day);
 if(scheduled){const claim=await sql(e,'INSERT OR IGNORE INTO editions(id,created,status,parts,urls) VALUES(?,?,?,?,?)',key,Date.now(),'sending',JSON.stringify(parts),'[]').run();if(!claim.meta.changes)return;}
 try{for(let i=0;i<parts.length;i++){await send(e,id,parts[i]);if(scheduled)await sql(e,'UPDATE editions SET next=? WHERE id=?',i+1,key).run();}if(scheduled)await sql(e,'UPDATE editions SET status=? WHERE id=?','sent',key).run();}
 catch{if(scheduled)await sql(e,'UPDATE editions SET status=? WHERE id=?','uncertain',key).run();}
}
async function workoutVideoCommand(e,id,text,updateId){
 let w;try{w=parseWorkoutInput(text.replace(/^\/video_tap(?:@\w+)?\s*/,''),localDay(Date.now()));}catch(err){await send(e,id,err.message);return;}
 await initVideo(e);
 const n=await sql(e,"SELECT COUNT(*) n FROM video_jobs WHERE status IN ('queued','running','uploading')").first();if(n.n>=10){await send(e,id,'Đã có 10 video chờ/xử lý; vui lòng đợi.');return;}
 const excerpt=JSON.stringify({...w,kind:'workout'}),job='v'+updateId;
 const dup=await sql(e,"SELECT id FROM video_jobs WHERE chat=? AND excerpt=? AND status IN ('queued','running','uploading')",id,excerpt).first();if(dup){await send(e,id,'Bài tập đang chờ/xử lý: '+dup.id);return;}
 await sql(e,"INSERT OR IGNORE INTO video_jobs(id,chat,title,url,excerpt,kind,created,status) VALUES(?,?,?,?,?,? ,?,'queued')",job,id,w.title,w.url,excerpt,'workout',Date.now()).run();
 await send(e,id,'Đã xếp hàng video BÀI TẬP '+job+': '+w.title+'\n'+(w.sourceType==='user'?'Nội dung do bạn cung cấp, cần duyệt động tác và mức tập trước khi đăng.':'Theo nguồn tham khảo '+w.url)+'\nVideo sẽ gửi về cuộc trò chuyện này. /check_status xem tiến độ.');
 await send(e,id,'BẢN NHÁP BÀI ĐĂNG — BÀI TẬP\n'+w.title+'\n'+w.benefit+'\n'+w.dose+'\n'+WORKOUT_NOTE+'\nNguồn: '+(w.sourceType==='user'?'Người dùng cung cấp; ':'')+w.url+'\n\n'+SOCIAL_FEEDBACK);
}
