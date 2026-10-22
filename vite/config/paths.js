import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const srcFolder = path.join(root, 'src');

export const paths = {
  root,
  src: srcFolder,
  build: path.join(root, 'dist'),
  /** Файлы из public/ копируются в корень dist как есть (favicon.ico, .htaccess, robots.txt, static/...) */
  public: path.join(root, 'public'),
  html: path.join(srcFolder, 'html'),
  scss: path.join(srcFolder, 'scss'),
  js: path.join(srcFolder, 'js'),
  images: path.join(srcFolder, 'images'),
  icons: path.join(srcFolder, 'icons'),
  fonts: path.join(srcFolder, 'fonts'),
  fontsScss: path.join(srcFolder, 'scss/config/fonts.scss'),
  nodeModules: path.join(root, 'node_modules'),
  projectDirName: path.basename(root),
  ftp: '', // Путь к нужной папке на удаленном сервере. Имя папки проекта добавится автоматически
};

/** Страницы сайта — все .html в корне src (src/html — это partials, а не страницы) */
export const getPages = () =>
  fs
    .readdirSync(paths.src)
    .filter((file) => file.endsWith('.html'))
    .sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));
