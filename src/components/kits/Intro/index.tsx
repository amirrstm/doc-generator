"use client";

import Image from "next/image";

import type { ReactElement } from "react";

type Props = { children: ReactElement };

export function ContentTitle({ children }: Props) {
  return <h1 className="font-bold text-2xl">{children}</h1>;
}

export function ContentDescription({ children }: Props) {
  return <span className="mt-4 text-gray-500 leading-7 dark:text-gray-400">{children}</span>;
}

export function ContentImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="mt-6">
      <Image
        alt={alt || "project-document"}
        className="h-auto w-full rounded-lg"
        height={1000}
        src={src}
        unoptimized
        width={1000}
      />
    </div>
  );
}
