import fs from 'node:fs';
const base=fs.readFileSync(new URL('worker.mjs',import.meta.url),'utf8');
const video=fs.readFileSync(new URL('video-cloud.mjs',import.meta.url),'utf8');
const article=fs.readFileSync(new URL('article-cloud.mjs',import.meta.url),'utf8');
const social=fs.readFileSync(new URL('social-cloud.mjs',import.meta.url),'utf8');
const access=fs.readFileSync(new URL('access-cloud.mjs',import.meta.url),'utf8');
const admin=fs.readFileSync(new URL('admin-setup.mjs',import.meta.url),'utf8');
const menu=fs.readFileSync(new URL('menu-cloud.mjs',import.meta.url),'utf8');
fs.writeFileSync(new URL('worker.deploy.mjs',import.meta.url),base.replace(/export (const|function) /g,'$1 ')+ '\n'+video+'\n'+article+'\n'+menu+'\n'+social+'\n'+access+'\n'+admin);
