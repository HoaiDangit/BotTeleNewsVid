import fs from 'node:fs';import crypto from 'node:crypto';
export const RUNTIME_VERSION='source-media-v2';
export function runtimeFingerprint(){const hash=crypto.createHash('sha256');for(const file of ['video-agent.mjs','editorial-policy.mjs','workout-editorial.mjs','licensed-images.mjs','article-images.mjs','article-screenshot.mjs','user-media.mjs','public-url.mjs','drive-images.mjs','sketch-images.mjs','install-media.mjs','runtime-version.mjs'])hash.update(fs.readFileSync(new URL(file,import.meta.url)));return hash.digest('hex').slice(0,16);}
