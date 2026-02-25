"use client";

import { IconVariable } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useProject } from "@/providers/Project";
import { useEnvVarsStore } from "@/stores/envVarsStore";

import type { ReactElement } from "react";

export default function EnvVarsButton(): ReactElement | null {
  const { projectSlug } = useProject();
  const { setIsOpen, getVars } = useEnvVarsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!projectSlug) return null;

  const count = mounted ? getVars(projectSlug).filter((v) => v.key).length : 0;

  return (
    <Button className="relative" onClick={() => setIsOpen(true)} size="icon" variant="transparent">
      <IconVariable className="h-5 w-5" />
      {count > 0 && (
        <span className="-top-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
          {count}
        </span>
      )}
    </Button>
  );
}
