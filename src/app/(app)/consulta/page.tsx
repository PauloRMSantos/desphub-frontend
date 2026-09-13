import { CarFront } from "lucide-react";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function ConsultaPage() {
  return (
    <PagePlaceholder
      icon={<CarFront size={30} />}
      title="Consulta de Veículo"
      description="A busca automatizada por placa/RENAVAM será construída na Onda 7."
    />
  );
}
