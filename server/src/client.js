/* ===== الواجهة المتصلة بالخادم ===== */
var API=((window.AL_CONFIG&&window.AL_CONFIG.apiBase)||"").replace(/\/+$/,""),NATIVE=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
var TOK=null,REV=0,busy=false,needSetup=null,loading=true;
try{TOK=localStorage.getItem("al_tok")}catch(e){}
function load(){return{owner:null,schools:[],users:[],data:{}}}
function save(){}
function err(m){var e=document.getElementById("er");if(e)e.textContent=m}
function apply(s){if(s.db)db=s.db;if(s.me)me=s.me;if(s.rev!=null)REV=s.rev;if(s.token){TOK=s.token;try{localStorage.setItem("al_tok",TOK)}catch(e){}}}
function logoutLocal(msg){me=null;TOK=null;ui.drawer=false;try{localStorage.removeItem("al_tok")}catch(e){}if(msg)toast(msg)}
async function api(path,body){if(NATIVE&&!API)throw{error:"لم يُضبط عنوان الخادم داخل التطبيق (راجع دليل بناء التطبيق)"};var h={"Content-Type":"application/json"};if(TOK)h.Authorization="Bearer "+TOK;var r,ac=new AbortController(),to=setTimeout(function(){ac.abort()},70000);
 try{r=await fetch(API+path,{method:body?"POST":"GET",headers:h,body:body?JSON.stringify(body):undefined,signal:ac.signal})}
 catch(e){clearTimeout(to);throw{offline:true,error:location.protocol=="file:"?"هذه النسخة تعمل من رابط الخادم فقط. لا تفتح الملف مباشرة: شغّل start-local.bat أو افتح رابط الموقع المنشور":(navigator.onLine===false?"لا يوجد اتصال بالإنترنت":"تعذر الوصول إلى الخادم. إن كان على استضافة مجانية فقد يحتاج دقيقة ليستيقظ، أعد المحاولة")}}
 clearTimeout(to);var j={};try{j=await r.json()}catch(e){}
 if(r.status==401&&TOK&&path!="/api/login"){logoutLocal("انتهت الجلسة، سجّل الدخول من جديد");render()}
 if(!r.ok)throw{status:r.status,error:j.error||"حدث خطأ"};return j}
function fail(e){toast((e&&e.error)||"حدث خطأ")}
function collectForm(){var F={};[].forEach.call(document.querySelectorAll("#app input,#app select,#app textarea"),function(el){if(el.type=="file"||el.type=="button")return;
 if(el.type=="checkbox"){if(el.dataset.g){if(el.checked)(F["g:"+el.dataset.g]=F["g:"+el.dataset.g]||[]).push(el.value)}else if(el.id)F[el.id]=el.checked;return}
 if(el.type=="radio"){if(el.checked)F["r:"+el.name]=el.value;return}
 if(el.id)F[el.id]=el.value});return F}
function uiSend(){var o={};["date","sec","kid","q","ay","open","edit","fee","take","mark"].forEach(function(k){if(typeof ui[k]=="string")o[k]=ui[k]});o.today=today();o.se=!!ui.se;if(ui.imp)o.imp=ui.imp;if(ui.impt)o.impt=ui.impt;return o}

var LOGO='<svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfe6ff"/></linearGradient></defs><path fill="url(#lg)" d="M32 11 59 24 32 37 5 24z"/><path fill="url(#lg)" opacity=".92" d="M15 33.5v11c0 4.6 8.1 8.5 17 8.5s17-3.9 17-8.5v-11L32 41z"/><path d="M57 26v15" stroke="#ffd36b" stroke-width="2.6" stroke-linecap="round"/><circle cx="57" cy="43.5" r="3.2" fill="#ffd36b"/></svg>';
function wl(inner){var q=QUOTES[Math.floor(Date.now()/864e5)%QUOTES.length];
 return`<div class='wl'><div class='wl-orb o1'></div><div class='wl-orb o2'></div><div class='wl-orb o3'></div>
 <div class='wl-wrap'><header class='wl-hero'><div class='wl-logo'>${LOGO}</div><h1>منصة الهمام التعليمية</h1><p class='wl-sub'>مدرستك في مكان واحد: حضور وغياب، درجات، تبليغات، وتواصل مباشر مع أولياء الأمور.</p>
 <div class='wl-chips'><span>📋 الحضور والغياب</span><span>🏅 الدرجات</span><span>🔔 التبليغات</span><span>🗓️ الجداول</span><span>📚 المكتبة</span></div></header>
 <section class='wl-card'>${inner}</section><p class='wl-quote'>« ${esc(q)} »</p><footer class='wl-foot'>منصة الهمام التعليمية</footer></div></div>`}
function loginView(){
 if(loading)return wl("<div class='wl-load'><i></i><p class='mu'>جاري التحميل...</p></div>");
 if(location.protocol=="file:")return wl(`<h2>لا يمكن فتح هذه النسخة مباشرة من الملف</h2><p>هذه النسخة <b>متصلة بخادم</b>، فلا تعمل بنقر الملف مرتين.</p><p>الحل: شغّل <b>start-local.bat</b> (يفتح الموقع على حاسبتك)، أو افتح <b>رابط الموقع</b> بعد نشره على الإنترنت.</p>`);
 var ios=/iPhone|iPad/.test(navigator.userAgent)&&!window.navigator.standalone,inst=ui.inst?"<p><button class='b g' style='width:100%' data-a='install'>📲 تثبيت التطبيق</button></p>":(ios?"<p class='mu'>للتثبيت على الآيفون: زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»</p>":"");
 if(needSetup)return wl(`<h2>إعداد المنصة (أول تشغيل)</h2><p class='mu' style='margin-top:0'>أنشئ حساب مسؤول النظام. رمز الإعداد يظهر في سجل الخادم (Logs) عند أول تشغيل، أو هو قيمة SETUP_CODE إن ضبطتها.</p>${fld("su_n","الاسم","")}<br>${fld("su_u","اسم المستخدم (إنكليزي)","","text","autocomplete='off'")}<br>${fld("su_p","كلمة المرور (6 أحرف فأكثر)","","password")}<br>${fld("su_c","رمز الإعداد","","text","autocomplete='off'")}<div class='err' id='er'></div><button class='b' style='width:100%' data-a='setup'>إنشاء الحساب</button>`);
 return wl(`<h2>أهلاً بك 👋</h2><p class='mu' style='margin:0 0 12px'>سجّل الدخول للمتابعة</p><div style='text-align:right'>${fld("lu","اسم المستخدم","","text","dir='ltr' autocomplete='username' autocapitalize='none'")}<br>${fld("lp","كلمة المرور","","password","autocomplete='current-password'")}</div><div class='err' id='er'></div><button class='b' style='width:100%;padding:13px' data-a='login'>تسجيل الدخول</button>${inst}`)}
function render(){var app=document.getElementById("app");
 if(!me){app.innerHTML=loginView();return}
 if(!MENU[me.role].some(function(m){return m[0]==tab}))tab=MENU[me.role][0][0];
 var K=me.role=="parent"?kid():null,title=me.schoolId&&SC()?SC().name:"منصة الهمام التعليمية",body=view(tab);
 var menu=MENU[me.role].map(function(m){return m[0]=="sep"?`<div class='sep'>${m[1]}</div>`:`<button class='mi' data-a='${m[0]=="out"?"out":"go"}' data-t='${m[0]}' aria-current='${tab==m[0]}'><i>${m[1]}</i>${m[2]}</button>`}).join("")+(ui.inst?"<button class='mi' data-a='install'><i>📲</i>تثبيت التطبيق</button>":"");
 var pf=`<div class='pf'>${K?avatar(K,1):`<div class='av sm'>${me.role=="owner"?"🛡️":me.role=="teacher"?"🧑‍🏫":"👤"}</div>`}<b>${esc(K?K.name:me.name)}</b><span>${esc(me.schoolId&&SC()?SC().name:"")}</span>${kids().length>1?`<select id='kidsel' style='margin-top:6px'>${kids().map(function(s){return`<option value='${s.id}'${K&&s.id==K.id?" selected":""}>${esc(s.name)} - ${esc(s.section)}</option>`}).join("")}</select>`:K?`<span style='color:var(--br);font-weight:700'>${esc(K.section)}</span>`:""}</div>`;
 app.innerHTML=`<div class='top'><button class='ham' data-a='drawer' aria-label='القائمة'>☰</button><h1>${esc(title)}</h1></div>${ui.drawer?`<div class='ov' data-a='drawer'></div><aside class='dr'>${pf}${menu}</aside>`:""}<main>${ui.prog?`<div class='prog' role='status'><i></i>${esc(ui.prog)}</div>`:""}${body}</main>`;
 if(me.role=="parent"&&ui.mark&&kid()){var k=ui.mark;ui.mark=null;api("/api/act",{a:"markread",d:{k:k},form:{},ui:uiSend()}).then(apply).catch(function(){})}}
function go(t){tab=t;ui.drawer=false;ui.edit=ui.fee=ui.imp=ui.impt=ui.take=ui.open=ui.cred=null;ui.se=false;ui.sel={};ui.q="";ui.pq="";ui.lim=0;ui.fsec="";ui.ysec="";ui.prog=null;try{sessionStorage.setItem("al_tab",t)}catch(e){}window.scrollTo(0,0)}

var CONF={delarch:"حذف الأرشيف القديم من الخادم نهائياً؟ تأكد أنك نزّلته وحفظته.",delsch:"حذف المدرسة وكل بياناتها وحساباتها نهائياً؟",delstu:"حذف الطالب وكل بياناته؟",delu:"حذف الحساب؟",delclass:"حذف الصف وشعبه؟",closeyear:"ستُمسح بيانات السنة من الخادم ويُرحَّل الطلاب. تأكد أنك حفظت ملف الأرشيف. متأكد؟"};
var LOCAL={
 drawer:function(){ui.drawer=!ui.drawer},
 go:function(b){if(MENU[me.role].some(function(t){return t[0]==b.dataset.t}))go(b.dataset.t)},
 canx:function(){ui.edit=ui.fee=ui.imp=ui.impt=ui.take=null;ui.se=false},
 openan:function(b,i){ui.open=ui.open==i?"":i},
 newstu:function(){ui.edit="new"},editstu:function(b,i){ui.edit=i},feestu:function(b,i){ui.fee=i},take:function(b,i){ui.take=i},
 editsched:function(){if(!ui.sec)return toast("اختر الشعبة أولاً");ui.se=true},
 install:function(){if(ui.inst){ui.inst.prompt();ui.inst=null}},
 printcred:function(){document.body.classList.add("pcred");window.print();setTimeout(function(){document.body.classList.remove("pcred")},500)},
 more:function(){ui.lim=(ui.lim||100)+100},
 selall:function(b){var ids=b.dataset.w=="stu"?stuFiltered().map(function(s){return s.id}):accFiltered(tab=="tch"?"teacher":"parent").map(function(u){return u.id});ui.sel=ui.sel||{};ids.forEach(function(i){ui.sel[i]=1})},
 selnone:function(){ui.sel={}},
 failall:function(){ui.fail=ui.fail||{};var q=nz(ui.q||""),sec=ui.ysec||"";S().students.forEach(function(s){if((!sec||s.section==sec)&&(!q||nz(s.name).indexOf(q)>-1))ui.fail[s.id]=1})},
 failnone:function(){var q=nz(ui.q||""),sec=ui.ysec||"";S().students.forEach(function(s){if((!sec||s.section==sec)&&(!q||nz(s.name).indexOf(q)>-1))delete(ui.fail||{})[s.id]})},
 unfail:function(b,i){delete(ui.fail||{})[i]},
 expacc:function(b){var role=b.dataset.r,l=accFiltered(role);dl("accounts-"+role+"-"+today()+".csv",null,"\uFEFF"+"الاسم,"+(role=="teacher"?"المادة":"الأبناء")+",اسم المستخدم,كلمة المرور\n"+l.map(function(u){return[u.name,role=="teacher"?u.subject||"":(u.children||[]).map(function(i){var s=byId(i);return s?s.name:""}).join("، "),u.username,u.pw||"(غيّرها المستخدم)"].map(function(x){return'"'+String(x).replace(/"/g,'""')+'"'}).join(",")}).join("\n"))},
 expcred:function(){dl("accounts-"+today()+".csv",null,"\uFEFF"+"الاسم,النوع,اسم المستخدم,كلمة المرور\n"+(ui.cred||[]).map(function(r){return[r.n,r.t,r.u,r.p].map(function(x){return'"'+String(x).replace(/"/g,'""')+'"'}).join(",")}).join("\n"))},
 tpl:function(){dl("students-template.csv",null,"\uFEFFالاسم,الصف والشعبة,هاتف ولي الأمر,الجنس,تاريخ الميلاد,العنوان,المشرف,القسط الكلي,اسم المستخدم,كلمة المرور\nمريم أحمد,الأول / أ (بنات),07701234567,أنثى,2019-05-12,بغداد,أ. سعاد,540000,parent1,Pass1234\n")},
 tplt:function(){dl("teachers-template.csv",null,"\uFEFFالاسم,المادة,الهاتف,الشعب,اسم المستخدم,كلمة المرور\nهدى سالم,الرياضيات,07700001111,الأول / أ (بنات),teacher1,Pass1234\n")}
};
async function act(a,i,d){if(busy)return;busy=true;
 try{var F=collectForm();if(CONF[a]&&!confirm(CONF[a])){busy=false;return}
  if(a=="delstus"||a=="delus"){var ks=Object.keys(ui.sel||{});if(!ks.length){toast("لم تحدد أي عنصر");busy=false;return}if(ks.length>3000){toast("حدد 3000 كحد أقصى في المرة الواحدة");busy=false;return}if(!confirm("حذف "+ks.length+(a=="delstus"?" طالب وكل بياناتهم؟":" حساب؟"))){busy=false;return}F["g:sel"]=ks}
  if(a=="closeyear"){if(F.ycf!==true){toast("أكّد أنك حفظت ملف الأرشيف أولاً");busy=false;return}F["g:fail"]=Object.keys(ui.fail||{}).slice(0,3000);S().classes.forEach(function(c){F["nx_"+c.id]=nxOf(c)});if(ui.ny)F.ny=ui.ny}
  if(a=="pwu"){var np=prompt("كلمة المرور الجديدة (6 أحرف على الأقل)");if(!np){busy=false;return}F.newpw=np}
  var r=await api("/api/act",{a:a,i:i,d:d,form:F,ui:uiSend()});apply(r);if(r.gone)logoutLocal();if(a=="delstus"||a=="delus")ui.sel={};if(a=="closeyear"&&r.toast&&r.toast.indexOf("تمت")==0){ui.fail={};ui.nxm={};ui.ny=""};if(r.ui)for(var k in r.ui)ui[k]=r.ui[k];if(r.toast)toast(r.toast)}
 catch(e){fail(e)}finally{busy=false;render()}}

/* ===== عمليات جماعية على دفعات صغيرة (لا حد للعدد، وكل دفعة قصيرة فلا تنتهي مهلتها) ===== */
async function runBulk(a,key,size,label){if(busy)return;busy=true;var rows=ui[key]||[],all=[],tot={added:0,skip:0,acc:0,n:0},k=0;
 try{for(;k<rows.length;k+=size){ui.prog=label+" "+Math.min(k+size,rows.length)+" / "+rows.length+" — لا تغلق الصفحة";render();var u=uiSend();u[key]=rows.slice(k,k+size);
   var r=await api("/api/act",{a:a,i:"",d:{},form:{},ui:u});apply(r);var s=(r.ui&&r.ui.stat)||{};tot.added+=s.added||0;tot.skip+=s.skip||0;tot.acc+=s.acc||0;tot.n+=s.n||0;if(r.ui&&r.ui.cred)all=all.concat(r.ui.cred)}
  ui[key]=null;toast(key=="imp"?"تم استيراد "+tot.added+" طالب"+(tot.skip?" (تخطي "+tot.skip+" مكرر)":"")+(tot.acc?" — حسابات أولياء الأمور: "+tot.acc:""):"تم إنشاء "+tot.n+" حساب معلم")}
 catch(e){ui[key]=rows.slice(k);toast(((e&&e.error)||"حدث خطأ")+" — تم تنفيذ "+k+" من "+rows.length+"، يمكنك إعادة الضغط لإكمال الباقي")}
 finally{ui.cred=all.length?all:null;ui.prog=null;busy=false;render()}}
async function runAuto(){if(busy)return;busy=true;var all=[],n=0,g=0;
 try{do{ui.prog="جاري إنشاء حسابات أولياء الأمور... ("+n+" حساب حتى الآن)";render();var r=await api("/api/act",{a:"autopar",i:"",d:{},form:{},ui:uiSend()});apply(r);n+=(r.ui&&r.ui.stat&&r.ui.stat.n)||0;if(r.ui&&r.ui.cred)all=all.concat(r.ui.cred);if(!(r.ui&&r.ui.cred&&r.ui.cred.length))break;g++}while(r.ui&&r.ui.rem>0&&g<500);toast("تم إنشاء "+n+" حساب")}
 catch(e){fail(e)}finally{ui.cred=all.length?all:null;ui.prog=null;busy=false;render()}}
async function doRefresh(){if(busy)return;try{var r=await api("/api/state");apply(r);toast("تم التحديث")}catch(e){fail(e)}render()}
document.addEventListener("keydown",function(e){if(e.key=="Enter"&&!me&&e.target.tagName=="INPUT"){var b=document.querySelector("#app [data-a]");if(b)b.click()}});
document.addEventListener("input",function(e){var id0=e.target.id;
 if(id0=="pcs"){var q=nz(e.target.value);[].forEach.call(document.querySelectorAll(".pl label"),function(l){l.style.display=!q||(l.dataset.n||"").indexOf(q)>-1?"":"none"});return}
 if(id0=="ny"){ui.ny=e.target.value;return}
 if(e.target.id=="sq"){ui.q=e.target.value;var c=e.target.selectionStart;render();var n=document.getElementById("sq");if(n){n.focus();try{n.setSelectionRange(c,c)}catch(x){}}}});
document.addEventListener("change",function(e){var i=e.target.id,pk=e.target.dataset&&e.target.dataset.pick;
 if(pk){var m=pk=="fail"?(ui.fail=ui.fail||{}):(ui.sel=ui.sel||{});if(e.target.checked)m[e.target.value]=1;else delete m[e.target.value];render();return}
 if(i=="fs"){ui.fsec=e.target.value;ui.lim=0;render();return}
 if(i=="ysec"){ui.ysec=e.target.value;ui.lim=0;render();return}
 if(i&&i.indexOf("nx_")==0){ui.nxm=ui.nxm||{};ui.nxm[i.slice(3)]=e.target.value;render();return}
 if(i=="ad"){ui.date=e.target.value||today();render()}
 else if(i=="as"){ui.sec=e.target.value;render()}
 else if(i=="ay"){ui.ay=e.target.value;render()}
 else if(i=="kidsel"){ui.kid=e.target.value;ui.drawer=false;render()}
 else if(i=="impxl"||i=="impt"){var f=e.target.files[0];if(!f)return;var r=new FileReader(),isx=/\.xlsx$/i.test(f.name);
  r.onload=async function(){try{var rows=isx?await readXlsx(r.result):readCsv(r.result),m=i=="impxl"?mapRows(rows):mapTeachers(rows);if(!m.length)throw 0;if(i=="impxl")ui.imp=m;else ui.impt=m;render()}catch(x){toast("تعذر قراءة الملف. استعمل ملف xlsx حديث أو CSV وتأكد من وجود عمود «الاسم».")}};
  if(isx)r.readAsArrayBuffer(f);else r.readAsText(f)}
 else if(i=="impsc"||i=="impall"){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=async function(){try{var o=JSON.parse(r.result);
  if(i=="impall"&&!confirm("سيتم استبدال كل البيانات. متأكد؟"))return;
  var res=await api(i=="impall"?"/api/import-all":"/api/import",o);apply(res);toast(res.toast||"تم الاستيراد");render()}catch(x){if(x&&x.error)toast(x.error);else toast("الملف غير صالح")}};r.readAsText(f)}});

document.addEventListener("click",async function(e){var b=e.target.closest("[data-a]");if(!b)return;var a=b.dataset.a,i=b.dataset.i;if(a=="delsec"||a=="delclass"||a=="unfail")e.preventDefault();
 if(a=="login"){if(busy)return;busy=true;try{var r=await api("/api/login",{username:val("lu"),password:document.getElementById("lp").value});apply(r);ui.kid=null;ui.sec="";go(MENU[me.role][0][0]);render()}catch(x){err((x&&x.error)||"تعذر الدخول")}finally{busy=false}return}
 if(a=="setup"){if(busy)return;var p=document.getElementById("su_p").value;if(p.length<6)return err("كلمة المرور 6 أحرف على الأقل");busy=true;try{await api("/api/setup",{name:val("su_n"),username:val("su_u"),password:p,code:val("su_c")});needSetup=false;toast("تم إنشاء الحساب، سجّل الدخول");render()}catch(x){err((x&&x.error)||"تعذر الإعداد")}finally{busy=false}return}
 if(a=="out"){logoutLocal();render();return}
 if(!me)return;
 if(a=="expsc"||a=="expall"){try{var o=await api(a=="expsc"?"/api/export":"/api/export-all");dl((a=="expsc"?"alhamam-school-":"alhamam-all-")+today()+".json",o)}catch(x){fail(x)}return}
 if(a=="doimp"){var hasAcc=(ui.imp||[]).some(function(x){return x.user&&x.pass});runBulk("doimp","imp",hasAcc?15:150,"جاري استيراد الطلاب");return}
 if(a=="doimpt"){runBulk("doimpt","impt",15,"جاري إنشاء حسابات المعلمين");return}
 if(a=="autopar"){runAuto();return}
 if(a=="refresh"){doRefresh();return}
 if(a=="ydl"){if(busy)return;try{ui.prog="جاري تجهيز الأرشيف...";render();await new Promise(function(r){setTimeout(r,30)});var z=curArchive();dlBin("ارشيف-"+safeName(SC().name,40)+"-"+safeName(SC().year,20)+".zip",z,"application/zip");busy=true;await api("/api/act",{a:"markexp",i:"",d:{},form:{},ui:uiSend()}).then(apply);toast("تم تنزيل الأرشيف. تأكد أن الملف محفوظ على جهازك")}catch(x){fail(x)}finally{busy=false;ui.prog=null;render()}return}
 if(a=="adl"){try{var ar=S().arch,fs=[];ar.forEach(function(y){var st=y.students.map(function(s){return{id:s.id,name:s.name,section:s.section}});var z=buildArchive({school:SC().name,year:y.year,students:st,grades:y.grades,att:y.att,evals:y.evals});fs.push({name:"ارشيف-"+safeName(y.year,20)+".zip",data:z})});
   if(fs.length==1)dlBin(fs[0].name,fs[0].data,"application/zip");else dlBin("ارشيف-السنوات-القديمة.zip",zipStore(fs),"application/zip");ui.adl=true;toast("تم تنزيل الأرشيف القديم")}catch(x){toast("تعذر إنشاء الملف")}render();return}
 if(LOCAL[a]){LOCAL[a](b,i);render();return}
 act(a,i,Object.assign({},b.dataset))});

window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();ui.inst=e;render()});
window.addEventListener("offline",function(){toast("انقطع الاتصال بالإنترنت")});
setInterval(async function(){if(!me||busy||document.hidden)return;var ae=document.activeElement;if(ae&&/INPUT|TEXTAREA|SELECT/.test(ae.tagName))return;try{var r=await api("/api/state?rev="+REV);if(!r.same){apply(r);render()}}catch(e){}},40000);
async function boot(){loading=true;render();
 try{if(TOK){var r=await api("/api/state");apply(r);var t=null;try{t=sessionStorage.getItem("al_tab")}catch(e){}go(t&&MENU[me.role].some(function(m){return m[0]==t})?t:MENU[me.role][0][0])}}catch(e){}
 try{if(!me){var s=await api("/api/status");needSetup=!!s.needSetup}}catch(e){needSetup=false}
 loading=false;render()}
if(NATIVE){window.print=function(){toast("الطباعة متاحة من المتصفح على الحاسبة")};try{var AP=window.Capacitor.Plugins&&window.Capacitor.Plugins.App;if(AP)AP.addListener("backButton",function(){if(ui.drawer){ui.drawer=false;render()}else if(me&&tab!=MENU[me.role][0][0]){go(MENU[me.role][0][0]);render()}else AP.exitApp()})}catch(e){}}
if(!NATIVE&&"serviceWorker" in navigator&&/^https?:/.test(location.protocol)){navigator.serviceWorker.register("sw.js").catch(function(){})}
boot();
