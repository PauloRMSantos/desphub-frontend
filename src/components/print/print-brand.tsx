export function PrintBrand({ logoUrl }: { logoUrl?: string | null }) {
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl || "/desphub-logo-horizontal.svg"}
        alt="Logo"
        className="h-10 w-auto max-w-[240px] object-contain"
      />
      <div className="mt-1 text-[11px] text-[#5A6472]">
        Sistema inteligente para Despachantes de Trânsito.
      </div>
    </div>
  );
}
