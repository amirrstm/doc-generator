import Image from "next/image";

import type { ReactElement } from "react";

export default function PageError(): ReactElement {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <div>
          <h1 className="font-medium text-3xl">خطای پروژه</h1>
          <p className="text-muted-foreground">مشخصات برنامه یافت نشد.</p>
        </div>
        <div className="size-[400px]">
          <Image alt="404" height={400} src="/images/error/500.svg" width={400} />
        </div>
      </div>
    </div>
  );
}
