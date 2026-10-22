export const validation = () => {
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

    // Validation functions
    const validators = {
        customEmail: (value) => {
            const regEx = /^[-a-z0-9~!$%^&*_=+}{'?]+(\.[-a-z0-9~!$%^&*_=+}{'?]+)*@[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*\.(xn--[a-z0-9-]+|[a-z]{2,})$/i;
            return regEx.test(value);
        },
        customEmailMessage: 'Введите корректный email',

        onlyLetters: (value) => {
            const regEx = /^[a-zA-Z а-яА-ЯЁё-]+$/;
            return regEx.test(value) || !value.length;
        },
        onlyLettersMessage: 'Вы можете ввести только буквы (латиница, кириллица)',

        phone: (value) => {
            return value.length >= 19;
        },
        phoneMessage: 'Введите полный телефон в соответствии с "маской"',

        passwordMatch: (value, field) => {
            const form = field.closest('form');
            if (!form) return true;

            const passwordFields = Array.from(form.querySelectorAll('input[type="password"]'));

            const mainPasswordField = passwordFields[0];

            if (!field.hasAttribute('password-match') || !mainPasswordField) {
                return true;
            }

            const passwordsMatch = mainPasswordField.value === value;

            const confirmField = field;
            setFieldStatus(confirmField, passwordsMatch, passwordsMatch ? '' : validators.passwordMatchMessage);

            if (confirmField.value.trim() && mainPasswordField.value !== confirmField.value) {
                setFieldStatus(mainPasswordField, false, validators.passwordMatchMessage);
            } else if (mainPasswordField.value === confirmField.value || !confirmField.value.trim()) {
                setFieldStatus(mainPasswordField, true, '');
            }

            return passwordsMatch;
        },
        passwordMatchMessage: 'Пароли не совпадают',

    };

    // Function to add or remove error messages
    const setFieldStatus = (field, isValid, message) => {
        const parent = field.closest(`.${config.classTo}`);
        const existingError = parent.querySelector(`.${config.errorTextClass}`);

        if (existingError) existingError.remove();

        if (!isValid) {
            parent.classList.add(config.errorClass);
            parent.classList.remove(config.successClass);
            const errorEl = document.createElement(config.errorTextTag);
            errorEl.className = config.errorTextClass;
            errorEl.textContent = message;
            parent.appendChild(errorEl);
        } else {
            parent.classList.remove(config.errorClass);
            parent.classList.add(config.successClass);
        }
    };

    // Validate a single field
    const validateField = (field) => {
        let isValid = true;
        let errorMessage = '';

        // Check required fields
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = field.getAttribute('required-message') || 'Обязательное поле';
        } else if (field.value.trim()) {
            // Custom validators
            if (field.hasAttribute('custom-email')) {
                isValid = validators.customEmail(field.value);
                errorMessage = validators.customEmailMessage;
            }
            if (field.hasAttribute('only-letters')) {
                isValid = validators.onlyLetters(field.value);
                errorMessage = validators.onlyLettersMessage;
            }
            if (field.hasAttribute('phone')) {
                isValid = validators.phone(field.value);
                errorMessage = validators.phoneMessage;
            }
            if (field.hasAttribute('password-match')) {
                isValid = validators.passwordMatch(field.value, field);
                errorMessage = validators.passwordMatchMessage;
            }
        }

        // Checkbox validation
        if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
            isValid = false;
            errorMessage = field.getAttribute('required-message') || 'Обязательное поле';
        }

        setFieldStatus(field, isValid, errorMessage);

        if (field.type === 'password' && !field.hasAttribute('password-match')) {
            const form = field.closest('form');
            const confirmField = form.querySelector('input[type="password"][password-match]');
            if (confirmField && confirmField.value.trim()) {
                validateField(confirmField);
            }
        }

        return isValid;
    };

    // Validate all fields simultaneously
    const validateAllFields = (form) => {
        const fields = form.querySelectorAll('input[required], textarea[required]');
        let firstErrorField = null;

        // Clear all previous validation states first
        fields.forEach(field => {
            const parent = field.closest(`.${config.classTo}`);
            parent.classList.remove(config.errorClass, config.successClass);
            const existingError = parent.querySelector(`.${config.errorTextClass}`);
            if (existingError) existingError.remove();
        });

        // Validate all fields and track first error
        const results = Array.from(fields).map(field => {
            const isValid = validateField(field);
            if (!isValid && !firstErrorField) {
                firstErrorField = field;
            }
            return isValid;
        });

        const isFormValid = results.every(result => result);

        return { isFormValid, firstErrorField };
    };

    // Handle button click (not form submit)
    const handleButtonClick = (form) => {
        const submitBtn = form.querySelector('.form-btn');
        if (!submitBtn) return;

        submitBtn.addEventListener('click', (event) => {
            // Run custom validation on all fields
            const { isFormValid, firstErrorField } = validateAllFields(form);

            // Scroll to first error if form is invalid
            if (!isFormValid && firstErrorField) {
                firstErrorField.closest(`.${config.classTo}`).scrollIntoView({
                    block: 'center',
                    behavior: 'smooth'
                });
            }

            // Dispatch custom event if form is valid
            if (isFormValid) {
                form.dispatchEvent(
                    new CustomEvent('valid-form', {
                        detail: { valid: true },
                    })
                );
            }
        });
    };

    // Handle form submission to prevent submission with custom validation errors
    const handleFormSubmit = (form) => {
        form.addEventListener('submit', (event) => {
            // Run custom validation
            const { isFormValid } = validateAllFields(form);

            // Prevent form submission if custom validation fails
            if (!isFormValid) {
                event.preventDefault();
                const firstErrorField = form.querySelector('input[required]:invalid, textarea[required]:invalid') || form.querySelector('input[required], textarea[required]');
                if (firstErrorField) {
                    firstErrorField.closest(`.${config.classTo}`).scrollIntoView({
                        block: 'center',
                        behavior: 'smooth'
                    });
                }
            }
        });
    };

    // Real-time validation
    const setupRealTimeValidation = (form) => {
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach((input) => {
            ['input', 'blur'].forEach(eventType => {
                input.addEventListener(eventType, () => validateField(input));
            });
        });
    };

    // Initialize for each form
    forms.forEach((form) => {
        handleButtonClick(form);
        handleFormSubmit(form);
        setupRealTimeValidation(form);
    });
};
