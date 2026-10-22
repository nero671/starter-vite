import Pristine from 'pristinejs';

const formValidation = () => {
    const config = {
        classTo: 'form-control',
        errorClass: 'form-control--error',
        successClass: 'form-control--success',
        errorTextParent: 'form-control',
        errorTextTag: 'div',
        errorTextClass: 'form-control__message',
    };

    const forms = document.querySelectorAll('.validation-form');

    if (!forms.length) return;

    Pristine.addValidator('hyphen', (value) => {
        if (value[value.length - 1] !== '-' && value[0] !== '-') return true;

        return false;
    }, 'Вы не можете ввести дефис в конец или в начало');

    Pristine.addValidator('space', (value) => {
        if (value[value.length - 1] !== ' ' && value[0] !== ' ') return true;

        return false;
    }, 'Вы не можете ввести пробел в конец или начало');

    Pristine.addValidator('custom-email', (value) => {
        // eslint-disable-next-line no-useless-escape
        const regEx = /^[-a-z0-9~!$%^&*_=+}{'?]+(\.[-a-z0-9~!$%^&*_=+}{'?]+)*@[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*\.(xn--[a-z0-9-]+|[a-z]{2,})$/i;

        if (value.match(regEx)) return true;

        return false;
    }, 'Вы можете ввести только латинские буквы, цифры, дефис, нижнее подчеркивание, точка (не первый или последний), символ "@". Например, test-8@gmail.com');

    Pristine.addValidator('only-number', (value) => {
        const regEx = /^\d+$/;

        if (value.match(regEx) || !value.length) return true;

        return false;
    }, 'Вы можете ввести только цифры');

    Pristine.addValidator('only-letters', (value) => {
        const regEx = /^[a-zA-Z а-яА-ЯЁё-]+$/;

        if (value.match(regEx) || !value.length) return true;

        return false;
    }, 'Вы можете ввести только буквы (латиница, кириллица)');

    Pristine.addValidator('letters-num-symb', (value) => {
        const regEx = /^[a-zA-Zа-яА-ЯЁё0-9\s!@#$%^&*()_+\-=,.<>?;:'"{}[\]|/\\]+$/;

        if (value.match(regEx) || !value.length) return true;

        return false;
    }, 'Вы можете ввести только буквы, цифры, символы');

    Pristine.addValidator('phone', (value) => {
        if (!(value.length < 16)) return true;

        return false;
    }, 'Введите полный телефон в соответствии с "маской"');

    Pristine.addValidator('only-number-optional', (value) => {
        const regEx = /^\d+$/;

        if (value.match(regEx) || !value.length) return true;

        return false;
    }, 'Вы можете ввести только цифры');

    Pristine.addValidator('cyrillic-space-hyphen-point-dash', (value) => {
        // eslint-disable-next-line no-useless-escape
        const regEx = /^[а-яА-ЯёЁ\- \/\.]*$/;

        if (value.match(regEx) || !value.length) return true;

        return false;
    }, 'Вы можете ввести только буквы (кириллица), пробелы, дефисы, точка, слэш');

    Pristine.addValidator('cyrillic-space-hyphen-point-dash-num', (value) => {
        // eslint-disable-next-line no-useless-escape
        const regEx = /^[а-яА-ЯёЁ0-9\- \/\.]*$/;

        if (value.match(regEx) || !value.length) return true;

        return false;
    }, 'Вы можете ввести только буквы (кириллица), цифры, пробелы, дефисы, точка, слэш');

    Pristine.addValidator('numbers-dash-slash', (value) => {
        // eslint-disable-next-line no-useless-escape
        // const regEx = /[\d\- \/\.]+/;
        const regEx = /^[0-9/-]*$/;

        if (value.match(regEx) || !value.length) return true;

        return false;
    }, 'Вы можете ввести только цифры, дефис, слэш');

    Pristine.addValidator('at-least-lower-and-upper-letter-and-digit', (value) => {
        // const regEx = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])[A-Za-z0-9]*$/;
        // const regEx = /^(?=.*[A-Z]|.*[А-ЯЁ])(?=.*[a-z]|.*[а-яё])(?=.*[0-9])[A-Za-zА-Яа-яЁё0-9]*$/;
        const regEx = /^(?=.*[A-ZА-ЯЁa-zа-яё])(?=.*[0-9])[A-Za-zА-Яа-яЁё0-9!@#$%^&*()_+{}[\]:;<>,.?~\\/\-|=]*$/;

        if (value.match(regEx)) return true;

        return false;
    }, 'Пароль должен содержать минимум одну цифру, строчную и прописную букву (латиница или кириллица)');

    function checkFormCheckBtns(form, event) {
        const inputs = form.querySelectorAll('.form-check-btn__input');

        if (!inputs.length) return;

        let isSuccess;
        const wrapper = form.querySelector('.card-block__box-wrap');

        inputs.forEach((input) => {
            if (input.checked) isSuccess = true;
        });

        if (!isSuccess) {
            event.preventDefault();

            const errorStr = "<div class='form-control__message'>Выберите один из вариантов</div>";
            const errorEl = wrapper.nextElementSibling;

            if (errorEl) errorEl.remove();

            wrapper.insertAdjacentHTML('afterend', errorStr);
        } else {
            const errorEl = wrapper.nextElementSibling;

            if (errorEl) errorEl.remove();
        }
    }

    forms.forEach((form) => {
        const pristine = new Pristine(form, config);

        form.addEventListener('submit', (event) => {
            const valid = pristine.validate();
            checkFormCheckBtns(form, event);

            if (!valid) {
                event.preventDefault();
                form.querySelector('.form-control--error')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            } else {

                form.dispatchEvent(
                    new CustomEvent('valid-form', {
                        detail: { valid: true },
                    })
                );
            }
        });
    });

};

export default formValidation;
