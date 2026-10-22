/**
 * Аккордеон.
 * Анимация высоты делается в CSS через grid-template-rows: 0fr → 1fr,
 * поэтому JS только переключает класс .active и aria-expanded (никаких расчётов scrollHeight).
 *
 * Разметка (BEM, имя блока любое — важны только окончания __item / __title / __content):
 * <div class="accordion" data-accordion>                 ← data-accordion-single — открыт только один пункт
 *   <div class="accordion__item">
 *     <button class="accordion__title" type="button">Заголовок <svg>…</svg></button>
 *     <div class="accordion__content">                   ← добавь .active, чтобы пункт был открыт сразу
 *       <div class="accordion__body">                    ← обязательная внутренняя обёртка (без padding)
 *         <div class="accordion__text">Контент</div>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 */
const ACTIVE_CLASS = 'active';

/** Класс заканчивается на __title (а не просто содержит его, как __title-text) */
const bemPart = (part) => `[class$="__${part}"], [class*="__${part} "]`;

const TITLE = bemPart('title');
const ITEM = bemPart('item');
const CONTENT = bemPart('content');

const getParts = (title) => {
  const item = title.closest(ITEM) || title.parentElement;
  const content = item.querySelector(CONTENT);
  const arrow = title.querySelector('svg');

  return { item, content, arrow };
};

const setState = (title, isOpen) => {
  const { item, content, arrow } = getParts(title);

  if (!content) return;

  [title, item, content, arrow].forEach((el) => el?.classList.toggle(ACTIVE_CLASS, isOpen));
  title.setAttribute('aria-expanded', String(isOpen));
};

export const useAccordion = (accordionWrapper, { single = false } = {}) => {
  if (!accordionWrapper) return;

  const titles = [...accordionWrapper.querySelectorAll(TITLE)];

  titles.forEach((title) => {
    const { content } = getParts(title);

    if (!content) return;

    content.id ||= `accordion-${Math.random().toString(36).slice(2, 9)}`;
    title.setAttribute('aria-controls', content.id);
    setState(title, content.classList.contains(ACTIVE_CLASS));
  });

  accordionWrapper.addEventListener('click', ({ target }) => {
    const title = target.closest(TITLE);

    if (!title || !titles.includes(title)) return;

    const isOpen = title.getAttribute('aria-expanded') === 'true';

    if (single && !isOpen) {
      titles.filter((other) => other !== title).forEach((other) => setState(other, false));
    }

    setState(title, !isOpen);
  });
};

/** Инициализация всех аккордеонов с атрибутом data-accordion */
export const initAccordions = (selector = '[data-accordion]') => {
  document.querySelectorAll(selector).forEach((accordion) => {
    useAccordion(accordion, { single: accordion.hasAttribute('data-accordion-single') });
  });
};
