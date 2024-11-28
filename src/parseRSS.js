const parseRSS = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    console.error('RSS parsing error:', parseError.textContent); // Лог ошибки парсинга RSS
    throw new Error('rssParsingError'); // Бросаем ошибку с текстом 'rssParsingError'
  }

  const feedTitle = doc.querySelector('channel > title').textContent;
  const feedDescription = doc.querySelector('channel > description').textContent;
  const items = [...doc.querySelectorAll('item')].map((item) => ({
    title: item.querySelector('title').textContent,
    link: item.querySelector('link').textContent,
    description: item.querySelector('description')?.textContent || '',
  }));

  console.log('RSS parsed successfully:', feedTitle); // Лог успешного парсинга RSS

  return {
    feed: {
      title: feedTitle,
      description: feedDescription,
    },
    posts: items,
  };
};

export default parseRSS;
