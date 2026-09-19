import Link from "next/link";
import { TrainFront } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <TrainFront className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-2xl font-extrabold">This page missed the train</h1>
      <p className="mt-2 text-muted">The link may be old, or the listing was removed.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
