'use strict';
/* خادم منصة الهمام التعليمية — بدون أي مكتبات خارجية (Node 18+).
   التخزين: ملف JSON (افتراضي) أو PostgreSQL إذا ضُبط DATABASE_URL. */
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), vm = require('vm');
try { fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && m[2] !== '' && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }); } catch (e) { /* لا يوجد ملف .env */ }
const PORT = +process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PUB = path.join(__dirname, 'public');
const TOKEN_DAYS = 30;

/* ---------- التخزين ---------- */
function fileStore() {
  fs.mkdirSync(path.join(DATA_DIR, 'backups'), { recursive: true });
  const f = path.join(DATA_DIR, 'db.json');
  return {
    name: 'file:' + f,
    async load() { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } },
    async save(o) {
      const tmp = f + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(o)); fs.renameSync(tmp, f);
      const day = new Date().toISOString().slice(0, 10), b = path.join(DATA_DIR, 'backups', 'db-' + day + '.json');
      if (!fs.existsSync(b)) { fs.copyFileSync(f, b); const all = fs.readdirSync(path.join(DATA_DIR, 'backups')).sort(); while (all.length > 14) fs.unlinkSync(path.join(DATA_DIR, 'backups', all.shift())); }
    }
  };
}
function pgStore() {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false } });
  return {
    name: 'postgres',
    async load() {
      await pool.query('create table if not exists app_state(id int primary key, doc jsonb not null, updated timestamptz default now())');
      const r = await pool.query('select doc from app_state where id=1'); return r.rows[0] ? r.rows[0].doc : null;
    },
    async save(o) { await pool.query('insert into app_state(id,doc,updated) values(1,$1,now()) on conflict(id) do update set doc=excluded.doc, updated=now()', [JSON.stringify(o)]); }
  };
}
const store = process.env.DATABASE_URL ? pgStore() : fileStore();
let db = null, saving = false, pending = false, timer = null;
function persist() { if (timer) return; timer = setTimeout(async () => { timer = null; if (saving) { pending = true; return; } saving = true; try { await store.save(db); } catch (e) { console.error('save failed', e.message); } saving = false; if (pending) { pending = false; persist(); } }, 250); }
async function flush() { if (timer) { clearTimeout(timer); timer = null; } try { await store.save(db); } catch (e) { console.error(e.message); } }

/* ---------- صندوق المنطق (نفس شيفرة الواجهة + logic.js) ---------- */
const scrypt = (p, s) => crypto.scryptSync(String(p), String(s), 32, { N: 16384 }).toString('hex');
const ctx = vm.createContext({ console, crypto: crypto.webcrypto, NODE: { scrypt }, setTimeout, Date, Math, JSON, Uint8Array });
vm.runInContext(fs.readFileSync(path.join(__dirname, 'core.js'), 'utf8') + '\n' + fs.readFileSync(path.join(__dirname, 'logic.js'), 'utf8'), ctx, { filename: 'sandbox.js' });

function normalize(o) {
  o.schools = Array.isArray(o.schools) ? o.schools : []; o.users = Array.isArray(o.users) ? o.users : []; o.data = o.data && typeof o.data === 'object' ? o.data : {};
  o.meta = o.meta || {}; o.meta.rev = o.meta.rev || 0;
  o.schools.forEach(s => { const d = o.data[s.id] || (o.data[s.id] = {}); ctx.ARR.forEach(k => { if (!d[k]) d[k] = k === 'att' ? {} : []; }); if (!d.info) d.info = {}; d.ann.forEach(a => { if (!a.kind) a.kind = 'adm'; }); if (!s.year) s.year = new Date().getFullYear() + '-' + (new Date().getFullYear() + 1); });
  return o;
}
const secret = () => process.env.APP_SECRET || db.meta.secret;

/* ---------- المصادقة ---------- */
const b64 = b => Buffer.from(b).toString('base64url');
function mkToken(u) { const p = b64(JSON.stringify({ u: u.id, e: Date.now() + TOKEN_DAYS * 864e5, p: (u.hash || '').slice(0, 8) })); return p + '.' + crypto.createHmac('sha256', secret()).update(p).digest('base64url'); }
function userFromToken(t) {
  try {
    const [p, s] = String(t).split('.'); const good = crypto.createHmac('sha256', secret()).update(p).digest('base64url');
    if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return null;
    const o = JSON.parse(Buffer.from(p, 'base64url').toString()); if (o.e < Date.now()) return null;
    const u = allUsers().find(x => x.id === o.u); if (!u || (u.hash || '').slice(0, 8) !== o.p) return null;
    if (u.schoolId) { const s2 = db.schools.find(x => x.id === u.schoolId); if (!s2 || s2.off) return null; }
    return u;
  } catch (e) { return null; }
}
const allUsers = () => (db.owner ? [db.owner] : []).concat(db.users);
const fails = new Map();
function locked(k) { const f = fails.get(k); return f && f.until > Date.now(); }
function fail(k) { const f = fails.get(k) || { n: 0, until: 0 }; if (++f.n >= 5) { f.until = Date.now() + 30000; f.n = 0; } fails.set(k, f); }
function checkPw(u, pw) { try { const a = Buffer.from(scrypt(pw, u.salt)), b = Buffer.from(u.hash); return a.length === b.length && crypto.timingSafeEqual(a, b); } catch (e) { return false; } }
function newUserObj(role, schoolId, name, username, pw) { const salt = crypto.randomBytes(12).toString('hex'); return { id: Date.now().toString(36) + crypto.randomBytes(4).toString('hex'), role, schoolId, name, username, salt, hash: scrypt(pw, salt) }; }

/* ---------- إسقاط البيانات حسب الدور ---------- */
const strip = u => ({ id: u.id, role: u.role, schoolId: u.schoolId || null, name: u.name, username: u.username, subject: u.subject, phone: u.phone, sections: u.sections, children: u.children, read: u.read || {} });
function project(u) {
  const out = { owner: null, schools: [], users: [], data: {} };
  if (u.role === 'owner') { out.schools = db.schools.map(s => Object.assign({}, s, { count: db.data[s.id].students.length })); out.users = db.users.filter(x => x.role === 'principal').map(strip); return out; }
  const s = db.schools.find(x => x.id === u.schoolId), D = db.data[u.schoolId]; out.schools = [s];
  if (u.role === 'principal') { out.users = db.users.filter(x => x.schoolId === u.schoolId).map(strip); out.data[s.id] = D; return out; }
  const clone = JSON.parse(JSON.stringify(D));
  let ids;
  if (u.role === 'teacher') ids = clone.students.filter(st => !u.sections || !u.sections.length || u.sections.includes(st.section)).map(st => st.id);
  else ids = (u.children || []).filter(c => clone.students.some(st => st.id === c));
  clone.students = clone.students.filter(st => ids.includes(st.id));
  const secs = [...new Set(clone.students.map(st => st.section))];
  const byKid = a => a.filter(x => ids.includes(x.sid));
  for (const d in clone.att) { const m = {}; ids.forEach(i => { if (clone.att[d][i]) m[i] = clone.att[d][i]; }); if (Object.keys(m).length) clone.att[d] = m; else delete clone.att[d]; }
  ['grades', 'evals', 'results', 'subs', 'notes'].forEach(k => { if (clone[k]) clone[k] = byKid(clone[k]); });
  clone.arch = clone.arch.map(a => ({ id: a.id, year: a.year, date: a.date, students: a.students.filter(x => ids.includes(x.id)), att: Object.fromEntries(Object.entries(a.att).map(([d, m]) => [d, Object.fromEntries(ids.filter(i => m[i]).map(i => [i, m[i]]))])), grades: byKid(a.grades), evals: byKid(a.evals) }));
  if (u.role === 'parent') {
    const sec = x => !x.section || secs.includes(x.section);
    ['hw', 'lessons', 'sched', 'exsch'].forEach(k => { clone[k] = clone[k].filter(sec); });
    clone.exams = clone.exams.filter(sec).map(e => ({ id: e.id, title: e.title, subject: e.subject, section: e.section, mins: e.mins, date: e.date, by: e.by, qs: e.qs.map(q => ({ q: q.q, o: q.o })) }));
    clone.ann = clone.ann.filter(a => !a.aud || secs.includes(a.aud));
    clone.sections = clone.sections.filter(x => secs.includes(x)); clone.secs = clone.secs.filter(x => secs.includes(x.label)); clone.classes = [];
    out.users = db.users.filter(x => x.schoolId === u.schoolId && x.role === 'teacher' && (!x.sections || !x.sections.length || x.sections.some(y => secs.includes(y)))).map(x => ({ id: x.id, role: 'teacher', schoolId: x.schoolId, name: x.name, subject: x.subject, phone: x.phone, sections: x.sections }));
  }
  out.data[s.id] = clone; return out;
}
const stateFor = u => ({ rev: db.meta.rev, me: strip(u), db: project(u) });

/* ---------- تنظيف المدخلات ---------- */
function cleanForm(f) { const o = {}; if (!f || typeof f !== 'object') return o; let n = 0; for (const k of Object.keys(f)) { if (++n > 3000 || k.length > 120) break; const v = f[k]; if (typeof v === 'string') o[k] = v.slice(0, 8000); else if (typeof v === 'boolean') o[k] = v; else if (Array.isArray(v)) o[k] = v.slice(0, 3000).filter(x => typeof x === 'string').map(x => x.slice(0, 200)); } return o; }
const UI_STR = ['today', 'date', 'sec', 'kid', 'q', 'ay', 'open', 'edit', 'fee', 'take', 'mark'], ROWK = ['user', 'pass', 'name', 'section', 'phone', 'gender', 'birth', 'address', 'sup', 'fee', 'subject', 'sections'];
function cleanUi(u) { const o = {}; if (!u || typeof u !== 'object') return o; UI_STR.forEach(k => { if (typeof u[k] === 'string') o[k] = u[k].slice(0, 200); }); o.se = u.se === true;
  ['imp', 'impt'].forEach(k => { if (Array.isArray(u[k])) o[k] = u[k].slice(0, 3000).filter(r => r && typeof r === 'object').map(r => { const x = {}; ROWK.forEach(c => { if (r[c] != null) x[c] = String(r[c]).slice(0, 300); }); return x; }); }); return o; }
const cleanD = d => { const o = {}; if (d && typeof d === 'object') for (const k of ['c', 'k', 'j', 's', 't']) if (typeof d[k] === 'string') o[k] = d[k].slice(0, 100); return o; };

/* ---------- HTTP ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
const SEC_HDR = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'" };
function send(res, code, obj, extra) { const body = typeof obj === 'string' ? obj : JSON.stringify(obj); res.writeHead(code, Object.assign({ 'Content-Type': typeof obj === 'string' ? 'text/plain' : 'application/json', 'Cache-Control': 'no-store' }, SEC_HDR, extra)); res.end(body); }
function body(req, max = 6e6) { return new Promise((ok, no) => { let n = 0; const c = []; req.on('data', d => { n += d.length; if (n > max) { no(new Error('big')); req.destroy(); } else c.push(d); }); req.on('end', () => { try { ok(JSON.parse(Buffer.concat(c).toString() || '{}')); } catch (e) { no(new Error('json')); } }); req.on('error', no); }); }
const ipOf = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
const hits = new Map(); function limited(ip) { const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60000); a.push(now); hits.set(ip, a); return a.length > 240; }
setInterval(() => { const now = Date.now(); for (const [k, a] of hits) if (!a.some(t => now - t < 60000)) hits.delete(k); }, 60000).unref();
const ALLOWED = ['capacitor://localhost', 'https://localhost', 'http://localhost'].concat((process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean));
function cors(req, res) { const o = req.headers.origin; if (o && ALLOWED.includes(o)) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); } }
let setupCode = null;
function ownerBoot() { if (db.owner) return; const u = process.env.OWNER_USER, p = process.env.OWNER_PASS; if (u && p && p.length >= 6) { db.owner = newUserObj('owner', null, 'مسؤول النظام', u.toLowerCase(), p); console.log('تم إنشاء حساب مسؤول النظام من متغيرات البيئة'); persist(); } else { setupCode = process.env.SETUP_CODE || crypto.randomBytes(4).toString('hex'); console.log('==== رمز إعداد المنصة (أول تشغيل): ' + setupCode + ' ===='); } }

async function api(req, res, url) {
  const ip = ipOf(req); if (limited(ip)) return send(res, 429, { error: 'طلبات كثيرة، انتظر قليلاً' });
  const m = req.method, p = url.pathname;
  if (p === '/api/health') return send(res, 200, { ok: true });
  if (p === '/api/status' && m === 'GET') return send(res, 200, { needSetup: !db.owner });
  if (p === '/api/setup' && m === 'POST') { if (locked('setup|' + ip)) return send(res, 429, { error: 'محاولات كثيرة. انتظر نصف دقيقة' }); const b = await body(req); if (db.owner) return send(res, 403, { error: 'تم الإعداد مسبقاً' }); const un = String(b.username || '').toLowerCase();
    if (!setupCode || String(b.code || '') !== setupCode) { fail('setup|' + ip); return send(res, 403, { error: 'رمز الإعداد غير صحيح' }); }
    if (!/^[a-z0-9_.-]{3,30}$/.test(un) || String(b.password || '').length < 6 || !String(b.name || '').trim()) return send(res, 400, { error: 'تحقق من الاسم واسم المستخدم (إنكليزي) وكلمة المرور (6 أحرف فأكثر)' });
    db.owner = newUserObj('owner', null, String(b.name).slice(0, 100), un, String(b.password)); setupCode = null; db.meta.rev++; persist(); return send(res, 200, { ok: true }); }
  if (p === '/api/login' && m === 'POST') { const b = await body(req, 5e4), un = String(b.username || '').toLowerCase().trim(), k1 = ip + '|' + un;
    if (locked(k1) || locked('u|' + un)) return send(res, 429, { error: 'محاولات كثيرة. انتظر نصف دقيقة ثم أعد المحاولة' });
    const u = allUsers().find(x => x.username === un);
    if (!u || !checkPw(u, String(b.password || ''))) { fail(k1); fail('u|' + un); return send(res, 401, { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }); }
    if (u.schoolId) { const s = db.schools.find(x => x.id === u.schoolId); if (!s || s.off) return send(res, 403, { error: 'هذا الحساب غير متاح حالياً. تواصل مع الإدارة' }); }
    return send(res, 200, Object.assign({ token: mkToken(u) }, stateFor(u))); }
  const u = userFromToken((req.headers.authorization || '').replace('Bearer ', ''));
  if (!u) return send(res, 401, { error: 'انتهت الجلسة، سجّل الدخول من جديد' });
  if (p === '/api/state' && m === 'GET') { if (url.searchParams.get('rev') == db.meta.rev) return send(res, 200, { same: true, rev: db.meta.rev }); return send(res, 200, stateFor(u)); }
  if (p === '/api/act' && m === 'POST') { const b = await body(req);
    ctx.db = db; ctx.me = u; ctx.FORM = cleanForm(b.form); ctx.ui = cleanUi(b.ui); ctx.OUT = { toast: '', err: '', dirty: false, newtok: false }; ctx.__a = String(b.a || '').slice(0, 40); ctx.__i = String(b.i || '').slice(0, 100); ctx.__d = cleanD(b.d);
    try { vm.runInContext('doAction(__a,__i,__d)', ctx, { timeout: 5000 }); } catch (e) { console.error('act error', ctx.__a, e.message); return send(res, 500, { error: 'تعذر تنفيذ العملية' }); }
    if (ctx.OUT.dirty) { db.meta.rev++; persist(); }
    const uo = {}; UI_STR.concat(['se', 'imp', 'impt', 'cred']).forEach(k => { if (k in ctx.ui) uo[k] = ctx.ui[k]; });
    const cur = findUserFresh(u.id); if (!cur) return send(res, 200, { toast: ctx.OUT.toast, ui: uo, gone: true });
    return send(res, 200, Object.assign({ toast: ctx.OUT.toast, ui: uo }, stateFor(cur), ctx.OUT.newtok ? { token: mkToken(cur) } : {})); }
  if (p === '/api/export' && m === 'GET' && u.role === 'principal') return send(res, 200, { sid: u.schoolId, data: db.data[u.schoolId], users: db.users.filter(x => x.schoolId === u.schoolId && x.role !== 'principal') });
  if (p === '/api/import' && m === 'POST' && u.role === 'principal') { const b = await body(req, 2e7); if (!b || b.sid !== u.schoolId || !b.data) return send(res, 400, { error: 'الملف غير صالح لهذه المدرسة' });
    const tmp = normalize({ schools: [db.schools.find(s => s.id === u.schoolId)], users: [], data: { [u.schoolId]: b.data } }); db.data[u.schoolId] = tmp.data[u.schoolId];
    const keep = db.users.filter(x => x.schoolId !== u.schoolId || x.role === 'principal'); const add = (Array.isArray(b.users) ? b.users : []).filter(x => x && (x.role === 'teacher' || x.role === 'parent') && x.username && x.salt && x.hash && !allUsers().some(y => y.username === x.username && y.schoolId !== u.schoolId)).map(x => Object.assign(x, { schoolId: u.schoolId }));
    db.users = keep.concat(add); db.meta.rev++; persist(); return send(res, 200, Object.assign({ toast: 'تم الاستيراد' }, stateFor(u))); }
  if (p === '/api/export-all' && m === 'GET' && u.role === 'owner') { const o = JSON.parse(JSON.stringify(db)); delete o.meta.secret; return send(res, 200, o); }
  if (p === '/api/import-all' && m === 'POST' && u.role === 'owner') { const b = await body(req, 5e7); if (!b || !Array.isArray(b.schools) || !Array.isArray(b.users) || !b.data) return send(res, 400, { error: 'الملف غير صالح' });
    b.owner = db.owner; b.meta = { rev: db.meta.rev + 1, secret: db.meta.secret }; db = normalize(b); persist(); return send(res, 200, Object.assign({ toast: 'تم الاستيراد' }, stateFor(db.owner))); }
  return send(res, 404, { error: 'غير موجود' });
}
const findUserFresh = id => allUsers().find(x => x.id === id);

function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname); if (p === '/') p = '/index.html';
  const f = path.normalize(path.join(PUB, p)); if (!f.startsWith(PUB + path.sep)) return send(res, 403, 'forbidden');
  fs.readFile(f, (e, d) => { if (e) return send(res, 404, 'not found'); const ext = path.extname(f), nocache = /index\.html|sw\.js|manifest/.test(f);
    res.writeHead(200, Object.assign({ 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': nocache ? 'no-cache' : 'public, max-age=86400' }, SEC_HDR, process.env.NODE_ENV === 'production' ? { 'Strict-Transport-Security': 'max-age=15552000' } : {})); res.end(d); });
}

async function main() {
  db = await store.load() || { owner: null, schools: [], users: [], data: {}, meta: {} };
  normalize(db); if (!db.meta.secret) db.meta.secret = crypto.randomBytes(32).toString('hex'); ownerBoot(); persist();
  const server = http.createServer(async (req, res) => {
    try { const url = new URL(req.url, 'http://x'); if (url.pathname.startsWith('/api/')) { cors(req, res); if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); } await api(req, res, url); } else serveStatic(req, res, url); }
    catch (e) { if (!res.headersSent) send(res, e.message === 'big' ? 413 : 400, { error: 'طلب غير صالح' }); }
  });
  server.listen(PORT, () => console.log('Al-Hamam online on port ' + PORT + ' | storage: ' + store.name));
  const stop = async () => { await flush(); process.exit(0); }; process.on('SIGTERM', stop); process.on('SIGINT', stop);
}
process.on('unhandledRejection', e => console.error('unhandled', e && e.message)); process.on('uncaughtException', e => console.error('uncaught', e && e.message));
main().catch(e => { console.error(e); process.exit(1); });
