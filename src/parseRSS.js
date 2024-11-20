const parseRSS = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('rssParsingError'); // Ключ ошибки для отображения
  }

  const feedTitle = doc.querySelector('channel > title').textContent;
  const feedDescription = doc.querySelector('channel > description').textContent;
  const items = [...doc.querySelectorAll('item')].map((item) => ({
    title: item.querySelector('title').textContent,
    link: item.querySelector('link').textContent,
  }));

  return {
    feed: {
      title: feedTitle,
      description: feedDescription,
    },
    posts: items,
  };
};

export default parseRSS;
