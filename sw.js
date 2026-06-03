/**
 * NEPAL DRIVING LICENSE MCQ - SERVICE WORKER
 * Enables offline functionality
 */

const CACHE_NAME = 'dl-nepal-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/quiz.html',
  '/results.html',
  '/questions.html',
  '/signs.html',
  '/history.html',
  '/css/style.css',
  '/js/utils.js',
  '/js/quiz.js',
  '/js/history.js',
  '/data/questions.json',
  '/blog/index.html',
  '/blog/how-to-apply-driving-license-nepal.html',
  '/blog/traffic-rules-nepal-complete-guide.html',
  '/blog/driving-license-requirements-nepal-2026.html'
];

// Install event - cache all files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        // Make network request
        return fetch(fetchRequest).then((response) => {
          // Check for valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Add to cache
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
      .catch(() => {
        // Offline - return cached version or offline page
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      })
  );
});