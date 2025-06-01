/**
 * Crystal Guardians - Service Worker
 * PWA対応、オフライン機能、キャッシュ管理
 */

const CACHE_NAME = 'crystal-guardians-v1.0.0';
const STATIC_CACHE_NAME = 'crystal-guardians-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'crystal-guardians-dynamic-v1.0.0';

// キャッシュするファイルリスト
const STATIC_FILES = [
    './',
    './index.html',
    './manifest.json',
    
    // CSS
    './css/style.css',
    
    // JavaScript - コアファイル
    './js/game.js',
    './js/mobile.js',
    './js/dataManager.js',
    './js/dataAdapter.js',
    
    // JavaScript - ゲームシステム
    './js/characters.js',
    './js/enemies.js',
    './js/stages.js',
    './js/weather.js',
    './js/difficulty.js',
    './js/grid.js',
    './js/minimap.js',
    './js/saveManager.js',
    './js/ads.js',
    
    // データファイル
    './data/characters.json',
    './data/enemies.json',
    './data/maps.json',
    './data/gameConfig.json',
    
    // ドキュメント
    './docs/api-design.md',
    './docs/data-management-guide.md'
];

// 動的にキャッシュするファイルパターン
const DYNAMIC_CACHE_PATTERNS = [
    /^https:\/\/fonts\.googleapis\.com/,
    /^https:\/\/fonts\.gstatic\.com/,
    /^https:\/\/cdnjs\.cloudflare\.com/
];

// キャッシュしないファイルパターン
const NO_CACHE_PATTERNS = [
    /\/tests\//,
    /\.test\.js$/,
    /\/api\//,
    /\/admin\//
];

// Service Worker インストール
self.addEventListener('install', event => {
    console.log('📱 Service Worker: インストール開始');
    
    event.waitUntil(
        Promise.all([
            // 静的ファイルのキャッシュ
            caches.open(STATIC_CACHE_NAME).then(cache => {
                console.log('📱 Service Worker: 静的ファイルをキャッシュ中');
                return cache.addAll(STATIC_FILES);
            }),
            
            // 即座にアクティベート
            self.skipWaiting()
        ])
    );
});

// Service Worker アクティベート
self.addEventListener('activate', event => {
    console.log('📱 Service Worker: アクティベート開始');
    
    event.waitUntil(
        Promise.all([
            // 古いキャッシュの削除
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName.startsWith('crystal-guardians-')) {
                            console.log('📱 Service Worker: 古いキャッシュを削除:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // 全てのクライアントを制御
            self.clients.claim()
        ])
    );
});

// フェッチイベント（リクエスト処理）
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // キャッシュしないパターンをチェック
    if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        return;
    }
    
    // GET リクエストのみ処理
    if (request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        handleFetchRequest(request)
    );
});

// フェッチリクエスト処理
async function handleFetchRequest(request) {
    const url = new URL(request.url);
    
    try {
        // 静的ファイルの場合
        if (isStaticFile(url.pathname)) {
            return await handleStaticFile(request);
        }
        
        // 動的ファイルの場合
        if (isDynamicFile(url.href)) {
            return await handleDynamicFile(request);
        }
        
        // その他のファイル（ネットワーク優先）
        return await handleNetworkFirst(request);
        
    } catch (error) {
        console.error('📱 Service Worker: フェッチエラー:', error);
        return await handleFallback(request);
    }
}

// 静的ファイル処理（キャッシュ優先）
async function handleStaticFile(request) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // バックグラウンドでキャッシュを更新
        updateCacheInBackground(request, cache);
        return cachedResponse;
    }
    
    // キャッシュにない場合はネットワークから取得
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
    }
    return networkResponse;
}

// 動的ファイル処理（ネットワーク優先、キャッシュフォールバック）
async function handleDynamicFile(request) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// ネットワーク優先処理
async function handleNetworkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // 成功した場合は動的キャッシュに保存
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // ネットワークエラーの場合はキャッシュから取得
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// フォールバック処理
async function handleFallback(request) {
    const url = new URL(request.url);
    
    // HTMLページの場合はindex.htmlを返す
    if (request.headers.get('accept')?.includes('text/html')) {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const fallbackResponse = await cache.match('./index.html');
        if (fallbackResponse) {
            return fallbackResponse;
        }
    }
    
    // その他の場合はオフラインページまたはエラーレスポンス
    return new Response(
        JSON.stringify({
            error: 'オフラインです',
            message: 'ネットワーク接続を確認してください'
        }),
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
}

// バックグラウンドキャッシュ更新
async function updateCacheInBackground(request, cache) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            await cache.put(request, networkResponse);
        }
    } catch (error) {
        // バックグラウンド更新のエラーは無視
        console.log('📱 Service Worker: バックグラウンド更新失敗:', error);
    }
}

// ファイルタイプ判定
function isStaticFile(pathname) {
    return STATIC_FILES.some(file => {
        const normalizedFile = file.replace('./', '/').replace(/\/$/, '/index.html');
        const normalizedPath = pathname === '/' ? '/index.html' : pathname;
        return normalizedFile === normalizedPath || file === pathname;
    });
}

function isDynamicFile(url) {
    return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// メッセージ処理
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({
                version: CACHE_NAME
            });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({
                    success: true
                });
            });
            break;
            
        case 'UPDATE_CACHE':
            updateStaticCache().then(() => {
                event.ports[0].postMessage({
                    success: true
                });
            });
            break;
            
        case 'GET_CACHE_STATUS':
            getCacheStatus().then(status => {
                event.ports[0].postMessage(status);
            });
            break;
    }
});

// キャッシュ管理機能
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => {
            if (cacheName.startsWith('crystal-guardians-')) {
                return caches.delete(cacheName);
            }
        })
    );
    console.log('📱 Service Worker: 全キャッシュクリア完了');
}

async function updateStaticCache() {
    const cache = await caches.open(STATIC_CACHE_NAME);
    await cache.addAll(STATIC_FILES);
    console.log('📱 Service Worker: 静的キャッシュ更新完了');
}

async function getCacheStatus() {
    const cacheNames = await caches.keys();
    const status = {
        static: false,
        dynamic: false,
        total: 0
    };
    
    for (const cacheName of cacheNames) {
        if (cacheName === STATIC_CACHE_NAME) {
            status.static = true;
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            status.total += keys.length;
        } else if (cacheName === DYNAMIC_CACHE_NAME) {
            status.dynamic = true;
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            status.total += keys.length;
        }
    }
    
    return status;
}

// プッシュ通知処理
self.addEventListener('push', event => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'Crystal Guardiansからの通知',
        icon: './assets/icon-192.png',
        badge: './assets/badge-72.png',
        tag: data.tag || 'crystal-guardians',
        data: data.data || {},
        actions: [
            {
                action: 'open',
                title: 'ゲームを開く',
                icon: './assets/action-open.png'
            },
            {
                action: 'close',
                title: '閉じる',
                icon: './assets/action-close.png'
            }
        ],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        vibrate: data.vibrate || [200, 100, 200]
    };
    
    event.waitUntil(
        self.registration.showNotification(
            data.title || 'Crystal Guardians',
            options
        )
    );
});

// 通知クリック処理
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    const action = event.action;
    const data = event.notification.data;
    
    if (action === 'close') {
        return;
    }
    
    // ゲームを開く
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            // 既存のウィンドウがあれば、それにフォーカス
            for (const client of clientList) {
                if (client.url.includes('crystal-guardians') && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // 新しいウィンドウを開く
            if (clients.openWindow) {
                const url = data.url || './index.html';
                return clients.openWindow(url);
            }
        })
    );
});

// バックグラウンド同期
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(
            handleBackgroundSync()
        );
    }
});

async function handleBackgroundSync() {
    try {
        // ゲームデータの同期処理
        console.log('📱 Service Worker: バックグラウンド同期実行');
        
        // セーブデータの同期
        await syncSaveData();
        
        // 統計データの送信
        await syncAnalytics();
        
        console.log('📱 Service Worker: バックグラウンド同期完了');
    } catch (error) {
        console.error('📱 Service Worker: バックグラウンド同期エラー:', error);
        throw error; // 再試行のため
    }
}

async function syncSaveData() {
    // IndexedDBからセーブデータを取得して同期
    // 実装は省略（実際のバックエンドAPIに依存）
}

async function syncAnalytics() {
    // 分析データの送信
    // 実装は省略（実際の分析サービスに依存）
}

// エラーハンドリング
self.addEventListener('error', event => {
    console.error('📱 Service Worker: エラー発生:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('📱 Service Worker: 未処理のPromise拒否:', event.reason);
});

console.log('📱 Service Worker: 初期化完了'); 