import {installRemotionQuiet} from './quiet-remotion.mjs';
import fs from 'node:fs';import path from 'node:path';
const rules={
 'scripts/ui-server.mjs':[['{ cwd, shell: false, env:','{ windowsHide: true, cwd, shell: false, env:'],['{ cwd: ROOT, shell: false, env:','{ windowsHide: true, cwd: ROOT, shell: false, env:'],["{ shell: false, stdio: 'ignore', detached: true }","{ windowsHide: true, shell: false, stdio: 'ignore', detached: true }"],["{ stdio: 'ignore' }","{ windowsHide: true, stdio: 'ignore' }"],['{maxBuffer:','{windowsHide: true, maxBuffer:'],["'-q:v', '4', nho]);","'-q:v', '4', nho], {windowsHide: true});"]],
 'scripts/tts.mjs':[["{ stdio: ['pipe', 'inherit', 'inherit'] }","{ windowsHide: true, stdio: ['pipe', 'inherit', 'inherit'] }"]],
 'scripts/gemini.mjs':[["{ stdio: ['pipe', 'inherit', 'inherit'] }","{ windowsHide: true, stdio: ['pipe', 'inherit', 'inherit'] }"]],
 'scripts/article-video.mjs':[["{cwd: ROOT, encoding: 'utf8', timeout:","{windowsHide: true, cwd: ROOT, encoding: 'utf8', timeout:"],["{cwd: ROOT, stdio: 'inherit', timeout:","{windowsHide: true, cwd: ROOT, stdio: 'inherit', timeout:"]],
 'scripts/record-demo.mjs':[["{cwd: ROOT, stdio: 'inherit'}","{windowsHide: true, cwd: ROOT, stdio: 'inherit'}"]],
 'scripts/source-evidence.mjs':[["{cwd: ROOT, encoding: 'utf8', timeout:","{windowsHide: true, cwd: ROOT, encoding: 'utf8', timeout:"]],
 'scripts/kiem-video.mjs':[['{maxBuffer:','{windowsHide: true, maxBuffer:']],
 'scripts/do-giong.mjs':[['{maxBuffer:','{windowsHide: true, maxBuffer:']],
 'scripts/sinh-anh-xem-truoc.mjs':[["{cwd: ROOT, stdio: 'inherit'}","{windowsHide: true, cwd: ROOT, stdio: 'inherit'}"]],
};
export function quietSource(source,rel){
 for(const [before,after] of rules[rel]||[]){if(!source.includes(before)&&!source.includes(after))throw Error('Studio changed: quiet process hook missing in '+rel);source=source.replaceAll(before,after);}return source;
}
export function installQuiet(appRoot){
 const edits=Object.keys(rules).map(rel=>{const file=path.join(appRoot,rel),before=fs.readFileSync(file,'utf8');return {rel,file,before,after:quietSource(before,rel)};});
 installRemotionQuiet(appRoot);
 const backup=path.join(appRoot,'teleSetup','.bridge','studio-backups');fs.mkdirSync(backup,{recursive:true});
 for(const e of edits)if(e.before!==e.after){const file=path.join(backup,e.rel.replace(/[\\/]/g,'_')+'.before-quiet-v2');if(!fs.existsSync(file))fs.writeFileSync(file,e.before);fs.writeFileSync(e.file,e.after);}return edits.filter(e=>e.before!==e.after).map(e=>e.rel);
}
