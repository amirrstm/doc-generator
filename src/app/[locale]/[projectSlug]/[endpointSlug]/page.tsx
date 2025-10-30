import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import Endpoint from "@/containers/Endpoint";
import { validateProject } from "@/utils/file";

import fs from "node:fs";
import path from "node:path";
import type { ReactElement } from "react";

type EndpointPageProps = {
  params: Promise<{
    locale: string;
    projectSlug: string;
    endpointSlug: string;
  }>;
};

export default async function EndpointPage({ params }: EndpointPageProps): Promise<ReactElement> {
  const { locale, projectSlug, endpointSlug } = await params;

  // Validate if project exists
  const projectExists = await validateProject(projectSlug);
  if (!projectExists) {
    notFound();
  }

  // Check if the MDX file exists for this endpoint in the current locale
  let mdxPath = path.join(process.cwd(), "docs", projectSlug, locale, "endpoints", `${endpointSlug}.mdx`);

  // If the locale-specific file doesn't exist, try English fallback
  if (!fs.existsSync(mdxPath) && locale !== "en") {
    const fallbackPath = path.join(process.cwd(), "docs", projectSlug, "en", "endpoints", `${endpointSlug}.mdx`);
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
    <div className="prose dark:prose-invert">
      <MDXRemote components={{ Endpoint }} source={mdxContent} />
    </div>
  );
}
