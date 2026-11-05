const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async()=>{
 const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await br.newContext({viewport:{width:390,height:844}});
 const calls=[];
 await ctx.addInitScript(()=>{window.__calls=[];const lst={};window.Capacitor={isNativePlatform:()=>true,Plugins:{
  App:{addListener:(n,f)=>{lst[n]=f;window.__lst=lst},exitApp:()=>window.__calls.push('exit')},
  Filesystem:{writeFile:(o)=>{window.__calls.push(['write',o.path,o.directory,atob(o.data).length]);return Promise.resolve({uri:'file:///cache/'+o.path})}},
  Share:{share:(o)=>{window.__calls.push(['share',o.title,o.url]);return Promise.resolve()}}}}});
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 const R=[];const t=(n,c)=>R.push((c?'PASS ':'FAIL ')+n);
 await pg.goto('http://localhost:8794/index.html');await pg.waitForSelector('#lu');
 t('mobile app loads from other origin (bundled assets)',true);
 await pg.fill('#lu','owner1');await pg.fill('#lp','ownerpass1');await pg.click('[data-a=login]');await pg.waitForSelector('#sn',{timeout:8000});
 t('cross-origin login works through CORS',(await pg.$('#sn'))!==null&&(await pg.evaluate(()=>me&&me.role==='owner')));
 await pg.fill('#sn','مدرسة');await pg.fill('#pn','م');await pg.fill('#pu','prinm');await pg.fill('#pw','pass1234');await pg.click('[data-a=addsch]');await pg.waitForTimeout(500);
 await pg.click('[data-a=drawer]');await pg.click('.dr [data-t=set]');await pg.waitForTimeout(200);
 await pg.click('[data-a=expall]');await pg.waitForTimeout(600);
 const calls2=await pg.evaluate(()=>window.__calls);
 t('native export uses Filesystem+Share',calls2.some(c=>c[0]=='write'&&c[2]=='CACHE'&&c[3]>50)&&calls2.some(c=>c[0]=='share'&&String(c[2]).startsWith('file:///cache/alhamam-all-')));
 await pg.evaluate(()=>window.print());await pg.waitForTimeout(200);t('print replaced by notice in native app',(await pg.innerText('#t')).includes('الطباعة'));
 await pg.evaluate(()=>{ui.drawer=true;render()});await pg.evaluate(()=>window.__lst.backButton());t('back button closes drawer',(await pg.$('.dr'))===null);
 await pg.evaluate(()=>{go('set');render()});await pg.evaluate(()=>window.__lst.backButton());t('back button returns to home tab',await pg.evaluate(()=>tab==='sch'));
 await pg.evaluate(()=>window.__lst.backButton());t('back button on home exits app',(await pg.evaluate(()=>window.__calls)).includes('exit'));
 // wrong server -> clear message
 await pg.evaluate(()=>{logoutLocal();API='http://localhost:9';render()});await pg.fill('#lu','x');await pg.fill('#lp','y');await pg.click('[data-a=login]');await pg.waitForTimeout(600);
 t('unreachable server shows clear message',(await pg.innerText('#er')).includes('تعذر الوصول إلى الخادم'));
 console.log(R.join('\n'));console.log('ERRORS:',JSON.stringify(errs));await br.close();
})().catch(e=>{console.log('TESTFAIL',e.message.slice(0,400));process.exit(1)});
