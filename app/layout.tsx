import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FormTrack",
  description: "Treningi, pomiary i progres w jednym miejscu",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#07120c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pl"><body>{children}</body></html>;
}
