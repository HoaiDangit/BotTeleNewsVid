import fs from 'node:fs';import path from 'node:path';
export function patchServer(source){
 if(source.includes('TELESETUP_MEDIA_V3'))return source;
 const anchor="        // Ưu tiên 0: Ảnh do chính người dùng tải lên — luôn thắng mọi nguồn khác.";
 if(!source.includes(anchor))throw Error('Studio changed: image hook not found; no changes applied');
 const start=source.indexOf(anchor),end=source.indexOf("        if (!ok && visualMode === 'user-only')",start);
 if(end<0)throw Error('Studio changed: end image hook missing');
 const replacement=`        // TELESETUP_MEDIA_V3: rotate only Telegram illustrations, retain ordinary UI behavior.
        const teleMedia = String(context).includes('[NewsAutoBear ') && visualMode === 'user-only';
        const picked = pickedUserImages[teleMedia && pickedUserImages.length ? i % pickedUserImages.length : i];
        if (picked) {
          try {
            fs.copyFileSync(picked.file, imgFile);
            usedImageDigests.add(crypto.createHash('sha1').update(fs.readFileSync(imgFile)).digest('hex'));
            ok = true; sc.imageCredit = teleMedia ? 'Ảnh minh họa' : '';
            appendLog('✅ Ảnh được cung cấp cho cảnh '+(i+1)+': '+picked.id);
          } catch (err) { appendLog('⚠️ Không đọc được ảnh: '+err.message); }
        }

`;
 source=source.slice(0,start)+replacement+source.slice(end);
 const name="const imgFile = path.join(imagesDir, `scene-${i}.jpg`);";
 if(!source.includes(name))throw Error('Studio changed: image filename hook missing');
 source=source.replace(name,"const imgFile = path.join(imagesDir, String(context).includes('[NewsAutoBear ') && visualMode === 'user-only' ? `tele-illustration-${i}.jpg` : `scene-${i}.jpg`);");
 // Image path is consumed by plan/spec generation below.
 source=source.replace("sc.image = `${slug}/images/scene-${i}.jpg`;","sc.image = `${slug}/images/${path.basename(imgFile)}`;");
 return source;
}
export function patchScene(source){
 if(source.includes('TELESETUP_MEDIA_V3'))return source;
 const anchor='  const captionReveal = useReveal(38);';
 if(!source.includes(anchor))throw Error('Studio changed: scene hook missing');
 return source.replace(anchor,anchor+`
  // TELESETUP_MEDIA_V3: clear illustration panel, no dark background filter.
  if (scene.image?.includes('/images/tele-illustration-')) {
    const clean = (s?: string) => (s || '').replace(/[{}]/g, '');
    const zoom = interpolate(frame, [0, 240], [1, 1.045], {extrapolateRight: 'clamp'});
    return <AbsoluteFill style={{background: '#0b1723', padding: ngang ? '65px 80px 160px' : '135px 64px 480px', color: '#fff', fontFamily: 'Arial, sans-serif', gap: 28}}>
      <div style={{fontSize: ngang ? 28 : 30, letterSpacing: 2, color: '#6ee7d1'}}>NEWSAUTOBEAR · {clean(scene.tag) || 'GÓC NHÌN'}</div>
      <div style={{fontSize: ngang ? 43 : 57, fontWeight: 800, lineHeight: 1.14}}>{clean(scene.headline)}</div>
      <div style={{flex: 1, minHeight: 0, position: 'relative', borderRadius: 22, overflow: 'hidden', background: '#f6f0e3', border: '3px solid #2d686b'}}>
        <Img src={staticFile(scene.image)} style={{width: '100%', height: '100%', objectFit: 'contain', transform: 'scale('+zoom+')'}} />
        <div style={{position: 'absolute', bottom: 14, left: 14, background: '#0b1723e8', padding: '8px 18px', fontSize: 25, color: '#b4f2e5', borderRadius: 8}}>Ảnh minh họa · Không phải ảnh sự kiện</div>
      </div>
    </AbsoluteFill>;
  }
`);
}
export function installMedia(appRoot){
 const targets=[['scripts/ui-server.mjs',patchServer],['src/components/FreeStyleScene.tsx',patchScene]];
 const pending=targets.map(([rel,patch])=>{const file=path.join(appRoot,rel),before=fs.readFileSync(file,'utf8');return {file,rel,before,after:patch(before)};});
 const backup=path.join(appRoot,'teleSetup','.bridge','studio-backups');fs.mkdirSync(backup,{recursive:true});
 for(const p of pending)if(p.before!==p.after){const dest=path.join(backup,p.rel.replace(/[\\/]/g,'_')+'.before-media-v3');if(!fs.existsSync(dest))fs.writeFileSync(dest,p.before);fs.writeFileSync(p.file,p.after);}
 return {changed:pending.filter(p=>p.before!==p.after).map(p=>p.rel)};
}
