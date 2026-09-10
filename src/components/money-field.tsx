import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatMoney, parseMoneyInput } from "@/lib/money/format";
import type { Currency } from "@/lib/money/types";
import { cn } from "@/lib/utils";

export function MoneyField({
  value,
  onChange,
  currency,
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  currency: Currency;
  className?: string;
}) {
  const [raw, setRaw] = useState(() => String(Math.round(value)));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setRaw(String(Math.round(value)));
  }, [value, focused]);

  return (
    <Input
      inputMode="numeric"
      className={cn("font-sans tabular-nums", className)}
      value={focused ? raw : formatMoney(value, currency)}
      onFocus={() => {
        setFocused(true);
        setRaw(value ? String(Math.round(value)) : "");
      }}
      onBlur={() => {
        setFocused(false);
        onChange(parseMoneyInput(raw));
      }}
      onChange={(e) => {
        setRaw(e.target.value);
        onChange(parseMoneyInput(e.target.value));
      }}
    />
  );
}
