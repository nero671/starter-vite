import path from 'node:path';
import { defineConfig } from 'vite';
import autoprefixer from 'autoprefixer'; // Вендорные префиксы (-webkit-, -moz-) по browserslist из package.json
import browserslistToEsbuild from 'browserslist-to-esbuild';

import { paths, getPages } from './vite/config/paths.js';
import { handlebars } from './vite/plugins/handlebars.js';
import { pagesMenu } from './vite/plugins/pagesMenu.js';
import { sassGlob } from './vite/plugins/sassGlob.js';
import { fonts } from './vite/plugins/fonts.js';
import { svgSprite } from './vite/plugins/svgSprite.js';
import { images, isSourceImage, toImageFileName } from './vite/plugins/images.js';
import { cssBuild } from './vite/plugins/cssBuild.js';
import { htmlBuild } from './vite/plugins/htmlBuild.js';

/**
 * Настройки сборки
 */
const options = {
  /** Сжимать HTML и удалять комментарии в build */
  minifyHtml: true,
  /** Добавлять ?_v=<версия> к css/js в build, чтобы браузер не показывал старый кэш */
  cacheBust: true,
  /** jpg/png → webp в build: <picture> в HTML и image-set() в CSS */
  webp: true,
  /**
   * <script defer> вместо <script type="module"> в build — dist можно открыть
   * двойным кликом по index.html, без сервера. Выключите, если используете динамический import()
   */
  classicScript: true,
  /** Плавающее меню со списком страниц в dev */
  pagesMenu: true,
};

/** Имена файлов в dist: картинки — с сохранением подпапок, остальное — по типу */
const assetFileNames = ({ names, originalFileNames }) => {
  const original = originalFileNames?.[0];

  if (isSourceImage(original)) return toImageFileName(path.resolve(paths.src, original));

  const ext = path.extname(names?.[0] ?? '').toLowerCase();

  if (ext === '.css') return 'css/style[extname]';
  if (/\.(woff2?|ttf|otf|eot)$/.test(ext)) return 'fonts/[name][extname]';
  if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/.test(ext)) return 'images/[name][extname]';
  if (/\.(mp4|webm|ogg|mp3|wav)$/.test(ext)) return 'media/[name][extname]';

  return 'assets/[name][extname]';
};

export default defineConfig(() => {
  const browsers = browserslistToEsbuild();

  return {
    root: paths.src,
    base: './',
    publicDir: paths.public,

    resolve: {
      alias: {
        '@img': paths.images,
        '@fonts': paths.fonts,
        '@scss': paths.scss,
        '@js': paths.js,
      },
    },

    plugins: [
      handlebars({
        helpers: {
          parseJson: (str) => {
            try {
              return JSON.parse(str);
            } catch (e) {
              console.error('Ошибка JSON:', e);
              return [];
            }
          },
          eq: (a, b) => a === b,
        },
      }),
      sassGlob(),
      fonts(),
      svgSprite(),
      options.pagesMenu && pagesMenu(),
      images(),
      cssBuild({ webp: options.webp }),
      htmlBuild(options),
    ],

    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          /** Позволяет импортировать стили из пакетов: @import 'swiper/swiper' */
          loadPaths: [paths.nodeModules],
          /** @import оставлен ради glob-импортов (@import '../html/**\/*.scss') и общих переменных */
          silenceDeprecations: ['import'],
          quietDeps: true,
        },
      },
      postcss: {
        plugins: [autoprefixer()],
      },
    },

    server: {
      port: 3000,
      open: true,
    },

    preview: {
      port: 3000,
      open: true,
    },

    build: {
      outDir: paths.build,
      emptyOutDir: true,
      /** Браузеры берутся из "browserslist" в package.json */
      target: browsers,
      cssTarget: browsers,
      /** CSS сжимается отдельно (cssBuild): в dist лежат style.css и style.min.css */
      cssMinify: false,
      /** Картинки и шрифты не встраиваются в CSS/HTML как base64 — всегда отдельными файлами */
      assetsInlineLimit: 0,
      modulePreload: false,
      reportCompressedSize: false,
      rolldownOptions: {
        input: Object.fromEntries(
          getPages().map((file) => [file.replace(/\.html$/, ''), path.join(paths.src, file)])
        ),
        output: {
          entryFileNames: 'js/[name].min.js',
          chunkFileNames: 'js/[name].min.js',
          assetFileNames,
        },
      },
    },
  };
});
