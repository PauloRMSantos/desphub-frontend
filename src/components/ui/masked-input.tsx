import { forwardRef } from "react";
import { Input, type InputProps } from "./input";
import { maskCpfCnpj, maskPhone } from "@/lib/format";

type MaskFn = (value: string) => string;

export interface MaskedInputProps
  extends Omit<InputProps, "value" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  mask: MaskFn;
}

const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ value, onValueChange, mask, ...props }, ref) => (
    <Input
      ref={ref}
      inputMode="numeric"
      value={mask(value)}
      onChange={(e) => onValueChange(mask(e.target.value))}
      {...props}
    />
  ),
);
MaskedInput.displayName = "MaskedInput";

export type MaskedFieldProps = Omit<MaskedInputProps, "mask">;

export const PhoneInput = forwardRef<HTMLInputElement, MaskedFieldProps>(
  (props, ref) => <MaskedInput ref={ref} mask={maskPhone} {...props} />,
);
PhoneInput.displayName = "PhoneInput";

export const DocInput = forwardRef<HTMLInputElement, MaskedFieldProps>(
  (props, ref) => <MaskedInput ref={ref} mask={maskCpfCnpj} {...props} />,
);
DocInput.displayName = "DocInput";
