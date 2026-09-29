"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Car, FileText } from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import { getClients, getVehicles, getServiceOrders } from "@/lib/data";
import { onlyDigits } from "@/lib/format";

interface Result {
  key: string;
  type: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  href: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const clients = useResource(
    () => (enabled ? getClients() : Promise.resolve([])),
    [enabled],
  );
  const vehicles = useResource(
    () => (enabled ? getVehicles() : Promise.resolve([])),
    [enabled],
  );
  const orders = useResource(
    () => (enabled ? getServiceOrders() : Promise.resolve([])),
    [enabled],
  );

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo<Result[]>(() => {
    const q = term.trim().toLowerCase();
    if (q.length < 2) return [];
    const qDigits = onlyDigits(term);
    const clientName = (id: number) =>
      clients.data?.find((c) => c.id === id)?.name ?? "";

    const out: Result[] = [];

    for (const c of clients.data ?? []) {
      const match =
        c.name.toLowerCase().includes(q) ||
        (qDigits.length > 0 && onlyDigits(c.cpfCnpj ?? "").includes(qDigits)) ||
        (qDigits.length > 0 && onlyDigits(c.telephone).includes(qDigits));
      if (match)
        out.push({
          key: `c${c.id}`,
          type: "Cliente",
          icon: <Users size={15} />,
          label: c.name,
          sub: c.cpfCnpj || c.telephone || "",
          href: `/clients?q=${encodeURIComponent(c.name)}`,
        });
      if (out.filter((r) => r.type === "Cliente").length >= 5) break;
    }

    for (const v of vehicles.data ?? []) {
      const owner = clientName(v.clientId ?? -1);
      const hay = [v.plate, v.brand, v.model, owner].join(" ").toLowerCase();
      const match =
        hay.includes(q) ||
        (qDigits.length > 0 && onlyDigits(v.renavam ?? "").includes(qDigits));
      if (match)
        out.push({
          key: `v${v.id}`,
          type: "Veículo",
          icon: <Car size={15} />,
          label: v.plate || `${v.brand} ${v.model}`,
          sub: `${v.brand} ${v.model}`,
          href: `/vehicles?q=${encodeURIComponent(v.plate || v.model || "")}`,
        });
      if (out.filter((r) => r.type === "Veículo").length >= 5) break;
    }

    for (const o of orders.data ?? []) {
      const hay = [o.code, clientName(o.clientId)].join(" ").toLowerCase();
      if (hay.includes(q))
        out.push({
          key: `o${o.id}`,
          type: "OS",
          icon: <FileText size={15} />,
          label: o.code,
          sub: clientName(o.clientId),
          href: `/orders?q=${encodeURIComponent(o.code)}`,
        });
      if (out.filter((r) => r.type === "OS").length >= 5) break;
    }

    return out;
  }, [term, clients.data, vehicles.data, orders.data]);

  function go(href: string) {
    setOpen(false);
    setTerm("");
    router.push(href);
  }

  const loading =
    enabled && (clients.loading || vehicles.loading || orders.loading);

  return (
    <div ref={boxRef} className="relative hidden xl:block">
      <div className="flex w-[244px] items-center gap-[9px] rounded-pill border border-border bg-card px-4 py-2.5 text-text-3">
        <Search size={17} className="shrink-0" />
        <input
          type="search"
          value={term}
          placeholder="Buscar OS, cliente, placa…"
          onFocus={() => {
            setEnabled(true);
            setOpen(true);
          }}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) go(results[0].href);
            if (e.key === "Escape") setOpen(false);
          }}
          className="w-full border-none bg-transparent text-[13.5px] text-text-1 outline-none placeholder:text-text-3 [&::-webkit-search-cancel-button]:appearance-none"
        />
      </div>

      {open && term.trim().length >= 2 && (
        <div className="fade-in absolute right-0 top-[46px] z-40 max-h-[70vh] w-[340px] overflow-y-auto rounded-xl border border-border bg-menu p-1.5 shadow-pop">
          {loading ? (
            <div className="px-3 py-4 text-center text-[13px] text-text-3">
              Buscando…
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-4 text-center text-[13px] text-text-3">
              Nenhum resultado para “{term.trim()}”.
            </div>
          ) : (
            results.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => go(r.href)}
                className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left hover:bg-row-hover"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-soft text-text-2">
                  {r.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-text-1">
                    {r.label}
                  </span>
                  <span className="block truncate text-[11.5px] text-text-3">
                    {r.sub}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-surface-soft px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.4px] text-text-3">
                  {r.type}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
