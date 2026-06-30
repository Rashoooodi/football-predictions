import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import NavigationBar from "@/components/NavigationBar";
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
  title: "Janahi Predictions",
  description: "World Cup prediction tracker for the family",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Janahi Preds",
  },
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
      <body className="bg-[#05060e] text-[#f8fafc] min-h-screen font-sans antialiased relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-300">
        {/* Background Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[30%] right-[-20%] w-[40%] h-[40%] rounded-full bg-teal-500/5 blur-[100px] pointer-events-none -z-10" />

        <main className="pb-32">{children}</main>
        <NavigationBar />

        {/* Register service worker for PWA support */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}

