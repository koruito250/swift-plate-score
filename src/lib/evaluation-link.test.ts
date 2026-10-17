import { describe, expect, test } from "bun:test";
import { buildEvaluationLink, normalizeTableSearchParam } from "./evaluation-link";

describe("QR da mesa e restaurante", () => {
  test("Mesa 01 é preenchida automaticamente", () => {
    const url = new URL(buildEvaluationLink("https://swift-plate-score.lovable.app/avaliar", "1", "restaurante-a"));
    expect(normalizeTableSearchParam(url.searchParams.get("mesa"))).toBe("01");
  });
  test("Mesa 7 mantém 07 mesmo com parâmetros antigos na URL", () => {
    const url = new URL(buildEvaluationLink("https://swift-plate-score.lovable.app/avaliar?mesa=01&t=antigo#fim", "7", "restaurante-b"));
    expect(url.searchParams.getAll("mesa")).toEqual(["07"]);
    expect(url.searchParams.getAll("t")).toEqual(["restaurante-b"]);
    expect(url.pathname).toBe("/avaliar");
  });
});