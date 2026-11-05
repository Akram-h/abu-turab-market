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

function loginView(){
 if(loading)return"<div class='login'><div class='av'>🎓</div><h2>منصة الهمام التعليمية</h2><p class='mu'>جاري التحميل...</p></div>";
 if(location.protocol=="file:")return`<div class='login'><div class='av'>🎓</div><h2>منصة الهمام التعليمية</h2>${card("لا يمكن فتح هذه النسخة مباشرة من الملف",`<p style='margin-top:0'>هذه النسخة <b>متصلة بخادم</b>، فلا تعمل بنقر الملف مرتين.</p><p>الحل: شغّل <b>start-local.bat</b> (يفتح الموقع على حاسبتك)، أو افتح <b>رابط الموقع</b> بعد نشره على الإنترنت.</p>`)}</div>`;
 var ios=/iPhone|iPad/.test(navigator.userAgent)&&!window.navigator.standalone,inst=ui.inst?"<p><button class='b g' data-a='install'>📲 تثبيت التطبيق</button></p>":(ios?"<p class='mu'>للتثبيت على الآيفون: زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»</p>":"");
 if(needSetup)return`<div class='login'><div class='av'>🎓</div><h2>منصة الهمام التعليمية</h2>${card("إعداد المنصة (أول تشغيل)",`<p class='mu' style='margin-top:0'>أنشئ حساب مسؤول النظام. رمز الإعداد يظهر في سجل الخادم (Logs) عند أول تشغيل، أو هو قيمة SETUP_CODE إن ضبطتها.</p>${fld("su_n","الاسم","")}<br>${fld("su_u","اسم المستخدم (إنكليزي)","","text","autocomplete='off'")}<br>${fld("su_p","كلمة المرور (6 أحرف فأكثر)","","password")}<br>${fld("su_c","رمز الإعداد","","text","autocomplete='off'")}<div class='err' id='er'></div><button class='b' style='width:100%' data-a='setup'>إنشاء الحساب</button>`)}</div>`;
 return`<div class='login'><div class='av'>🎓</div><h2>منصة الهمام التعليمية</h2>${card("",`<div style='text-align:right'>${fld("lu","اسم المستخدم","","text","dir='ltr' autocomplete='username' autocapitalize='none'")}<br>${fld("lp","كلمة المرور","","password","autocomplete='current-password'")}</div><div class='err' id='er'></div><button class='b' style='width:100%' data-a='login'>تسجيل الدخول</button>`)}${inst}</div>`}
function render(){var app=document.getElementById("app");
 if(!me){app.innerHTML=loginView();return}
 if(!MENU[me.role].some(function(m){return m[0]==tab}))tab=MENU[me.role][0][0];
 var K=me.role=="parent"?kid():null,title=me.schoolId&&SC()?SC().name:"منصة الهمام التعليمية",body=view(tab);
 var menu=MENU[me.role].map(function(m){return m[0]=="sep"?`<div class='sep'>${m[1]}</div>`:`<button class='mi' data-a='${m[0]=="out"?"out":"go"}' data-t='${m[0]}' aria-current='${tab==m[0]}'><i>${m[1]}</i>${m[2]}</button>`}).join("")+(ui.inst?"<button class='mi' data-a='install'><i>📲</i>تثبيت التطبيق</button>":"");
 var pf=`<div class='pf'>${K?avatar(K,1):`<div class='av sm'>${me.role=="owner"?"🛡️":me.role=="teacher"?"🧑‍🏫":"👤"}</div>`}<b>${esc(K?K.name:me.name)}</b><span>${esc(me.schoolId&&SC()?SC().name:"")}</span>${kids().length>1?`<select id='kidsel' style='margin-top:6px'>${kids().map(function(s){return`<option value='${s.id}'${K&&s.id==K.id?" selected":""}>${esc(s.name)} - ${esc(s.section)}</option>`}).join("")}</select>`:K?`<span style='color:var(--br);font-weight:700'>${esc(K.section)}</span>`:""}</div>`;
 app.innerHTML=`<div class='top'><button class='ham' data-a='drawer' aria-label='القائمة'>☰</button><h1>${esc(title)}</h1></div>${ui.drawer?`<div class='ov' data-a='drawer'></div><aside class='dr'>${pf}${menu}</aside>`:""}<main>${body}</main>`;
 if(me.role=="parent"&&ui.mark&&kid()){var k=ui.mark;ui.mark=null;api("/api/act",{a:"markread",d:{k:k},form:{},ui:uiSend()}).then(apply).catch(function(){})}}
function go(t){tab=t;ui.drawer=false;ui.edit=ui.fee=ui.imp=ui.impt=ui.take=ui.open=ui.cred=null;ui.se=false;try{sessionStorage.setItem("al_tab",t)}catch(e){}window.scrollTo(0,0)}

var CONF={delsch:"حذف المدرسة وكل بياناتها وحساباتها نهائياً؟",delstu:"حذف الطالب وكل بياناته؟",delu:"حذف الحساب؟",delclass:"حذف الصف وشعبه؟",closeyear:"سيتم أرشفة الدرجات والحضور والتقييمات وبدء سنة جديدة. متأكد؟"};
var LOCAL={
 drawer:function(){ui.drawer=!ui.drawer},
 go:function(b){if(MENU[me.role].some(function(t){return t[0]==b.dataset.t}))go(b.dataset.t)},
 canx:function(){ui.edit=ui.fee=ui.imp=ui.impt=ui.take=null;ui.se=false},
 openan:function(b,i){ui.open=ui.open==i?"":i},
 newstu:function(){ui.edit="new"},editstu:function(b,i){ui.edit=i},feestu:function(b,i){ui.fee=i},take:function(b,i){ui.take=i},
 editsched:function(){if(!ui.sec)return toast("اختر الشعبة أولاً");ui.se=true},
 install:function(){if(ui.inst){ui.inst.prompt();ui.inst=null}},
 printcred:function(){document.body.classList.add("pcred");window.print();setTimeout(function(){document.body.classList.remove("pcred")},500)},
 expcred:function(){dl("accounts-"+today()+".csv",null,"\uFEFF"+"الاسم,النوع,اسم المستخدم,كلمة المرور\n"+(ui.cred||[]).map(function(r){return[r.n,r.t,r.u,r.p].map(function(x){return'"'+String(x).replace(/"/g,'""')+'"'}).join(",")}).join("\n"))},
 tpl:function(){dl("students-template.csv",null,"\uFEFFالاسم,الصف والشعبة,هاتف ولي الأمر,الجنس,تاريخ الميلاد,العنوان,المشرف,القسط الكلي,اسم المستخدم,كلمة المرور\nمريم أحمد,الأول / أ (بنات),07701234567,أنثى,2019-05-12,بغداد,أ. سعاد,540000,parent1,Pass1234\n")},
 tplt:function(){dl("teachers-template.csv",null,"\uFEFFالاسم,المادة,الهاتف,الشعب,اسم المستخدم,كلمة المرور\nهدى سالم,الرياضيات,07700001111,الأول / أ (بنات),teacher1,Pass1234\n")}
};
async function act(a,i,d){if(busy)return;busy=true;
 try{var F=collectForm();if(CONF[a]&&!confirm(CONF[a])){busy=false;return}
  if(a=="pwu"){var np=prompt("كلمة المرور الجديدة (6 أحرف على الأقل)");if(!np){busy=false;return}F.newpw=np}
  var r=await api("/api/act",{a:a,i:i,d:d,form:F,ui:uiSend()});apply(r);if(r.gone)logoutLocal();if(r.ui)for(var k in r.ui)ui[k]=r.ui[k];if(r.toast)toast(r.toast)}
 catch(e){fail(e)}finally{busy=false;render()}}

document.addEventListener("keydown",function(e){if(e.key=="Enter"&&!me&&e.target.tagName=="INPUT"){var b=document.querySelector("#app [data-a]");if(b)b.click()}});
document.addEventListener("input",function(e){if(e.target.id=="sq"){ui.q=e.target.value;var c=e.target.selectionStart;render();var n=document.getElementById("sq");if(n){n.focus();try{n.setSelectionRange(c,c)}catch(x){}}}});
document.addEventListener("change",function(e){var i=e.target.id;
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

document.addEventListener("click",async function(e){var b=e.target.closest("[data-a]");if(!b)return;var a=b.dataset.a,i=b.dataset.i;if(a=="delsec"||a=="delclass")e.preventDefault();
 if(a=="login"){if(busy)return;busy=true;try{var r=await api("/api/login",{username:val("lu"),password:document.getElementById("lp").value});apply(r);ui.kid=null;ui.sec="";go(MENU[me.role][0][0]);render()}catch(x){err((x&&x.error)||"تعذر الدخول")}finally{busy=false}return}
 if(a=="setup"){if(busy)return;var p=document.getElementById("su_p").value;if(p.length<6)return err("كلمة المرور 6 أحرف على الأقل");busy=true;try{await api("/api/setup",{name:val("su_n"),username:val("su_u"),password:p,code:val("su_c")});needSetup=false;toast("تم إنشاء الحساب، سجّل الدخول");render()}catch(x){err((x&&x.error)||"تعذر الإعداد")}finally{busy=false}return}
 if(a=="out"){logoutLocal();render();return}
 if(!me)return;
 if(a=="expsc"||a=="expall"){try{var o=await api(a=="expsc"?"/api/export":"/api/export-all");dl((a=="expsc"?"alhamam-school-":"alhamam-all-")+today()+".json",o)}catch(x){fail(x)}return}
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
