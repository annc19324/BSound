import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/context/PlayerContext";
import Player from "@/components/Player";
import Sidebar from "@/components/Sidebar";
import AdHeader from "@/components/AdHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BSound - B Ray Sounds",
  description: "tracks of B Ray",
  icons: { icon: '/bsound.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PlayerProvider>
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              <AdHeader />
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                {children}
              </div>
            </main>
            <footer className="player-bar">
              <Player />
            </footer>
          </div>
        </PlayerProvider>
      </body>
    </html>
  );
}
