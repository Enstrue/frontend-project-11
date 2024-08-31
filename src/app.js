import * as yup from "yup";
import { initView } from "./view.js";

const app = () => {
  // Схема валидации с использованием yup
  const schema = yup.object().shape({
    url: yup
      .string()
      .url("Некорректный URL")
      .required("URL обязателен для заполнения")
      .test("is-unique", "Этот URL уже добавлен", function (value) {
        const { feeds } = this.options.context;
        return !feeds.includes(value);
      }),
  });

  // Начальное состояние
  const state = {
    feeds: [],
    form: {
      url: "",
      valid: true,
      error: null,
    },
  };

  // Функция для валидации URL
  const validate = (url, feeds) => {
    return schema
      .validate({ url }, { context: { feeds } })
      .then(() => ({ isValid: true, error: null }))
      .catch((err) => ({ isValid: false, error: err.errors[0] }));
  };

  // Инициализация вотчеров и интерфейса
  const watchedState = initView(state);

  const form = document.querySelector(".rss-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const url = formData.get("url").trim();

    watchedState.form.url = url;

    validate(url, watchedState.feeds).then(({ isValid, error }) => {
      if (isValid) {
        watchedState.feeds.push(url);
        watchedState.form.url = "";
        form.reset();
        form.querySelector("input").focus();
      }
      watchedState.form.valid = isValid;
      watchedState.form.error = error;
    });
  });
};
export default app;
