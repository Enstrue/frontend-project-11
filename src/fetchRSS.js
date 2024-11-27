import axios from 'axios';

const fetchRSS = (url) => {
  const proxyUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${url}`;

  return axios.get(proxyUrl)
    .then((response) => {
      console.log('RSS data fetched successfully'); // Лог успешного получения RSS данных
      return response.data.contents;
    })
    .catch((error) => {
      console.error('Network error:', error); // Лог сетевой ошибки
      throw new Error('networkError'); // Ключ ошибки для отображения
    });
};

export default fetchRSS;
