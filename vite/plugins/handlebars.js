import fs from 'node:fs';
import path from 'node:path';
import Handlebars from 'handlebars';

import { paths, getPages } from '../config/paths.js';

const PARTIAL_EXT = '.html';

/**
 * Регистрирует все .html файлы папки как partials.
 * Имя partial = путь относительно папки без расширения:
 * src/html/components/breadcrumbs/breadcrumbs.html → {{> components/breadcrumbs/breadcrumbs}}
 */
const registerPartials = (hbs, dir, root = dir) => {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      registerPartials(hbs, fullPath, root);
      continue;
    }

    if (path.extname(entry.name) !== PARTIAL_EXT) continue;

    const name = path
      .relative(root, fullPath)
      .slice(0, -PARTIAL_EXT.length)
      .split(path.sep)
      .join('/');

    hbs.registerPartial(name, fs.readFileSync(fullPath, 'utf8'));
  }
};

/** Заголовок страницы: {{> head title="..."}} или <title>...</title> */
const getPageTitle = (file) => {
  const html = fs.readFileSync(path.join(paths.src, file), 'utf8');
  const match =
    html.match(/\{\{>\s*head\b[^}]*?title=(["'])(.*?)\1/s) || html.match(/<title>(.*?)<\/title>/s);

  return match ? match.at(-1).trim() : file;
};

/** Список страниц для разводящей (index.html) и меню страниц в dev-режиме */
export const getPagesData = () =>
  getPages()
    .filter((file) => file !== 'index.html')
    .map((file) => ({ file, name: file.replace(/\.html$/, ''), title: getPageTitle(file) }));

/**
 * Компиляция страниц через Handlebars.
 * Partials перечитываются при каждом запросе страницы, поэтому правки подхватываются сразу.
 *
 * Данные, доступные в любом шаблоне:
 *   {{#each pages}} — список страниц ({ file, name, title })
 *   {{page}}        — имя текущей страницы (home, ui, ...)
 *   {{isDev}} / {{isBuild}}
 */
export const handlebars = ({ helpers = {}, data = {} } = {}) => {
  let isBuild = false;

  return {
    name: 'starter:handlebars',

    configResolved(config) {
      isBuild = config.command === 'build';
    },

    configureServer(server) {
      // Vite не знает о partials — перезагружаем страницу при изменении любого .html в src
      const reload = (file) => {
        if (file.endsWith(PARTIAL_EXT) && file.startsWith(paths.src)) {
          server.ws.send({ type: 'full-reload' });
        }
      };

      server.watcher.on('change', reload);
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const hbs = Handlebars.create();

        hbs.registerHelper(helpers);
        registerPartials(hbs, paths.html);

        try {
          const template = hbs.compile(html);

          return template({
            ...data,
            pages: getPagesData(),
            page: path.basename(ctx.filename, PARTIAL_EXT),
            isDev: !isBuild,
            isBuild,
          }).replace(/@img\//g, 'images/');
        } catch (error) {
          error.message = `${path.relative(paths.root, ctx.filename)}: ${error.message}`;
          throw error;
        }
      },
    },
  };
};
