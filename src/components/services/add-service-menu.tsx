"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import type { Service } from "@/types";

const MAX_RENDERED = 50;

function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function AddServiceMenu({
  services,
  onPick,
}: {
  services: Service[];
  onPick: (service: Service) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(
    () =>
      [...services].sort((a, b) =>
        a.serviceName.localeCompare(b.serviceName, "pt-BR", {
          sensitivity: "base",
        }),
      ),
    [services],
  );

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return sorted;
    return sorted.filter((s) => norm(s.serviceName).includes(q));
  }, [sorted, query]);

  const visible = filtered.slice(0, MAX_RENDERED);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  return (
    <div ref={boxRef} className="relative">
      <Button
        variant="soft"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        disabled={services.length === 0}
      >
        <Plus size={15} />
        Adicionar serviço
      </Button>
      {open && (
        <div className="fade-in absolute right-0 top-[38px] z-30 flex max-h-[320px] w-[320px] flex-col overflow-hidden rounded-lg border border-border bg-menu shadow-pop">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search size={15} className="shrink-0 text-text-3" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter" && visible[0]) {
                  onPick(visible[0]);
                  setOpen(false);
                }
              }}
              placeholder="Buscar serviço…"
              className="w-full border-none bg-transparent text-[13.5px] text-text-1 outline-none placeholder:text-text-3"
            />
          </div>
          <div className="overflow-y-auto p-1.5">
            {visible.length === 0 ? (
              <div className="px-2.5 py-4 text-center text-[13px] text-text-3">
                {services.length === 0
                  ? "Nenhum serviço cadastrado."
                  : "Nenhum serviço encontrado."}
              </div>
            ) : (
              visible.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onPick(s);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left hover:bg-row-hover"
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] text-text-1">
                    {s.serviceName}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-text-3">
                    {brl(s.price)}
                  </span>
                </button>
              ))
            )}
            {filtered.length > MAX_RENDERED && (
              <div className="px-2.5 py-2 text-center text-[11.5px] text-text-3">
                Mostrando {MAX_RENDERED} de {filtered.length} — refine a busca.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
