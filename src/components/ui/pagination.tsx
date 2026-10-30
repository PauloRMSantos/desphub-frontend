"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-border px-4 py-3",
        className,
      )}
    >
      <span className="text-[12.5px] text-text-3">
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="grid h-8 w-8 place-items-center rounded-[10px] border border-border-strong text-text-2 enabled:hover:bg-surface-soft enabled:hover:text-text-1 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[70px] text-center text-[12.5px] text-text-2">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          aria-label="Próxima página"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="grid h-8 w-8 place-items-center rounded-[10px] border border-border-strong text-text-2 enabled:hover:bg-surface-soft enabled:hover:text-text-1 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
