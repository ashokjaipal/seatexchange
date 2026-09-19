import { getSessionUser } from "@/lib/auth";
import { NavClient } from "./NavClient";

export async function Navbar() {
  const user = await getSessionUser();
  return <NavClient user={user ? { id: user.id, name: user.name } : null} />;
}
