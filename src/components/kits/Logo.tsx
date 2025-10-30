import Image from "next/image";

import type { ReactElement } from "react";

type Sizes = "xs" | "sm" | "md" | "lg" | "xl";

type Props = { size?: Sizes };

export default function Logo({ size = "md" }: Props): ReactElement {
  const sizes: Record<Sizes, string> = {
    lg: "w-[100px] h-[100px]",
    md: "w-[80px] h-[80px]",
    sm: "w-[60px] h-[60px]",
    xl: "w-[120px] h-[120px]",
    xs: "w-[30px] h-[30px]"
  };

  return (
    <div className={`relative ${sizes[size]}`}>
      <Image
        alt="app-logo"
        className="size-full object-contain"
        height={0}
        priority
        src="/images/logo.webp"
        unoptimized
        width={0}
      />
    </div>
  );
}
