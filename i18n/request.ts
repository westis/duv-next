import { getRequestConfig } from "next-intl/server";
import { activeLocales, defaultLocale, type Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = activeLocales.includes(requested as Locale)
    ? (requested as Locale)
    : defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
