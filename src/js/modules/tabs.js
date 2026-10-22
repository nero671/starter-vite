/**
 * Табы.
 *
 * Вариант 1 — по data-атрибутам (разметка: src/html/components/tabs/tabs.html):
 *   initTabs();
 *
 * Вариант 2 — вручную, как раньше:
 *   tabs(document.querySelector('.tabs__nav'), document.querySelectorAll('.tabs__btn'), document.querySelectorAll('.tabs__panel'));
 *
 * Активная кнопка получает класс .show, активная панель — .active.
 * Управление с клавиатуры: ← / → / Home / End.
 */
const BUTTON_ACTIVE = 'show';
const PANEL_ACTIVE = 'active';

export const tabs = (linkWrapper, link, content) => {
  if (!linkWrapper) return;

  const buttons = [...link];
  const panels = [...content];

  const toggleTab = (index, { focus = false } = {}) => {
    buttons.forEach((button, i) => {
      const isActive = i === index;

      button.classList.toggle(BUTTON_ACTIVE, isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
      panels[i]?.classList.toggle(PANEL_ACTIVE, isActive);

      if (panels[i]) panels[i].hidden = !isActive;
      if (isActive && focus) button.focus();
    });
  };

  linkWrapper.setAttribute('role', 'tablist');

  buttons.forEach((button, i) => {
    const panel = panels[i];
    const id = `tab-${Math.random().toString(36).slice(2, 9)}`;

    button.setAttribute('role', 'tab');
    button.id ||= `${id}-btn`;

    if (panel) {
      panel.setAttribute('role', 'tabpanel');
      panel.id ||= `${id}-panel`;
      panel.setAttribute('aria-labelledby', button.id);
      button.setAttribute('aria-controls', panel.id);
    }
  });

  const initialIndex = Math.max(buttons.findIndex((button) => button.classList.contains(BUTTON_ACTIVE)), 0);
  toggleTab(initialIndex);

  linkWrapper.addEventListener('click', ({ target }) => {
    const index = buttons.findIndex((button) => button.contains(target));

    if (index !== -1) toggleTab(index);
  });

  linkWrapper.addEventListener('keydown', (e) => {
    const current = buttons.findIndex((button) => button === document.activeElement);

    if (current === -1) return;

    const keys = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      Home: 0,
      End: buttons.length - 1,
    };

    if (!(e.key in keys)) return;

    e.preventDefault();
    toggleTab((keys[e.key] + buttons.length) % buttons.length, { focus: true });
  });
}

/**
 * Инициализация всех табов по атрибутам:
 * [data-tabs] > [data-tabs-nav] > [data-tabs-button]  и  [data-tabs-panel]
 */
export const initTabs = (selector = '[data-tabs]') => {
  document.querySelectorAll(selector).forEach((container) => {
    tabs(
      container.querySelector('[data-tabs-nav]'),
      container.querySelectorAll('[data-tabs-button]'),
      container.querySelectorAll('[data-tabs-panel]')
    );
  });
};
