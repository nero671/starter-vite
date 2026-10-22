import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { styleText } from 'node:util';
import fontEditor from 'fonteditor-core';
import wawoff2 from 'wawoff2';

import { paths } from '../config/paths.js';

const { Font } = fontEditor;

const fontWeights = {
  thin: 100,
  hairline: 100,
  extralight: 200,
  ultralight: 200,
  light: 300,
  regular: 400,
  normal: 400,
  book: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  extrabold: 800,
  ultrabold: 800,
  heavy: 900,
  black: 900,
};

const FONT_EXT_RE = /\.(otf|ttf|woff2?)$/i;

const success = (text) => console.log(styleText(['bold', 'white', 'bgGreenBright'], text));

const getFiles = (dir, extensions) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((file) => extensions.includes(path.extname(file).toLowerCase()))
    : [];

/** Конвертация нужна, только если результата нет или исходник новее */
const isOutdated = (source, target) =>
  !fs.existsSync(target) || fs.statSync(target).mtimeMs < fs.statSync(source).mtimeMs;

/** .otf → .ttf (результат кладётся рядом, в src/fonts) */
const otfToTtf = (onError) => {
  for (const file of getFiles(paths.fonts, ['.otf'])) {
    const source = path.join(paths.fonts, file);
    const ttfPath = path.join(paths.fonts, `${path.parse(file).name}.ttf`);

    if (!isOutdated(source, ttfPath)) continue;

    try {
      const font = Font.create(fs.readFileSync(source), { type: 'otf' });

      fs.writeFileSync(ttfPath, font.write({ type: 'ttf', toBuffer: true }));
    } catch (error) {
      onError(file, error);
    }
  }
};

/** .ttf → .woff + .woff2 (рядом, в src/fonts). Vite сам положит их в dist/fonts */
const ttfToWoff = async (onError) => {
  await Promise.all(
    getFiles(paths.fonts, ['.ttf']).map(async (file) => {
      const source = path.join(paths.fonts, file);
      const { name } = path.parse(file);
      const woffPath = path.join(paths.fonts, `${name}.woff`);
      const woff2Path = path.join(paths.fonts, `${name}.woff2`);

      if (!isOutdated(source, woffPath) && !isOutdated(source, woff2Path)) return;

      try {
        const input = fs.readFileSync(source);
        const woff = Font.create(input, { type: 'ttf', hinting: true, kerning: true }).write({
          type: 'woff',
          hinting: true,
          kerning: true,
          toBuffer: true,
          deflate: (data) => [...zlib.deflateSync(Buffer.from(data))],
        });

        fs.writeFileSync(woffPath, woff);
        fs.writeFileSync(woff2Path, await wawoff2.compress(input));
      } catch (error) {
        onError(file, error);
      }
    })
  );
};

/**
 * Разбор имени файла: Inter-BoldItalic → { family: 'Inter', weight: 700, style: 'italic' }
 * Для вариативных шрифтов (Inter-Variable, Inter[wght]) — диапазон 100 900
 */
const parseFontName = (fileName) => {
  const [family, ...rest] = fileName.split('-');
  const modifier = rest.join('').toLowerCase();
  const style = /italic|oblique/.test(modifier) ? 'italic' : 'normal';

  if (/variable|\[wght/.test(fileName.toLowerCase())) {
    return { family: family.replace(/\[.*$/, ''), weight: '100 900', style };
  }

  const weightName = modifier.replace(/italic|oblique/g, '') || 'regular';

  return { family, weight: fontWeights[weightName] ?? 400, style };
};

const EMPTY_FONTS_SCSS = `// Файл создаётся автоматически из шрифтов в src/fonts (.ttf / .otf / .woff / .woff2).
// Чтобы пересоздать его после добавления новых шрифтов — удалите этот файл.
`;

/**
 * Создаёт src/scss/config/fonts.scss с @font-face для всех шрифтов из src/fonts.
 * Уже заполненный файл не перезаписывается (его могли поправить руками).
 */
const fontStyle = () => {
  const fontFiles = getFiles(paths.fonts, ['.woff', '.woff2']);
  const current = fs.existsSync(paths.fontsScss) ? fs.readFileSync(paths.fontsScss, 'utf8') : null;

  if (current?.includes('@font-face')) {
    if (fontFiles.length) {
      success(
        'Файл scss/config/fonts.scss уже существует.\nДля обновления файла нужно его удалить!'
      );
    }
    return;
  }

  if (!fontFiles.length) {
    if (current === null) fs.writeFileSync(paths.fontsScss, EMPTY_FONTS_SCSS);
    return;
  }

  const fontNames = [...new Set(fontFiles.map((file) => path.parse(file).name))];

  const css = fontNames
    .map((fileName) => {
      const { family, weight, style } = parseFontName(fileName);
      const sources = ['woff2', 'woff']
        .filter((ext) => fontFiles.includes(`${fileName}.${ext}`))
        .map((ext) => `url("@fonts/${fileName}.${ext}") format("${ext}")`)
        .join(', ');

      return `@font-face {\n\tfont-family: "${family}";\n\tfont-display: swap;\n\tsrc: ${sources};\n\tfont-weight: ${weight};\n\tfont-style: ${style};\n}\n`;
    })
    .join('');

  fs.writeFileSync(paths.fontsScss, css);
  success('[Файл fonts.scss успешно записан]');
};

/**
 * Шрифты: .otf → .ttf → .woff/.woff2 + автоматический fonts.scss.
 * Запускается при старте dev/build и при добавлении шрифтов в src/fonts во время dev.
 * Ошибка конвертации: в dev — сообщение в консоли, в build — остановка сборки.
 */
export const fonts = () => {
  let isBuild = false;

  const run = async () => {
    const onError = (file, error) => {
      error.message = `[fonts] ${file}: ${error.message}`;

      if (isBuild) throw error;
      console.error(styleText('red', error.message));
    };

    fs.mkdirSync(paths.fonts, { recursive: true });
    otfToTtf(onError);
    await ttfToWoff(onError);
    fontStyle();
  };

  return {
    name: 'starter:fonts',

    configResolved(config) {
      isBuild = config.command === 'build';
    },

    async buildStart() {
      await run();
    },

    configureServer(server) {
      let timer;

      // Шрифты обычно добавляют пачкой — запускаем конвертацию один раз после последнего файла
      server.watcher.on('add', (file) => {
        if (!file.startsWith(paths.fonts) || !FONT_EXT_RE.test(file)) return;

        clearTimeout(timer);
        timer = setTimeout(run, 500);
      });
    },
  };
};
