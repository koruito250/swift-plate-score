import { createContext, useContext } from "react";

export interface TenantInfo {
  id: string;
  nome: string;
  login: string;
  valor_assinatura: number;
  data_expiracao: string;
  status: "ativo" | "bloqueado";
}

export const TenantContext = createContext<TenantInfo | null>(null);

export function useTenant(): TenantInfo {
  const t = useContext(TenantContext);
  if (!t) throw new Error("TenantContext não inicializado.");
  return t;
}
