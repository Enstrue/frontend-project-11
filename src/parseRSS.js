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
    description: item.querySelector('description')?.textContent || '', // Описание поста
  }));

  return {
    feed: {
      title: feedTitle,
      description: feedDescription,
    },
    posts: items,
  };
};

const checkForUpdates = (url) => {
  const lastChecked = state.lastChecked[url] || new Date(0);

  fetchRSS(url)
    .then((rssData) => parseRSS(rssData))
    .then(({ posts }) => {
      const newPosts = posts.filter(post => {
        const postDate = new Date(post.pubDate);
        return postDate > lastChecked;
      });

      if (newPosts.length > 0) {
        newPosts.forEach(post => {
          watchedState.posts.push({ ...post, id: _.uniqueId() });
        });
        state.lastChecked[url] = new Date();
      }

      setTimeout(() => checkForUpdates(url), 5000);
    })
    .catch(() => setTimeout(() => checkForUpdates(url), 5000));
};

export default parseRSS;
