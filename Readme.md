# Start Template: Vite

Сборка для вёрстки многостраничных сайтов на [Vite](https://vite.dev/). Повторяет возможности gulp-сборки
(Handlebars, SCSS, webp, шрифты, svg-спрайт, zip, ftp), но работает быстрее и обновляет стили без перезагрузки страницы.

## Требования

- **Node.js 22.12+** (в проекте есть `.nvmrc`: `nvm use`).

## Команды

- Установка зависимостей: `$ npm install`;
- Режим разработки (сервер на http://localhost:3000): `$ npm run dev`;
- Сборка проекта в режиме `production`: `$ npm run build`;
- Просмотр собранного `dist` через сервер: `$ npm run preview`;
- Архив для заказчика: `$ npm run zip`;
- Выгрузка на хостинг по FTP: `$ npm run deployFTP`;
- Публикация на GitHub Pages: `$ npm run deploy`;
- Форматирование кода: `$ npm run prettier`.

## Структура

```
├── public/                  # копируется в корень dist как есть: favicon.ico, .htaccess, robots.txt, static/...
├── src/
│   ├── index.html           # разводящая — список страниц собирается автоматически
│   ├── home.html, ui.html…  # страницы сайта (любой .html в корне src)
│   ├── html/                # partials: head, header, footer, components/...
│   ├── scss/                # style.scss + config (переменные, миксины, reset…), components, libs
│   ├── js/                  # app.js + modules, helpers, libs
│   ├── images/              # картинки (в build: сжатие + webp)
│   ├── icons/               # svg-иконки для спрайта
│   └── fonts/               # шрифты (.ttf/.otf → .woff/.woff2)
├── vite/                    # плагины и задачи сборки (аналог папки gulp/)
└── vite.config.js           # настройки сборки
```

Итоговый `dist`:

```
dist/
├── index.html, home.html, ui.html…
├── css/style.css            # несжатый
├── css/style.min.css        # сжатый (подключён в HTML)
├── js/app.min.js
├── images/                  # + .webp копии, images/icons/icons.svg
└── fonts/
```

Все пути в `dist` относительные, поэтому проект работает из любой папки на хостинге (в т.ч. GitHub Pages) и
**открывается двойным кликом по `index.html`** без сервера.

## Поддерживаемые браузеры

Список браузеров задаётся **в одном месте** — в поле `"browserslist"` файла `package.json`. По нему работают:

- **Autoprefixer** — добавляет вендорные префиксы (`-webkit-`, `-moz-`) в CSS;
- **Vite** — переводит современный JS в синтаксис, понятный этим браузерам.

По умолчанию: все актуальные браузеры + Safari / iOS 14 и новее. Посмотреть итоговый список: `$ npx browserslist`.

## HTML

Страницы собираются из частей через Handlebars. Partials — все `.html` из `src/html`, имя = путь без расширения:

```handlebars
{{> head title="Главная"}}
{{> header/header}}
{{> components/breadcrumbs/breadcrumbs
  items=(parseJson '[
    { "title": "Главная", "url": "/" },
    { "title": "Контакты" }
  ]')
}}
{{> script}}
```

- `{{> head title="..."}}` — подключает стили и задаёт `<title>`; по `title` подписывается страница в разводящей;
- хелперы: `parseJson` (массивы/объекты прямо в шаблоне), `eq` (`{{#if (eq page "home")}}`);
- в любом шаблоне доступны `{{page}}` (имя текущей страницы), `{{#each pages}}`, `{{isDev}}` / `{{isBuild}}`;
- новая страница = новый `.html` в корне `src`. Она сразу появится в разводящей и в меню страниц;
- в режиме `dev` в правом нижнем углу есть кнопка ☰ со списком всех страниц (отключается в `vite.config.js`).

В режиме `production` HTML сжимается, комментарии удаляются, к `css`/`js` добавляется метка версии `?_v=...`,
чтобы браузер не показывал старый кэш.

## SCSS

- `src/scss/style.scss` подключается в `head.html` через `<link rel="stylesheet" href="/scss/style.scss">`;
- стили компонентов из `src/html/**/*.scss` подключаются **автоматически** (`@import '../html/**/*.scss'`) — новый файл
  подхватывается без перезапуска сервера;
- переменные, миксины и шаблоны из `scss/config` доступны во всех файлах;
- в режиме `dev` стили обновляются без перезагрузки страницы, есть source maps;
- в режиме `production` медиа-запросы группируются, рядом с `style.css` создаётся сжатый `style.min.css`;
- импорт стилей из пакетов: `@import 'swiper/css';`.

Полезные миксины и функции (`src/scss/config/mixins.scss`):

```scss
.title {
  font-size: fluid(28, 48);           // резиновый размер через clamp(): 28px → 48px
  padding: rem(24);                   // 1.5rem

  @include media(767) { ... }         // @media (max-width: 767.98px)
  @include mediaMin(768) { ... }      // @media (min-width: 768px)
  @include hover { color: red; }      // hover только для мыши, без «залипания» на телефонах
}
```

## Картинки и WebP

Картинки лежат в `src/images` и подключаются через `@img/`:

```html
<img src="@img/photo.jpg" alt="">
```

```scss
background: url('@img/photo.jpg');
```

В режиме `production` вся папка `src/images` копируется в `dist/images` (с подпапками, даже если картинка нигде не
подключена — например используется из JS), а все `jpg`/`jpeg`/`png`:

- сжимаются (если сжатый файл получился больше исходника — остаётся исходник);
- конвертируются в `.webp` (через [sharp](https://sharp.pixelplumbing.com/)).

Подключение webp происходит само:

- **HTML** — `<img>` превращается в `<picture>` с webp-источником. Работает с `srcset`, `sizes` и ленивой загрузкой
  через `data-src`. Внешние ссылки, `svg`, `gif` и уже готовые `<picture>` не трогаются. Отключить для конкретной
  картинки: атрибут `data-no-webp`;
- **CSS** — `background: url(...)` дополняется `image-set()` с webp. Старые браузеры используют исходный `jpg`/`png`.

> `<picture>` получает `display: contents`, поэтому раскладка картинок одинаковая в `dev` и `production`.

## SVG-спрайт

Все иконки из `src/icons/*.svg` собираются в спрайт `images/icons/icons.svg` (id = имя файла):

```html
<svg><use href="@img/icons/icons.svg#arrow"></use></svg>
```

Все иконки спрайта в режиме `dev`: http://localhost:3000/images/icons/icons.html

## Шрифты

Положите `.ttf` / `.otf` в `src/fonts` — сборка сконвертирует их в `.woff` и `.woff2` (рядом, в `src/fonts`) и создаст
файл `src/scss/config/fonts.scss`:

```scss
@font-face {
  font-family: "Inter";
  font-display: swap;
  src: url("@fonts/Inter-Bold.woff2") format("woff2"), url("@fonts/Inter-Bold.woff") format("woff");
  font-weight: 700;
  font-style: normal;
}
```

Начертание определяется по имени файла: `Inter-Bold`, `Inter-BoldItalic`, `Inter-SemiBold`, `Inter-Variable` и т.д.

> Уже заполненный `fonts.scss` не перезаписывается. Чтобы пересоздать его после добавления новых шрифтов —
> **удалите** файл и запустите сборку.

## JavaScript

- точка входа — `src/js/app.js`, поддерживаются `import/export`, импорт без расширения и из папки (`./modules` →
  `./modules/index.js`);
- неиспользуемый код в итоговый файл не попадает — модули включаются раскомментированием в `app.js`;
- в режиме `production` код сжимается в `js/app.min.js` и подключается обычным `<script defer>`, поэтому `dist` работает
  без сервера (`file://`). Если понадобится динамический `import()` — выключите `classicScript` в `vite.config.js`.

## Готовые компоненты

HTML — `src/html/components`, стили подключаются автоматически, JS — `src/js/modules` (раскомментировать в `app.js`).
Все компоненты собраны на странице `ui.html`.

| Компонент | Разметка | JS |
| --- | --- | --- |
| Аккордеон (плавное раскрытие на CSS Grid) | `components/accordion` | `initAccordions()` |
| Табы (с управлением с клавиатуры) | `components/tabs` | `initTabs()` |
| Модальное окно (закрытие по фону / Escape) | `components/popup` | `togglePopupWindows()` |
| Кастомный select (синхронизирован с нативным) | `components/customSelect` | `customSelect()` |
| Чекбокс | `components/customCheckbox` | — |
| Выпадающий список | `components/dropdown` | `dropdown()` |
| Баннер cookies (запоминает выбор) | `components/cookies-banner` | `cookiesInit()` |
| Счётчик `+ / -` | `components/counter` | `counter()` |
| Загрузка файла | `components/file` | `customFile()` |
| Хлебные крошки | `components/breadcrumbs` | — |
| Пагинация | `components/pagination` | — |
| Слайдер диапазона | `components/range` | `rangeSlider()` (нужен `nouislider`) |
| Анимация чисел | `<span data-count-target="12 500">0</span>` | `countNumAnim()` |

## Остальное

- папка `public` копируется в корень `dist` как есть — туда кладутся `favicon.ico`, `.htaccess`, `robots.txt`, а любые
  файлы для скачивания (pdf и т.п.) — в `public/static`;
- перед каждой сборкой папка `dist` очищается;
- `$ npm run zip` — собирает проект и архивирует его в `<имя-папки-проекта>.zip`;
- `$ npm run deployFTP` — собирает проект и выгружает на хостинг. Доступы — в `.env` в корне проекта (файл не попадает в
  git), подробнее в `vite/config/ftp.js`:

  ```
  FTP_HOST=ftp.example.com
  FTP_USER=user
  FTP_PASSWORD=secret
  ```

- настройки сборки (сжатие HTML, `?_v=`, webp, `<script defer>`, меню страниц) — объект `options` в `vite.config.js`.

### Ошибки

- в режиме `dev` ошибка (SCSS, JS, HTML) показывается прямо в браузере поверх страницы, а сервер продолжает работать —
  после исправления страница обновится сама;
- в режиме `build`/`zip`/`deployFTP` ошибка **останавливает сборку**, чтобы битый проект не ушёл заказчику или на хостинг.
