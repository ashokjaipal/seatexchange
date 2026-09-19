import type { Database } from "./types";
import { newId } from "./db";

export function pushNotification(db: Database, userId: string, title: string, body: string, href?: string) {
  db.notifications.unshift({
    id: newId("n_"),
    userId,
    title,
    body,
    href,
    read: false,
    createdAt: new Date().toISOString(),
  });
  // keep the inbox bounded
  const mine = db.notifications.filter((n) => n.userId === userId);
  if (mine.length > 50) {
    const drop = new Set(mine.slice(50).map((n) => n.id));
    db.notifications = db.notifications.filter((n) => !drop.has(n.id));
  }
}
