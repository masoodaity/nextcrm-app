import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) || "en";
  return {
    messages: (await import(`./locales/${locale}.json`)).default,
    timeZone: "Europe/Prague",
  };
});
