export function brl(value: number): string {
  return `R$ ${brlNumber(value)}`;
}

export function brlNumber(value: number): string {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function brlDecimal(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "R$ 0,00";
  const raw = String(value);
  const neg = raw.trim().startsWith("-");
  const clean = raw.replace(/[^0-9.]/g, "");
  const [intPart, decRaw = ""] = clean.split(".");
  const dec = (decRaw + "00").slice(0, 2);
  const intFmt = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${neg ? "-" : ""}R$ ${intFmt},${dec}`;
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCpfCnpj(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length === 0) return "";
  if (d.length <= 11) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function maskYearModel(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 4) return d;
  return `${d.slice(0, 4)}/${d.slice(4)}`;
}

export function formatPlate(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

export function isoToBR(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function formatDateTimeBR(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} · ${hh}:${min}`;
}
