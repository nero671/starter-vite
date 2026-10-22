const cookiesAcceptName = 'COOKIES_ACCEPTED';
const cookiesDeclainName = 'COOKIES_DECLAINED';
const cookiesClassMod = 'is-active';
/** Срок хранения решения пользователя (дней) */
const cookiesMaxAgeDays = 365;

export const getCookie = (name) => {
  const matches = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
  );

  return matches ? decodeURIComponent(matches[1]) : undefined;
};

export const setCookie = (name, value, options = {}) => {
  options = {
    path: '/',
    SameSite: 'Lax',
    ...options,
  };

  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }

  let updatedCookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);

  for (const [optionKey, optionValue] of Object.entries(options)) {
    updatedCookie += '; ' + optionKey;

    if (optionValue !== true) {
      updatedCookie += '=' + optionValue;
    }
  }

  document.cookie = updatedCookie;
};

export const deleteCookie = (name) => {
  setCookie(name, '', {
    'max-age': -1,
  });
};

const getCookieBanner = () => document.querySelector('[data-cookies-banner]');

const showCookiesBanner = () => {
  getCookieBanner()?.classList.add(cookiesClassMod);
};

const hideCookiesBanner = () => {
  getCookieBanner()?.classList.remove(cookiesClassMod);
};

/** Сохраняем выбор пользователя (принял / отклонил) */
const saveChoice = (isAccepted) => {
  deleteCookie(isAccepted ? cookiesDeclainName : cookiesAcceptName);
  setCookie(isAccepted ? cookiesAcceptName : cookiesDeclainName, true, {
    'max-age': cookiesMaxAgeDays * 24 * 60 * 60,
  });
  hideCookiesBanner();
};

export const isCookiesAccepted = () => getCookie(cookiesAcceptName) === 'true';

export const cookiesInit = () => {
  const hasChoice = getCookie(cookiesAcceptName) || getCookie(cookiesDeclainName);

  if (!hasChoice) showCookiesBanner();

  document.addEventListener('click', ({ target }) => {
    if (target.closest('.js-cookies-accept')) saveChoice(true);
    if (target.closest('.js-cookies-declain')) saveChoice(false);
    if (target.closest('.js-cookies-banner-show')) showCookiesBanner();
    if (target.closest('.js-cookies-banner-hide')) hideCookiesBanner();
  });
};
