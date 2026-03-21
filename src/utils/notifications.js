const GYM_NAME = import.meta.env.VITE_GYM_NAME || "BOSS GYM"

// Request permission from browser
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("Browser does not support notifications")
    return false
  }
  if (Notification.permission === "granted") {
    return true
  }
  if (Notification.permission === "denied") {
    return false
  }
  const permission = await Notification.requestPermission()
  return permission === "granted"
}

// Send a single browser notification
export function sendBrowserNotification(title, body, icon) {
  if (Notification.permission !== "granted") return
  new Notification(title, {
    body: body,
    icon: icon || "/favicon.ico",
    badge: "/favicon.ico",
    tag: title,
    requireInteraction: false
  })
}

// Get today's date string YYYY-MM-DD
export function getTodayString() {
  return new Date().toISOString().split("T")[0]
}
