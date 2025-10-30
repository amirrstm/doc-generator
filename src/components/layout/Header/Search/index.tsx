"use client";

import { IconSearch } from "@tabler/icons-react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import { useSearch } from "@/hooks/useSearch";

import type { ReactElement } from "react";

export default function HeaderSearch(): ReactElement {
  const { setIsOpen } = useSearch();
  const t = useTranslations("search");

  return (
    <div className="hidden flex-1 items-center justify-center gap-2 lg:flex">
      <button
        className={clsx(
          "pointer-events-auto relative mx-px w-full min-w-80 items-center justify-between gap-2 truncate rounded-lg py-2 pr-3 pl-3.5 text-gray-400 text-sm leading-6 ring-1 ring-gray-400/20 hover:ring-gray-600/25 focus:outline-primary lg:flex dark:text-white/50 dark:ring-1 dark:ring-gray-600/30 dark:brightness-[1.1] dark:hover:ring-gray-500/30 dark:hover:brightness-[1.25]"
        )}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <div className="flex flex-1 items-center gap-2">
          <IconSearch className="size-4" />
          <p>{t("title")}</p>
        </div>
        <span className="flex-none font-semibold text-xs">K⌘</span>
      </button>
    </div>
  );
}
