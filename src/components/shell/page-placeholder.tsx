import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

/** Temporary content for routes whose screen is built in a later wave. */
export function PagePlaceholder({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="fade-in">
      <EmptyState icon={icon} title={title} description={description} />
    </Card>
  );
}
