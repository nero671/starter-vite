import fs from 'node:fs';
import path from 'node:path';
import { zipSync } from 'fflate';
import { globSync } from 'tinyglobby';

import { paths } from '../config/paths.js';

/** Архив готового проекта для заказчика: <имя-папки-проекта>.zip в корне проекта */
const archiveName = `${paths.projectDirName}.zip`;
const archivePath = path.join(paths.root, archiveName);

const files = globSync('**/*', { cwd: paths.build, dot: true });

if (!files.length) {
  console.error('[zip] Папка dist пуста — сначала соберите проект: npm run build');
  process.exit(1);
}

const archive = Object.fromEntries(
  files.map((file) => [
    `${paths.projectDirName}/${file}`,
    fs.readFileSync(path.join(paths.build, file)),
  ])
);

fs.writeFileSync(archivePath, zipSync(archive, { level: 9 }));

console.log(
  `[zip] ${archiveName} — ${files.length} файлов, ${(fs.statSync(archivePath).size / 1024).toFixed(1)} KB`
);
