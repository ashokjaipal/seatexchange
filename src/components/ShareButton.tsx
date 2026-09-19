"use client";

import type { ReactNode } from "react";
import { useToast } from "./Toast";

export function ShareButton({ title, text, path, children, className = "btn-secondary" }: { title: string; text: string; path: string; children: ReactNode; className?: string }) {
  const { toast } = useToast();
  const share = async () => {
    const url = `${window.location.origin}${path}`;
    const full = `${text} ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(full);
      toast("Link copied. Paste it in your family WhatsApp group!", "success");
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(full)}`, "_blank");
    }
  };
  return (
    <button type="button" onClick={share} className={className}>
      {children}
    </button>
  );
}
