import { notificationStore } from "@/src/features/notifications/notificationState";
export type { NotificationItem as CachedNotificationItem } from "@/src/features/notifications/createNotificationStore";
export function useCachedNotifications() {
  return {
    readCachedNotifications: async () => ({ notifications: notificationStore.getSnapshot().items, savedAt: 0, hit: notificationStore.getSnapshot().items.length > 0 }),
    writeCachedNotifications: async (items: import("@/src/features/notifications/createNotificationStore").NotificationItem[]) => { notificationStore.setItems(() => items); return items; },
    fetchNotificationsFresh: async () => { await notificationStore.refresh(true); return notificationStore.getSnapshot().items; },
  };
}
