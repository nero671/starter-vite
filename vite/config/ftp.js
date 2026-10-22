/**
 * Настройки FTP. Пароль лучше не хранить в репозитории —
 * значения можно задать в файле .env в корне проекта (он в .gitignore):
 *   FTP_HOST=ftp.example.com
 *   FTP_USER=user
 *   FTP_PASSWORD=secret
 */
const configFTP = {
  host: process.env.FTP_HOST || '', // Адрес FTP сервера
  user: process.env.FTP_USER || '', // Имя пользователя
  password: process.env.FTP_PASSWORD || '', // Пароль
  port: Number(process.env.FTP_PORT) || 21,
  secure: process.env.FTP_SECURE === 'true', // FTPS
};

export { configFTP };
