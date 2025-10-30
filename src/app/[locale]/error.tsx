"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import type { Metadata } from "next";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "500 - خطای سرور"
};

export default function ServerError(): ReactElement {
  const t = useTranslations("errors");

  const onRetry = (): void => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between p-6 md:p-0">
        <div>
          <h1 className="font-medium text-3xl">{t("500")}</h1>
          <p className="text-muted-foreground">{t("500-description")}</p>

          <div className="pt-8">
            <Button onClick={onRetry}>{t("retry")}</Button>
          </div>
        </div>
        <div className="size-[400px]">
          <Image alt="500 Error Illustration" height={400} src="/images/error/500.svg" width={400} />
        </div>
      </div>
    </div>
  );
}
