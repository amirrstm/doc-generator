"use client";

import { useTranslations } from "next-intl";

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandList } from "@/components/ui/command";
import { useSearch } from "@/hooks/useSearch";

import SearchResultCard from "./SearchResultCard";

import type { ReactElement } from "react";

export default function SearchDialog(): ReactElement {
  const t = useTranslations("search");
  const { isOpen, setIsOpen, query, setQuery, results, isLoading, navigateToResult } = useSearch();

  return (
    <CommandDialog description={t("description")} onOpenChange={setIsOpen} open={isOpen} title={t("title")}>
      <CommandInput onValueChange={setQuery} placeholder={t("placeholder")} value={query} />
      <CommandList>
        {isLoading && <div className="py-6 text-center text-muted-foreground text-sm">{t("searching")}</div>}

        {!isLoading && query.trim() && results.length === 0 && <CommandEmpty>{t("noResults")}</CommandEmpty>}

        {!isLoading && results.length > 0 && (
          <CommandGroup heading={t("results")}>
            {results.map((result) => (
              <SearchResultCard key={result.id} onSelect={navigateToResult} result={result} />
            ))}
          </CommandGroup>
        )}

        {!query.trim() && <div className="py-6 text-center text-muted-foreground text-sm">{t("emptyState")}</div>}
      </CommandList>
    </CommandDialog>
  );
}
