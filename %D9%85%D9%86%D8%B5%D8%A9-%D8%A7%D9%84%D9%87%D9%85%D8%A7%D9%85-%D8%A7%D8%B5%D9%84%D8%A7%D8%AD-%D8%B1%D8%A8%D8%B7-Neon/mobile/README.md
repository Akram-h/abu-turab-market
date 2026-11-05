# مشروع تطبيقي الجوال (Capacitor)
الخطوات الكاملة في `../README.md` (الخطوتان 2 و3). الأوامر باختصار:

```
npm install
node scripts/prepare.js https://رابط-خادمك
npx cap add android      # و/أو: npx cap add ios
npx @capacitor/assets generate
npx cap sync
npx cap open android     # أو: npx cap open ios
```
بعد أي تعديل على `../server/public` شغّل: `npm run sync`.
