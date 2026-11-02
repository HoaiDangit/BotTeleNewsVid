// Application feature: isolated, read-only capture of a public source page. No user browser profile.
import dns from 'node:dns/promises';import path from 'node:path';import {createRequire} from 'node:module';import {publicURL,isPublicAddress} from './public-url.mjs';
export async function captureArticle(config,job){
 if(job.kind==='workout'||JSON.parse(job.payload||'{}').noPage||config.articleScreenshots===false)return null;
 const require=createRequire(path.join(config.appRoot,'package.json')),{chromium}=require('playwright'),cache=new Map();
 const check=async value=>{const u=publicURL(value);if(!cache.has(u.hostname)){const addresses=await dns.lookup(u.hostname,{all:true});if(!addresses.length||addresses.some(x=>!isPublicAddress(x.address)))throw Error('Private capture URL');cache.set(u.hostname,true);}return u.href;};
 const url=await check(job.url);let browser;
 try{browser=await chromium.launch({headless:true,timeout:15000});}catch{browser=await chromium.launch({headless:true,channel:'msedge',timeout:15000});}
 try{
  const context=await browser.newContext({viewport:{width:1280,height:1100},serviceWorkers:'block',acceptDownloads:false});
  await context.route('**/*',async route=>{try{if(['media','websocket'].includes(route.request().resourceType()))return route.abort();await check(route.request().url());return route.continue();}catch{return route.abort();}});
  const page=await context.newPage();const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
  if(!response||response.status()>=400||!(response.headers()['content-type']||'').includes('text/html'))throw Error('Source page unavailable');
  const text=await page.locator('body').innerText({timeout:5000});if(text.length<300||/verify you are human|access denied|captcha challenge/i.test(text))throw Error('Source capture blocked');
  await page.locator('h1').first().scrollIntoViewIfNeeded({timeout:2000}).catch(()=>{});
  const bytes=await page.screenshot({type:'png',fullPage:false,timeout:10000});if(bytes.length>6000000)throw Error('Source screenshot too large');
  return {bytes:Buffer.from(bytes),mime:'image/png',provider:'article-screenshot',url,sourcePage:url,author:new URL(url).hostname,title:'Ảnh chụp màn hình trang nguồn',license:'Source-page screenshot — rights not independently verified',purpose:'Ảnh chụp trang nguồn, không phải ảnh chụp trực tiếp sự kiện'};
 }finally{await browser.close();}
}
