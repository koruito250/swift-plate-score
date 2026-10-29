import { test } from "node:test";
import assert from "node:assert/strict";
import { tenantMetrics } from "./tenant-metrics";

test("Valor total considera todos os clientes cadastrados, inclusive bloqueados e vencidos", () => {
  assert.equal(tenantMetrics([
    {status: "ativo", data_expiracao: "2026-12-01", valor_assinatura: 100},
    {status: "bloqueado", data_expiracao: "2026-12-01", valor_assinatura: 200},
    {status: "ativo", data_expiracao: "2026-01-01", valor_assinatura: 50},
  ], "2026-10-29").totalReceita, 350);
});
test("Indicadores separam clientes ativos, bloqueados e vencidos", () => {
  const metrics = tenantMetrics([
    {status: "ativo", data_expiracao: "2026-12-01", valor_assinatura: 100},
    {status: "bloqueado", data_expiracao: "2026-12-01", valor_assinatura: 200},
    {status: "ativo", data_expiracao: "2026-01-01", valor_assinatura: 50},
  ], "2026-10-29");
  assert.deepEqual([metrics.total, metrics.ativos, metrics.bloqueados, metrics.vencidos], [3, 1, 1, 1]);
});