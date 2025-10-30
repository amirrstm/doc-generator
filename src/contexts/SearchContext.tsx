/* eslint-disable react-refresh/only-export-components */
"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";

import { searchItems } from "@/utils/search";

import type { ReactNode } from "react";
import type { SearchItem } from "@/utils/file";
import type { SearchResult } from "@/utils/search";

type SearchContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  navigateToResult: (result: SearchResult) => void;
};

const SearchContext = createContext<SearchContextType>({
  isLoading: false,
  isOpen: false,
  navigateToResult: () => {},
  query: "",
  results: [],
  setIsOpen: () => {},
  setQuery: () => {}
});

type SearchProviderProps = {
  children: ReactNode;
  searchIndex: SearchItem[];
};

export function SearchProvider({ children, searchIndex }: SearchProviderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      const searchResults = searchItems(searchIndex, query, 5);
      setResults(searchResults);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchIndex]);

  // Navigation handler
  const navigateToResult = useCallback(
    (result: SearchResult) => {
      router.push(result.url);
      setIsOpen(false);
      setQuery("");
    },
    [router]
  );

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const value = useMemo(
    () => ({
      isLoading,
      isOpen,
      navigateToResult,
      query,
      results,
      setIsOpen,
      setQuery
    }),
    [isOpen, query, results, isLoading, navigateToResult]
  );

  return <SearchContext value={value}>{children}</SearchContext>;
}

export function useSearch() {
  const context = use(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
