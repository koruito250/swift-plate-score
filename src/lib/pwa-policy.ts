export const INSTALL_DELAY_MS = 2000;

export function isPreviewHostname(hostname: string, delegatedHostname = "") {
  const host = hostname.toLowerCase();
  if (delegatedHostname && host === delegatedHostname.toLowerCase()) return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"].some(domain => host === domain || host.endsWith(`.${domain}`))) return true;
  return /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+\.(?:lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(host)
    || /^project--.+-dev\.(?:lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(host);
}

export function installationPlatform(userAgent: string, touchPoints: number) {
  if (/iPad|iPhone|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && touchPoints > 1)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "desktop";
}