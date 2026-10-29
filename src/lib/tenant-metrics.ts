export interface SubscriptionTenant {
  status: "ativo" | "bloqueado";
  data_expiracao: string;
  valor_assinatura: number;
}

export function tenantMetrics(tenants: SubscriptionTenant[], today: string) {
  return {
    total: tenants.length,
    ativos: tenants.filter(t => t.status === "ativo" && t.data_expiracao >= today).length,
    bloqueados: tenants.filter(t => t.status === "bloqueado").length,
    vencidos: tenants.filter(t => t.status === "ativo" && t.data_expiracao < today).length,
    totalReceita: tenants.reduce((sum, t) => sum + Number(t.valor_assinatura || 0), 0),
  };
}