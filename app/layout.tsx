// app/layout.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DUV Ultramarathon Statistics",
  description: "Comprehensive ultramarathon statistics and results",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            <header>{/* Add your header content here */}</header>
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
            <footer>{/* Add your footer content here */}</footer>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
