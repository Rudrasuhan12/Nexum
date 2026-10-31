import { describe, it, expect, beforeEach } from "vitest";
import {
  notificationStore,
  INITIAL_NOTIFICATIONS,
  AppNotification,
} from "../src/lib/notifications-data";
import { DEMO_USERS, UserPresenceStatus } from "../src/lib/auth-types";

describe("Top Header Notifications and Presence State Engine", () => {
  beforeEach(() => {
    notificationStore.reset();
  });

  it("verifies initial notifications match the top bar unread badge (count of 4 for client)", () => {
    const data = notificationStore.getForUser("CLIENT");
    const unreadClient = data.notifications.filter((n) => !n.read);
    expect(unreadClient.length).toBe(4);
    expect(data.unreadCount).toBe(4);
  });

  it("marks a notification as read and decrements unread count", () => {
    const item = notificationStore.markAsRead("notif-1");
    expect(item).not.toBeNull();
    expect(item?.read).toBe(true);
    const data = notificationStore.getForUser("CLIENT");
    expect(data.unreadCount).toBe(3);
  });

  it("marks all notifications as read for client", () => {
    const updatedCount = notificationStore.markAllAsRead("CLIENT");
    expect(updatedCount).toBe(4);
    const data = notificationStore.getForUser("CLIENT");
    expect(data.unreadCount).toBe(0);
  });

  it("adds a new deliverable notification and tracks it correctly", () => {
    const newNotif = notificationStore.addNotification({
      role: "CLIENT",
      userId: "usr_client_alex",
      title: "New Deliverable Uploaded",
      message: "Freelancer uploaded pull request #45 for review.",
      type: "DELIVERABLE",
      projectName: "TechKart – E-commerce Website",
      actionUrl: "/client/workspace",
    });

    expect(newNotif.id).toBeDefined();
    const data = notificationStore.getForUser("CLIENT");
    expect(data.unreadCount).toBe(5);
  });

  it("ensures all demo users have a valid presenceStatus configured", () => {
    const validStatuses: UserPresenceStatus[] = ["available", "busy", "away", "offline"];
    Object.values(DEMO_USERS).forEach((user) => {
      expect(user.presenceStatus).toBeDefined();
      expect(validStatuses).toContain(user.presenceStatus);
    });
  });
});
