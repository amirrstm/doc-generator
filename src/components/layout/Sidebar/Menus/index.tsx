"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { useProject } from "@/providers/Project";

import SidebarSingleMenu from "./Group/Single";

import type { ReactElement } from "react";

export default function SidebarMenus(): ReactElement | null {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const { projectSlug, sidebarData } = useProject();

  return (
    <>
      <div className="mt-8">
        <Link className="mb-3 ps-4 font-extrabold text-gray-900 lg:mb-2 dark:text-gray-200" href={`/${projectSlug}`}>
          {t("main")}
        </Link>
      </div>

      {/* Project-specific sidebar sections */}
      {sidebarData &&
        sidebarData.length > 0 &&
        projectSlug &&
        sidebarData.map((section) => (
          <div className="mt-8" key={section.section}>
            <h5 className="mb-3 ps-4 font-extrabold text-gray-900 lg:mb-2 dark:text-gray-200">{section.section}</h5>
            <ul>
              {section.items.map((item) => (
                <li className="relative scroll-m-4 first:scroll-m-20" key={item.slug}>
                  <SidebarSingleMenu
                    href={`/${projectSlug}/${item.slug}`}
                    isActive={pathname.includes(item.slug)}
                    title={item.title}
                    type={item.method.toLowerCase()}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
    </>
  );
}
