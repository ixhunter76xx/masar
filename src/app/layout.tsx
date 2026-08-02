import type { Metadata, Viewport } from "next";

import { MotionRoot } from "@/components/motion/MotionRoot";
import { plexArabic, plexMono } from "@/lib/fonts";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: SITE.tagline,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.shortDescription,
};

export const viewport: Viewport = {
  themeColor: "#0d1013",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plexArabic.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-ink text-paper antialiased">
        <MotionRoot>{children}</MotionRoot>
      </body>
    </html>
  );
}
