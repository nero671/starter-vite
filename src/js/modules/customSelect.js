/**
 * Кастомный select поверх нативного <select> (значение всегда синхронизировано с ним,
 * поэтому форма отправляется как обычно).
 * Управление с клавиатуры: Enter/Пробел — открыть/выбрать, ↑/↓ — навигация, Escape — закрыть.
 */
const OPEN_CLASS = 'open';
const SELECTED_CLASS = 'is-selected';
const FOCUSED_CLASS = 'is-focused';

const closeAll = (except) => {
    document.querySelectorAll(`.custom-select.${OPEN_CLASS}`).forEach((select) => {
        if (select === except) return;

        select.classList.remove(OPEN_CLASS);
        select.querySelector('.custom-select__selected')?.setAttribute('aria-expanded', 'false');
    });
};

export const customSelect = () => {
    const initSelect = (wrapper) => {
        const nativeSelect = wrapper.querySelector('select');
        const customSelect = wrapper.querySelector('.custom-select');

        if (!nativeSelect || !customSelect) return;

        const listId = `custom-select-${Math.random().toString(36).slice(2, 9)}`;

        const selected = document.createElement('div');
        selected.className = 'custom-select__selected';
        selected.tabIndex = 0;
        selected.setAttribute('role', 'combobox');
        selected.setAttribute('aria-haspopup', 'listbox');
        selected.setAttribute('aria-expanded', 'false');
        selected.setAttribute('aria-controls', listId);
        selected.textContent = nativeSelect.options[nativeSelect.selectedIndex]?.textContent || 'Выбрать';

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-select__options';
        optionsContainer.id = listId;
        optionsContainer.setAttribute('role', 'listbox');

        const customOptions = [...nativeSelect.options]
            .filter((option) => option.value)
            .map((option) => {
                const customOption = document.createElement('div');
                customOption.className = 'custom-select__option';
                customOption.textContent = option.textContent;
                customOption.dataset.value = option.value;
                customOption.setAttribute('role', 'option');
                customOption.setAttribute('aria-selected', String(option.selected && nativeSelect.value === option.value));
                optionsContainer.appendChild(customOption);

                return customOption;
            });

        let focusedIndex = -1;

        const setOpen = (isOpen) => {
            if (isOpen) closeAll(customSelect);

            customSelect.classList.toggle(OPEN_CLASS, isOpen);
            selected.setAttribute('aria-expanded', String(isOpen));
        };

        const focusOption = (index) => {
            focusedIndex = (index + customOptions.length) % customOptions.length;
            customOptions.forEach((option, i) => option.classList.toggle(FOCUSED_CLASS, i === focusedIndex));
            customOptions[focusedIndex]?.scrollIntoView({ block: 'nearest' });
        };

        const choose = (customOption) => {
            selected.textContent = customOption.textContent;
            nativeSelect.value = customOption.dataset.value;
            nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));

            customOptions.forEach((option) => {
                const isSelected = option === customOption;

                option.classList.toggle(SELECTED_CLASS, isSelected);
                option.setAttribute('aria-selected', String(isSelected));
            });

            setOpen(false);
            selected.focus();
        };

        selected.addEventListener('click', () => setOpen(!customSelect.classList.contains(OPEN_CLASS)));

        optionsContainer.addEventListener('click', (e) => {
            const customOption = e.target.closest('.custom-select__option');

            if (customOption) choose(customOption);
        });

        selected.addEventListener('keydown', (e) => {
            const isOpen = customSelect.classList.contains(OPEN_CLASS);

            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();

                    if (isOpen && customOptions[focusedIndex]) {
                        choose(customOptions[focusedIndex]);
                    } else {
                        setOpen(!isOpen);
                    }
                    break;
                case 'ArrowDown':
                case 'ArrowUp':
                    e.preventDefault();
                    setOpen(true);
                    focusOption(focusedIndex + (e.key === 'ArrowDown' ? 1 : -1));
                    break;
                case 'Escape':
                case 'Tab':
                    setOpen(false);
                    break;
                default:
                    break;
            }
        });

        customSelect.innerHTML = '';
        customSelect.appendChild(selected);
        customSelect.appendChild(optionsContainer);
    };

    document.querySelectorAll('.custom-select-wrapper').forEach(initSelect);

    // Клик вне селекта закрывает все открытые
    document.addEventListener('click', (e) => {
        closeAll(e.target.closest('.custom-select'));
    });
};
