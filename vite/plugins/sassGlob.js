import path from 'node:path';
import { globSync } from 'tinyglobby';

/** @import '../html/**\/*.scss'; — только в начале строки, закомментированные импорты не трогаем */
const GLOB_IMPORT_RE = /^([ \t]*)@import\s+(['"])([^'"]*[*{][^'"]*)\2\s*;?/gm;
const SCSS_RE = /\.s[ac]ss$/;

/**
 * Glob-импорты в SCSS, как gulp-sass-glob:
 *   @import '../html/**\/*.scss';
 * превращается в список @import всех найденных файлов (по алфавиту).
 * В dev при добавлении/удалении .scss файла стили пересобираются автоматически.
 */
export const sassGlob = () => {
  /** Файлы, в которых есть glob-импорты — их нужно пересобрать при появлении новых .scss */
  const globFiles = new Set();

  return {
    name: 'starter:sass-glob',
    enforce: 'pre',

    transform(code, id) {
      const file = id.split('?')[0];

      if (!SCSS_RE.test(file) || !GLOB_IMPORT_RE.test(code)) return null;

      GLOB_IMPORT_RE.lastIndex = 0;
      globFiles.add(file);

      const dir = path.dirname(file);

      return {
        code: code.replace(GLOB_IMPORT_RE, (_match, indent, quote, pattern) =>
          globSync(pattern, { cwd: dir, expandDirectories: false })
            .filter((found) => SCSS_RE.test(found) && path.resolve(dir, found) !== file)
            .sort()
            .map(
              (found) =>
                `${indent}@import ${quote}${found.startsWith('.') ? found : `./${found}`}${quote};`
            )
            .join('\n')
        ),
        map: null,
      };
    },

    configureServer(server) {
      const onAddOrUnlink = (file) => {
        if (!SCSS_RE.test(file)) return;

        const environment = server.environments.client;

        for (const globFile of globFiles) {
          for (const mod of environment.moduleGraph.getModulesByFile(globFile) ?? []) {
            environment.reloadModule(mod);
          }
        }
      };

      server.watcher.on('add', onAddOrUnlink);
      server.watcher.on('unlink', onAddOrUnlink);
    },
  };
};
