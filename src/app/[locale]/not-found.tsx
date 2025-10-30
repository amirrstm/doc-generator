import Image from "next/image";
import { useTranslations } from "next-intl";

import type { Metadata } from "next";
import type { ReactElement } from "react";

export const metadata: Metadata = { title: "404 - یافت نشد" };

export default function NotFound(): ReactElement {
  const t = useTranslations("errors");

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col-reverse items-center justify-between p-6 md:flex-row md:p-0">
        <div>
          <h1 className="font-medium text-3xl">{t("404")}</h1>
          <p className="text-muted-foreground">{t("404-description")}</p>
        </div>

        <figure className="size-[400px]">
          <Image alt="404 Error Illustration" height={400} src="/images/error/404.svg" width={400} />
        </figure>
      </div>
    </div>
  );
}
