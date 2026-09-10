import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AFTERHOURS — 16 September 2026",
  description: "Afterhours Party at Studio XO, Indore. 16 September 2026, 4 PM onwards. Confirm you’re coming and join the RSVP list.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><head><link rel="preload" href="/fonts/PirataOne-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/></head><body>{children}</body></html>;
}
