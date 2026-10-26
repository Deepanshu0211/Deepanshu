// ICE servers for multiplayer (world/net.ts). Two browsers on different networks often cannot reach each other
// directly (mobile data, carrier-grade NAT, office firewalls); a TURN relay carries their traffic instead.
// Short-lived relay credentials are fetched here, server-side, so the provider's secret never reaches the page.
//   Cloudflare Realtime TURN: CLOUDFLARE_TURN_KEY_ID + CLOUDFLARE_TURN_API_TOKEN
//   Metered (metered.ca):     METERED_DOMAIN (e.g. yourapp.metered.live) + METERED_API_KEY
// With neither set, only public STUN is returned: fine on one network, unreliable across networks.
export const dynamic = "force-dynamic";

type Ice = { urls: string | string[]; username?: string; credential?: string };
const STUN: Ice[] = [{ urls: ["stun:stun.cloudflare.com:3478", "stun:stun.l.google.com:19302"] }];

/** Port 53 TURN often times out in browsers (Cloudflare's own advice), so it is left out. */
function usable(servers: Ice[]) {
  return servers.map(s => ({ ...s, urls: (Array.isArray(s.urls) ? s.urls : [s.urls]).filter(u => !/:53(\?|$)/.test(u)) })).filter(s => s.urls.length);
}

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const { CLOUDFLARE_TURN_KEY_ID: keyId, CLOUDFLARE_TURN_API_TOKEN: token, METERED_DOMAIN: domain, METERED_API_KEY: apiKey } = process.env;
    if (keyId && token) {
      const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(keyId)}/credentials/generate-ice-servers`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ ttl: 6 * 60 * 60 }), cache: "no-store",
      });
      if (r.ok) { const data = await r.json() as { iceServers: Ice[] | Ice }; return Response.json({ relay: true, iceServers: usable(Array.isArray(data.iceServers) ? data.iceServers : [data.iceServers]) }, { headers }); }
      console.error("TURN: Cloudflare answered", r.status);
    } else if (domain && apiKey) {
      const r = await fetch(`https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`, { cache: "no-store" });
      if (r.ok) return Response.json({ relay: true, iceServers: usable(await r.json() as Ice[]) }, { headers });
      console.error("TURN: Metered answered", r.status);
    }
  } catch (error) { console.error("TURN: credentials unavailable", error); }
  return Response.json({ relay: false, iceServers: STUN }, { headers });
}
