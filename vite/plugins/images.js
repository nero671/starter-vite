import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { globSync } from 'tinyglobby';

import { paths } from '../config/paths.js';

/** Настройки качества. webp ≈ как у прежнего gulp-webp, jpeg — mozjpeg как у imagemin */
const defaults = {
  webp: { quality: 80, effort: 5 },
  jpeg: { quality: 80, mozjpeg: true },
  png: { compressionLevel: 9, adaptiveFiltering: true, effort: 10 },
};

const optimizers = {
  '.jpg': (input, options) => sharp(input).rotate().jpeg(options.jpeg).toBuffer(),
  '.jpeg': (input, options) => sharp(input).rotate().jpeg(options.jpeg).toBuffer(),
  '.png': (input, options) => sharp(input).png(options.png).toBuffer(),
};

/** Путь картинки в dist: src/images/catalog/a.jpg → images/catalog/a.jpg */
export const toImageFileName = (file) =>
  `images/${path.relative(paths.images, file).split(path.sep).join('/')}`;

export const isSourceImage = (file) =>
  Boolean(file) && path.resolve(paths.src, file).startsWith(paths.images + path.sep);

/**
 * Копирует всю папку src/images в dist/images (даже картинки, которые нигде не подключены,
 * например используются из JS или в data-src). Структура подпапок сохраняется.
 *
 * Для каждой jpg/png картинки:
 * - создаёт рядом .webp копию (если .webp с таким именем не лежит в src/images);
 * - сжимает оригинал (если результат получился больше исходника — оставляет исходник).
 * Остальные форматы (gif, svg, webp, avif, ico) копируются без изменений.
 */
export const images = (userOptions = {}) => {
  const options = {
    webp: { ...defaults.webp, ...userOptions.webp },
    jpeg: { ...defaults.jpeg, ...userOptions.jpeg },
    png: { ...defaults.png, ...userOptions.png },
  };

  return {
    name: 'starter:images',
    apply: 'build',

    async generateBundle(_options, bundle) {
      const files = globSync('**/*', { cwd: paths.images, absolute: true, dot: false });

      /** Картинки, подключённые в HTML/CSS, Vite уже положил в bundle — заменяем их содержимое */
      const setAsset = (fileName, source) => {
        if (bundle[fileName]?.type === 'asset') {
          bundle[fileName].source = source;
        } else {
          this.emitFile({ type: 'asset', fileName, source });
        }
      };

      let total = 0;
      let saved = 0;

      await Promise.all(
        files.map(async (file) => {
          const fileName = toImageFileName(file);
          const input = fs.readFileSync(file);
          const optimize = optimizers[path.extname(file).toLowerCase()];

          if (!optimize) return setAsset(fileName, input);

          try {
            const webpFile = file.replace(/\.[^.]+$/, '.webp');
            const [webpBuffer, optimizedBuffer] = await Promise.all([
              fs.existsSync(webpFile) ? null : sharp(input).rotate().webp(options.webp).toBuffer(),
              optimize(input, options),
            ]);

            if (webpBuffer) setAsset(toImageFileName(webpFile), webpBuffer);

            if (optimizedBuffer.length < input.length) {
              saved += input.length - optimizedBuffer.length;
              setAsset(fileName, optimizedBuffer);
            } else {
              setAsset(fileName, input);
            }

            total += 1;
          } catch (error) {
            error.message = `${path.relative(paths.root, file)}: ${error.message}`;
            throw error;
          }
        })
      );

      if (total) {
        this.info(`Обработано картинок: ${total}, сэкономлено ${(saved / 1024).toFixed(1)} KB`);
      }
    },
  };
};
