import { getPagesData } from './handlebars.js';

const STYLE = `
  .dev-pages { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; font: 14px/1.3 system-ui, sans-serif; }
  .dev-pages summary { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: #131313; color: #fff; cursor: pointer; list-style: none; box-shadow: 0 4px 16px rgba(0,0,0,.25); }
  .dev-pages summary::-webkit-details-marker { display: none; }
  .dev-pages nav { position: absolute; right: 0; bottom: 52px; display: flex; flex-direction: column; max-height: 60vh; overflow: auto; padding: 8px; border-radius: 12px; background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,.25); }
  .dev-pages a { padding: 8px 12px; border-radius: 8px; color: #131313; text-decoration: none; white-space: nowrap; }
  .dev-pages a:hover { background: #f2f3f5; }
  .dev-pages a[aria-current] { background: #131313; color: #fff; }
`;

/**
 * Плавающее меню со списком всех страниц (только в dev).
 * Обновляется само при добавлении новых страниц в src.
 */
export const pagesMenu = () => ({
  name: 'starter:pages-menu',
  apply: 'serve',

  transformIndexHtml(html, ctx) {
    const current = ctx.path.replace(/^\//, '') || 'index.html';
    const pages = [{ file: 'index.html', title: 'Все страницы' }, ...getPagesData()];

    const links = pages
      .map(
        ({ file, title }) =>
          `<a href="/${file}"${file === current ? ' aria-current="page"' : ''}>${title}</a>`
      )
      .join('');

    return [
      { tag: 'style', children: STYLE, injectTo: 'head' },
      {
        tag: 'details',
        attrs: { class: 'dev-pages' },
        children: `<summary title="Страницы">☰</summary><nav>${links}</nav>`,
        injectTo: 'body',
      },
    ];
  },
});
