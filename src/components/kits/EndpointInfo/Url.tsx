import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { tv } from "tailwind-variants";

import { cn } from "@/utils/cn";
import { parseUrlWithParameters } from "@/utils/string";

const badgeVariants = tv({
  base: "inline-flex items-center leading-tight justify-center font-en rounded-xl px-3 py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-[color,box-shadow] overflow-hidden",
  compoundVariants: [
    {
      className: "bg-green-400/20 text-green-700 dark:bg-green-400/20 dark:text-green-400",
      type: "get"
    },

    {
      className: "bg-blue-400/20 text-blue-700 dark:bg-blue-400/20 dark:text-blue-400",
      type: "post"
    },

    {
      className: "bg-orange-400/20 text-orange-700 dark:bg-orange-400/20 dark:text-orange-400",
      type: "patch"
    },

    {
      className: "bg-red-400/20 text-red-700 dark:bg-red-400/20 dark:text-red-400",
      type: "del"
    },

    {
      className: "bg-purple-400/20 text-purple-700 dark:bg-purple-400/20 dark:text-purple-400",
      type: "put"
    }
  ],
  defaultVariants: {
    type: "get",
    variant: "filled"
  },

  variants: { type: { del: "", get: "", patch: "", post: "", put: "" } }
});

type Props = {
  url: string;
  type: string;
  action?: React.ReactNode;
};

export function EndpointUrl({ url, type, action }: Props) {
  const [copied, setCopied] = useState(false);
  const urlParts = parseUrlWithParameters(url);

  const copyToClipboard = async () => {
    if (url) {
      await navigator.clipboard.writeText(url.replace(/\\?\{|\\?\}/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex w-full gap-2 rounded-md border p-2" dir="ltr">
      <div className="group relative flex h-10 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-md border p-2">
        <div
          className={cn(
            badgeVariants({
              type: type as "get" | "post" | "patch" | "del" | "put"
            })
          )}
        >
          {type.toUpperCase()}
        </div>

        <div className="hide-scrollbar min-w-0 flex-1 overflow-x-auto">
          <div className="flex flex-nowrap items-center gap-1 whitespace-nowrap font-medium font-mono text-gray-800 text-xs md:text-sm dark:text-white">
            {urlParts.map((part, index) =>
              part.isParameter ? (
                <span
                  className="inline-flex items-center rounded-md bg-blue-100 px-1 py-0.5 font-medium text-base text-blue-800 ring-1 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20"
                  key={index}
                >
                  {`{${part.text.replace(/\\?\{|\\?\}/g, "")}}`}
                </span>
              ) : (
                <span key={index}>{part.text}</span>
              )
            )}
          </div>
        </div>

        <button
          className="absolute top-0 right-0 flex h-full w-10 cursor-pointer items-center justify-center bg-background opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          onClick={copyToClipboard}
          type="button"
        >
          {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
        </button>
      </div>

      {action}
    </div>
  );
}
