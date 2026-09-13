import { Car } from "lucide-react";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function VeiculosPage() {
  return (
    <PagePlaceholder
      icon={<Car size={30} />}
      title="Veículos"
      description="Lista e cadastro de veículos serão construídos na Onda 6."
    />
  );
}
