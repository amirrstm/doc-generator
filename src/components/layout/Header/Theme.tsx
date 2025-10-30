"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import type { ReactElement } from "react";

export default function HeaderTheme(): ReactElement | null {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-6 md:flex-1">
      <button
        className="flex cursor-pointer items-center gap-2 text-gray-400 hover:text-gray-600 dark:text-white/50 dark:hover:text-white"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        type="button"
      >
        {resolvedTheme === "dark" ? <IconSun className="size-5" /> : <IconMoon className="size-5" />}
      </button>
    </div>
  );
}
