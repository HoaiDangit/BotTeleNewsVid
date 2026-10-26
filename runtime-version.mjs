import fs from 'node:fs';import crypto from 'node:crypto';
export const RUNTIME_VERSION='media-v3';
export function runtimeFingerprint(){const hash=crypto.createHash('sha256');for(const file of ['video-agent.mjs','editorial-policy.mjs','licensed-images.mjs','drive-images.mjs','sketch-images.mjs','install-media.mjs','runtime-version.mjs'])hash.update(fs.readFileSync(new URL(file,import.meta.url)));return hash.digest('hex').slice(0,16);}
