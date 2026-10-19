import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Providers } from "@/components/layout/Providers";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { localeDirection } from "@/i18n/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic", "greek"], variable: "--font-inter" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site");
  return {
    title: { default: t("name"), template: `%s · DUV` },
    description: t("description"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations("site");
  return (
    <html lang={locale} dir={localeDirection(locale)} className={inter.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:start-2 focus:top-2"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <Providers>
            <SiteHeader />
            <main id="main" className="grow">
              {children}
            </main>
            <SiteFooter />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
