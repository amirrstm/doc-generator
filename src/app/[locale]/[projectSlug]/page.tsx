import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import ContentAlert from "@/components/kits/Alert";
import { ContentDescription, ContentImage, ContentTitle } from "@/components/kits/Intro";
import { validateProject } from "@/utils/file";

import fs from "node:fs";
import path from "node:path";
import type { ReactElement } from "react";

export default async function ProjectPage({
  params
}: {
  params: Promise<{ locale: string; projectSlug: string }>;
}): Promise<ReactElement> {
  const { locale, projectSlug } = await params;

  const projectExists = await validateProject(projectSlug);
  if (!projectExists) notFound();

  // Try to read the locale-specific intro file
  let mdxPath = path.join(process.cwd(), "docs", projectSlug, locale, "intro.mdx");

  // If the locale-specific file doesn't exist, try English fallback
  if (!fs.existsSync(mdxPath) && locale !== "en") {
    const fallbackPath = path.join(process.cwd(), "docs", projectSlug, "en", "intro.mdx");
    if (fs.existsSync(fallbackPath)) {
      mdxPath = fallbackPath;
    } else {
      notFound();
    }
  } else if (!fs.existsSync(mdxPath)) {
    notFound();
  }

  const mdxContent = fs.readFileSync(mdxPath, "utf-8");

  return (
    <div className="container mx-auto px-4">
      <MDXRemote
        components={{
          Description: ContentDescription,
          Image: ContentImage,
          Info: ContentAlert,
          Title: ContentTitle
        }}
        source={mdxContent}
      />
    </div>
  );
}
