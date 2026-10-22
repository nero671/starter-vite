import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'basic-ftp';

import { paths } from '../config/paths.js';

/** Логины/пароли можно хранить в .env (он в .gitignore), см. vite/config/ftp.js */
const envFile = path.join(paths.root, '.env');

if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const { configFTP } = await import('../config/ftp.js');

if (!configFTP.host) {
  console.error('[ftp] Не указан FTP сервер: заполните vite/config/ftp.js или .env');
  process.exit(1);
}

/** Папка на сервере: /<paths.ftp>/<имя-папки-проекта> */
const remoteDir = `/${[paths.ftp, paths.projectDirName].filter(Boolean).join('/')}`;
const client = new Client();

try {
  await client.access(configFTP);
  await client.ensureDir(remoteDir);
  await client.uploadFromDir(paths.build);

  console.log(`[ftp] Проект выгружен в ${configFTP.host}${remoteDir}`);
} catch (error) {
  console.error(`[ftp] ${error.message}`);
  process.exitCode = 1;
} finally {
  client.close();
}
