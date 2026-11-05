const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const B='http://localhost:8790';
(async()=>{
 const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await br.newContext({viewport:{width:390,height:844}});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept('NewPass123'));
 const R=[];const t=(n,c)=>R.push((c?'PASS ':'FAIL ')+n);
 const W=ms=>pg.waitForTimeout(ms||350);
 const txt=()=>pg.innerText('body'),fill=(i,v)=>pg.fill('#'+i,v),click=async s=>{await pg.click(s);await W()};
 const go=async k=>{await pg.click('[data-a=drawer]');await click(`.dr [data-t=${k}]`)};
 const login=async(u,p)=>{await fill('lu',u);await fill('lp',p);await click('[data-a=login]');await W(500)};
 const logout=async()=>{await pg.click('[data-a=drawer]');await click('.dr [data-a=out]')};
 const api=async(path,tok,body)=>{const r=await fetch(B+path,{method:body?'POST':'GET',headers:Object.assign({'content-type':'application/json'},tok?{authorization:'Bearer '+tok}:{}),body:body?JSON.stringify(body):undefined});let j={};try{j=await r.json()}catch(e){}return{s:r.status,j}};
 const L=async(u,p)=>(await api('/api/login',null,{username:u,password:p})).j;
 await pg.goto(B);await pg.waitForSelector('#lu');
 let b=await txt();t('login page hides roles',!b.includes('المدير')&&!b.includes('المعلم')&&!b.includes('ولي الأمر')&&!b.includes('مسؤول'));
 await login('owner1','ownerpass1');
 await fill('sn','مدرسة النور');await fill('pn','مدير');await fill('pu','prina');await fill('pw','pass1234');await click('[data-a=addsch]');
 await fill('sn','مدرسة ب');await fill('pn','مدير ب');await fill('pu','prinb');await fill('pw','pass1234');await click('[data-a=addsch]');
 t('2 schools (online)',(await txt()).includes('مدرسة النور')&&(await txt()).includes('مدرسة ب'));
 await logout();await login('prina','pass1234');
 await go('cls');await fill('cc','الأول');await click('[data-a=addclass]');
 await pg.selectOption('#sc_cls','الأول');await fill('sc_names','أ, ب');await pg.selectOption('#sc_shift','بنين وبنات');await click('[data-a=addsecs]');
 b=await txt();t('boys+girls same class/section',b.includes('الأول / أ (بنين)')&&b.includes('الأول / أ (بنات)'));
 await pg.check('#cpriv');await click('[data-a=savesc]');
 await go('stu');await click('[data-a=newstu]');await fill('f_name','مريم');await pg.selectOption('#f_section','الأول / ب (بنات)');await fill('f_fee','540000');await click('[data-a=savestu]');
 t('student saved on server',(await txt()).includes('مريم'));
 await pg.setInputFiles('#impxl','/tmp/students2.xlsx');await pg.waitForSelector('[data-a=doimp]');await click('[data-a=doimp]');
 b=await txt();t('xlsx import + credentials list (server)',b.includes('سارة علي')&&b.includes('قائمة حسابات الدخول')&&b.includes('fam1'));
 await go('tch');await pg.setInputFiles('#impt','/tmp/teachers.xlsx');await pg.waitForSelector('[data-a=doimpt]');await click('[data-a=doimpt]');
 b=await txt();t('teachers import',b.includes('tteach1')&&b.includes('علي الخويلدي'));
 await go('par');await click('[data-a=autopar]');const prow=await pg.$$eval('.credc tbody tr',r=>r.map(x=>x.innerText.split('\t')));t('auto parent accounts',prow.length===3);
 await go('sched');await pg.selectOption('#as','الأول / أ (بنات)');await click('[data-a=editsched]');await fill('tt_s_0_1','الرياضيات');await fill('tt_t_0_1','هدى');await fill('tt_s_4_7','الفنية');await click('[data-a=savesched]');
 t('schedule grid via server',(await pg.$$eval('table.tt tbody td',c=>c.map(x=>x.innerText.trim()))).includes('الرياضيات\nهدى'));
 await go('adm');await fill('g_ann_title','عطلة رسمية');await fill('g_ann_body','الدوام معطل غداً');await click('[data-a=addann][data-k=adm]');t('admin notice',(await txt()).includes('عطلة رسمية'));
 await go('exsch');await pg.selectOption('#as','الأول / أ (بنات)');await fill('g_exsch_subject','الرياضيات');await pg.selectOption('#g_exsch_section','الأول / أ (بنات)');await fill('g_exsch_date','2026-11-15');await click('[data-a=addg][data-c=exsch]');t('exam schedule table',(await txt()).includes('الرياضيات'));
 // teacher with account tteach1 (sections A girls + B girls)
 await logout();await login('tteach1','Teach1234');
 b=await txt();t('imported teacher can login',b.includes('الحضور'));
 await go('att');const aBtns=await pg.$$('[data-a=st][data-s=A]');t('teacher sees only assigned sections students',aBtns.length===3);
 await aBtns[0].click();await W();
 await go('gr');await pg.selectOption('#gs',{label:'سارة علي'});await fill('gm','رياضيات');await fill('ge','شهري');await fill('gv','88');await click('[data-a=addgr]');
 await go('eval');await pg.selectOption('#ev_s',{label:'سارة علي'});await fill('ev_n','طالبة مجتهدة');await click('[data-a=addev]');
 await go('sci');await fill('g_ann_title','درس الرياضيات');await fill('g_ann_body','حل صفحة 20');await click('[data-a=addann][data-k=sci]');
 await go('exam');await fill('x_t','اختبار قصير');await fill('x_q','2+2؟ | 3 | 4 | 5 | 6 | 2');await click('[data-a=addexam]');t('exam created',(await txt()).includes('اختبار قصير'));
 await go('hw');await fill('g_hw_title','واجب الجمع');await click('[data-a=addg][data-c=hw]');
 await logout();
 // parent fam1 (two kids: سارة بنات / عمر بنين)
 await login('fam1','Pass1234');b=await txt();t('parent home',b.includes('سارة')||b.includes('عمر'));
 await go('gr');t('parent sees grade',(await txt()).includes('88/100'));
 await go('exam');await click('[data-a=take]');await pg.check('input[name=q0][value="1"]');await click('[data-a=subexam]');t('exam graded on server',(await txt()).includes('1/1'));
 await go('hw');const hwid=await pg.getAttribute('[data-a=subhw]','data-i');await fill('sub_'+hwid,'تم الحل');await click('[data-a=subhw]');t('hw submitted',(await txt()).includes('تم التسليم'));
 await go('home');await W(500);
 const tokP=await pg.evaluate(()=>localStorage.getItem('al_tok'));
 // ===== security tests via raw API =====
 const st=(await api('/api/state',tokP)).j;const D=st.db.data[st.me.schoolId];
 t('parent state: only own children',D.students.length===2&&D.students.every(s=>st.me.children.includes(s.id)));
 t('parent state: exam answers stripped',D.exams.length>0&&D.exams.every(e=>e.qs.every(q=>q.a===undefined)));
 t('parent state: no password hashes anywhere',!JSON.stringify(st).includes('"hash"')&&!JSON.stringify(st).includes('"salt"'));
 const beforeN=(await api('/api/state',tokP)).j.db.data[st.me.schoolId].students.length;
 await api('/api/act',tokP,{a:'savestu',i:'',d:{},form:{f_name:'HACK',f_section:''},ui:{}});
 await api('/api/act',tokP,{a:'addsch',i:'',d:{},form:{sn:'X',pn:'Y',pu:'hacker1',pw:'abcdef'},ui:{}});
 await api('/api/act',tokP,{a:'delg',i:'x',d:{c:'students'},form:{},ui:{}});
 const afterS=(await api('/api/state',tokP)).j;
 t('parent cannot add student / school / delete via API',afterS.db.data[st.me.schoolId].students.length===beforeN&&(await L('hacker1','abcdef')).token===undefined);
 t('parent cannot export school',(await api('/api/export',tokP)).s===404);
 t('tampered token rejected',(await api('/api/state',tokP.slice(0,-3)+'abc')).s===401);
 const tT=(await L('tteach1','Teach1234')).token;
 await api('/api/act',tT,{a:'addsch',i:'',d:{},form:{sn:'X',pn:'Y',pu:'hacker2',pw:'abcdef'},ui:{}});
 await api('/api/act',tT,{a:'addtch',i:'',d:{},form:{tn:'z',tu:'hacker3',tp:'abcdef'},ui:{}});
 t('teacher cannot create school/accounts',!(await L('hacker2','abcdef')).token&&!(await L('hacker3','abcdef')).token);
 const sT=(await api('/api/state',tT)).j.db.data;const sid=Object.keys(sT)[0];
 t('teacher state limited to his sections (3 of 5+ students)',sT[sid].students.length===3);
 const tA=(await L('prina','pass1234')),tB=(await L('prinb','pass1234'));
 t('principal state = own school only',Object.keys(tA.db.data).length===1&&Object.keys(tB.db.data).length===1&&tA.db.schools.length===1&&tA.db.data[Object.keys(tA.db.data)[0]].students.length>=4&&tB.db.data[Object.keys(tB.db.data)[0]].students.length===0);
 const victim=tA.db.data[Object.keys(tA.db.data)[0]].students[0].id;
 await api('/api/act',tB.token,{a:'delstu',i:victim,d:{},form:{},ui:{}});
 t('principal B cannot delete school A student',(await api('/api/state',tA.token)).j.db.data[Object.keys(tA.db.data)[0]].students.some(s=>s.id===victim));
 const r1=await api('/api/act',tB.token,{a:'addtch',i:'',d:{},form:{tn:'dup',tu:'tteach1',tp:'abcdef'},ui:{}});t('duplicate username across schools blocked',(r1.j.toast||'').includes('مستعمل'));
 const r2=await api('/api/act',tB.token,{a:'addsch',i:'',d:{},form:{sn:'X',pn:'Y',pu:'hacker4',pw:'abcdef'},ui:{}});t('principal cannot create principal/school',!(await L('hacker4','abcdef')).token);
 // password reset invalidates old token
 const tO=(await L('owner1','ownerpass1')).token;const pb=tB.db.users.find(u=>u.role==='principal')||{};
 const bid=(await api('/api/state',tO)).j.db.users.find(u=>u.username==='prinb').id;
 await api('/api/act',tO,{a:'pwu',i:bid,d:{},form:{newpw:'newpass99'},ui:{}});
 t('old token dead after owner resets password',(await api('/api/state',tB.token)).s===401&&!!(await L('prinb','newpass99')).token);
 // lockout
 for(let i=0;i<5;i++)await L('prina','wrong');const lk=await api('/api/login',null,{username:'prina',password:'pass1234'});t('login lockout after 5 failures',lk.s===429);
 // school disabled
 const sch=(await api('/api/state',tO)).j.db.schools.find(s=>s.name==='مدرسة ب');await api('/api/act',tO,{a:'offsch',i:sch.id,d:{},form:{},ui:{}});
 t('disabled school blocks its users',(await api('/api/state',(await L('prinb','newpass99')).token||'x')).s===401);
 // owner state doesnt leak school data
 const os=(await api('/api/state',tO)).j;t('owner state has no school internals',Object.keys(os.db.data).length===0&&os.db.users.every(u=>u.role==='principal'));
 // PWA
 await pg.goto(B);await pg.waitForTimeout(1200);
 const sw=await pg.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()));t('service worker registered',sw);
 const hdr=await fetch(B+'/');t('security headers present',!!hdr.headers.get('content-security-policy')&&hdr.headers.get('x-content-type-options')==='nosniff');
 console.log(R.join('\n'));console.log('ERRORS:',JSON.stringify(errs));await br.close();
})().catch(e=>{console.log('TESTFAIL',e.message.slice(0,600));process.exit(1)});
