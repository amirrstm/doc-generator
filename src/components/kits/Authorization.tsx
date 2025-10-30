import { Badge } from "@/components/ui/badge";

import type { ReactElement } from "react";

export default function ContentAuthorization(): ReactElement {
  return (
    <div dir="ltr">
      <div className="flex w-full items-baseline border-gray-100 border-b pb-2.5 dark:border-gray-800">
        <h4 className="flex-1 font-bold text-lg">Authorizations</h4>
      </div>

      <div className="flex flex-col gap-3 py-6">
        <div className="flex items-center gap-2 font-mono">
          <p className="text-brand-primary text-sm">Authorization</p>
          <Badge variant="secondary">string</Badge>
          <Badge variant="secondary">header</Badge>
          <Badge variant="destructive">required</Badge>
        </div>

        <p className="whitespace-pre-line font-en text-gray-700 text-sm dark:text-gray-300">
          Bearer authentication header of the form{" "}
          <code className="rounded-md bg-accent px-1 font-mono">Bearer &lt;token&gt;</code>, where{" "}
          <code className="rounded-md bg-accent px-1 font-mono">&lt;token&gt;</code> is your auth token.
        </p>
      </div>
    </div>
  );
}
