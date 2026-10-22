/**
 * Анимация чисел при появлении в зоне видимости.
 *
 * Разметка: <span data-count-target="12 500">0</span>
 * Дробные числа поддерживаются: data-count-target="4,8"
 *
 * @param {string} selector - селектор элементов
 * @param {number} duration - длительность анимации (мс)
 */
export const countNumAnim = (selector = '[data-count-target]', duration = 2000) => {
  const elements = document.querySelectorAll(selector);

  if (!elements.length) return;

  const formatNumber = (num, decimals) =>
    num.toLocaleString('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const animate = (el) => {
    const raw = el.dataset.countTarget.replace(/\s/g, '').replace(',', '.');
    const target = parseFloat(raw);
    const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;

    if (Number.isNaN(target)) return;

    // Пользователь отключил анимации в системе — сразу показываем итог
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = formatNumber(target, decimals);
      return;
    }

    const startTime = performance.now();

    const update = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3; // easeOutCubic

      el.textContent = formatNumber(target * eased, decimals);

      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;

        observer.unobserve(target);
        animate(target);
      });
    },
    { threshold: 0.3 }
  );

  elements.forEach((el) => observer.observe(el));
};
