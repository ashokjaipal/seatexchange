import { handle, json } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const GET = handle(async () => {
  const user = await getSessionUser();
  if (!user) return json({ notifications: [], unread: 0, pendingRequests: 0 });
  const db = getDb();
  const notifications = db.notifications.filter((n) => n.userId === user.id).slice(0, 20);
  const unread = notifications.filter((n) => !n.read).length;
  const pendingRequests = db.requests.filter((r) => r.toUserId === user.id && r.status === "pending").length;
  return json({ notifications, unread, pendingRequests });
});
