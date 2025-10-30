"use client";

import { QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "@/utils/queryClient";

import type { PropsWithChildren, ReactElement } from "react";

export default function ReactQueryProvider({ children }: PropsWithChildren): ReactElement {
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
