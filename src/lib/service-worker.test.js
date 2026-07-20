const fs = require('fs');
const path = require('path');
const vm = require('vm');

const serviceWorkerSource = fs.readFileSync(
  path.join(process.cwd(), 'public', 'service-worker.js'),
  'utf8'
);

const loadServiceWorker = ({ fetchResponse = { status: 200 }, cacheNames = [] } = {}) => {
  const listeners = {};
  const fetch = jest.fn(() => Promise.resolve(fetchResponse));
  const cache = {
    keys: jest.fn(() => Promise.resolve([])),
    delete: jest.fn(() => Promise.resolve(true)),
    match: jest.fn(() => Promise.resolve(null)),
    put: jest.fn(() => Promise.resolve()),
  };
  const cachesApi = {
    keys: jest.fn(() => Promise.resolve(cacheNames)),
    delete: jest.fn(() => Promise.resolve(true)),
    open: jest.fn(() => Promise.resolve(cache)),
  };

  const context = {
    URL,
    Date,
    Promise,
    Headers: class Headers {
      constructor(headers = {}) {
        this.headers = headers;
      }

      set() {}
    },
    Response: class Response {},
    caches: cachesApi,
    fetch,
    self: {
      addEventListener: (eventName, handler) => {
        listeners[eventName] = handler;
      },
      clients: {
        claim: jest.fn(() => Promise.resolve()),
      },
      skipWaiting: jest.fn(),
    },
  };

  vm.runInNewContext(serviceWorkerSource, context);

  return { cache, cachesApi, fetch, listeners };
};

describe('service worker', () => {
  it('removes the retired Supabase API cache on activation', async () => {
    const { cachesApi, listeners } = loadServiceWorker({
      cacheNames: ['static-v1', 'images-v2', 'api-cache', 'old-cache'],
    });
    const waitUntilPromises = [];
    const event = {
      waitUntil: jest.fn((promise) => {
        waitUntilPromises.push(promise);
      }),
    };

    listeners.activate(event);
    await waitUntilPromises[0];

    expect(cachesApi.delete).toHaveBeenCalledWith('api-cache');
    expect(cachesApi.delete).toHaveBeenCalledWith('old-cache');
    expect(cachesApi.delete).not.toHaveBeenCalledWith('static-v1');
    expect(cachesApi.delete).not.toHaveBeenCalledWith('images-v2');
  });

  it('bypasses Supabase auth requests instead of caching them', async () => {
    const { cachesApi, fetch, listeners } = loadServiceWorker();
    const request = {
      method: 'GET',
      url: 'https://example.supabase.co/auth/v1/user',
      destination: '',
    };
    const event = {
      request,
      respondWith: jest.fn(),
    };

    listeners.fetch(event);

    expect(event.respondWith).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(request);
    expect(cachesApi.open).not.toHaveBeenCalled();
    await expect(event.respondWith.mock.calls[0][0]).resolves.toEqual({ status: 200 });
  });

  it('bypasses Supabase REST requests instead of serving stale cached data', async () => {
    const { cachesApi, fetch, listeners } = loadServiceWorker();
    const request = {
      method: 'GET',
      url: 'https://example.supabase.co/rest/v1/digital_library_books?select=*',
      destination: '',
    };
    const event = {
      request,
      respondWith: jest.fn(),
    };

    listeners.fetch(event);

    expect(event.respondWith).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(request);
    expect(cachesApi.open).not.toHaveBeenCalled();
    await expect(event.respondWith.mock.calls[0][0]).resolves.toEqual({ status: 200 });
  });

  it('passes opaque cross-origin image responses through without rebuilding them', async () => {
    const opaqueResponse = {
      status: 0,
      type: 'opaque',
      clone: jest.fn(),
    };
    const { cache, fetch, listeners } = loadServiceWorker({ fetchResponse: opaqueResponse });
    const request = {
      method: 'GET',
      url: 'https://example.supabase.co/storage/v1/object/public/covers/cover.png',
      destination: 'image',
    };
    const event = {
      request,
      respondWith: jest.fn(),
    };

    listeners.fetch(event);

    expect(event.respondWith).toHaveBeenCalledTimes(1);
    await expect(event.respondWith.mock.calls[0][0]).resolves.toBe(opaqueResponse);
    expect(fetch).toHaveBeenCalledWith(request);
    expect(opaqueResponse.clone).not.toHaveBeenCalled();
    expect(cache.put).not.toHaveBeenCalled();
  });
});
