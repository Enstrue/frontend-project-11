import onChange from 'on-change';

const renderFormState = (state) => {
  const input = document.querySelector('#url-input');
  const feedback = document.querySelector('.feedback');
  
  if (state.form.valid) {
    input.classList.remove('is-invalid');
    feedback.textContent = '';
  } else {
    input.classList.add('is-invalid');
    feedback.textContent = state.form.error;
  }
};

export const initView = (state) => {
  // Создаем вотчер для слежения за изменениями в состоянии и обновления интерфейса
  return onChange(state, (path, value) => {
    if (path.startsWith('form')) {
      renderFormState(state);
    }
    // Вы можете добавить другие условия для слежения за изменениями в других частях состояния
  });
};
