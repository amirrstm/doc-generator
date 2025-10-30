"use client";

import { IconLanguage } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { locales } from "@/configs/i18n/routing";
import { cn } from "@/utils/cn";

import type { ReactElement } from "react";

type LanguageOption = {
  code: string;
  name: string;
  nativeName: string;
};

const languages: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "fa", name: "Persian", nativeName: "فارسی" }
];

export default function LanguageSwitcher(): ReactElement {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("header");

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;

    const segments = pathname.split("/").filter(Boolean);
    if (locales.includes(segments[0])) segments.shift();

    const newPath = newLocale === "en" ? `/${segments.join("/")}` : `/${newLocale}/${segments.join("/")}`;

    router.push(newPath || "/");
  };

  const currentLanguage = languages.find((lang) => lang.code === currentLocale);

  return (
    <Select onValueChange={handleLanguageChange} value={currentLocale}>
      <SelectTrigger aria-label={t("language")} className="w-fit min-w-0 gap-2 px-3 py-2">
        <IconLanguage className="size-4 shrink-0" />
        <SelectValue>
          <span className="hidden sm:inline">{currentLanguage?.nativeName}</span>
          <span className="uppercase sm:hidden">{currentLocale}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem className="gap-3" key={language.code} value={language.code}>
            <div className="flex flex-col items-start">
              <span className={cn("font-medium", language.code === "fa" ? "font-fa" : "font-en")}>{language.nativeName}</span>
              <span className="text-muted-foreground text-xs">{language.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
