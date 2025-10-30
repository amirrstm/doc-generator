import { Skeleton } from "@/components/ui/skeleton";

import type { ReactElement } from "react";

export default function PageSkeleton(): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
