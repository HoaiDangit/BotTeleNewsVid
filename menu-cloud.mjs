const BOT_COMMANDS=[
  {command:'tin',description:'Xem 10 tin mới ưu tiên'},
  {command:'tim',description:'Tìm tin theo từ khóa và khoảng ngày'},
  {command:'hoi',description:'Hỏi AI về tin tức có dẫn nguồn'},
  {command:'sang',description:'Xem lại bản tin 07:00'},
  {command:'toi',description:'Xem lại bản tin 20:00'},
  {command:'video',description:'Tạo video từ link bài báo'},
  {command:'check_status',description:'Kiểm tra máy dựng và tiến độ video'},
  {command:'trangthai',description:'Kiểm tra kho tin và dịch vụ AI'},
  {command:'nguon',description:'Danh sách nguồn báo đang theo dõi'},
  {command:'help',description:'Hướng dẫn và ví dụ dùng lệnh'},
  {command:'start',description:'Bắt đầu hoặc xem hướng dẫn'},
  {command:'myid',description:'Lấy Telegram ID để xin quyền truy cập'}
];
async function syncMenu(e) {
  const owner=await get(e,'owner');
  const scopes=[{type:'default'},{type:'all_private_chats'},...(owner?[{type:'chat',chat_id:owner}]:[])];
  for(const scope of scopes)for(const language_code of ['', 'vi','en'])await telegram(e,'setMyCommands',{commands:BOT_COMMANDS,scope,language_code});
  await telegram(e,'setChatMenuButton',{menu_button:{type:'commands'}});
  if(owner)for(const language_code of ['', 'vi','en'])await telegram(e,'setMyCommands',{commands:[...BOT_COMMANDS,{command:'allow',description:'Thêm tài khoản được phép'},{command:'deny',description:'Thu hồi quyền tài khoản'},{command:'users',description:'Danh sách tài khoản được phép'}],scope:{type:'chat',chat_id:owner},language_code});
  if(owner)await telegram(e,'setChatMenuButton',{chat_id:owner,menu_button:{type:'commands'}});
  return {ok:true,commands:await telegram(e,'getMyCommands',{scope:{type:'default'},language_code:''}),ownerCommands:owner?await telegram(e,'getMyCommands',{scope:{type:'chat',chat_id:owner},language_code:'vi'}):[],menuButton:await telegram(e,'getChatMenuButton',owner?{chat_id:owner}:{})};
}
async function auditBot(e,probeAI=false) {
  const webhook=await telegram(e,'getWebhookInfo',{});
  const articles=await sql(e,'SELECT COUNT(*) n FROM articles').first();
  const editions=(await sql(e,'SELECT id,status,created FROM editions ORDER BY created DESC LIMIT 4').all()).results;
  const recent=(await sql(e,'SELECT status,COUNT(*) n FROM video_jobs GROUP BY status').all()).results;
  let aiProbe=null;
  let availableModels=null;
  if(probeAI){const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models',{headers:{'x-goog-api-key':e.GEMINI_API_KEY},signal:AbortSignal.timeout(10000)});const data=await r.json();availableModels={status:r.status,names:(data.models||[]).filter(m=>m.supportedGenerationMethods?.includes('generateContent')).map(m=>m.name)};}
  if(probeAI){const article=await sql(e,'SELECT title,summary FROM articles ORDER BY published DESC LIMIT 1').first();if(article)aiProbe=!!await gemini(e,'Kiểm tra kết nối: tóm tắt trích đoạn này trong một câu tiếng Việt: '+JSON.stringify(article));}
  return {configuredModel:e.GEMINI_MODEL,probeModel:e.GEMINI_MODEL,webhook:{configured:!!webhook.url,pending: webhook.pending_update_count,lastError:webhook.last_error_message||null},articles:articles.n,editions,videos:recent,agentSeen:Number(await get(e,'video_agent_seen')||0),aiStatus:await get(e,'ai_status'),aiProbe,availableModels,commands:await telegram(e,'getMyCommands',{})};
}
