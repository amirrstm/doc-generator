"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProject } from "@/providers/Project";

import type { ReactElement } from "react";

export default function BaseUrlSelector(): ReactElement | null {
  const { environments, selectedEnvironment, setSelectedEnvironment } = useProject();

  if (environments.length <= 1) return null;

  return (
    <Select
      onValueChange={(value) => {
        const env = environments.find((e) => e.url === value);
        if (env) {
          setSelectedEnvironment(env);
        }
      }}
      value={selectedEnvironment?.url || ""}
    >
      <SelectTrigger size="sm">
        <SelectValue placeholder="Select environment" />
      </SelectTrigger>
      <SelectContent>
        {environments.map((env) => (
          <SelectItem key={env.url} value={env.url}>
            {env.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
