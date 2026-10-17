import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildEvaluationLink, normalizeTableSearchParam } from "./evaluation-link";

describe("QR da mesa e restaurante", () => {
  test("Mesa 01 é preenchida automaticamente", () => {
    const url = new URL(buildEvaluationLink("https://swift-plate-score.lovable.app/avaliar", "1", "restaurante-a"));
    assert.equal(normalizeTableSearchParam(url.searchParams.get("mesa")), "01");
  });
  test("Mesa 7 mantém 07 mesmo com parâmetros antigos na URL", () => {
    const url = new URL(buildEvaluationLink("https://swift-plate-score.lovable.app/avaliar?mesa=01&t=antigo#fim", "7", "restaurante-b"));
    assert.deepEqual(url.searchParams.getAll("mesa"), ["07"]);
    assert.deepEqual(url.searchParams.getAll("t"), ["restaurante-b"]);
    assert.equal(url.pathname, "/avaliar");
  });
});