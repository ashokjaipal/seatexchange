import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { authMode } from "@/lib/otp";
import { MSG91_WIDGET_ID, MSG91_TOKEN_AUTH } from "@/lib/msg91";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Log in" };
export const dynamic = "force-dynamic";

function safeNext(n?: string) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNext(next);
  const user = await getSessionUser();
  if (user) redirect(target);
  return (
    <div className="container-x flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md animate-rise">
        <LoginForm next={target} mode={authMode()} msg91={{ widgetId: MSG91_WIDGET_ID, tokenAuth: MSG91_TOKEN_AUTH }} />
      </div>
    </div>
  );
}
