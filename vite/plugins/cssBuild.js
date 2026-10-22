import postcss from 'postcss';
import sortMediaQueries from 'postcss-sort-media-queries'; // Группировка медиа запросов
import { transform } from 'lightningcss'; // Сжатие CSS файла

import { webpCss } from './webp.js'; // Вывод WEBP изображений через image-set()

/**
 * Финальная обработка CSS в build (пути к картинкам здесь уже итоговые: ../images/a.jpg):
 * - группировка медиа-запросов (desktop-first);
 * - background: url(a.jpg) дополняется image-set() с webp;
 * - рядом с несжатым style.css кладётся сжатый style.min.css (его и подключает HTML).
 */
export const cssBuild = ({ webp = true } = {}) => ({
  name: 'starter:css-build',
  apply: 'build',

  async generateBundle(_options, bundle) {
    for (const asset of Object.values(bundle)) {
      if (asset.type !== 'asset' || !asset.fileName.endsWith('.css')) continue;

      const plugins = [sortMediaQueries({ sort: 'desktop-first' }), ...(webp ? [webpCss()] : [])];
      const { css } = await postcss(plugins).process(String(asset.source), { from: undefined });

      const { code } = transform({
        filename: asset.fileName,
        code: Buffer.from(css),
        minify: true,
      });

      asset.source = css;
      this.emitFile({
        type: 'asset',
        fileName: asset.fileName.replace(/\.css$/, '.min.css'),
        source: code,
      });
    }
  },
});
