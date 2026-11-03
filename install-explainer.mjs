import {installQuiet} from './quiet-processes.mjs';
import fs from 'node:fs';import path from 'node:path';import {installMedia} from './install-media.mjs';
export function explainerServer(source){
 if(source.includes('TELESETUP_EXPLAINER_V2'))return source;
 if(source.includes('TELESETUP_EXPLAINER_V1'))return upgradeImagePaths(source);
 const anchor="const imgFile = path.join(imagesDir, String(context).includes('[NewsAutoBear ') && visualMode === 'user-only' ? `tele-illustration-${i}.jpg` : `scene-${i}.jpg`);";
 if(!source.includes(anchor))throw Error('Không tìm thấy điểm cài explainer trong Studio');
 const call='await callGemini(prompt, env, geminiModel)';if(!source.includes(call))throw Error('Không tìm thấy điểm lập kịch bản');
 source=source.replace(call,"await callGemini(String(context).includes('[NewsAutoBear explain-web-v1]') ? newsPlannerPrompt(context) : prompt, env, geminiModel)");
 return upgradeImagePaths("import {newsPlannerPrompt} from './tele-news-planner.mjs';\n"+source.replace(anchor,"// TELESETUP_EXPLAINER_V1: only opted-in news jobs use the new renderer.\n        const imgFile = path.join(imagesDir, String(context).includes('[NewsAutoBear explain-web-v1]') ? `tele-explainer-${i}.jpg` : String(context).includes('[NewsAutoBear ') && visualMode === 'user-only' ? `tele-illustration-${i}.jpg` : `scene-${i}.jpg`);"));
}
function upgradeImagePaths(source){
 // Studio has several image branches; the generic free-style branch must also opt in.
 const filename="const imgFile = path.join(imagesDir, `scene-${i}.jpg`);";
 source=source.replaceAll(filename,"const imgFile = path.join(imagesDir, String(context).includes('[NewsAutoBear explain-web-v1]') ? `tele-explainer-${i}.jpg` : `scene-${i}.jpg`);");
 source=source.replaceAll('sc.image = `${slug}/images/scene-${i}.jpg`;','sc.image = `${slug}/images/${path.basename(imgFile)}`;');
 return '// TELESETUP_EXPLAINER_V2: preserve the scoped media path in every image branch.\n'+source;
}
export function explainerScene(source){
 if(source.includes('TELESETUP_EXPLAINER_V1'))return source;
 const anchor='  // TELESETUP_MEDIA_V3: clear illustration panel, no dark background filter.';
 if(!source.includes(anchor))throw Error('Không tìm thấy điểm cài explainer trong cảnh');
 return "import {NewsExplainer} from './NewsExplainer';\n"+source.replace(anchor,"  // TELESETUP_EXPLAINER_V1\n  if(scene.image?.includes('/images/tele-explainer-')) return <NewsExplainer scene={scene} idx={idx}/>;\n"+anchor);
}
export function installExplainer(appRoot){
 installMedia(appRoot);installQuiet(appRoot);
 const targets=[['scripts/ui-server.mjs',explainerServer],['src/components/FreeStyleScene.tsx',explainerScene]];
 const edits=targets.map(([rel,patch])=>{const file=path.join(appRoot,rel),before=fs.readFileSync(file,'utf8');return {rel,file,before,after:patch(before)};});
 const backup=path.join(appRoot,'teleSetup','.bridge','studio-backups');fs.mkdirSync(backup,{recursive:true});
 fs.copyFileSync(new URL('./NewsExplainer.tsx',import.meta.url),path.join(appRoot,'src/components/NewsExplainer.tsx'));
 fs.copyFileSync(new URL('./news-planner.mjs',import.meta.url),path.join(appRoot,'scripts/tele-news-planner.mjs'));
 for(const e of edits)if(e.before!==e.after){const b=path.join(backup,e.rel.replace(/[\\/]/g,'_')+'.before-explainer-v1');if(!fs.existsSync(b))fs.writeFileSync(b,e.before);fs.writeFileSync(e.file,e.after);}
 return edits.filter(e=>e.before!==e.after).map(e=>e.rel);
}
