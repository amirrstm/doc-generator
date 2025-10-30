"use client";

import { Badge } from "@/components/ui/badge";
import { CommandItem } from "@/components/ui/command";

import type { ReactElement } from "react";
import type { SearchResult } from "@/utils/search";

type Props = {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
};

const methodColors = {
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  GET: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  PATCH: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  POST: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
} as const;

export default function SearchResultCard({ result, onSelect }: Props): ReactElement {
  const methodColor =
    methodColors[result.method as keyof typeof methodColors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";

  return (
    <CommandItem
      className="flex cursor-pointer flex-col items-start gap-2 p-3"
      key={result.id}
      onSelect={() => onSelect(result)}
      value={result.id}
    >
      <div className="flex w-full items-center gap-3">
        <Badge className={`shrink-0 font-medium text-xs ${methodColor} border-0`} variant="outline">
          {result.method}
        </Badge>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 font-medium text-sm" dangerouslySetInnerHTML={{ __html: result.highlightedTitle }} />
        </div>
      </div>

      {result.description && (
        <div className="w-full pl-0">
          <p
            className="line-clamp-2 text-muted-foreground text-xs leading-relaxed"
            dangerouslySetInnerHTML={{ __html: result.highlightedDescription }}
          />
        </div>
      )}

      {result.category && <div className="font-mono text-muted-foreground/80 text-xs">{result.category}</div>}
    </CommandItem>
  );
}
