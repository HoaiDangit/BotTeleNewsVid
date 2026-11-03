import {publicURL} from './public-url.mjs';
export function parseNewsText(raw,entities=[]){
 const userText=String(raw||'').trim();if(userText.length>30000)throw Error('Tổng nội dung gửi kèm tối đa 30000 ký tự; vui lòng chia thành các yêu cầu riêng.');
 const found=[...(userText.match(/https?:\/\/[^\s<>"“”|]+/gu)||[]),...entities.filter(x=>x.type==='text_link').map(x=>x.url)];
 const urls=[];
 for(let value of found){value=String(value).replace(/[.,;!?…»”’]+$/gu,'');while(value.endsWith(')')&&(value.match(/\)/g)||[]).length>(value.match(/\(/g)||[]).length)value=value.slice(0,-1);while(value.endsWith(']')&&(value.match(/\]/g)||[]).length>(value.match(/\[/g)||[]).length)value=value.slice(0,-1);const url=publicURL(value).href;if(!urls.includes(url))urls.push(url);}
 if(urls.length>5)throw Error('Một video tổng hợp nhận tối đa 5 link bài báo. Hãy chia thêm một yêu cầu để giữ đủ nội dung.');
 const parts=userText.split('|').map(x=>x.trim());
 const legacy=!/^https?:\/\//i.test(parts[0])&&parts.length>=3&&parts.slice(2).join(' | ').length>=300;
 return {userText,urls,title:legacy?parts[0].slice(0,250):'',sourceName:legacy?parts[1].slice(0,100):'',providedLength:userText.replace(/https?:\/\/[^\s<>"“”|]+/gu,'').trim().length};
}
