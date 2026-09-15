import { forwardRef, type InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ wrapperClassName, className, ...props }, ref) => (
    <div
      className={cn(
        "flex min-w-[240px] items-center gap-[9px] rounded-pill border border-border-strong bg-input px-4 py-[11px] text-text-3",
        wrapperClassName,
      )}
    >
      <Search size={17} className="shrink-0" />
      <input
        ref={ref}
        type="search"
        className={cn(
          "w-full border-none bg-transparent text-[13.5px] text-text-1 outline-none placeholder:text-text-3",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
SearchInput.displayName = "SearchInput";
