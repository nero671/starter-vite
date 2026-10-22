import { minify } from 'html-minifier-terser';

import { webpHtml } from './webp.js';

/** Метка версии вида 20251024220319 — сбрасывает кэш браузера для css/js после каждого билда */
const getVersion = () => new Date().toISOString().replace(/\D/g, '').slice(0, 14);

/** Добавляет ?_v=<версия> к локальным .css/.js в атрибутах href/src */
const LOCAL_ASSET_RE = /(\s(?:href|src)=["'])(?![a-z]+:|\/\/)([^"'?#]+\.(?:css|js))(["'])/gi;

/** Подключённые сборкой стили: css/style.css → css/style.min.css */
const LOCAL_CSS_RE = /(<link\b[^>]*\shref=["'](?![a-z]+:|\/\/)[^"'?#]+?)(\.min)?\.css(["'])/gi;

/**
 * Финальная обработка HTML в build (пути здесь уже итоговые: ./images/a.jpg):
 * - <img> с jpg/png оборачивается в <picture> с webp-источником;
 * - стили подключаются из сжатого style.min.css;
 * - classicScript: <script type="module"> → <script defer>, чтобы dist открывался
 *   двойным кликом по index.html (file://) — модули по file:// браузер не загружает;
 * - сжатие HTML и удаление комментариев;
 * - метка версии ?_v=... к css/js.
 */
export const htmlBuild = ({
  webp = true,
  minifyHtml = true,
  cacheBust = true,
  classicScript = true,
} = {}) => ({
  name: 'starter:html-build',
  apply: 'build',

  generateBundle: {
    order: 'post',
    async handler(_options, bundle) {
      const version = getVersion();

      for (const asset of Object.values(bundle)) {
        if (asset.type !== 'asset' || !asset.fileName.endsWith('.html')) continue;

        let html = String(asset.source);

        if (webp) html = webpHtml(html);

        html = html.replace(LOCAL_CSS_RE, '$1.min.css$3');

        if (classicScript) {
          html = html
            .replace(/<script\b([^>]*?)\stype=["']module["']([^>]*)>/gi, '<script$1 defer$2>')
            .replace(/(<(?:script|link)\b[^>]*?)\scrossorigin(?:=["'][^"']*["'])?/gi, '$1');
        }

        html = await minify(html, {
          useShortDoctype: true,
          sortClassName: true,
          collapseBooleanAttributes: true,
          collapseWhitespace: minifyHtml,
          removeComments: minifyHtml,
          minifyCSS: minifyHtml,
        });

        if (cacheBust) html = html.replace(LOCAL_ASSET_RE, `$1$2?_v=${version}$3`);

        asset.source = html;
      }
    },
  },
});
