// مركز أبو تراب للتسوق — خادم بدون أي مكتبات خارجية (Node 18+)
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const PASS = process.env.ADMIN_PASSWORD || 'admin123';
const D = path.join(__dirname, 'data'), F = path.join(D, 'db.json'), IM = path.join(D, 'img'), PUB = path.join(__dirname, 'public');
fs.mkdirSync(IM, { recursive: true });

const seed = {
  settings: { fee: 2000, free: false, disc: 0, minOrder: 0 },
  cats: [['الخضروات','🥬'],['المواد الغذائية','🍚'],['المعلبات','🥫'],['الدجاج واللحوم','🍗'],['الأجبان','🧀'],['التجهيزات المنزلية','🏠'],['التجهيزات المدرسية','🎒'],['المثلجات','🍦'],['أخرى','🛒']].map(([name, icon]) => ({ name, icon })),
  products: [], orders: []
};
let db = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : seed;
const save = () => { fs.writeFileSync(F + '.tmp', JSON.stringify(db)); fs.renameSync(F + '.tmp', F); };
const uid = () => crypto.randomBytes(5).toString('hex');
const sessions = new Map(), tries = new Map();
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.js': 'text/javascript' };

const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
const readBody = req => new Promise((ok, no) => {
  let s = '', n = 0;
  req.on('data', c => { n += c.length; if (n > 3e6) { no(new Error('big')); req.destroy(); } else s += c; });
  req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch (e) { no(e); } });
});
const isAdmin = req => {
  const m = /(?:^|; )sid=([a-f0-9]+)/.exec(req.headers.cookie || '');
  const t = m && sessions.get(m[1]);
  return !!t && t > Date.now();
};
const toStock = v => (v === '' || v == null || isNaN(+v)) ? null : Math.max(0, Math.floor(+v));
const str = (v, n) => String(v ?? '').trim().slice(0, n);

async function api(req, res, url) {
  const p = url.pathname, M = req.method;
  if (p === '/api/store' && M === 'GET') return send(res, 200, { settings: db.settings, cats: db.cats, products: db.products });

  if (p === '/api/order' && M === 'POST') {
    const b = await readBody(req);
    const name = str(b.name, 60), phone = str(b.phone, 20), addr = str(b.addr, 200), note = str(b.note, 200);
    if (!name || !/^[0-9+ ]{7,20}$/.test(phone) || !addr) return send(res, 400, { error: 'بيانات ناقصة' });
    let sub = 0; const items = [], used = [];
    for (const it of Array.isArray(b.items) ? b.items.slice(0, 100) : []) {
      const pr = db.products.find(x => x.id === it.id && x.on !== false), q = Math.floor(+it.q);
      if (pr && q > 0 && q < 100) {
        if (pr.stock != null && q > pr.stock) return send(res, 400, { error: pr.stock > 0 ? `الكمية المتوفرة من ${pr.name} هي ${pr.stock} فقط` : `نفذت كمية ${pr.name}` });
        items.push({ n: pr.name, q, u: pr.unit || '', p: pr.price }); used.push([pr, q]); sub += pr.price * q;
      }
    }
    if (!items.length) return send(res, 400, { error: 'السلة فارغة' });
    if (sub < (db.settings.minOrder || 0)) return send(res, 400, { error: 'أقل مبلغ للطلب ' + db.settings.minOrder });
    used.forEach(([pr, q]) => { if (pr.stock != null) pr.stock = Math.max(0, pr.stock - q); });
    const disc = sub * (db.settings.disc || 0) / 100, fee = db.settings.free ? 0 : (+db.settings.fee || 0);
    const o = { id: uid(), no: (db.orders[0]?.no || 0) + 1, name, phone, addr, note, items, sub, disc, fee, total: sub - disc + fee, ts: Date.now(), done: false };
    db.orders.unshift(o); db.orders = db.orders.slice(0, 2000); save();
    return send(res, 200, { ok: true, no: o.no });
  }

  if (p === '/api/admin/login' && M === 'POST') {
    const ip = req.socket.remoteAddress, t = tries.get(ip) || { n: 0, at: Date.now() };
    if (Date.now() - t.at > 6e5) { t.n = 0; t.at = Date.now(); }
    if (t.n >= 5) return send(res, 429, { error: 'محاولات كثيرة، انتظر 10 دقائق' });
    const b = await readBody(req), a = Buffer.from(String(b.password || '')), c = Buffer.from(PASS);
    if (a.length !== c.length || !crypto.timingSafeEqual(a, c)) { t.n++; tries.set(ip, t); return send(res, 401, { error: 'كلمة المرور غير صحيحة' }); }
    const sid = crypto.randomBytes(24).toString('hex'); sessions.set(sid, Date.now() + 12 * 36e5);
    res.setHeader('Set-Cookie', `sid=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`);
    return send(res, 200, { ok: true });
  }
  if (!p.startsWith('/api/admin/')) return send(res, 404, { error: 'not found' });
  if (!isAdmin(req)) return send(res, 401, { error: 'غير مصرح' });

  if (p === '/api/admin/me') return send(res, 200, { ok: true });
  if (p === '/api/admin/orders' && M === 'GET') return send(res, 200, db.orders);
  let m;
  if ((m = /^\/api\/admin\/orders\/(\w+)$/.exec(p))) {
    const i = db.orders.findIndex(o => o.id === m[1]); if (i < 0) return send(res, 404, {});
    if (M === 'DELETE') db.orders.splice(i, 1); else db.orders[i].done = true;
    save(); return send(res, 200, { ok: true });
  }
  if (p === '/api/admin/settings' && M === 'PUT') {
    const b = await readBody(req);
    db.settings = { fee: Math.max(0, +b.fee || 0), free: !!b.free, disc: Math.min(100, Math.max(0, +b.disc || 0)), minOrder: Math.max(0, +b.minOrder || 0) };
    save(); return send(res, 200, db.settings);
  }
  if (p === '/api/admin/cats' && M === 'PUT') {
    const b = await readBody(req);
    db.cats = (Array.isArray(b) ? b : []).slice(0, 40).map(c => ({ name: str(c.name, 40), icon: str(c.icon, 4) || '🛒' })).filter(c => c.name);
    save(); return send(res, 200, db.cats);
  }
  if (p === '/api/admin/upload' && M === 'POST') {
    const b = await readBody(req), r = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(b.data || '');
    if (!r) return send(res, 400, { error: 'صورة غير صالحة' });
    const n = uid() + '.jpg'; fs.writeFileSync(path.join(IM, n), Buffer.from(r[1], 'base64'));
    return send(res, 200, { url: '/img/' + n });
  }
  if (p === '/api/admin/products' && M === 'POST') {
    const b = await readBody(req), price = +b.price;
    if (!str(b.name, 80) || !(price >= 0)) return send(res, 400, { error: 'الاسم والسعر مطلوبان' });
    const x = { id: uid(), name: str(b.name, 80), price, cat: str(b.cat, 40), unit: str(b.unit, 20), img: str(b.img, 80), on: true, stock: toStock(b.stock) };
    db.products.unshift(x); save(); return send(res, 200, x);
  }
  if ((m = /^\/api\/admin\/products\/(\w+)$/.exec(p))) {
    const i = db.products.findIndex(x => x.id === m[1]); if (i < 0) return send(res, 404, {});
    if (M === 'DELETE') db.products.splice(i, 1);
    else { const b = await readBody(req), x = db.products[i];
      if (b.price !== undefined && +b.price >= 0) x.price = +b.price;
      if (b.on !== undefined) x.on = !!b.on;
      if (b.name) x.name = str(b.name, 80);
      if ('stock' in b) x.stock = toStock(b.stock);
      if (b.cat !== undefined) x.cat = str(b.cat, 40); }
    save(); return send(res, 200, { ok: true });
  }
  send(res, 404, { error: 'not found' });
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x'), p = url.pathname;
    if (p.startsWith('/api/')) return await api(req, res, url);
    let f;
    if (p === '/') f = path.join(PUB, 'index.html');
    else if (p === '/admin') f = path.join(PUB, 'admin.html');
    else if (p.startsWith('/img/')) f = path.join(IM, path.basename(p));
    else if (['/style.css', '/logo.svg'].includes(p)) f = path.join(PUB, path.basename(p));
    if (!f || !fs.existsSync(f)) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', ...(p === '/admin' ? { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } : {}) });
    fs.createReadStream(f).pipe(res);
  } catch (e) { if (!res.headersSent) send(res, 400, { error: 'طلب غير صالح' }); }
}).listen(PORT, () => console.log(`المتجر: http://localhost:${PORT}   الإدارة: http://localhost:${PORT}/admin`));
