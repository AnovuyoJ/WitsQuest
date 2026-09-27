import type { Metadata } from "next";
import { Geist, Geist_Mono, Pirata_One } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import OfflineSyncProvider from "@/components/OfflineSyncProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pirataOne = Pirata_One({
  weight: "400",
  variable: "--font-pirata",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WitsQuest",
  description: "Explore Wits campus, complete quests, and collect cards.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pirataOne.variable} h-full antialiased`}
    >
      <body className="campus-background min-h-full flex flex-col">
        <OfflineSyncProvider>{children}</OfflineSyncProvider>
      </body>
    </html>
  );
}