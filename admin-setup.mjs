async function adminSetup(e,data){
 const owner=await get(e,'owner');
 if(data.action==='inspect'){
  const target=/^[1-9]\d{0,15}$/.test(String(data.id||''))?String(data.id):owner;
  let chat=null;try{if(target)chat=await telegram(e,'getChat',{chat_id:target});}catch{}
  return json({owner:target,username:chat?.username||null,firstName:chat?.first_name||null,reachable:!!chat});
 }
 const id=String(data.id||''),username=String(data.username||'').replace(/^@/,'').toLowerCase();
 if(data.action!=='assign'||!/^[1-9]\d{0,15}$/.test(id)||!Number.isSafeInteger(Number(id))||!/^\w{5,32}$/.test(username))return json({error:'Provide numeric Telegram ID and expected username'},400);
 let chat;try{chat=await telegram(e,'getChat',{chat_id:id});}catch{return json({error:'Account must send /myid to this bot first'},400);}
 if(chat.type!=='private'||String(chat.id)!==id||String(chat.username||'').toLowerCase()!==username)return json({error:'Telegram account does not match expected username'},409);
 if(!owner)return json({error:'Use initial pairing for an unclaimed bot'},409);
 const r=await sql(e,"UPDATE state SET v=? WHERE k='owner' AND v=?",id,owner).run();
 if(!r.meta.changes)return json({error:'Owner changed concurrently; inspect again'},409);
 // Clear stale menu privileges; runtime authorization always uses the new owner ID.
 let menuSynced=true;
 try{if(owner!==id)for(const language_code of ['', 'vi','en'])await telegram(e,'setMyCommands',{commands:BOT_COMMANDS,scope:{type:'chat',chat_id:owner},language_code});await syncMenu(e);}catch{menuSynced=false;}
 return json({ok:true,owner:id,username:chat.username,menuSynced});
}
