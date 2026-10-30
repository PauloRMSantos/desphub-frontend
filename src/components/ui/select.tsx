"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldBase, stateStyles, type FieldState } from "./input";

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  state?: FieldState;
  searchable?: boolean;
  sorted?: boolean;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
}

interface Opt {
  value: string;
  label: string;
  disabled: boolean;
}

const MAX_RENDERED = 60;

function nodeText(node: ReactNode): string {
  if (node == null || node === false || node === true) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement(node)) {
    return nodeText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function Select({
  state = "default",
  searchable,
  sorted = true,
  className,
  children,
  value,
  onChange,
  disabled,
  ...props
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { placeholder, options } = useMemo(() => {
    const opts: Opt[] = [];
    let ph: Opt | null = null;
    Children.forEach(children, (child) => {
      if (!isValidElement(child) || child.type !== "option") return;
      const p = child.props as {
        value?: string | number;
        children?: ReactNode;
        disabled?: boolean;
      };
      const v = String(p.value ?? "");
      const opt: Opt = {
        value: v,
        label: nodeText(p.children) || v,
        disabled: !!p.disabled,
      };
      if (v === "") ph = opt;
      else opts.push(opt);
    });
    if (sorted) {
      opts.sort((a, b) =>
        a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }),
      );
    }
    return { placeholder: ph as Opt | null, options: opts };
  }, [children, sorted]);

  const showSearch = searchable ?? true;
  const current = String(value ?? "");
  const selected = options.find((o) => o.value === current) ?? null;

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return options;
    return options.filter((o) => norm(o.label).includes(q));
  }, [options, query]);

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
      setActive(0);
      if (showSearch) requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, showSearch]);

  function choose(v: string) {
    onChange?.({
      target: { value: v },
    } as unknown as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = visible[active];
      if (opt && !opt.disabled) choose(opt.value);
    }
  }

  const triggerLabel = selected?.label ?? placeholder?.label ?? "Selecione…";

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          fieldBase,
          stateStyles[state],
          "flex items-center justify-between gap-2 pr-3 text-left disabled:cursor-not-allowed disabled:opacity-60",
        )}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        <span className={cn("truncate", !selected && "text-[#a9b2be]")}>
          {triggerLabel}
        </span>
        <ChevronDown size={16} className="shrink-0 text-text-3" />
      </button>

      {open && (
        <div
          role="listbox"
          onKeyDown={onKeyDown}
          className="fade-in absolute left-0 right-0 top-[calc(100%+6px)] z-40 flex max-h-[300px] flex-col overflow-hidden rounded-xl border border-border bg-menu shadow-pop"
        >
          {showSearch && (
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search size={15} className="shrink-0 text-text-3" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Buscar…"
                className="w-full border-none bg-transparent text-[13.5px] text-text-1 outline-none placeholder:text-text-3"
              />
            </div>
          )}

          <div className="overflow-y-auto p-1.5">
            {placeholder && (
              <button
                type="button"
                onClick={() => choose("")}
                className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] text-text-3 hover:bg-row-hover"
              >
                {placeholder.label}
              </button>
            )}

            {visible.length === 0 ? (
              <div className="px-2.5 py-4 text-center text-[13px] text-text-3">
                Nenhuma opção encontrada.
              </div>
            ) : (
              visible.map((o, i) => {
                const isSelected = o.value === current;
                const isActive = i === active;
                return (
                  <button
                    key={o.value}
                    type="button"
                    disabled={o.disabled}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => !o.disabled && choose(o.value)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] text-text-1 disabled:opacity-40",
                      isActive && "bg-row-hover",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {isSelected && (
                      <Check size={15} className="shrink-0 text-link-blue" />
                    )}
                  </button>
                );
              })
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
