import toggleBodyLock from '../helpers/toggleBodyLock.js';

class Popup {
  constructor() {
    this.html = document.documentElement;
    this.body = document.body;
    this.pageWrapper = document.querySelector('.page');
    this.lockPaddingElements = document.querySelectorAll('[data-lp]');
  }

  /**
   * Toggle body lock to prevent scrolling.
   * @param {boolean} isLock - Indicates whether to lock the body or unlock it.
   */
  toggleBodyLock(isLock) {
    toggleBodyLock(isLock);
  }
}

export default Popup;
