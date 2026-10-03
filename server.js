const http = require('http');
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');
const { Redis } = require('@upstash/redis');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const DATA_DIR = isVercel
  ? path.join('/tmp', 'campuspulse-data')
  : path.join(__dirname, 'data');
const VAPID_KEYS_PATH = path.join(DATA_DIR, 'vapid-keys.json');
const SUBSCRIPTIONS_PATH = path.join(DATA_DIR, 'push-subscriptions.json');
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const hasVapidConfig = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

fs.mkdirSync(DATA_DIR, { recursive: true });

function loadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

let vapidKeys = loadJson(VAPID_KEYS_PATH, null);
if (!vapidKeys) {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_KEYS_PATH, JSON.stringify(vapidKeys, null, 2));
}
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY || vapidKeys.publicKey,
  process.env.VAPID_PRIVATE_KEY || vapidKeys.privateKey
);

let subscriptions = loadJson(SUBSCRIPTIONS_PATH, []);

async function getSubscriptions() {
  if (redis) return (await redis.get('campuspulse:push-subscriptions')) || [];
  return subscriptions;
}

async function saveSubscriptions(nextSubscriptions) {
  subscriptions = nextSubscriptions;
  if (redis) {
    await redis.set('campuspulse:push-subscriptions', subscriptions);
  } else {
    fs.writeFileSync(SUBSCRIPTIONS_PATH, JSON.stringify(subscriptions, null, 2));
  }
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

async function notifySubscribers(notice) {
  const currentSubscriptions = await getSubscriptions();
  const payload = JSON.stringify({
    title: `CampusPulse: ${notice.title}`,
    body: `${notice.category}: ${notice.description}`,
    url: `/#notice-${notice.id}`,
    tag: `campuspulse-${notice.id}`
  });
  const failedEndpoints = [];

  await Promise.all(currentSubscriptions.map(async subscription => {
    try {
      await webpush.sendNotification(subscription, payload);
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        failedEndpoints.push(subscription.endpoint);
      } else {
        console.error('Push delivery failed:', error.message);
      }
    }
  }));

  if (failedEndpoints.length) {
    await saveSubscriptions(currentSubscriptions.filter(subscription => !failedEndpoints.includes(subscription.endpoint)));
  }
}

async function handleApiRequest(req, res, pathname) {
  if (pathname === '/api/push/public-key' && req.method === 'GET') {
    if (isVercel && (!hasVapidConfig || !redis)) {
      sendJson(res, 503, { error: 'Push requires VAPID and Upstash Redis environment variables on Vercel' });
      return true;
    }
    sendJson(res, 200, { publicKey: process.env.VAPID_PUBLIC_KEY || vapidKeys.publicKey });
    return true;
  }

  if (pathname === '/api/push/subscribe' && req.method === 'POST') {
    try {
      if (isVercel && !redis) {
        sendJson(res, 503, { error: 'Configure Upstash Redis on Vercel before subscribing devices' });
        return true;
      }
      const subscription = await readRequestBody(req);
      if (!subscription.endpoint || !subscription.keys) {
        sendJson(res, 400, { error: 'Invalid push subscription' });
        return true;
      }
      const currentSubscriptions = await getSubscriptions();
      if (!currentSubscriptions.some(item => item.endpoint === subscription.endpoint)) {
        await saveSubscriptions([...currentSubscriptions, subscription]);
      }
      sendJson(res, 201, { subscribed: true });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return true;
  }

  if (pathname === '/api/push/unsubscribe' && req.method === 'POST') {
    try {
      const { endpoint } = await readRequestBody(req);
      if (!endpoint) {
        sendJson(res, 400, { error: 'Subscription endpoint is required' });
        return true;
      }
      const currentSubscriptions = await getSubscriptions();
      await saveSubscriptions(currentSubscriptions.filter(item => item.endpoint !== endpoint));
      sendJson(res, 200, { unsubscribed: true });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return true;
  }

  if (pathname === '/api/push/notify' && req.method === 'POST') {
    try {
      const notice = await readRequestBody(req);
      if (!notice.id || !notice.title || !notice.description) {
        sendJson(res, 400, { error: 'Notice title, description, and id are required' });
        return true;
      }
      await notifySubscribers(notice);
      sendJson(res, 200, { notified: true });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return true;
  }

  return false;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

async function handleRequest(req, res) {
  // Normalize URL and remove query strings
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let safePath = parsedUrl.pathname;

  if (safePath.startsWith('/api/')) {
    if (await handleApiRequest(req, res, safePath)) return;
    sendJson(res, 404, { error: 'API route not found' });
    return;
  }
  
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  } else if (safePath === '/admin' || safePath === '/admin/') {
    safePath = '/admin.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  // Security check to avoid directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA if not an asset
      const ext = path.extname(filePath);
      if (!ext || ext === '.html') {
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(indexPath, (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
          }
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
}

if (process.env.VERCEL) {
  module.exports = handleRequest;
} else {
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Smart Campus Notice Portal is running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔔 Open multiple tabs to test live Push Notifications!`);
    console.log(`====================================================`);
  });
}
