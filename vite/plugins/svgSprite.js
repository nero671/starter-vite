import fs from 'node:fs';
import path from 'node:path';
import SVGSpriter from 'svg-sprite';
import { globSync } from 'tinyglobby';

import { paths } from '../config/paths.js';

export const SPRITE_FILE = 'images/icons/icons.svg';
const PREVIEW_FILE = 'images/icons/icons.html';

/** Собирает все src/icons/*.svg в один спрайт. id символа = имя файла */
const createSprite = async () => {
  const files = globSync('*.svg', { cwd: paths.icons, absolute: true });

  if (!files.length) return null;

  const spriter = new SVGSpriter({
    dest: paths.build,
    mode: { symbol: { sprite: SPRITE_FILE } },
  });

  for (const file of files) {
    spriter.add(file, path.basename(file), fs.readFileSync(file, 'utf8'));
  }

  const { result } = await spriter.compileAsync();

  return {
    sprite: result.symbol.sprite.contents,
    ids: files.map((file) => path.basename(file, '.svg')),
  };
};

/** Страница со всеми иконками спрайта (только в dev): /images/icons/icons.html */
const createPreview = (ids) => `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Иконки спрайта</title>
  <style>
    body { margin: 0; padding: 32px; font-family: system-ui, sans-serif; color: #131313; }
    ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; padding: 0; list-style: none; }
    li { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 8px; border: 1px solid #e4e6eb; border-radius: 12px; font-size: 13px; }
    svg { width: 32px; height: 32px; }
    code { user-select: all; }
  </style>
</head>
<body>
  <h1>Иконки (${ids.length})</h1>
  <p>Использование: <code>&lt;svg&gt;&lt;use href="@img/icons/icons.svg#имя"&gt;&lt;/use&gt;&lt;/svg&gt;</code></p>
  <ul>
    ${ids.map((id) => `<li><svg><use href="icons.svg#${id}"></use></svg><code>${id}</code></li>`).join('\n    ')}
  </ul>
</body>
</html>`;

/**
 * SVG-спрайт из src/icons/*.svg → images/icons/icons.svg
 * Использование: <svg><use href="@img/icons/icons.svg#имя-файла"></use></svg>
 *
 * dev   — спрайт собирается в памяти и пересобирается при изменении иконок;
 * build — спрайт кладётся в dist/images/icons/icons.svg.
 */
export const svgSprite = () => {
  let cache = null;

  const getSprite = async () => {
    cache ??= createSprite();
    return cache;
  };

  return {
    name: 'starter:svg-sprite',

    configureServer(server) {
      const onChange = (file) => {
        if (!file.startsWith(paths.icons) || !file.endsWith('.svg')) return;

        cache = null;
        server.ws.send({ type: 'full-reload' });
      };

      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);

      server.middlewares.use(async (req, res, next) => {
        const url = req.url.split('?')[0].replace(/^\//, '');

        if (url !== SPRITE_FILE && url !== PREVIEW_FILE) return next();

        try {
          const result = await getSprite();

          if (!result) return next();

          const isSprite = url === SPRITE_FILE;

          res.setHeader('Content-Type', isSprite ? 'image/svg+xml' : 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(isSprite ? result.sprite : createPreview(result.ids));
        } catch (error) {
          cache = null;
          next(error);
        }
      });
    },

    async generateBundle() {
      const result = await getSprite();

      if (result) {
        this.emitFile({ type: 'asset', fileName: SPRITE_FILE, source: result.sprite });
      }
    },
  };
};
