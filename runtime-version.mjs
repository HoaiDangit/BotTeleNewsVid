import fs from 'node:fs';import crypto from 'node:crypto';
export const RUNTIME_VERSION='dual-v1';
export function runtimeFingerprint(){const hash=crypto.createHash('sha256');for(const file of ['video-agent.mjs','editorial-policy.mjs','workout-editorial.mjs','licensed-images.mjs','article-images.mjs','drive-images.mjs','sketch-images.mjs','install-media.mjs','runtime-version.mjs'])hash.update(fs.readFileSync(new URL(file,import.meta.url)));return hash.digest('hex').slice(0,16);}
