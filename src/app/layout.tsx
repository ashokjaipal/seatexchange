import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: {
    default: "SeatBadlo - Swap your train seat with co-passengers",
    template: "%s | SeatBadlo",
  },
  description:
    "Split from family? Stuck on an upper berth? SeatBadlo helps Indian Railways passengers find co-passengers on the same train who will happily exchange seats. Free, private and takes 2 minutes.",
  applicationName: "SeatBadlo",
  manifest: "/manifest.webmanifest",
  keywords: ["train seat exchange", "berth swap", "Indian Railways", "IRCTC seat swap", "lower berth", "seat badlo"],
  openGraph: {
    title: "SeatBadlo - Seat badlo, saath baitho",
    description: "Swap train seats and berths with co-passengers on your train, before you board.",
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: "#2a48c2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
