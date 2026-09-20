import { handle, json, readJson, requireUser, str, fail } from "@/lib/api";
import { getSessionUser, publicUser } from "@/lib/auth";
import { mutate } from "@/lib/db";
import type { Gender } from "@/lib/types";

export const GET = handle(async () => {
  const user = await getSessionUser();
  return json({ user: user ? publicUser(user) : null });
});

export const PATCH = handle(async (req: Request) => {
  const user = await requireUser();
  const body = await readJson(req);
  const name = str(body.name, 60);
  const genderRaw = str(body.gender, 1);
  if (name.length < 2) return fail("Name must be at least 2 characters.");
  const gender = (["M", "F", "O"].includes(genderRaw) ? genderRaw : undefined) as Gender | undefined;
  const updated = await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id)!;
    u.name = name;
    u.gender = gender;
    return u;
  });
  return json({ user: publicUser(updated) });
});
