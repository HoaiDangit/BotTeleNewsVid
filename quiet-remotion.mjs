import fs from 'node:fs';import path from 'node:path';
export function patchRemotionQuiet(source,kind){
 if(source.includes('TELESETUP_NATIVE_QUIET_V2'))return source;
 if(source.includes('TELESETUP_NATIVE_QUIET_V1')&&kind!=='browser')return source;
 let before,after;
 if(kind==='ffmpeg'){before='        ...options,\n';after=before+'        windowsHide: true,\n';}
 else if(kind==='compositor'){before='const child = (0, node_child_process_1.spawn)(bin, [JSON.stringify(fullCommand)], {\n';after=before+'        windowsHide: true,\n';}
 else if(kind==='browser'){let out=source.replace(/\r\n/g,'\n');const spawn='const proc = childProcess.spawn(executablePath, processArguments, {\n';if(!out.includes(spawn))throw Error('Remotion browser hook changed');if(!out.includes(spawn+'        windowsHide: true,'))out=out.replace(spawn,spawn+'        windowsHide: true,\n');const kill='childProcess.exec(`taskkill /pid ${proc.pid} /T /F`, (error) => {';if(!out.includes(kill))throw Error('Remotion cleanup hook changed');return '// TELESETUP_NATIVE_QUIET_V2\n'+out.replace(kill,'childProcess.exec(`taskkill /pid ${proc.pid} /T /F`, {windowsHide: true}, (error) => {');}
 else if(kind==='editor'){before="execProm('wmic process where \"executablepath is not null\" get executablepath')";after="execProm('wmic process where \"executablepath is not null\" get executablepath', {windowsHide: true})";}
 else throw Error('Unknown Remotion patch');
 const normalized=source.replace(/\r\n/g,'\n');if(!normalized.includes(before))throw Error('Remotion changed: native quiet hook missing in '+kind);
 return '// TELESETUP_NATIVE_QUIET_V1\n'+normalized.replaceAll(before,after);
}
export function installRemotionQuiet(appRoot){
 const packages=path.join(appRoot,'node_modules/@remotion'),targets=[['renderer','call-ffmpeg.js','ffmpeg'],['renderer','compositor/compositor.js','compositor'],['renderer','browser/BrowserRunner.js','browser'],['studio-server','helpers/open-in-editor.js','editor']];
 const changes=targets.map(([pkg,rel,kind])=>{const file=path.join(packages,pkg,'dist',rel),before=fs.readFileSync(file,'utf8'),version=JSON.parse(fs.readFileSync(path.join(packages,pkg,'package.json'),'utf8')).version.replace(/[^\w.-]/g,'_');return {pkg,rel,file,version,before,after:patchRemotionQuiet(before,kind)};});
 const backup=path.join(appRoot,'teleSetup/.bridge/studio-backups');fs.mkdirSync(backup,{recursive:true});
 for(const e of changes)if(e.before!==e.after){const dest=path.join(backup,'remotion-'+e.pkg+'-'+e.version+'-'+e.rel.replace(/[\\/]/g,'_')+'.before-native-quiet-v2');if(!fs.existsSync(dest))fs.writeFileSync(dest,e.before);fs.writeFileSync(e.file,e.after);}
 return changes.filter(e=>e.before!==e.after).map(e=>e.pkg+'/'+e.rel);
}
