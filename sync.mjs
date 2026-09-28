// Funzione di sincronizzazione di Tuttoverde.
// Ogni "codice" (token) identifica un archivio. Il server non salva mai il codice:
// usa solo il suo hash SHA-256 come nome dell'archivio.
import { getStore } from "@netlify/blobs";

const COLLS = ["clients", "appts", "tx", "treat"];
const MAX_BYTES = 3_000_000;
const TOMB_TTL = 1000 * 60 * 60 * 24 * 365;

function emptyState() {
  return { clients: [], appts: [], tx: [], treat: [], del: {}, meta: { _u: 0 } };
}

// Unione record per record: vince la modifica piu' recente (_u); le cancellazioni (del) battono i record piu' vecchi.
export function mergeStates(a, b) {
  a = a || {}; b = b || {};
  const out = emptyState();
  const now = Date.now();
  const del = Object.assign({}, a.del || {});
  Object.keys(b.del || {}).forEach((k) => { if ((b.del[k] || 0) > (del[k] || 0)) del[k] = b.del[k]; });
  Object.keys(del).forEach((k) => { if (now - del[k] > TOMB_TTL) delete del[k]; });
  COLLS.forEach((c) => {
    const m = {};
    [a[c] || [], b[c] || []].forEach((list) => {
      list.forEach((r) => {
        if (!r || typeof r.id !== "string") return;
        const o = m[r.id];
        if (!o || (r._u || 0) > (o._u || 0)) m[r.id] = r;
      });
    });
    Object.keys(m).forEach((id) => {
      const t = del[c + "/" + id];
      if (t && t >= (m[id]._u || 0)) return;
      out[c].push(m[id]);
    });
  });
  out.del = del;
  const ma = a.meta || { _u: 0 }, mb = b.meta || { _u: 0 };
  out.meta = (mb._u || 0) > (ma._u || 0) ? mb : ma;
  return out;
}

async function sha256hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!/^[A-Za-z0-9_-]{24,128}$/.test(token)) return json({ error: "token" }, 401);
  const key = await sha256hex(token);
  const store = getStore("tuttoverde");
  const cur = (await store.get(key, { type: "json" })) || emptyState();

  if (req.method === "GET") return json({ state: cur });

  if (req.method === "POST") {
    const text = await req.text();
    if (text.length > MAX_BYTES) return json({ error: "too_large" }, 413);
    let body;
    try { body = JSON.parse(text); } catch { return json({ error: "json" }, 400); }
    if (!body || typeof body.state !== "object") return json({ error: "state" }, 400);
    const merged = mergeStates(cur, body.state);
    await store.setJSON(key, merged);
    return json({ state: merged });
  }
  return json({ error: "method" }, 405);
};

export const config = { path: "/api/sync" };
