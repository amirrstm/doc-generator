"use client";

import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProject } from "@/providers/Project";
import { useEnvVarsStore } from "@/stores/envVarsStore";

import type { ReactElement } from "react";

export default function EnvVarsDialog(): ReactElement | null {
  const t = useTranslations("envVars");
  const { projectSlug } = useProject();
  const { isOpen, setIsOpen, getVars, addVar, updateVar, removeVar } = useEnvVarsStore();

  if (!projectSlug) return null;

  const vars = getVars(projectSlug);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogContent className="sm:max-w-lg" dir="ltr">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {vars.length === 0 && <p className="text-center text-muted-foreground text-sm">{t("noVariables")}</p>}

          {vars.map((v, index) => (
            <div className="flex items-center gap-2" key={index}>
              <Input
                className="flex-1 font-mono text-sm"
                onChange={(e) => updateVar(projectSlug, index, { ...v, key: e.target.value })}
                placeholder={t("variableName")}
                value={v.key}
              />
              <Input
                className="flex-1 text-sm"
                onChange={(e) => updateVar(projectSlug, index, { ...v, value: e.target.value })}
                placeholder={t("variableValue")}
                type="password"
                value={v.value}
              />
              <Button onClick={() => removeVar(projectSlug, index)} size="icon" type="button" variant="transparent">
                <IconTrash className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <Button
            className="mt-1 w-full"
            onClick={() => addVar(projectSlug, { key: "", value: "" })}
            size="sm"
            type="button"
            variant="outline"
          >
            <IconPlus className="h-4 w-4" />
            {t("addVariable")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
