import * as bootstrap from 'bootstrap';
import * as yup from 'yup';
import _ from 'lodash';
import fetchRSS from './fetchRSS.js';
import parseRSS from './parseRSS.js';
import initI18n from './i18n.js';
import { initView, resetForm, renderPosts } from './view.js';

const app = () => {
  initI18n().then((i18nInstance) => {
    yup.setLocale({
      string: {
        url: i18nInstance.t('feedback.invalidUrl'),
      },
      mixed: {
        required: i18nInstance.t('feedback.notEmpty'),
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
        successMessage: null,
      },
      uiState: {
        visitedPosts: [],
        modal: {},
      },
      lastChecked: {},
    };
    const watchedState = initView(state, i18nInstance);

    const updateFormState = (errorMessage) => {
      watchedState.form = {
        error: errorMessage,
        successMessage: null,
        url: watchedState.form.url,
        valid: false,
      };
    };

    const schema = yup.object().shape({
      url: yup.string().url().required().notOneOf(state.feeds.map((feed) => feed.url)),
    });

    const checkForUpdates = (url, stateParam, localWatchedState) => {
      const lastChecked = stateParam.lastChecked[url] || new Date(0);

      return fetchRSS(url)
        .then((rssData) => parseRSS(rssData))
        .then(({ posts }) => {
          const newPosts = posts.filter((post) => {
            const postDate = new Date(post.pubDate);
            return postDate > lastChecked;
          });

          if (newPosts.length > 0) {
            newPosts.forEach((post) => {
              localWatchedState.posts.push({ ...post, id: _.uniqueId() });
            });

            const updatedState = { ...state };
            updatedState.lastChecked[url] = new Date();
            return updatedState; // Возвращаем обновленное состояние
          }

          return null; // Если новых постов нет, можно вернуть null или пустой объект
        })
        .catch(() => {}); // Ошибка при получении данных
    };

    const form = document.querySelector('.rss-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const url = formData.get('url').trim();
      watchedState.form.url = url;

      // Проверка на наличие дублирующего URL
      const isUrlExist = state.feeds.some((feed) => feed.url === url);
      if (isUrlExist) {
        updateFormState(i18nInstance.t('feedback.alreadyExists')); // Сообщение об ошибке
        return; // Выход из функции, если URL уже существует
      }

      schema
        .validate({ url })
        .then(() => fetchRSS(url))
        .then((rssData) => {
          const { feed, posts } = parseRSS(rssData);
          const feedId = _.uniqueId();

          watchedState.form = {
            error: null,
            successMessage: i18nInstance.t('feedback.success'),
            url,
            valid: true,
          };

          watchedState.feeds.push({ ...feed, id: feedId, url });

          if (!state.lastChecked[url]) {
            state.lastChecked[url] = new Date();
          }

          const newPosts = posts.map((post) => ({ ...post, id: _.uniqueId(), feedId }));
          watchedState.posts.push(...newPosts);

          resetForm();
        })
        .catch((error) => {
          let errorMessageKey;

          if (error.name === 'ValidationError' && error.errors.includes('url is a required field')) {
            errorMessageKey = 'feedback.notEmpty';
          } else if (error.message === 'rssParsingError') {
            errorMessageKey = 'feedback.rssParsingError';
          } else if (error.name === 'ValidationError') {
            errorMessageKey = 'feedback.invalidUrl';
          } else if (error.message === 'networkError') {
            errorMessageKey = 'feedback.networkError';
          } else {
            errorMessageKey = 'feedback.unknownError';
          }

          updateFormState(i18nInstance.t(errorMessageKey));
        });
    });

    const postsContainer = document.querySelector('.posts');
    postsContainer.addEventListener('click', (e) => {
      const postId = e.target.dataset.id;
      if (!postId) return;

      const post = watchedState.posts.find((p) => p.id === postId);

      if (e.target.tagName === 'A') {
        watchedState.uiState.modal = {
          title: post.title,
          description: post.description,
          link: post.link,
        };

        if (!watchedState.uiState.visitedPosts.includes(post.id)) {
          watchedState.uiState.visitedPosts = [...watchedState.uiState.visitedPosts, post.id];
          renderPosts(watchedState.posts, watchedState);
        }
      }

      if (e.target.tagName === 'BUTTON') {
        watchedState.uiState.modal = {
          title: post.title,
          description: post.description,
          link: post.link,
        };

        if (!watchedState.uiState.visitedPosts.includes(post.id)) {
          watchedState.uiState.visitedPosts = [...watchedState.uiState.visitedPosts, post.id];
          renderPosts(watchedState.posts, watchedState);
        }

        const modalElement = document.querySelector('#modal');
        const modalInstance = new bootstrap.Modal(modalElement);
        modalInstance.show();
      }
    });

    const startUpdateChecking = async () => {
      const checkUpdatesForFeed = (feed) => checkForUpdates(feed.url, state, watchedState);
      const updatePromises = watchedState.feeds.map(checkUpdatesForFeed);
      await Promise.all(updatePromises);
      setTimeout(() => {
        startUpdateChecking();
      }, 5000);
    };

    startUpdateChecking();
  });
};

export default app;
