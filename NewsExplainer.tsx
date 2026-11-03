import React from 'react';
import {AbsoluteFill, Img, staticFile, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {FreeStyleSceneData} from './FreeStyleScene';

const clean=(v:unknown)=>String(v??'').replace(/[{}]/g,'').trim();
export const NewsExplainer:React.FC<{scene:FreeStyleSceneData;idx:number}>=({scene,idx})=>{
 const frame=useCurrentFrame(),{width,height,fps,durationInFrames}=useVideoConfig(),wide=width>height;
 const beat=Math.min(fps*3,Math.max(fps*.6,durationInFrames/6));
 const reveal=(n:number)=>interpolate(frame,[n*beat,n*beat+fps*.55],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const enter=(n:number)=>({opacity:reveal(n),transform:`translateY(${(1-reveal(n))*22}px)`});
 const accent=['#6655d5','#087c88','#ab5a30'][idx%3],ink='#202741';
 const items=clean(scene.body||scene.lead).split(/\s*\|\s*|\n+/).filter(Boolean).slice(0,4);
 const bars=(scene.chart?.bars||[]).filter(b=>Number.isFinite(b.value)&&Number(b.value)>=0).slice(0,4);
 const max=Math.max(1,...bars.map(b=>Number(b.value)));
 const compare=scene.compare;
 const card:React.CSSProperties={background:'#fff',border:'2px solid #e3e4f0',borderRadius:24,padding:28,boxShadow:'0 12px 40px #35376309'};
 const header=clean(scene.headline),tag=clean(scene.tag)||['SỰ KIỆN','GIẢI THÍCH','DỮ KIỆN','GÓC NHÌN'][idx%4];
 return <AbsoluteFill style={{background:'radial-gradient(ellipse at 88% 15%,#ded9ff 0%,#f4f4fb 48%,#edf5f4 100%)',fontFamily:'Arial, sans-serif',color:ink,padding:wide?'70px 105px 180px':'132px 64px 400px',gap:30}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:25,fontWeight:700,letterSpacing:2,color:accent,...enter(0)}}><span>NEWSAUTOBEAR / GIẢI THÍCH</span><span>{String(idx+1).padStart(2,'0')}</span></div>
  <div style={{...enter(0),display:'flex',alignItems:'center',gap:14,fontSize:24,color:accent}}><div style={{width:34,height:5,background:accent}}/>{tag}</div>
  <div style={{fontSize:wide?58:64,fontWeight:800,lineHeight:1.12,letterSpacing:-1.5,...enter(0)}}>{header}</div>
  <div style={{display:'flex',flex:1,minHeight:0,gap:26,flexDirection:wide?'row':'column'}}>
   <div style={{flex:wide?1.35:1,display:'flex',flexDirection:'column',gap:20,minHeight:0}}>
    {bars.length>=2?<div style={{...card,...enter(1)}}><div style={{fontSize:30,fontWeight:700,marginBottom:24}}>{clean(scene.chart?.title)}</div>{bars.map((b,i)=><div key={i} style={{marginTop:22,...enter(i+1)}}><div style={{display:'flex',justifyContent:'space-between',fontSize:27,gap:16}}><span>{clean(b.label)}</span><strong>{b.value} {clean(scene.chart?.unit)}</strong></div><div style={{height:16,background:'#eeedf7',borderRadius:8,marginTop:12}}><div style={{height:'100%',width:`${Number(b.value)/max*reveal(i+1)*100}%`,background:accent,borderRadius:8}}/></div></div>)}</div>
    :compare&&((compare.leftItems||[]).length||(compare.rightItems||[]).length)?<div style={{display:'flex',gap:18,flex:1}}>{[0,1].map((n)=><div key={n} style={{...card,...enter(n+1),transform:`translateX(${(1-reveal(n+1))*(n?32:-32)}px)`,flex:1,borderTop:`7px solid ${n? '#119099':accent}`}}><div style={{fontSize:30,fontWeight:800,marginBottom:24,color:n?'#087c88':accent}}>{clean(n?compare.rightLabel:compare.leftLabel)}</div>{(n?compare.rightItems:compare.leftItems)?.slice(0,3).map((s,i)=><div key={i} style={{fontSize:29,lineHeight:1.4,marginBottom:26,...enter(i+2)}}>{clean(s)}</div>)}</div>)}</div>
    :scene.stat&&clean(scene.stat.value)?<div style={{...card,...enter(1),transform:`scale(${.92+.08*reveal(1)})`,borderLeft:`8px solid ${accent}`}}><div style={{fontSize:92,fontWeight:800,color:accent}}>{clean(scene.stat.prefix)}{clean(scene.stat.value)}{clean(scene.stat.suffix)}</div><div style={{fontSize:34,fontWeight:700,marginTop:16}}>{clean(scene.stat.label)}</div><div style={{fontSize:26,lineHeight:1.4,marginTop:20,color:'#626980'}}>{clean(scene.stat.context)}</div></div>
    :tag.includes('CƠ CHẾ')?<div style={{position:'relative',paddingTop:20}}><div style={{...enter(1),margin:'0 auto 62px',width:'66%',background:accent,color:'#fff',borderRadius:24,padding:'26px 28px',textAlign:'center',fontSize:34,fontWeight:800}}>Các yếu tố liên quan</div><svg viewBox="0 0 900 100" style={{position:'absolute',top:111,left:0,width:'100%',height:100,opacity:reveal(2)}}><path d="M450 0 V40 H210 V100 M450 40 H690 V100" fill="none" stroke={accent} strokeWidth="3" strokeDasharray="1000" strokeDashoffset={1000*(1-reveal(2))}/></svg><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:26}}>{items.map((s,i)=><div key={i} style={{...card,...enter(i+2),minHeight:155,borderTop:`5px solid ${accent}`,fontSize:31,fontWeight:600,lineHeight:1.35,gridColumn:i===items.length-1&&items.length%2?'1 / 3':undefined}}>{s}</div>)}</div></div>
    :<div style={{display:'flex',flexDirection:'column',gap:16}}>{items.map((s,i)=><React.Fragment key={i}>{i>0&&<div style={{height:22,borderLeft:`3px solid ${accent}55`,marginLeft:31,opacity:reveal(i+1)}}/>}<div style={{...card,...enter(i+1),display:'flex',alignItems:'center',gap:24}}><div style={{width:56,height:56,borderRadius:16,background:accent+'15',color:accent,fontSize:27,fontWeight:800,display:'grid',placeItems:'center',flexShrink:0}}>{i+1}</div><div style={{fontSize:32,lineHeight:1.35,fontWeight:600}}>{s}</div></div></React.Fragment>)}</div>}
   </div>
   {scene.image&&<div style={{...card,...enter(2),padding:14,flex:wide?1:undefined,height:wide?undefined:320,minHeight:0,position:'relative',overflow:'hidden'}}><Img src={staticFile(scene.image)} style={{width:'100%',height:'100%',objectFit:'contain',borderRadius:14,transform:`scale(${1+Math.min(frame/(fps*60),.035)})`}}/><div style={{position:'absolute',bottom:22,left:24,fontSize:21,background:'#ffffffec',padding:'8px 12px',borderRadius:9,color:'#4b536a'}}>Ảnh minh họa · Nguồn ở cuối video</div></div>}
  </div>
  <div style={{height:4,width:120+Math.min(1,frame/Math.max(1,durationInFrames))*(width-248),background:accent,borderRadius:2}}/>
 </AbsoluteFill>;
};
