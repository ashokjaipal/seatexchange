"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getFirebaseAnalytics } from "@/lib/firebase";

/** Initialises Firebase Analytics in the browser and logs a page_view on every route change. */
export function FirebaseAnalytics() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    getFirebaseAnalytics()
      .then(async (a) => {
        if (!a) return;
        const { logEvent } = await import("firebase/analytics");
        logEvent(a, "page_view", { page_path: pathname + (search.size ? `?${search}` : ""), page_title: document.title });
      })
      .catch(() => {});
  }, [pathname, search]);
  return null;
}
