import { describe, expect, it } from "vitest";
import { INSTALL_DELAY_MS, installationPlatform, isPreviewHostname } from "./pwa-policy";

describe("PWA installation rules", () => {
  it("opens installation after two seconds", () => expect(INSTALL_DELAY_MS).toBe(2000));
  it("rejects all preview hosts while retaining published domains", () => {
    for (const host of ["id-preview--abc.lovable.app", "preview-12--abc.gpt-eng.com", "project--abc-dev.lovable.app", "app.lovableproject.com", "beta.lovable.dev", "localhost"]) expect(isPreviewHostname(host)).toBe(true);
    expect(isPreviewHostname("swift-plate-score.lovable.app")).toBe(false);
    expect(isPreviewHostname("preview-v2--shop.example.com")).toBe(false);
    expect(isPreviewHostname("delegated.example.com", "delegated.example.com")).toBe(true);
  });
  it("selects instructions for iPhone, iPad, Android and desktop", () => {
    expect(installationPlatform("iPhone", 1)).toBe("ios");
    expect(installationPlatform("Macintosh", 5)).toBe("ios");
    expect(installationPlatform("Android", 1)).toBe("android");
    expect(installationPlatform("Windows", 0)).toBe("desktop");
  });
});