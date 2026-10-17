async function accessCommand(e,id,owner,text){
 const [cmd,arg]=text.split(/\s+/);
 if(id!==owner){await send(e,id,'Tài khoản này chưa phải quản trị viên. Gửi /myid để lấy Telegram ID và yêu cầu chủ bot xác lập lại quyền.');return;}
 if(cmd==='/users'){
  const rows=(await sql(e,"SELECT k FROM state WHERE k LIKE 'access:%' ORDER BY k").all()).results;
  await send(e,id,'Quản trị viên: '+owner+'\nĐược phép:\n'+(rows.map(r=>r.k.slice(7)).join('\n')||'(chưa có)')+'\n\n/allow <ID> — thêm\n/deny <ID> — xóa\nNgười dùng gửi /myid cho bot để lấy ID.');return;
 }
 if(!/^[1-9]\d{0,15}$/.test(arg||'')||!Number.isSafeInteger(Number(arg))){await send(e,id,'Dùng '+cmd+' <Telegram ID dạng số>. Người dùng lấy ID bằng /myid.');return;}
 if(arg===owner){await send(e,id,'Tài khoản quản trị viên luôn được phép và không thể xóa bằng lệnh này.');return;}
 if(cmd==='/allow'){
  await put(e,'access:'+arg,JSON.stringify({added:Date.now(),by:owner}));
  await send(e,id,'Đã cho phép tài khoản '+arg+'. Người đó có thể gửi /start để sử dụng tin tức, AI và tạo video.');
 }else{
  await sql(e,'DELETE FROM state WHERE k=?','access:'+arg).run();await initVideo(e);
  await sql(e,"UPDATE video_jobs SET status='cancelled',progress='Quyền truy cập đã bị thu hồi',finished=? WHERE chat=? AND status IN ('queued','running')",Date.now(),arg).run();
  await send(e,id,'Đã thu hồi quyền của '+arg+' và hủy yêu cầu video chưa gửi. Lượt gửi Telegram đã bắt đầu không thể thu hồi bằng lệnh này.');
 }
}
