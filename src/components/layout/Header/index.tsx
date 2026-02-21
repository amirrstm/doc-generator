import { useTranslations } from "next-intl";

import Logo from "@/components/kits/Logo";

import BaseUrlSelector from "./BaseUrlSelector";
import HeaderSearch from "./Search";
import HeaderTheme from "./Theme";

import type { ReactElement } from "react";

export default function Header(): ReactElement {
  const t = useTranslations("common");

  return (
    <header className="fixed top-0 z-30 w-full lg:sticky">
      <nav className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between border-b border-b-gray-100 bg-background px-4 backdrop-blur-sm lg:px-10 dark:border-b-gray-900">
        <div className="flex items-center gap-2">
          <Logo size="xs" />
          <p
            className="font-black text-sm md:text-base"
            dangerouslySetInnerHTML={{
              __html: t.markup("title", { base: (chunks) => `<span class="text-brand-primary">${chunks}</span>` })
            }}
          />
        </div>

        <div className="flex w-fit items-center gap-4">
          <HeaderSearch />
          <BaseUrlSelector />
          <HeaderTheme />
        </div>
      </nav>
    </header>
  );
}
