import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";

/** الخط الأساسي لكل النصوص العربية والإنجليزية */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

/** خط الأرقام والدرجات والمعرّفات */
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});
