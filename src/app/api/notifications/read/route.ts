import { handle, json, requireUser } from "@/lib/api";
import { mutate } from "@/lib/db";

export const POST = handle(async () => {
  const user = await requireUser();
  mutate((db) => {
    for (const n of db.notifications) if (n.userId === user.id) n.read = true;
  });
  return json({ ok: true });
});
