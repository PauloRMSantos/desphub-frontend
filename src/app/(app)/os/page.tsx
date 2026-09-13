import { FileText } from "lucide-react";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function OrdensServicoPage() {
  return (
    <PagePlaceholder
      icon={<FileText size={30} />}
      title="Ordens de Serviço"
      description="O formulário de OS com impressão será construído na Onda 8."
    />
  );
}
