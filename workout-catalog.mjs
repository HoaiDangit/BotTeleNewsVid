const STRENGTH_SOURCE='https://www.nhs.uk/live-well/exercise/strength-exercises/';
export const WORKOUT_NOTE='Các gợi ý hỗ trợ vận động và kiểm soát cân nặng, không phải xếp hạng 5 bài tốt nhất hoặc cam kết giảm cân. Đây là lựa chọn bài, không yêu cầu tập tất cả mỗi ngày. Bắt đầu vừa sức; dừng nếu đau, chóng mặt hoặc khó chịu. Nếu có bệnh nền/chấn thương, hỏi chuyên gia trước khi tập.';
export const WORKOUTS=[
 {key:'walk',title:'Đi bộ nhanh',aliases:['brisk walking'],steps:'Đi với nhịp còn nói chuyện được nhưng khó hát. Tăng dần nếu trước đây ít vận động.',dose:'Có thể bắt đầu bằng 10 phút đi bộ nhanh nếu phù hợp thể trạng.',benefit:'Vận động aerobic, hỗ trợ sức bền và tiêu hao năng lượng.',url:'https://www.nhs.uk/live-well/exercise/walking-for-health/'},
 {key:'chair',title:'Đứng lên ngồi xuống ghế',aliases:['sit to stand'],steps:'Dùng ghế chắc, không bánh xe. Đặt chân vững, đứng lên chậm rồi ngồi xuống có kiểm soát.',dose:'Tham khảo 5 lần, tăng từ từ khi phù hợp.',benefit:'Rèn sức mạnh chức năng của chân.',url:STRENGTH_SOURCE},
 {key:'squat',title:'Squat nông có điểm tựa',aliases:['mini squat'],steps:'Vịn ghế chắc, gập gối trong tầm thoải mái rồi đứng lại; giữ lưng thẳng.',dose:'Tham khảo 5 lần có kiểm soát.',benefit:'Rèn nhóm cơ chân.',url:STRENGTH_SOURCE},
 {key:'calf',title:'Nhón gót có điểm tựa',aliases:['calf raises'],steps:'Vịn ghế chắc, nâng hai gót chậm trong tầm thoải mái rồi hạ xuống.',dose:'Tham khảo 5 lần.',benefit:'Rèn cơ bắp chân.',url:STRENGTH_SOURCE},
 {key:'wall',title:'Chống đẩy tường',aliases:['wall press up','wall push up'],steps:'Đặt tay lên tường ngang ngực, giữ lưng thẳng. Gập tay chậm rồi đẩy trở lại.',dose:'Nguồn gợi ý 3 hiệp, mỗi hiệp 5–10 lần; điều chỉnh theo khả năng.',benefit:'Rèn sức mạnh thân trên.',url:STRENGTH_SOURCE},
 {key:'curl',title:'Cuốn tay với tạ nhẹ',aliases:['biceps curl'],steps:'Giữ khuỷu cạnh thân, nâng tạ nhẹ về vai rồi hạ chậm. Có thể dùng chai nước.',dose:'Tham khảo 3 hiệp, 5 lần mỗi tay.',benefit:'Rèn sức mạnh tay.',url:STRENGTH_SOURCE},
 {key:'side-leg',title:'Nâng chân sang bên có điểm tựa',aliases:['sideways leg lift'],steps:'Vịn ghế chắc, nâng chân sang bên trong tầm thoải mái rồi hạ; giữ hông thẳng.',dose:'Tham khảo 5 lần mỗi chân.',benefit:'Rèn cơ hông và chân.',url:STRENGTH_SOURCE}
];
export function dailyWorkouts(day){const rest=WORKOUTS.slice(1),offset=Math.floor(Date.parse(day+'T00:00:00Z')/86400000)%rest.length;return [WORKOUTS[0],...Array.from({length:4},(_,i)=>rest[(i+offset)%rest.length])].map(w=>({...w,sourceType:'catalog',reviewed:'2026-10-26'}));}
export function parseWorkoutInput(raw,day){
 const value=String(raw||'').trim();if(/^[1-5]$/.test(value))return dailyWorkouts(day)[Number(value)-1];
 const p=value.split('|').map(x=>x.trim());
 if(p.length<2||p.length>4||p[0].length<3||p[0].length>120||p[1].length<25||value.length>1800)throw Error('Dùng /video_tap 1–5 hoặc /video_tap Tên bài | Mô tả động tác ít nhất 25 ký tự | Mức tập (nếu có) | Link nguồn (nếu có).');
 if(/(?:giảm|giam|đốt|dot)\s*\d+\s*(?:kg|kcal)|chắc chắn.*giảm|cam kết.*giảm/i.test(value))throw Error('Không nhận cam kết số cân/calorie giảm. Hãy gửi mô tả động tác và mức tập để tham khảo.');
 let url='https://t.me/newsautobeartalk_bot';
 if(p[3]){try{const u=new URL(p[3]);if(u.protocol!=='https:')throw Error();url=u.href;}catch{throw Error('Link nguồn phải là HTTPS hợp lệ.');}}
 return {key:'custom',title:p[0],steps:p[1],dose:p[2]||'Người gửi chưa cung cấp mức tập; cần người có chuyên môn duyệt, không tự đặt liều tập.',benefit:'Nội dung do người dùng cung cấp, chưa được kiểm chứng chuyên môn.',url,sourceType:'user',reviewed:null,aliases:[]};
}
