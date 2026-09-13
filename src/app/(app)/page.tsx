import { LayoutDashboard } from "lucide-react";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function DashboardPage() {
  return (
    <PagePlaceholder
      icon={<LayoutDashboard size={30} />}
      title="Dashboard"
      description="Os indicadores, gráficos e listas serão construídos na Onda 4."
    />
  );
}
