import onChange from 'on-change';

const renderFormState = (state, i18nInstance) => {
  const input = document.querySelector('#url-input');
  const feedback = document.querySelector('.feedback');

  if (state.form.valid) {
    input.classList.remove('is-invalid');
    feedback.textContent = '';
  } else {
    input.classList.add('is-invalid');

    const errorMessage = i18nInstance.exists(state.form.error)
      ? i18nInstance.t(state.form.error)
      : state.form.error;

    feedback.textContent = errorMessage;
  }
};

const renderFeeds = (feeds) => {
  const feedsContainer = document.querySelector('.feeds');
  feedsContainer.innerHTML = ''; // Очищаем перед добавлением

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

const renderPosts = (posts, state) => {
  const postsContainer = document.querySelector('.posts');
  postsContainer.innerHTML = ''; // Очищаем перед добавлением

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

    postLink.addEventListener('click', () => {
      if (!state.uiState.visitedPosts.includes(post.id)) {
        state.uiState.visitedPosts = [...state.uiState.visitedPosts, post.id];
      }
    });

    const postButton = document.createElement('button');
    postButton.textContent = 'Просмотр';
    postButton.type = 'button';
    postButton.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    postButton.dataset.id = post.id;

    postButton.addEventListener('click', () => {
      if (!state.uiState.visitedPosts.includes(post.id)) {
        state.uiState.visitedPosts = [...state.uiState.visitedPosts, post.id];
      }

      state.uiState.modal = {
        title: post.title,
        description: post.description,
        link: post.link,
      };
      renderModal(state.uiState.modal);
    });

    postItem.append(postLink, postButton);
    postList.appendChild(postItem);
  });

  postsContainer.appendChild(postList);
};



const renderModal = (modal) => {
  const modalElement = document.querySelector('#modal');
  const modalTitle = modalElement.querySelector('.modal-title');
  const modalBody = modalElement.querySelector('.modal-body');
  const modalFullArticle = modalElement.querySelector('.full-article');

  // Устанавливаем содержимое модального окна
  modalTitle.textContent = modal.title;
  modalBody.textContent = modal.description;
  modalFullArticle.href = modal.link;

  // Открываем модальное окно
  const bootstrapModal = new bootstrap.Modal(modalElement); // Создаём инстанс модального окна
  bootstrapModal.show(); // Показываем окно
};


export const initView = (state, i18nInstance) => {
  const watchedState = onChange(state, (path, value) => {
    if (path.startsWith('form')) {
      renderFormState(state, i18nInstance);
    }
    if (path === 'feeds') {
      renderFeeds(state.feeds);
    }
    if (path === 'posts') {
      renderPosts(state.posts, state);
    }
    if (path === 'uiState.modal') {
      renderModal(state.uiState.modal);
    }
    if (path === 'uiState.visitedPosts') {
      renderPosts(state.posts, state);
    }    
  });

  return watchedState;
};
