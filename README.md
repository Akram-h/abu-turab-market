# مركز أبو تراب للتسوق

## التشغيل
1. ثبّت Node.js 18 أو أحدث.
2. من داخل المجلد:
   - Linux/Mac: `ADMIN_PASSWORD="كلمة-قوية" PORT=3000 node server.js`
   - Windows (PowerShell): `$env:ADMIN_PASSWORD="كلمة-قوية"; node server.js`
3. المتجر: http://localhost:3000  — الإدارة: http://localhost:3000/admin

## مهم قبل الرفع
- غيّر ADMIN_PASSWORD (الافتراضية admin123 غير آمنة).
- فعّل HTTPS (Nginx + Let's Encrypt) حتى لا تنتقل كلمة المرور بدون تشفير.
- البيانات والصور في مجلد data/ — خذ منه نسخة احتياطية دورية.
- للتشغيل الدائم: `npm i -g pm2 && ADMIN_PASSWORD=... pm2 start server.js --name market`
