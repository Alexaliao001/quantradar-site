/**
 * QuantRadar Service Worker
 * 处理浏览器推送通知
 */

const CACHE_NAME = "quantradar-v1";

// 安装事件
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  self.skipWaiting();
});

// 激活事件
self.addEventListener("activate", (event) => {
  console.log("[SW] Service worker activated");
  event.waitUntil(clients.claim());
});

// 推送通知事件
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");
  
  if (!event.data) {
    console.log("[SW] No data in push event");
    return;
  }
  
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error("[SW] Failed to parse push data:", e);
    data = {
      title: "QuantRadar",
      body: event.data.text(),
    };
  }
  
  const options = {
    body: data.body || data.message,
    icon: data.icon || "/logo-192.png",
    badge: data.badge || "/badge-72.png",
    image: data.image,
    tag: data.tag || "quantradar-notification",
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    vibrate: [200, 100, 200],
    timestamp: data.data?.timestamp || Date.now(),
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知点击事件
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  let url = data.url || "https://quantradar.one";
  
  // 根据action决定跳转URL
  switch (event.action) {
    case "view":
      url = data.url || "https://quantradar.one";
      break;
    case "dashboard":
      url = "https://quantradar.one/dashboard";
      break;
    case "analyze":
      url = data.symbol 
        ? `https://quantradar.one/analysis?symbol=${data.symbol}`
        : "https://quantradar.one/analysis";
      break;
    case "renew":
      url = "https://quantradar.one/subscription";
      break;
    case "dismiss":
      return;
    default:
      url = data.url || "https://quantradar.one";
  }
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 如果已有窗口打开，聚焦并导航
        for (const client of clientList) {
          if (client.url.includes("quantradar.one") && "focus" in client) {
            client.focus();
            if ("navigate" in client) {
              return client.navigate(url);
            }
            return;
          }
        }
        // 否则打开新窗口
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// 通知关闭事件
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed");
  
  // 可以在这里记录用户关闭通知的行为
  const data = event.notification.data || {};
  
  // 发送分析事件（如果需要）
  if (data.type) {
    fetch("/api/analytics/notification-closed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: data.type,
        symbol: data.symbol,
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // 静默失败
    });
  }
});

// 后台同步事件（用于离线时的通知重试）
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);
  
  if (event.tag === "sync-notifications") {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // 同步离线期间的通知状态
  try {
    const response = await fetch("/api/trpc/notifications.sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    console.log("[SW] Notifications synced:", response.ok);
  } catch (error) {
    console.error("[SW] Failed to sync notifications:", error);
  }
}

// 消息事件（用于与主页面通信）
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);
  
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

console.log("[SW] Service worker loaded");
