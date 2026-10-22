import fs from 'node:fs';
import path from 'node:path';

import { paths } from '../config/paths.js';

/** Расширения, для которых сборка создаёт .webp копию */
const CONVERTIBLE_RE = /\.(jpe?g|png)(?=$|[?#])/i;

/** Внешние ссылки (http:, https:, data:, //cdn и т.д.) не трогаем */
const isExternal = (url) => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url);

/**
 * Проверяем, что картинка реально лежит в src/images.
 * Иначе .webp не появится и <picture>/image-set сломают показ картинки.
 */
const hasSourceImage = (url) => {
  const cleanUrl = decodeURI(url.split(/[?#]/)[0]);
  const match = cleanUrl.match(/(?:^|\/)images\/(.+)$/);

  return Boolean(match) && fs.existsSync(path.join(paths.images, match[1]));
};

export const canConvertToWebp = (url) =>
  Boolean(url) && CONVERTIBLE_RE.test(url) && !isExternal(url) && hasSourceImage(url);

export const toWebpUrl = (url) => url.replace(CONVERTIBLE_RE, '.webp');

// ==================================================================================================
// HTML: <img src="images/a.jpg"> → <picture><source srcset="images/a.webp" type="image/webp"><img ...></picture>
// ==================================================================================================

const getAttr = (tag, name) => {
  const match = tag.match(new RegExp(`(?<![\\w-])${name}\\s*=\\s*(["'])(.*?)\\1`, 'is'));

  return match ? match[2] : null;
};

const convertSrcset = (srcset) =>
  srcset
    .split(',')
    .map((candidate) => {
      const [url, ...descriptor] = candidate.trim().split(/\s+/);

      return [canConvertToWebp(url) ? toWebpUrl(url) : url, ...descriptor].join(' ');
    })
    .join(', ');

const wrapImg = (tag) => {
  // Атрибут data-no-webp отключает обёртку для конкретной картинки
  if (/\sdata-no-webp\b/i.test(tag)) return tag;

  const sizes = getAttr(tag, 'sizes');
  const sizesAttr = sizes ? ` sizes="${sizes}"` : '';

  // Ленивая загрузка через data-src / data-srcset (lazysizes, vanilla-lazyload и т.п.)
  const lazySrc = getAttr(tag, 'data-srcset') || getAttr(tag, 'data-src');

  if (lazySrc && canConvertToWebp(lazySrc.split(/[\s,]/)[0])) {
    return `<picture><source data-srcset="${convertSrcset(lazySrc)}"${sizesAttr} type="image/webp">${tag}</picture>`;
  }

  const src = getAttr(tag, 'src');

  if (!canConvertToWebp(src)) return tag;

  const srcset = getAttr(tag, 'srcset');
  const webpSrcset = srcset ? convertSrcset(srcset) : toWebpUrl(src);

  return `<picture><source srcset="${webpSrcset}"${sizesAttr} type="image/webp">${tag}</picture>`;
};

/** Оборачивает <img> в <picture> с webp-источником. Уже готовые <picture> и комментарии не трогает */
export const webpHtml = (html) =>
  html.replace(/<!--[\s\S]*?-->|<picture\b[\s\S]*?<\/picture>|<img\b[^>]*>/gi, (match) =>
    /^<img/i.test(match) ? wrapImg(match) : match
  );

// ==================================================================================================
// CSS (PostCSS): background-image: url(a.jpg)
// → background-image: url(a.jpg);  /* fallback для старых браузеров */
//   background-image: image-set(url(a.webp) type("image/webp"), url(a.jpg) type("image/jpeg"));
// ==================================================================================================

const WEBP_PROPS_RE =
  /^(?:background|background-image|border-image|border-image-source|list-style|list-style-image)$/i;
const CSS_URL_RE = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;

const mimeType = (url) => (/\.png(?=$|[?#])/i.test(url) ? 'image/png' : 'image/jpeg');

export const webpCss = () => ({
  postcssPlugin: 'webp-image-set',
  Declaration(decl) {
    if (!WEBP_PROPS_RE.test(decl.prop) || /image-set\(/i.test(decl.value)) return;

    let isChanged = false;

    const value = decl.value.replace(CSS_URL_RE, (match, _quote, url) => {
      if (!canConvertToWebp(url)) return match;

      isChanged = true;

      return `image-set(url("${toWebpUrl(url)}") type("image/webp"), url("${url}") type("${mimeType(url)}"))`;
    });

    if (isChanged) decl.cloneAfter({ value });
  },
});

webpCss.postcss = true;
