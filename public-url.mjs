export function isPublicAddress(value){
 const s=String(value).toLowerCase().replace(/^\[|\]$/g,'');
 if(s.includes(':'))return /^[23][0-9a-f]{3}:/.test(s)&&!s.startsWith('2001:db8:');
 const p=s.split('.').map(Number);if(p.length!==4||p.some(x=>!Number.isInteger(x)||x<0||x>255))return false;
 const [a,b]=p;return !(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&(b===168||b===0))||(a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19)));
}
export function publicURL(value,base){
 const u=new URL(value,base),h=u.hostname.toLowerCase();
 if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||!h.includes('.')||/(?:^|\.)(?:localhost|local|internal|lan|test|invalid|onion)$/.test(h)||h.endsWith('.arpa')||((/^[\d.]+$/.test(h)||h.includes(':'))&&!isPublicAddress(h)))throw Error('Link phải là trang HTTPS công khai, không dùng địa chỉ nội bộ.');
 u.hash='';return u;
}
