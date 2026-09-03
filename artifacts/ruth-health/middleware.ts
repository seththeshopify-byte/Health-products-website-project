import { next } from "@vercel/edge";

// Matches Facebook, WhatsApp, Twitter/X, LinkedIn, Telegram, Slack, Discord,
// Pinterest, and search engine crawlers. These bots never execute JavaScript,
// so they only ever see the raw index.html unless we intercept and rewrite it here.
const BOT_UA_REGEX =
  /facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Pinterest|Discordbot|Googlebot|bingbot|Applebot/i;

const API_BASE = "https://ruth-health-api.onrender.com/api";

const ROUTE_PATTERNS: { regex: RegExp; type: "products" | "services" | "courses" | "rooms" }[] = [
  { regex: /^\/products\/(\d+)$/, type: "products" },
  { regex: /^\/services\/(\d+)$/, type: "services" },
  { regex: /^\/courses\/(\d+)$/, type: "courses" },
  { regex: /^\/rooms\/(\d+)$/, type: "rooms" },
];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent") || "";

  // Regular human visitors: let the normal SPA rewrite in vercel.json handle it.
  if (!BOT_UA_REGEX.test(userAgent)) {
    return next();
  }

  const matched = ROUTE_PATTERNS.map((p) => ({ ...p, m: url.pathname.match(p.regex) })).find(
    (p) => p.m
  );

  if (!matched || !matched.m) {
    return next();
  }

  const id = matched.m[1];

  try {
    const apiRes = await fetch(`${API_BASE}/${matched.type}/${id}`);
    if (!apiRes.ok) {
      return next();
    }
    const item = await apiRes.json();

    const title = escapeHtml(item.name || "Ruth Health Products & Services");
    const rawDescription = (item.description || "").replace(/\s+/g, " ").trim();
    const description = escapeHtml(rawDescription.slice(0, 200));
    const image: string = item.imageUrl || `${url.origin}/RuthHotelLogo.png`;
    const pageUrl = url.toString();

    const htmlRes = await fetch(`${url.origin}/index.html`);
    let html = await htmlRes.text();

    html = html
      .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
      .replace(
        /<meta name="description" content=".*?"\s*\/>/,
        `<meta name="description" content="${description}" />`
      )
      .replace(
        /<meta property="og:title" content=".*?"\s*\/>/,
        `<meta property="og:title" content="${title}" />`
      )
      .replace(
        /<meta property="og:description" content=".*?"\s*\/>/,
        `<meta property="og:description" content="${description}" />`
      )
      .replace(
        /<meta property="og:type" content=".*?"\s*\/>/,
        `<meta property="og:type" content="website" />\n    <meta property="og:image" content="${image}" />\n    <meta property="og:url" content="${pageUrl}" />`
      )
      .replace(
        /<meta name="twitter:title" content=".*?"\s*\/>/,
        `<meta name="twitter:title" content="${title}" />`
      )
      .replace(
        /<meta name="twitter:description" content=".*?"\s*\/>/,
        `<meta name="twitter:description" content="${description}" />\n    <meta name="twitter:image" content="${image}" />`
      );

    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return next();
  }
}

export const config = {
  matcher: ["/products/:id*", "/services/:id*", "/courses/:id*", "/rooms/:id*"],
};
