export function normalizeTableSearchParam(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === null || raw === undefined) return "";
  const normalized = String(raw).trim();
  if (!normalized) return "";
  return /^\d+$/.test(normalized) ? normalized.padStart(2, "0") : normalized;
}

export function buildEvaluationLink(baseUrl: string, table: string, tenantId: string) {
  const url = new URL(baseUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("URL inválida");
  url.pathname = "/avaliar";
  url.hash = "";
  url.search = "";
  url.searchParams.set("mesa", normalizeTableSearchParam(table));
  url.searchParams.set("t", tenantId);
  return url.toString();
}