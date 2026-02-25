"use client";

import Header from "./Header";
import EnvVarsDialog from "./Header/EnvVarsDialog";
import SearchDialog from "./Header/Search/SearchDialog";
import Sidebar from "./Sidebar";

import type { PropsWithChildren, ReactElement } from "react";

export default function Layout({ children }: PropsWithChildren): ReactElement {
  return (
    <main>
      <Header />
      <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-8">
        <Sidebar />
        <div className="relative mx-auto box-border w-full grow flex-col px-1 py-24 lg:py-8 lg:ps-[20rem]">{children}</div>
      </div>
      <SearchDialog />
      <EnvVarsDialog />
    </main>
  );
}
