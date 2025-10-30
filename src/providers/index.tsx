"use client";

import { AppProgressProvider as ProgressProvider } from "@bprogress/next";

import { Toaster } from "@/components/ui/sonner";

import ReactQueryProvider from "./ReactQuery";
import ThemeProvider from "./Theme";

import type { PropsWithChildren, ReactElement } from "react";

export default function Providers({ children }: PropsWithChildren): ReactElement {
  return (
    <ProgressProvider color="#017ffe" height="4px" options={{ showSpinner: false }} shallowRouting>
      <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
        <ReactQueryProvider>{children}</ReactQueryProvider>

        <Toaster />
      </ThemeProvider>
    </ProgressProvider>
  );
}
