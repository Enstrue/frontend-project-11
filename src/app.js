import * as yup from 'yup';
import _ from 'lodash';
import fetchRSS from './fetchRSS.js';
import parseRSS from './parseRSS.js';
import initI18n from './i18n.js';
import { initView } from './view.js';

const app = () => {
  initI18n().then((i18nInstance) => {
    yup.setLocale({
      string: {
        url: i18nInstance.t('feedback.invalidUrl'),
      },
      mixed: {
        required: i18nInstance.t('feedback.invalidUrl'),
        notOneOf: i18nInstance.t('feedback.alreadyExists'),
      },
    });

    const state = {
      feeds: [],
      posts: [],
      form: {
        url: '',
        valid: true,
        error: null,
      },
      uiState: {
        visitedPosts: new Set(),  // Множество для отслеживания посещённых постов
        modal: null,
      },
      lastChecked: {}  // Храним информацию о последней проверке каждого потока
    };

    const schema = yup.object().shape({
      url: yup.string().url().required().notOneOf(state.feeds.map((feed) => feed.url)),
    });

    const watchedState = initView(state, i18nInstance);

    const form = document.querySelector('.rss-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const url = formData.get('url').trim();

      watchedState.form.url = url;

      schema.validate({ url })
        .then(() => fetchRSS(url))
        .then((rssData) => parseRSS(rssData))
        .then(({ feed, posts }) => {
          const feedId = _.uniqueId();
          watchedState.feeds.push({ ...feed, id: feedId, url });

          // Добавляем новые посты
          const newPosts = posts.map((post) => ({ ...post, id: _.uniqueId(), feedId }));
          watchedState.posts.push(...newPosts);

          watchedState.form.valid = true;
          watchedState.form.error = null;

          form.reset();
          form.querySelector('input').focus();
        })
        .catch((error) => {
          watchedState.form.valid = false;
          watchedState.form.error = i18nInstance.t(`feedback.${error}`);
        });
    });

    // Функция для проверки обновлений RSS
    const checkForUpdates = (url) => {
      fetchRSS(url)
        .then((rssData) => parseRSS(rssData))
        .then(({ posts }) => {
          const lastChecked = state.lastChecked[url] || new Date(0);  // Если нет времени последней проверки, то начинаем с самой старой даты
          const newPosts = posts.filter(post => new Date(post.pubDate) > lastChecked);

          if (newPosts.length > 0) {
            // Добавляем новые посты в список
            newPosts.forEach(post => {
              watchedState.posts.push({ ...post, id: _.uniqueId() });
            });

            // Обновляем информацию о последней проверке
            state.lastChecked[url] = new Date();
          }
        })
        .catch((error) => console.error(`Error checking updates for ${url}:`, error));
    };

    // Периодическая проверка всех добавленных RSS
    const startUpdateChecking = () => {
      state.feeds.forEach((feed) => {
        checkForUpdates(feed.url);
      });

      // Проверяем снова через 5 секунд
      setTimeout(startUpdateChecking, 5000);
    };

    // Запускаем периодическую проверку обновлений
    startUpdateChecking();
  });
};

export default app;
