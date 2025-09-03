// ApplyTrak Enhanced Service Worker
const CACHE_VERSION = 'applytrak-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico',
  '/favicon.svg'
];

// API endpoints that should be cached
const API_ENDPOINTS = [
  '/api/',
  '/supabase/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  // Silent service worker installation
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        // Silent asset caching
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Silent cache completion
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  // Silent service worker activation
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              // Silent old cache deletion
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Silent service worker activation complete
        return self.clients.claim();
      })
  );
});

// Enhanced fetch event with comprehensive caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
  } else if (isApiRequest(request)) {
    event.respondWith(networkFirst(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(navigationHandler(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache strategies
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return new Response('Offline - Resource not available', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline - API not available', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

async function navigationHandler(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match('/');
    return cachedResponse || new Response('Offline - App not available', { status: 503 });
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Background Sync for offline data
self.addEventListener('sync', (event) => {
  // Silent background sync trigger
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  } else if (event.tag === 'sync-applications') {
    event.waitUntil(syncApplications());
  } else if (event.tag === 'sync-goals') {
    event.waitUntil(syncGoals());
  }
});

// Background sync implementation
async function doBackgroundSync() {
  try {
    // Silent background sync start
    
    // Check if we're online
    if (!navigator.onLine) {
      // Silent offline skip
      return;
    }

    // Sync applications
    await syncApplications();
    
    // Sync goals
    await syncGoals();
    
    // Notify clients that sync completed
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        timestamp: Date.now()
      });
    });
    
    // Silent background sync completion
  } catch (error) {
    console.error('Background sync failed:', error);
    
    // Notify clients of sync failure
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_FAILED',
        error: error.message,
        timestamp: Date.now()
      });
    });
  }
}

// Sync applications data
async function syncApplications() {
  try {
    // Get pending applications from IndexedDB
    const pendingData = await getPendingSyncData('applications');
    
    if (pendingData.length === 0) {
      console.log('No pending applications to sync');
      return;
    }

    console.log(`Syncing ${pendingData.length} pending applications`);
    
    // Attempt to sync with server
    const response = await fetch('/api/sync/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ applications: pendingData })
    });

    if (response.ok) {
      console.log('Applications synced successfully');
      await clearPendingSyncData('applications');
    } else {
      throw new Error(`Sync failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to sync applications:', error);
    throw error;
  }
}

// Sync goals data
async function syncGoals() {
  try {
    const pendingData = await getPendingSyncData('goals');
    
    if (pendingData.length === 0) {
      console.log('No pending goals to sync');
      return;
    }

    console.log(`Syncing ${pendingData.length} pending goals`);
    
    const response = await fetch('/api/sync/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ goals: pendingData })
    });

    if (response.ok) {
      console.log('Goals synced successfully');
      await clearPendingSyncData('goals');
    } else {
      throw new Error(`Sync failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to sync goals:', error);
    throw error;
  }
}

// Helper functions for sync data management
async function getPendingSyncData(type) {
  // This would interact with IndexedDB to get pending sync data
  // For now, return empty array as placeholder
  return [];
}

async function clearPendingSyncData(type) {
  // This would clear the pending sync data from IndexedDB
  console.log(`Clearing pending sync data for ${type}`);
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'TRIGGER_SYNC':
      event.waitUntil(doBackgroundSync());
      break;
      
    case 'CACHE_URLS':
      cacheUrls(data.urls);
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Cache specific URLs
async function cacheUrls(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.addAll(urls);
    console.log('URLs cached successfully:', urls);
  } catch (error) {
    console.error('Failed to cache URLs:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New job search reminder!',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open ApplyTrak',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ApplyTrak', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
