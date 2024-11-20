import * as yup from 'yup';
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

          const newPosts = posts.map((post) => ({ ...post, id: _.uniqueId(), feedId }));
          watchedState.posts.push(...newPosts);

          watchedState.form.valid = true;
          watchedState.form.error = null;

          form.reset();
          form.querySelector('input').focus();
        })
        .catch((error) => {
          watchedState.form.valid = false;
          watchedState.form.error = error.message;
        });
    });
  });
};

export default app;