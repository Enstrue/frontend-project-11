import onChange from 'on-change';

const renderFormState = (state, i18nInstance) => {
  const input = document.querySelector('#url-input');
  const feedback = document.querySelector('.feedback');

  if (state.form.valid) {
    input.classList.remove('is-invalid');
    feedback.textContent = '';
  } else {
    input.classList.add('is-invalid');

    // Предполагаем, что state.form.error содержит ключ перевода
    const errorMessage = i18nInstance.exists(state.form.error)
      ? i18nInstance.t(state.form.error)
      : state.form.error; // Если ключ перевода не найден, показываем текст ошибки

    feedback.textContent = errorMessage;
  }
};

export const initView = (state, i18nInstance) => {
  return onChange(state, (path) => {
    if (path.startsWith('form')) {
      renderFormState(state, i18nInstance);
    }
  });
};
