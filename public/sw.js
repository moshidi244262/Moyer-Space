const CACHE_NAME = 'moyer-space-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/lib/tailwind.js',
  '/lib/react.js',
  '/lib/react-dom.js',
  '/lib/framer-motion.js',
  '/manifest.json'
];

// 安装并缓存核心文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  // 【重要】遇到 /api/ 请求直接放行，绝对不能缓存后端密码验证接口
  if (event.request.url.includes('/api/')) {
    return;
  }

  // 静态资源：优先使用缓存，如果没有再请求网络
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});