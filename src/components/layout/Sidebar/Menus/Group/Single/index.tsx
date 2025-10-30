"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";

import ApiBadge from "./Badge";

import type { ReactElement } from "react";
import type { APITypes } from "@/constants/api";

type Props = {
  href: string;
  title: string;
  isActive?: boolean;
  type?: string;
};

export default function SidebarSingleMenu({ href, title, isActive, type }: Props): ReactElement | null {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <Link
      className={clsx(
        "group mt-2 flex cursor-pointer items-center gap-x-3 rounded-lg px-4 py-2 font-light text-gray-700",
        "hover:bg-gray-600/5 hover:text-gray-900 lg:mt-0 dark:text-gray-400 dark:hover:bg-gray-200/5 dark:hover:text-gray-300",
        {
          "!text-brand-primary hover:!text-brand-primary hover:!bg-brand-primary/20 !font-bold bg-brand-primary/10": isActive
        }
      )}
      href={href}
    >
      {type && (
        <ApiBadge type={type as APITypes} variant={isActive ? "filled" : "outline"}>
          {type.toUpperCase()}
        </ApiBadge>
      )}
      <div className="flex flex-1 items-center space-x-2.5 text-sm">
        <span>{title}</span>
      </div>
    </Link>
  );
}
