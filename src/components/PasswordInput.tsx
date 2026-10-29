import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PasswordInput({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  return <div className="relative">
    <input id={id} type={visible ? "text" : "password"} required minLength={6} value={value}
      onChange={e => onChange(e.target.value)} autoComplete="current-password"
      className="w-full bg-background border border-border pl-4 pr-12 py-3" />
    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2"
      aria-label={visible ? "Ocultar senha" : "Mostrar senha"} title={visible ? "Ocultar senha" : "Mostrar senha"}
      aria-pressed={visible} onClick={() => setVisible(v => !v)}>
      {visible ? <EyeOff /> : <Eye />}
    </Button>
  </div>;
}