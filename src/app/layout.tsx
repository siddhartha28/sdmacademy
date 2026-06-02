import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "S.D.M. Academy Shaulana",
  description:
    "S.D.M. Academy Shaulana — UP Board affiliated school, Classes Play to 8. Established 2006.",
  keywords: "SDM Academy, Shaulana, Dhaulana, Hapur, UP Board, School",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-ivory antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
