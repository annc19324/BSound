import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/context/PlayerContext";
import Player from "@/components/Player";
import Sidebar from "@/components/Sidebar";
import AdHeader from "@/components/AdHeader";
import { Toaster } from "react-hot-toast";
import PullToRefresh from "@/components/PullToRefresh";

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
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid rgba(243, 186, 47, 0.2)',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: '600'
              },
              success: {
                iconTheme: {
                  primary: 'var(--primary)',
                  secondary: '#000',
                },
              },
            }}
          />
          <div className="app-container">
            <PullToRefresh />
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
