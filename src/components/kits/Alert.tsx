import { IconAlertCircle } from "@tabler/icons-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = { children: React.ReactNode };

export default function ContentAlert({ children }: Props) {
  return (
    <section className="mt-4">
      <Alert variant="info">
        <IconAlertCircle className="h-4 w-4" />

        <AlertDescription>{children}</AlertDescription>
      </Alert>
    </section>
  );
}
