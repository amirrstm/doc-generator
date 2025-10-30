import { notFound } from "next/navigation";

import Layout from "@/components/layout";
import { SearchProvider } from "@/contexts/SearchContext";
import { ProjectProvider } from "@/providers/Project";
import { buildProjectSearchIndex, readProjectEnvironments, readProjectSidebar, validateProject } from "@/utils/file";

import type { ReactElement } from "react";

export default async function ProjectLayout({
  params,
  children
}: {
  params: Promise<{ locale: string; projectSlug: string }>;
  children: ReactElement;
}): Promise<ReactElement> {
  const { locale, projectSlug } = await params;

  const projectExists = await validateProject(projectSlug);
  if (!projectExists) notFound();

  const sidebarData = await readProjectSidebar(projectSlug, locale);
  const environments = await readProjectEnvironments(projectSlug);

  // Build search index server-side
  const searchIndex = sidebarData ? await buildProjectSearchIndex(projectSlug, sidebarData, locale) : [];

  return (
    <ProjectProvider environments={environments || []} projectSlug={projectSlug} sidebarData={sidebarData}>
      <SearchProvider searchIndex={searchIndex}>
        <Layout>{children}</Layout>
      </SearchProvider>
    </ProjectProvider>
  );
}
