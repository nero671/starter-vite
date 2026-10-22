import Popup from './Popup.js';

class BurgerMenu extends Popup {
  constructor() {
    super();

    this.burgerButton = document.querySelector('.icon-menu');
  }

  /**
   * Initialize the menu functionality.
   */
  init() {
    if (!this.burgerButton) return;

    this.burgerButton.setAttribute('aria-expanded', 'false');

    document.addEventListener('click', ({ target }) => {
      if (target.closest('.icon-menu')) {
        this.html.classList.contains('menu-open') ? this.menuClose() : this.menuOpen();
      }
    });

    // Закрытие по клавише Escape
    document.addEventListener('keydown', ({ key }) => {
      if (key === 'Escape' && this.html.classList.contains('menu-open')) {
        this.menuClose();
      }
    });
  }

  /**
   * Open the menu.
   */
  menuOpen() {
    this.toggleBodyLock(true);
    this.html.classList.add('menu-open');
    this.burgerButton?.setAttribute('aria-expanded', 'true');
  }

  /**
   * Close the menu.
   */
  menuClose() {
    this.toggleBodyLock(false);
    this.html.classList.remove('menu-open');
    this.burgerButton?.setAttribute('aria-expanded', 'false');
  }
}

export default BurgerMenu;
