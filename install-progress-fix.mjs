import fs from 'node:fs';import path from 'node:path';
export function progressServer(source){
 if(source.includes('TELESETUP_ASYNC_QUALITY_V1'))return source;
 const anchor="      const {kiemVideo} = await import('./kiem-video.mjs');\n      kiemVideo(slug, {log: appendLog});";
 if(!source.includes(anchor))throw Error('Studio changed: quality check hook missing');
 return source.replace(anchor,"      // TELESETUP_ASYNC_QUALITY_V1: keep HTTP/SSE responsive during frame checks.\n      await execCmd(process.execPath, [path.join(ROOT, 'scripts', 'kiem-video.mjs'), slug]);");
}
export function installProgressFix(appRoot){
 const file=path.join(appRoot,'scripts/ui-server.mjs'),before=fs.readFileSync(file,'utf8'),after=progressServer(before);if(before===after)return false;
 const backup=path.join(appRoot,'teleSetup/.bridge/studio-backups/scripts_ui-server.mjs.before-async-quality-v1');fs.mkdirSync(path.dirname(backup),{recursive:true});if(!fs.existsSync(backup))fs.writeFileSync(backup,before);fs.writeFileSync(file,after);return true;
}
