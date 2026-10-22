/** Максимальная длина имени файла (без расширения), остальное обрезается */
const MAX_NAME_LENGTH = 20;

const shortenFileName = (fileName) => {
    const dotIndex = fileName.lastIndexOf('.');

    if (dotIndex <= MAX_NAME_LENGTH) return fileName;

    return `${fileName.slice(0, MAX_NAME_LENGTH)}…${fileName.slice(dotIndex)}`;
};

export const customFile = () => {
    document.querySelectorAll('.custom-file-input').forEach((input) => {
        const fileLabel = input.closest('.custom-file')?.querySelector('.custom-file-label span');

        if (!fileLabel) return;

        const defaultText = fileLabel.innerHTML;

        input.addEventListener('change', () => {
            const { files } = input;

            if (!files.length) {
                fileLabel.innerHTML = defaultText;
                return;
            }

            fileLabel.textContent =
                files.length > 1 ? `Выбрано файлов: ${files.length}` : shortenFileName(files[0].name);
        });
    });
}
