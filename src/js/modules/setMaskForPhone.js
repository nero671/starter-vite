import IMask from 'imask';

const setMaskForPhone = () => {
  const phones = document.querySelectorAll('.phone-mask');

  if (!phones.length) return;

  phones.forEach((phone) => {
    IMask(phone, {
      mask: '+{7}(000)000-00-00',
    });
  });
};

export default setMaskForPhone;
