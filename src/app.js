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
        visitedPosts: [],
        modal: {
          title: null,
          description: null,
          link: null,
        },
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

      schema.validate({ url })
        .then(() => fetchRSS(url))
        .then((rssData) => parseRSS(rssData))
        .then(({ feed, posts }) => {
          const feedId = _.uniqueId();
          watchedState.feeds.push({ ...feed, id: feedId, url });

          if (!state.lastChecked[url]) {
            state.lastChecked[url] = new Date();
          }

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

    const checkForUpdates = (url) => {
      const lastChecked = state.lastChecked[url] || new Date(0);

      fetchRSS(url)
        .then((rssData) => parseRSS(rssData))
        .then(({ posts }) => {
          const newPosts = posts.filter(post => {
            const postDate = new Date(post.pubDate);
            return postDate > lastChecked;
          });

          if (newPosts.length > 0) {
            const feedId = state.feeds.find(feed => feed.url === url).id;
            const enrichedPosts = newPosts.map(post => ({ ...post, id: _.uniqueId(), feedId }));

            state.posts = [...state.posts, ...enrichedPosts];
            state.lastChecked[url] = new Date();
          }

          setTimeout(() => checkForUpdates(url), 5000);
        })
        .catch(() => setTimeout(() => checkForUpdates(url), 5000));
    };

    const startUpdateChecking = () => {
      console.log("Starting periodic update check...");

      watchedState.feeds.forEach(feed => {
        checkForUpdates(feed.url);
      });
    };

    startUpdateChecking();
  });
};

export default app;
