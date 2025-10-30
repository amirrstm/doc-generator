/* eslint-disable react-refresh/only-export-components */
"use client";

import { createContext, use, useMemo, useState } from "react";

import type { ReactNode } from "react";
import type { Environment, SidebarData } from "@/utils/file";

type ProjectContextType = {
  projectSlug: string | null;
  sidebarData: SidebarData | null;
  environments: Environment[];
  selectedEnvironment: Environment | null;
  setSelectedEnvironment: (env: Environment) => void;
};

const ProjectContext = createContext<ProjectContextType>({
  environments: [],
  projectSlug: null,
  selectedEnvironment: null,
  setSelectedEnvironment: () => {},
  sidebarData: null
});

type ProjectProviderProps = {
  children: ReactNode;
  projectSlug: string | null;
  sidebarData: SidebarData | null;
  environments: Environment[];
};

export function ProjectProvider({ children, projectSlug, sidebarData, environments }: ProjectProviderProps) {
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(
    environments.length > 0 ? environments[0] : null
  );

  const value = useMemo(
    () => ({
      environments,
      projectSlug,
      selectedEnvironment,
      setSelectedEnvironment,
      sidebarData
    }),
    [projectSlug, sidebarData, environments, selectedEnvironment]
  );

  return <ProjectContext value={value}>{children}</ProjectContext>;
}

export function useProject() {
  const context = use(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
