#!/usr/bin/env node
'use strict';
/* يجهّز مجلد www من نسخة الويب ويضبط عنوان الخادم داخل التطبيق.
   الاستعمال:  node scripts/prepare.js https://your-server.example.com
   أو:         SERVER_URL=https://your-server.example.com node scripts/prepare.js */
const fs = require('fs'), path = require('path');
const raw = (process.env.SERVER_URL || process.argv[2] || '').trim();
const url = raw.replace(/\/+$/, '');
const okHttps = /^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(url);
const okDev = process.env.ALLOW_HTTP === '1' && /^http:\/\/[a-z0-9.-]+(:\d+)?$/i.test(url);
if (!okHttps && !okDev) {
  console.error('\nخطأ: لم يُحدَّد عنوان الخادم أو أنه غير صالح.\nأعطه بالشكل:  node scripts/prepare.js https://your-app.onrender.com\n(يجب أن يبدأ بـ https:// وبدون مسار بعد اسم النطاق)\n');
  process.exit(1);
}
const src = path.join(__dirname, '..', '..', 'server', 'public'), dst = path.join(__dirname, '..', 'www');
if (!fs.existsSync(path.join(src, 'index.html'))) { console.error('لم أجد ' + src + '/index.html'); process.exit(1); }
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true });
fs.rmSync(path.join(dst, 'sw.js'), { force: true });          // لا حاجة لعامل الخدمة داخل التطبيق
fs.writeFileSync(path.join(dst, 'config.js'), 'window.AL_CONFIG=' + JSON.stringify({ apiBase: url }) + ';\n');
console.log('تم تجهيز www ← عنوان الخادم: ' + url);
