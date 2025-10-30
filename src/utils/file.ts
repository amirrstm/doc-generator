import fs from "node:fs";
import path from "node:path";

export type SidebarItem = {
  title: string;
  method: string;
  slug: string;
};

export type SidebarSection = {
  section: string;
  items: SidebarItem[];
};

export type SidebarData = SidebarSection[];

export type Environment = {
  name: string;
  url: string;
};

export type SearchItem = {
  id: string;
  title: string;
  method: string;
  description: string;
  category: string;
  projectSlug: string;
  slug: string;
  url: string;
  searchableText: string;
};

/**
 * Read sidebar.json for a specific project and locale
 * @param projectSlug - The project slug (e.g., 'interaction')
 * @param locale - The locale (e.g., 'en', 'fa')
 * @returns Promise<SidebarData | null> - Parsed sidebar data or null if not found
 */
export async function readProjectSidebar(projectSlug: string, locale: string = "en"): Promise<SidebarData | null> {
  try {
    const sidebarPath = path.join(process.cwd(), "docs", projectSlug, locale, "sidebar.json");

    // Check if the locale-specific file exists
    if (!fs.existsSync(sidebarPath)) {
      // Try fallback to English if not found
      if (locale !== "en") {
        console.warn(`Sidebar file not found for project: ${projectSlug} in locale: ${locale}, trying English fallback`);
        const fallbackPath = path.join(process.cwd(), "docs", projectSlug, "en", "sidebar.json");

        if (fs.existsSync(fallbackPath)) {
          const sidebarContent = fs.readFileSync(fallbackPath, "utf-8");
          return JSON.parse(sidebarContent);
        }
      }

      console.warn(`Sidebar file not found for project: ${projectSlug}`);
      return null;
    }

    // Read and parse the JSON file
    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
    const sidebarData: SidebarData = JSON.parse(sidebarContent);

    return sidebarData;
  } catch (error) {
    console.error(`Error reading sidebar for project ${projectSlug}:`, error);
    return null;
  }
}

/**
 * Get list of available projects based on docs directory
 * @returns Promise<string[]> - Array of project slugs
 */
export async function getAvailableProjects(): Promise<string[]> {
  try {
    const docsPath = path.join(process.cwd(), "docs");

    if (!fs.existsSync(docsPath)) {
      return [];
    }

    const entries = fs.readdirSync(docsPath, { withFileTypes: true });
    const projects = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

    return projects;
  } catch (error) {
    console.error("Error reading available projects:", error);
    return [];
  }
}

/**
 * Validate if a project exists
 * @param projectSlug - The project slug to validate
 * @returns Promise<boolean> - True if project exists
 */
export async function validateProject(projectSlug: string): Promise<boolean> {
  try {
    const projectPath = path.join(process.cwd(), "docs", projectSlug);
    return fs.existsSync(projectPath);
  } catch (error) {
    console.error(`Error validating project ${projectSlug}:`, error);
    return false;
  }
}

/**
 * Read env.json for a specific project
 * @param projectSlug - The project slug (e.g., 'interaction')
 * @returns Promise<Environment[] | null> - Parsed environment data or null if not found
 */
export async function readProjectEnvironments(projectSlug: string): Promise<Environment[] | null> {
  try {
    const envPath = path.join(process.cwd(), "docs", projectSlug, "env.json");

    // Check if the file exists
    if (!fs.existsSync(envPath)) {
      console.warn(`Environment file not found for project: ${projectSlug}`);
      return null;
    }

    // Read and parse the JSON file
    const envContent = fs.readFileSync(envPath, "utf-8");
    const envData: Environment[] = JSON.parse(envContent);

    return envData;
  } catch (error) {
    console.error(`Error reading environments for project ${projectSlug}:`, error);
    return null;
  }
}

/**
 * Extract content from MDX file (server-side only)
 */
function extractMDXContent(filePath: string): { description: string; category: string } | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, "utf-8");

    // Extract description from MDX content - handle both template literals and regular strings
    const descriptionMatch = content.match(/description=\{`([^`]+)`\}/) || content.match(/description="([^"]+)"/);
    const description = descriptionMatch?.[1]?.replace(/\n/g, " ").trim() || "";

    // Extract category from MDX content
    const categoryMatch = content.match(/category="([^"]+)"/);
    const category = categoryMatch?.[1] || "";

    return { category, description };
  } catch (error) {
    console.warn(`Failed to extract content from ${filePath}:`, error);
    return null;
  }
}

/**
 * Build search index from sidebar data and MDX files (server-side only)
 */
export async function buildProjectSearchIndex(
  projectSlug: string,
  sidebarData: SidebarData,
  locale: string = "en"
): Promise<SearchItem[]> {
  const searchItems: SearchItem[] = [];

  for (const section of sidebarData) {
    for (const item of section.items) {
      const mdxPath = path.join(process.cwd(), "docs", projectSlug, locale, "endpoints", `${item.slug}.mdx`);
      const mdxContent = extractMDXContent(mdxPath);

      const searchItem: SearchItem = {
        category: mdxContent?.category || section.section,
        description: mdxContent?.description || "",
        id: `${projectSlug}-${locale}-${item.slug}`,
        method: item.method,
        projectSlug,
        searchableText: `${item.title} ${mdxContent?.description || ""} ${mdxContent?.category || section.section}`.toLowerCase(),
        slug: item.slug,
        title: item.title,
        url: `/${projectSlug}/${item.slug}`
      };

      searchItems.push(searchItem);
    }
  }

  return searchItems;
}
