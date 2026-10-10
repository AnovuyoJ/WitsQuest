import type { Metadata, Viewport } from "next"; // added Viewport
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import OfflineSyncProvider from "@/components/OfflineSyncProvider";
import ThemeProvider from "@/components/ThemeProvider";
import { themeInitScript } from "@/lib/theme";
import PageTitleManager from "@/components/PageTitleManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WitsQuest",
  description: "Explore Wits campus, complete quests, and collect cards.",
};

export const viewport: Viewport = {
  colorScheme: "light dark", // tells phone browsers the page handles dark mode itself, so they don't force-darken it
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="campus-background min-h-full flex flex-col">
        <script id="witsquest-theme-init" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>
          <PageTitleManager />
          <OfflineSyncProvider>{children}</OfflineSyncProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}