import { defineRouting } from "next-intl/routing";

export const locales: string[] = ["en", "fa"];

export const routing = defineRouting({
  defaultLocale: "en",
  localeDetection: false,
  localePrefix: "as-needed",
  locales
});
