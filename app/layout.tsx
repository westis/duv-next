import type { Metadata } from "next";
import { Archivo, Barlow_Condensed } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Providers } from "@/components/layout/Providers";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { localeDirection } from "@/i18n/config";
import "./globals.css";

// DUV Swiss Grid type (design-system/README.md): Barlow Condensed for titles, headings, labels and
// big figures, Archivo for body text and data. Neither has Cyrillic or Greek; those scripts fall
// back to the system sans. Only Latin is preloaded.
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-barlow-condensed",
});
const archivo = Archivo({ subsets: ["latin", "latin-ext"], variable: "--font-archivo" });

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
    <html lang={locale} dir={localeDirection(locale)} className={`${barlowCondensed.variable} ${archivo.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only z-50 border border-fg bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:start-2 focus:top-2"
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
