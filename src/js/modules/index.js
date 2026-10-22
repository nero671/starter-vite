import toggleBodyLock from './../helpers/toggleBodyLock';
import { html, firstScreen, header } from './../helpers/elementsNodeList';

// Проверка браузера на поддержку .webp изображений ======================================================
function isWebp() {
  // Проверка поддержки webp
  const testWebp = (callback) => {
    const webP = new Image();

    webP.onload = webP.onerror = () => callback(webP.height === 2);
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  };

  // Добавление класса _webp или _no-webp для HTML
  testWebp((support) => {
    html.classList.add(support ? 'webp' : 'no-webp');
  });
}

/* Проверка мобильного браузера */
const isMobile = {
  Android: () => navigator.userAgent.match(/Android/i),
  BlackBerry: () => navigator.userAgent.match(/BlackBerry/i),
  // iPadOS 13+ представляется как Mac, поэтому дополнительно проверяем сенсорный экран
  iOS: () =>
    navigator.userAgent.match(/iPhone|iPad|iPod/i) ||
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1),
  Opera: () => navigator.userAgent.match(/Opera Mini/i),
  Windows: () => navigator.userAgent.match(/IEMobile/i),
  any: () =>
    isMobile.Android() ||
    isMobile.BlackBerry() ||
    isMobile.iOS() ||
    isMobile.Opera() ||
    isMobile.Windows(),
};

/* Добавление класса touch для HTML если браузер мобильный */
function addTouchClass() {
  // Основное устройство ввода — палец (без hover)
  const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  if (isMobile.any() || isTouchDevice) {
    html.classList.add('touch');
  }
}

// Добавление loaded для HTML после полной загрузки страницы
function addLoadedClass() {
  window.addEventListener('load', () => {
    setTimeout(() => {
      html.classList.add('loaded');
    }, 0);
  });
}

// Получение хеша в адресе сайта
const getHash = () => location.hash?.replace('#', '');

// Указание хеша в адресе сайта
function setHash(hash) {
  hash = hash ? `#${hash}` : location.href.split('#')[0];
  history.pushState('', '', hash);
}

// Функция для фиксированной шапки при скролле ===========================================================
function headerFixed() {
  if (!header || !firstScreen) return;

  const headerStickyObserver = new IntersectionObserver(([entry]) => {
    header.classList.toggle('sticky', !entry.isIntersecting);
  });

  headerStickyObserver.observe(firstScreen);
}

// Универсальная функция для открытия и закрытия попапов ==================================================
const OPEN_CLASS = '_is-open';

const closePopup = (popup) => {
  if (!popup) return;

  popup.classList.remove(OPEN_CLASS);

  if (!document.querySelector(`[data-popup].${OPEN_CLASS}`)) {
    toggleBodyLock(false);
  }
};

const openPopup = (name) => {
  const popup = document.querySelector(`[data-popup="${name}"]`);

  if (!popup) return;

  document.querySelectorAll(`[data-popup].${OPEN_CLASS}`).forEach((modal) => {
    modal.classList.remove(OPEN_CLASS);
  });

  popup.classList.add(OPEN_CLASS);
  toggleBodyLock(true);
};

const togglePopupWindows = () => {
  document.addEventListener('click', ({ target }) => {
    const opener = target.closest('[data-type]');

    if (opener) {
      openPopup(opener.dataset.type);
      return;
    }

    if (target.classList.contains('_overlay-bg') || target.closest('.button-close')) {
      closePopup(target.closest('[data-popup]'));
    }
  });

  // Закрытие по клавише Escape
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.querySelectorAll(`[data-popup].${OPEN_CLASS}`).forEach(closePopup);
    }
  });
};

const cookies = () => {
  const cookie = document.querySelector('.cookie');

  if (!cookie) {
    return;
  }

  if (sessionStorage.cookie === 'none') {
    cookie.style.display = 'none';
    cookie.style.opacity = '0';
  } else {
    cookie.style.display = 'flex';
    cookie.style.opacity = '1';
  }

  cookie.addEventListener('click', (e) => {
    if (e.target.closest('.accept-cookie')) {
      cookie.style.display = 'none';
      sessionStorage.cookie = cookie.style.display;
    }
  });
};

export {
  isWebp,
  isMobile,
  addTouchClass,
  headerFixed,
  togglePopupWindows,
  openPopup,
  closePopup,
  addLoadedClass,
  getHash,
  setHash,
  cookies
};
