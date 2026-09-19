"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { useToast } from "./Toast";

export function ManageListing({ id, status, compact = false }: { id: string; status: string; compact?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<"" | "withdraw" | "swapped">("");

  const act = async (kind: "withdraw" | "swapped") => {
    if (kind === "withdraw" && !window.confirm("Remove this listing? Pending requests on it will be cancelled.")) return;
    setBusy(kind);
    try {
      const r =
        kind === "withdraw"
          ? await fetch(`/api/listings/${id}`, { method: "DELETE" })
          : await fetch(`/api/listings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "swapped" }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast(kind === "withdraw" ? "Listing removed." : "Marked as swapped. Happy journey!", "success");
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy("");
    }
  };

  if (status !== "active") return null;
  const size = compact ? "btn-sm" : "";
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={`btn-secondary ${size}`} onClick={() => act("swapped")} disabled={!!busy}>
        {busy === "swapped" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Swapped already
      </button>
      <button type="button" className={`btn-danger ${size}`} onClick={() => act("withdraw")} disabled={!!busy}>
        {busy === "withdraw" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Remove
      </button>
    </div>
  );
}
