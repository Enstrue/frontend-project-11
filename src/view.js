import onChange from "on-change";

const renderFormState = (state, i18nInstance) => {
  const input = document.querySelector('#url-input');
  const feedback = document.querySelector('.feedback');

  feedback.textContent = '';
  feedback.classList.remove('text-success', 'text-danger');

  if (state.form.valid) {
    input.classList.remove('is-invalid');
  } else {
    input.classList.add('is-invalid');
  }

  if (state.form.error) {
    feedback.classList.add('text-danger');
    feedback.textContent = i18nInstance.exists(state.form.error)
      ? i18nInstance.t(state.form.error)
      : state.form.error;
    console.log('Error message:', feedback.textContent); // Лог для проверки ошибки
  }

  if (state.form.successMessage) {
    feedback.classList.add('text-success');
    feedback.textContent = state.form.successMessage;
    console.log('Success message:', feedback.textContent); // Лог для проверки успеха
  }
  console.log('Form state:', state.form); // Лог состояния формы
};


const renderFeeds = (feeds) => {
  const feedsContainer = document.querySelector('.feeds');
  feedsContainer.innerHTML = '';

  if (feeds.length === 0) return;

  const feedsTitle = document.createElement('h2');
  feedsTitle.textContent = 'Фиды';
  feedsContainer.appendChild(feedsTitle);

  const feedList = document.createElement('ul');
  feedList.classList.add('list-group', 'mb-5');

  feeds.forEach(({ title, description }) => {
    const feedItem = document.createElement('li');
    feedItem.classList.add('list-group-item');

    const feedTitle = document.createElement('h3');
    feedTitle.textContent = title;

    const feedDescription = document.createElement('p');
    feedDescription.textContent = description;

    feedItem.append(feedTitle, feedDescription);
    feedList.appendChild(feedItem);
  });

  feedsContainer.appendChild(feedList);
};

export const renderPosts = (posts, state) => {
  const postsContainer = document.querySelector('.posts');
  postsContainer.innerHTML = '';

  if (posts.length === 0) return;

  const postsTitle = document.createElement('h2');
  postsTitle.textContent = 'Посты';
  postsContainer.appendChild(postsTitle);

  const postList = document.createElement('ul');
  postList.classList.add('list-group');

  posts.forEach((post) => {
    const postItem = document.createElement('li');
    postItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');

    const postLink = document.createElement('a');
    postLink.href = post.link;
    postLink.textContent = post.title;
    postLink.target = '_blank';
    postLink.rel = 'noopener noreferrer';
    postLink.classList.toggle('fw-bold', !state.uiState.visitedPosts.includes(post.id));
    postLink.classList.toggle('fw-normal', state.uiState.visitedPosts.includes(post.id));
    postLink.dataset.id = post.id;

    const postButton = document.createElement('button');
    postButton.textContent = 'Просмотр';
    postButton.type = 'button';
    postButton.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    postButton.dataset.id = post.id;

    postItem.append(postLink, postButton);
    postList.appendChild(postItem);
  });

  postsContainer.appendChild(postList);
};

const renderModal = (modal) => {
  const modalElement = document.querySelector('#modal');
  const modalTitle = modalElement.querySelector('.modal-title');
  const modalBody = modalElement.querySelector('.modal-body');
  const modalLink = modalElement.querySelector('.full-article');

  modalTitle.textContent = modal.title;
  modalBody.textContent = modal.description;
  modalLink.href = modal.link;
};

export const initView = (state, i18nInstance) => {
  const watchedState = onChange(state, (path) => {
    console.log('State change detected at path:', path); // Лог изменений состояния
    
    switch(path) {
      case 'form':
        renderFormState(watchedState, i18nInstance);
      case 'feeds':
        renderFeeds(watchedState.feeds);
      case 'posts':
        renderPosts(watchedState.posts, watchedState);
      case 'uiState.modal':
        renderModal(watchedState.uiState.modal);
      default:
        return;
    }
  });
 
  return watchedState;
};

export const resetForm = () => {
  const form = document.querySelector('.rss-form');
  form.reset();
  form.querySelector('input').focus(); // Сфокусироваться на input после отправки
  console.log('Form reset and input focused'); // Лог сброса формы
};
