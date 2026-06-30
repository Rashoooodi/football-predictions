import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import NavigationBar from "@/components/NavigationBar";
import InstallBanner from "@/components/InstallBanner";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NBR World Cup Predictions",
  description: "World Cup prediction tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    statusBarStyle: "black-translucent",
    title: "NBR Predictions",
  },
  other: {
    "mobile-web-app-capable": "yes"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 0.85,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} dark`}>
      <body className="bg-[#05060e] text-[#f8fafc] min-h-screen font-sans antialiased relative overflow-x-hidden selection:bg-red-500/30 selection:text-red-300">
        {/* Background Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[30%] right-[-20%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[100px] pointer-events-none -z-10" />

        <main className="pb-32 min-h-[100dvh] flex flex-col">
          <div className="flex-grow">{children}</div>
          <footer className="py-8 text-center text-[10px] text-gray-500 font-medium opacity-60">
            <p>&copy; {new Date().getFullYear()} Team Rashid Works</p>
            <p className="mt-1">Support: <a href="mailto:him@support.example.com" className="hover:text-white transition-colors">him@support.example.com</a></p>
          </footer>
        </main>
        <NavigationBar />
        <InstallBanner />

        {/* Register service worker for PWA support */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.deferredPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.deferredPrompt = e;
                if (window.onBeforeInstallPromptReady) {
                  window.onBeforeInstallPromptReady(e);
                }
              });

              if ('serviceWorker' in navigator) {
                if (document.readyState === 'complete') {
                  navigator.serviceWorker.register('/sw.js');
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              }
            `
          }}
        />
      </body>
    </html>
  );
}

