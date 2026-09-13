import { Users } from "lucide-react";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function ClientesPage() {
  return (
    <PagePlaceholder
      icon={<Users size={30} />}
      title="Clientes"
      description="Lista, ficha e formulário de clientes serão construídos na Onda 5."
    />
  );
}
