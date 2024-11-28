import * as yup from 'yup';
import _ from 'lodash';
import fetchRSS from './fetchRSS.js';
import parseRSS from './parseRSS.js';
import initI18n from './i18n.js';
import { initView, resetForm, renderPosts } from './view.js';

const app = () => {
  initI18n().then((i18nInstance) => {
    console.log('i18n initialized:', i18nInstance.t('feedback.success')); // Лог инициализации

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

      console.log('Submitting URL:', url); // Лог отправки формы

      // Проверка, существует ли уже такой канал
      const existingFeed = state.feeds.find(feed => feed.url === url);
      if (existingFeed) {
        const errorMessage = i18nInstance.t('feedback.alreadyExists');
        console.log('Feed already exists:', errorMessage); // Лог ошибки, если канал уже добавлен

        // Переопределяем watchedState.form для этой ошибки
        updateFormState(errorMessage);
        return; // Прерываем выполнение, так как канал уже существует
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
          url: url,
          valid: true,
        };
    
        watchedState.feeds.push({ ...feed, id: feedId, url });
    
        if (!state.lastChecked[url]) {
          state.lastChecked[url] = new Date();
        }
    
        const newPosts = posts.map((post) => ({ ...post, id: _.uniqueId(), feedId }));
        watchedState.posts.push(...newPosts);
    
        resetForm(); // Сброс формы и фокус на input
        console.log('RSS successfully fetched and parsed'); // Лог успешной загрузки и парсинга RSS
      })
      .catch((error) => {
        let errorMessageKey;
    
        // Если ошибка это валидация пустого URL
        if (error.name === 'ValidationError' && error.errors.includes('url is a required field')) {
          errorMessageKey = 'feedback.notEmpty'; // Сообщение, если URL пустой
        } else if (error.message === 'rssParsingError') {
          errorMessageKey = 'feedback.rssParsingError'; // Ошибка парсинга RSS
        } else if (error.name === 'ValidationError') {
          errorMessageKey = 'feedback.invalidUrl'; // Ошибка валидации URL
        } else if (error.message === 'networkError') {
          errorMessageKey = 'feedback.networkError'; // Ошибка сети
        } else {
          errorMessageKey = 'feedback.unknownError'; // Неизвестная ошибка
        }
    
        updateFormState(i18nInstance.t(errorMessageKey)); // Передаем правильное сообщение
      });
    
    });

    // Функция для обновления состояния формы
    const updateFormState = (errorMessage) => {
      watchedState.form = {
        error: errorMessage,
        successMessage: null,
        url: watchedState.form.url,
        valid: false, // форма недействительна
      };
    };

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
      console.log('Starting periodic update check...');
      const updatePromises = watchedState.feeds.map((feed) => checkForUpdates(feed.url, state, watchedState));
      await Promise.all(updatePromises);
      setTimeout(startUpdateChecking, 5000);
    };

    startUpdateChecking();
  });
};

const checkForUpdates = (url, state, watchedState) => {
  const lastChecked = state.lastChecked[url] || new Date(0);

  return fetchRSS(url)
    .then((rssData) => parseRSS(rssData))
    .then(({ posts }) => {
      const newPosts = posts.filter(post => {
        const postDate = new Date(post.pubDate);
        return postDate > lastChecked;
      });

      if (newPosts.length > 0) {
        newPosts.forEach(post => {
          watchedState.posts.push({ ...post, id: _.uniqueId() });
        });
        state.lastChecked[url] = new Date();
      }
    })
    .catch(() => {}); // Ошибка при получении данных
};

export default app;

