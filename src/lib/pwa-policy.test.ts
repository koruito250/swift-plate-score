import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { INSTALL_DELAY_MS, installationPlatform, isPreviewHostname } from "./pwa-policy";

describe("PWA installation rules", () => {
  it("opens installation after two seconds", () => assert.equal(INSTALL_DELAY_MS, 2000));
  it("rejects all preview hosts while retaining published domains", () => {
    for (const host of ["id-preview--abc.lovable.app", "preview-12--abc.gpt-eng.com", "project--abc-dev.lovable.app", "app.lovableproject.com", "beta.lovable.dev", "localhost"]) assert.equal(isPreviewHostname(host), true);
    assert.equal(isPreviewHostname("swift-plate-score.lovable.app"), false);
    assert.equal(isPreviewHostname("preview-v2--shop.example.com"), false);
    assert.equal(isPreviewHostname("delegated.example.com", "delegated.example.com"), true);
  });
  it("selects instructions for iPhone, iPad, Android and desktop", () => {
    assert.equal(installationPlatform("iPhone", 1), "ios");
    assert.equal(installationPlatform("Macintosh", 5), "ios");
    assert.equal(installationPlatform("Android", 1), "android");
    assert.equal(installationPlatform("Windows", 0), "desktop");
  });
});