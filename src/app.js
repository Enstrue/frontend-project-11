import * as yup from 'yup';
import initI18n from './i18n.js';
import { initView } from './view.js';

const app = () => {
  initI18n().then((i18nInstance) => {
    // Устанавливаем локализацию для yup после полной инициализации i18n
    yup.setLocale({
      string: {
        url: i18nInstance.t('feedback.invalidUrl'),
      },
      mixed: {
        required: i18nInstance.t('feedback.invalidUrl'),
        notOneOf: i18nInstance.t('feedback.alreadyExists'),
      },
    });

    // Начальное состояние
    const state = {
      feeds: [],
      form: {
        url: '',
        valid: true,
        error: null,
      },
    };

    // Схема валидации URL
    const schema = yup.object().shape({
      url: yup.string()
        .url()  // Сообщение об ошибке будет локализовано через yup.setLocale
        .required()  // Сообщение об ошибке будет локализовано через yup.setLocale
        .notOneOf(state.feeds), // Проверка на уникальность; сообщение об ошибке локализуется через yup.setLocale
    });

    // Функция валидации
    const validate = (url) => {
      return schema.validate({ url }, { context: { feeds: state.feeds } })
        .then(() => ({ isValid: true, error: null }))
        .catch((err) => ({ isValid: false, error: err.errors[0] }));
    };

    // Инициализация интерфейса (view)
    const watchedState = initView(state, i18nInstance);

    // Обработка отправки формы
    const form = document.querySelector('.rss-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const url = formData.get('url').trim();

      watchedState.form.url = url;

      validate(url)
        .then(({ isValid, error }) => {
          if (isValid) {
            watchedState.feeds.push(url); // Добавляем URL в список
            watchedState.form.url = '';
            form.reset(); // Сбрасываем форму
            form.querySelector('input').focus(); // Устанавливаем фокус
          }
          watchedState.form.valid = isValid;
          watchedState.form.error = error; // Устанавливаем ошибку
        });
    });
  });
};

export default app;
