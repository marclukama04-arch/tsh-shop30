// tsh.shop : serveur sans dépendance (Node.js 18 ou plus)
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const PORT = process.env.PORT || 3000;
const PASS = process.env.ADMIN_PASSWORD || "";
const ROOT = __dirname, DIR = process.env.DATA_DIR || ROOT;
const DATA = path.join(DIR, "data"), UP = path.join(DIR, "uploads"), PUB = path.join(ROOT, "public"), SEED = path.join(ROOT, "seed");
if (!PASS) { console.error("ERREUR : définissez la variable ADMIN_PASSWORD (votre mot de passe admin)."); process.exit(1); }

fs.mkdirSync(DATA, { recursive: true }); fs.mkdirSync(UP, { recursive: true });
if (!fs.existsSync(path.join(DATA, "products.json"))) fs.copyFileSync(path.join(SEED, "products.json"), path.join(DATA, "products.json"));
for (const f of fs.readdirSync(path.join(SEED, "uploads"))) {
  const t = path.join(UP, f); if (!fs.existsSync(t)) fs.copyFileSync(path.join(SEED, "uploads", f), t);
}

const rd = f => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8")); } catch { return []; } };
const wr = (f, d) => { const t = path.join(DATA, f + ".tmp"); fs.writeFileSync(t, JSON.stringify(d)); fs.renameSync(t, path.join(DATA, f)); };
const send = (res, c, d) => { res.writeHead(c, { "Content-Type": "application/json" }); res.end(JSON.stringify(d)); };
const body = req => new Promise((ok, ko) => {
  let b = "", n = 0;
  req.on("data", c => { n += c.length; if (n > 8e6) { ko(); req.destroy(); } else b += c; });
  req.on("end", () => { try { ok(JSON.parse(b || "{}")); } catch { ko(); } });
});
const tokens = new Map(), fails = new Map();
const isAdmin = req => { const t = tokens.get(req.headers["x-token"]); return !!t && t > Date.now(); };
const str = (v, n) => String(v ?? "").slice(0, n);
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".ico": "image/x-icon" };

http.createServer(async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-token"); res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    const u = req.url.split("?")[0], m = req.method;
    if (u.startsWith("/api/")) {
      if (u === "/api/login" && m === "POST") {
        const ip = req.socket.remoteAddress, f = fails.get(ip) || { n: 0, t: Date.now() };
        if (Date.now() - f.t > 6e5) { f.n = 0; f.t = Date.now(); }
        if (f.n >= 5) return send(res, 429, {});
        const { password } = await body(req);
        const a = crypto.createHash("sha256").update(String(password || "")).digest(), b = crypto.createHash("sha256").update(PASS).digest();
        if (!crypto.timingSafeEqual(a, b)) { f.n++; fails.set(ip, f); return send(res, 401, {}); }
        const tk = crypto.randomBytes(24).toString("hex"); tokens.set(tk, Date.now() + 12 * 36e5);
        return send(res, 200, { token: tk });
      }
      if (u === "/api/products" && m === "GET") return send(res, 200, rd("products.json"));
      if (u === "/api/products" && m === "PUT") {
        if (!isAdmin(req)) return send(res, 401, {});
        const d = await body(req); if (!Array.isArray(d)) return send(res, 400, {});
        wr("products.json", d); return send(res, 200, { ok: 1 });
      }
      if (u === "/api/upload" && m === "POST") {
        if (!isAdmin(req)) return send(res, 401, {});
        const { data } = await body(req), x = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(data || "");
        if (!x) return send(res, 400, {});
        const name = crypto.randomBytes(8).toString("hex") + "." + (x[1] === "jpeg" ? "jpg" : x[1]);
        fs.writeFileSync(path.join(UP, name), Buffer.from(x[2], "base64")); return send(res, 200, { url: "/uploads/" + name });
      }
      if (u === "/api/orders" && m === "GET") return isAdmin(req) ? send(res, 200, rd("orders.json")) : send(res, 401, {});
      if (u === "/api/orders" && m === "PUT") {
        if (!isAdmin(req)) return send(res, 401, {});
        const d = await body(req); if (!Array.isArray(d)) return send(res, 400, {});
        wr("orders.json", d); return send(res, 200, { ok: 1 });
      }
      if (u === "/api/orders" && m === "POST") {
        const { o = {}, items } = await body(req);
        if (!Array.isArray(items) || !items.length || items.length > 50) return send(res, 400, {});
        const P = rd("products.json"), O = rd("orders.json"); let sub = 0; const lines = [];
        for (const it of items) {
          const p = P.find(x => x.id === it.id), q = Math.floor(+it.q);
          if (!p || !(q >= 1) || p.out || p.st < q) return send(res, 409, { error: "stock" });
          p.st -= q; sub += p.p * q; const opt = [str(it.c, 20), str(it.s, 10)].filter(Boolean).join(", "); lines.push(q + "× " + p.n + (opt ? " (" + opt + ")" : ""));
        }
        const pick = o.ad === "Retrait en boutique", airtel = o.m === "Airtel Money";
        const order = { id: "TSH-" + (1001 + O.length), cl: str(o.cl, 80), tel: str(o.tel, 30), ad: str(o.ad, 200), m: airtel ? "Airtel Money" : "Paiement sur place",
          am: airtel ? str(o.am, 30) : "", t: sub + (pick || sub >= 100 ? 0 : 5), st: "Nouvelle", pd: false, d: new Date().toLocaleDateString("fr-FR"), it: lines.join(", ") };
        O.push(order); wr("products.json", P); wr("orders.json", O); return send(res, 200, { id: order.id });
      }
      return send(res, 404, {});
    }
    // fichiers statiques
    let file;
    if (u.startsWith("/uploads/")) file = path.join(UP, path.normalize(u.slice(9)));
    else file = path.join(PUB, u === "/" ? "index.html" : u.replace(/\/+$/, "") === "/admin" ? "admin.html" : path.normalize(u));
    const base = u.startsWith("/uploads/") ? UP : PUB;
    if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("Introuvable"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": u.startsWith("/uploads/") ? "public, max-age=86400" : "no-cache" });
    fs.createReadStream(file).pipe(res);
  } catch { try { send(res, 400, {}); } catch {} }
}).listen(PORT, () => console.log("tsh.shop prêt sur le port " + PORT));
