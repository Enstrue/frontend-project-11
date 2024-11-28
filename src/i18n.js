import i18next from 'i18next';
import ru from './locales/ru.js';

const initI18n = () => {
  const i18nInstance = i18next.createInstance(); // Создаем новый экземпляр i18next

  return i18nInstance
    .init({
      resources: {
        ru,
      },
      lng: 'ru', // Устанавливаем язык по умолчанию
      fallbackLng: 'ru', // Устанавливаем язык по умолчанию, если выбранный не доступен
      debug: true,
      interpolation: {
        escapeValue: false,
      },
    })
    .then(() => i18nInstance);
};

export default initI18n;
