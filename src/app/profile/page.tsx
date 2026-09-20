import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Avatar } from "@/components/Avatar";
import { ProfileForm } from "@/components/ProfileForm";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/profile");
  const db = await getDb();
  const listed = db.listings.filter((l) => l.userId === user.id).length;
  const swaps = db.requests.filter((r) => (r.fromUserId === user.id || r.toUserId === user.id) && (r.status === "accepted" || r.status === "completed")).length;

  return (
    <div className="container-x py-6 sm:py-10">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{user.name}</h1>
            <p className="text-sm text-muted">
              {listed} seat{listed === 1 ? "" : "s"} listed · {swaps} swap{swaps === 1 ? "" : "s"} agreed
            </p>
          </div>
        </div>
        <div className="mt-6">
          <ProfileForm user={{ name: user.name, mobile: user.mobile, gender: user.gender }} />
        </div>
      </div>
    </div>
  );
}
