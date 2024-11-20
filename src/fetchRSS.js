import axios from 'axios';

const fetchRSS = (url) => {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&disableCache=true`;

  return axios.get(proxyUrl)
    .then((response) => response.data.contents)
    .catch(() => {
      throw new Error('networkError'); // Ключ ошибки для отображения
    });
};

export default fetchRSS;
