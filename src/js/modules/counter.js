/**
 * Счётчик количества (+ / -).
 * Ограничения задаются атрибутами: <div class="counter" data-min="1" data-max="99">
 * При изменении значения на input отправляется событие change.
 */
export const counter = () => {
    document.querySelectorAll('.counter').forEach((counterNode) => {
        const minusButton = counterNode.querySelector('.minus');
        const plusButton = counterNode.querySelector('.plus');
        const countInput = counterNode.querySelector('.count');

        if (!minusButton || !plusButton || !countInput) return;

        const min = Number(counterNode.dataset.min ?? 1);
        const max = Number(counterNode.dataset.max ?? Infinity);

        const updateButtonsState = () => {
            const value = Number(countInput.value);

            minusButton.disabled = value <= min;
            plusButton.disabled = value >= max;
        };

        const setValue = (value) => {
            countInput.value = Math.min(Math.max(value, min), max);
            countInput.dispatchEvent(new Event('change', { bubbles: true }));
            updateButtonsState();
        };

        minusButton.addEventListener('click', () => setValue(Number(countInput.value) - 1));
        plusButton.addEventListener('click', () => setValue(Number(countInput.value) + 1));

        updateButtonsState();
    });
}
