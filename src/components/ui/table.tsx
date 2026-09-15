import type { TableHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({
  className,
  children,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn(
        "w-full border-collapse text-[13.5px]",
        "[&_thead_th]:border-b [&_thead_th]:border-border [&_thead_th]:px-5 [&_thead_th]:py-2.5 [&_thead_th]:text-left [&_thead_th]:text-[10.5px] [&_thead_th]:font-bold [&_thead_th]:uppercase [&_thead_th]:tracking-[0.9px] [&_thead_th]:text-text-3 [&_thead_th]:whitespace-nowrap",
        "[&_tbody_td]:border-b [&_tbody_td]:border-border [&_tbody_td]:px-5 [&_tbody_td]:py-3.5 [&_tbody_td]:align-middle [&_tbody_td]:text-text-1",
        "[&_tbody_tr]:transition-colors [&_tbody_tr:nth-child(even)]:bg-row-alt [&_tbody_tr:hover]:bg-row-hover [&_tbody_tr:last-child_td]:border-b-0",
        className,
      )}
      {...props}
    >
      {children}
    </table>
  );
}
