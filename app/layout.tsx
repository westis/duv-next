import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TheNavbar } from "@/components/the-navbar";
import "./globals.css";
import "../styles/date-range-picker.css";

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
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TheNavbar />
          <Suspense fallback={<div>Loading...</div>}>
            <main>{children}</main>
          </Suspense>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            document.addEventListener('keydown', function(e) {
              if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.querySelector('button[aria-haspopup="dialog"]').click();
              }
            });
          `,
          }}
        />
      </body>
    </html>
  );
}
