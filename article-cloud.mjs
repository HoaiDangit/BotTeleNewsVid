const ARTICLE_HOSTS=['vietnamnet.vn','vnexpress.net','dantri.com.vn','tuoitre.vn','thanhnien.vn','nhandan.vn','baochinhphu.vn','vov.vn','vtv.vn','vietnamplus.vn','tienphong.vn','laodong.vn','bbc.com','bbc.co.uk','reuters.com','apnews.com','theguardian.com','techcrunch.com','theverge.com','arstechnica.com'];
function articleURL(value){
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||!ARTICLE_HOSTS.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))throw Error('Nguồn này chưa có bộ đọc. Hiện hỗ trợ VietnamNet, VnExpress, Dân Trí, Tuổi Trẻ, Thanh Niên, BBC, Reuters và các báo phổ biến khác.');
  u.hash='';return u.href;
}
function extractArticle(html){
  const meta=name=>{for(const m of html.matchAll(/<meta\b[^>]*>/gi)){const attrs={};for(const a of m[0].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs))attrs[a[1].toLowerCase()]=a[3];if(attrs.property===name||attrs.name===name)return xmlText(attrs.content||'');}return '';};
  const title=meta('og:title')||xmlText(tag(html,'h1'))||xmlText(tag(html,'title'));
  const stripped=html.replace(/<(script|style|nav|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
  const body=(stripped.match(/<(?:div|section)[^>]*class=["'][^"']*(?:maincontent|main-content|content-detail|detail-content|fck_detail|article-body)[^"']*["'][^>]*>([\s\S]*?)(?:<\/article>|<footer\b|<div[^>]*class=["'][^"']*(?:related|comment|bottom))/i)||[])[1]||tag(stripped,'article');
  const paragraphs=[...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>xmlText(m[1])).filter(x=>x.length>45);
  const summary=[...new Set(paragraphs)].join('\n').slice(0,18000);
  if(!title||summary.length<300)throw Error('Không đọc được đủ nội dung bài báo (trang chặn truy cập, yêu cầu đăng nhập hoặc định dạng chưa hỗ trợ). Chưa tạo video để tránh bịa nội dung.');
  return {title:title.slice(0,250),summary};
}
async function loadArticle(value){
  let url=articleURL(value);
  for(let i=0;i<4;i++){
    const r=await fetch(url,{redirect:'manual',headers:{Accept:'text/html'},signal:AbortSignal.timeout(12000)});
    if([301,302,303,307,308].includes(r.status)){await r.body?.cancel();url=articleURL(new URL(r.headers.get('location'),url).href);continue;}
    if(!r.ok){await r.body?.cancel();throw Error('Trang báo trả lỗi HTTP '+r.status+'. Chưa thể lấy nội dung.');}
    if(!(r.headers.get('content-type')||'').includes('text/html')){await r.body?.cancel();throw Error('Link phải trỏ đến trang bài báo HTML.');}
    const reader=r.body.getReader(),chunks=[];let size=0;
    for(;;){const {done,value:chunk}=await reader.read();if(done)break;size+=chunk.length;if(size>2000000){await reader.cancel();throw Error('Trang quá lớn để đọc.');}chunks.push(chunk);}
    const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
    return {...extractArticle(new TextDecoder().decode(bytes)),url};
  }
  throw Error('Trang chuyển hướng quá nhiều lần.');
}
