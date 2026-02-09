import "@/styles/globals.css";
import "@/styles/design-system.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastProvider";
import { PremiumNavbar } from "@/components/layout/PremiumNavbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "LandBiznes - Zillow for Land | Verified Land Marketplace",
  description: "Discover, verify, and invest in land across Sierra Leone and beyond. Real-time market data, community verification, and zero-dispute assurance. Your trusted land intelligence platform.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "LandBiznes - Zillow for Land",
    description: "Verified land marketplace with community intelligence and zero-dispute guarantee",
    siteName: "LandBiznes",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LandBiznes - Zillow for Land",
    description: "Verified land marketplace with community intelligence",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white antialiased">
        <AuthProvider>
          <ToastProvider />
          <PremiumNavbar />
          <main className="min-h-[calc(100vh-4rem-1px)]">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
