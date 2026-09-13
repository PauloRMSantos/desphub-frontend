import { Settings } from "lucide-react";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function ConfiguracoesPage() {
  return (
    <PagePlaceholder
      icon={<Settings size={30} />}
      title="Configurações"
      description="Dados do escritório, usuários e preferências serão construídos na Onda 10."
    />
  );
}
