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
        visitedPosts: new Set(),
        modal: null,
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
      console.log(`Starting update check for ${url}...`);

      const lastChecked = state.lastChecked[url] || new Date(0);
      console.log(`Last checked for ${url}: ${lastChecked}`);

      fetchRSS(url)
        .then((rssData) => parseRSS(rssData))
        .then(({ posts }) => {
          console.log(`Fetched ${posts.length} posts for ${url}`);

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

          setTimeout(() => checkForUpdates(url), 5000);
        })
        .catch((error) => {
          console.error(`Error checking updates for ${url}:`, error);
          setTimeout(() => checkForUpdates(url), 5000);
        });
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
