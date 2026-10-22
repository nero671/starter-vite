/**
 * Выпадающий список.
 * Клик по .js-dropdown открывает/закрывает его, клик вне или Escape — закрывает все.
 */
const ACTIVE_CLASS = 'active';

const closeAll = (except) => {
    document.querySelectorAll(`.js-dropdown.${ACTIVE_CLASS}`).forEach((dropdown) => {
        if (dropdown === except) return;

        dropdown.classList.remove(ACTIVE_CLASS);
        dropdown.setAttribute('aria-expanded', 'false');
    });
};

export const dropdown = () => {
    document.querySelectorAll('.js-dropdown').forEach((dropdown) => {
        dropdown.setAttribute('aria-expanded', String(dropdown.classList.contains(ACTIVE_CLASS)));
    });

    document.addEventListener('click', (e) => {
        const dropdown = e.target.closest('.js-dropdown');

        closeAll(dropdown);

        if (dropdown && !e.target.closest('.js-dropdown__option')) {
            const isActive = dropdown.classList.toggle(ACTIVE_CLASS);

            dropdown.setAttribute('aria-expanded', String(isActive));
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll();

        // Открытие с клавиатуры (у .js-dropdown стоит role="button" и tabindex="0")
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('js-dropdown')) {
            e.preventDefault();
            e.target.click();
        }
    });
};
