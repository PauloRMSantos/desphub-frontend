import { Wallet } from "lucide-react";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function FinanceiroPage() {
  return (
    <PagePlaceholder
      icon={<Wallet size={30} />}
      title="Financeiro"
      description="Visão geral e orçamentos serão construídos na Onda 9."
    />
  );
}
