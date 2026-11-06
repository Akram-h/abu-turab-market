/* ---------- SHA-256 (مستقل) ---------- */
function sha256(ascii){function rr(v,a){return(v>>>a)|(v<<(32-a))}
var mp=Math.pow,mw=mp(2,32),i,j,r="",words=[],al=ascii.length*8,hash=sha256.h=sha256.h||[],k=sha256.k=sha256.k||[],pc=k.length,ic={};
for(var c=2;pc<64;c++){if(!ic[c]){for(i=0;i<313;i+=c)ic[i]=c;hash[pc]=(mp(c,.5)*mw)|0;k[pc++]=(mp(c,1/3)*mw)|0}}
ascii+="\x80";while(ascii.length%64-56)ascii+="\x00";
for(i=0;i<ascii.length;i++){j=ascii.charCodeAt(i);words[i>>2]|=j<<((3-i)%4)*8}
words[words.length]=((al/mw)|0);words[words.length]=al;
for(j=0;j<words.length;){var w=words.slice(j,j+=16),oh=hash;hash=hash.slice(0,8);
for(i=0;i<64;i++){var w15=w[i-15],w2=w[i-2],a=hash[0],e=hash[4];
var t1=hash[7]+(rr(e,6)^rr(e,11)^rr(e,25))+((e&hash[5])^((~e)&hash[6]))+k[i]+(w[i]=(i<16)?w[i]:(w[i-16]+(rr(w15,7)^rr(w15,18)^(w15>>>3))+w[i-7]+(rr(w2,17)^rr(w2,19)^(w2>>>10))|0));
var t2=(rr(a,2)^rr(a,13)^rr(a,22))+((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
hash=[(t1+t2)|0].concat(hash);hash[4]=(hash[4]+t1)|0}
for(i=0;i<8;i++)hash[i]=(hash[i]+oh[i])|0}
for(i=0;i<8;i++)for(j=3;j+1;j--){var b=(hash[i]>>(j*8))&255;r+=((b<16)?0:"")+b.toString(16)}return r}
function hashPw(salt,p){var h=sha256(unescape(encodeURIComponent(salt+p)));for(var i=0;i<2000;i++)h=sha256(h+salt);return h}

/* ---------- البيانات ---------- */
var KEY="alhamam_v2",ROLE={owner:"مسؤول النظام",principal:"المدير",teacher:"المعلم",parent:"ولي الأمر"};
var QUOTES=["إن البلاء للظالم أدب، وللمؤمن امتحان، وللأولياء درجة كرامة.","العلم نور والجهل ظلام.","من جدّ وجد ومن زرع حصد.","اطلبوا العلم من المهد إلى اللحد.","خير الناس أنفعهم للناس."];
var TERMS=["الفصل الأول","نصف السنة","الفصل الثاني","النهائي"];
var DAYS=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"],RATES=["ممتاز","جيد جداً","جيد","متوسط","ضعيف"];
var MENU={
owner:[["sch","🏫","المدارس"],["set","⚙️","الإعدادات والنسخ الاحتياطي"],["out","🚪","تسجيل الخروج"]],
principal:[["home","🏠","الرئيسية"],["stu","🎓","الطلاب"],["tch","👩‍🏫","حسابات المعلمين"],["par","👪","حسابات أولياء الأمور"],["att","📋","الحضور والغياب"],["gr","🏅","الدرجات"],["hw","📓","الواجبات البيتية"],["sci","🔔","التبليغات العلمية"],["adm","📢","التبليغات الإدارية"],["sched","🗓️","الجدول الأسبوعي"],["exsch","📅","جدول الامتحانات"],["sep","التعليم التفاعلي"],["lib","📚","المكتبة"],["vid","🎬","المكتبة الفيديوية"],["ev","🎉","الفعاليات"],["cls","🏫","المدرسة والصفوف"],["set","⚙️","الإعدادات"],["out","🚪","تسجيل الخروج"],["year","🎓","إنهاء السنة والترحيل"],["arch","🗂️","أرشيف السنوات"]],
teacher:[["home","🏠","الرئيسية"],["att","📋","الحضور والغياب"],["gr","🏅","الدرجات"],["eval","📝","سجل التقييمات"],["sci","🔔","التبليغات العلمية"],["adm","📢","التبليغات الإدارية"],["les","🖥️","الدروس الإلكترونية"],["exam","🧩","الاختبارات"],["hw","📓","الواجبات البيتية"],["sched","🗓️","الجدول الأسبوعي"],["exsch","📅","جدول الامتحانات"],["sep","التعليم التفاعلي"],["lib","📚","المكتبة"],["vid","🎬","المكتبة الفيديوية"],["ev","🎉","الفعاليات"],["set","⚙️","الإعدادات"],["out","🚪","تسجيل الخروج"],["arch","🗂️","أرشيف السنوات"]],
parent:[["home","🏠","الرئيسية"],["info","🪪","معلومات الطالب"],["eval","📝","سجل التقييمات"],["gr","🏅","الدرجات"],["att","📋","الحضور"],["tch","💬","التواصل مع الأساتذة"],["sci","🔔","التبليغات العلمية"],["adm","📢","التبليغات الإدارية"],["les","🖥️","الدروس الإلكترونية"],["exam","🧩","الاختبارات"],["hw","📓","الواجبات البيتية"],["sched","🗓️","الجدول الأسبوعي"],["exsch","📅","جدول الامتحانات"],["sep","التعليم التفاعلي"],["lib","📚","المكتبة"],["vid","🎬","المكتبة الفيديوية"],["ev","🎉","الفعاليات"],["set","⚙️","الإعدادات"],["out","🚪","تسجيل الخروج"],["arch","🗂️","أرشيف السنوات"]]};
var ARR=["classes","secs","sections","students","att","grades","evals","hw","subs","exams","results","ann","lessons","sched","exsch","lib","vids","events","arch"];
function blank(){var o={info:{},att:{}};ARR.forEach(function(k){if(k!="att")o[k]=[]});return o}
var db=load(),me=null,tab="home",ui={date:today(),drawer:false,fails:0,lock:0};
function load(){try{var o=JSON.parse(localStorage.getItem(KEY));if(o&&o.schools){o.schools.forEach(function(s){var d=o.data[s.id]||(o.data[s.id]=blank());ARR.forEach(function(k){if(!d[k])d[k]=k=="att"?{}:[]});if(!d.info)d.info={};d.ann.forEach(function(a){if(!a.kind)a.kind="adm"});if(!s.year)s.year=yearLbl()});return o}}catch(e){}return{owner:null,schools:[],users:[],data:{}}}
function yearLbl(){var y=new Date().getFullYear();return y+"-"+(y+1)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){toast("تعذر الحفظ: مساحة المتصفح ممتلئة")}}
try{var sid0=sessionStorage.getItem("al_me");if(sid0)me=findUser(sid0)}catch(e){}
if(me&&MENU[me.role]&&(!me.schoolId||school(me.schoolId)&&!school(me.schoolId).off))tab=MENU[me.role][0][0];else me=null;
function allUsers(){return(db.owner?[db.owner]:[]).concat(db.users)}
function findUser(id){return allUsers().filter(function(u){return u.id==id})[0]||null}
function school(id){return db.schools.filter(function(s){return s.id==id})[0]||null}
function SC(){return school(me.schoolId)}
function S(){return db.data[me.schoolId]}
function today(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function toast(m){var e=document.getElementById("t");e.textContent=m;e.className="s";clearTimeout(toast.k);toast.k=setTimeout(function(){e.className=""},2800)}
function mkUser(role,schoolId,name,username,pw,extra){var salt=uid()+uid(),u={id:uid(),role:role,schoolId:schoolId,name:name,username:username,salt:salt,hash:hashPw(salt,pw)};for(var k in extra)u[k]=extra[k];return u}
function setPw(u,pw){u.salt=uid()+uid();u.hash=hashPw(u.salt,pw)}
function fd(d){if(!d)return"";var x=new Date(d);return isNaN(x)?esc(d):x.toLocaleDateString("ar-IQ")}
function money(n){return"IQ "+(Number(n)||0).toLocaleString("en-US")}
function val(i){var e=document.getElementById(i);return e?e.value.trim():""}
function checked(g){return[].slice.call(document.querySelectorAll('[data-g="'+g+'"]:checked')).map(function(x){return x.value})}
function userOk(un){if(!/^[a-z0-9_.-]{3,30}$/.test(un))return"اسم المستخدم: 3 أحرف أو أكثر بالإنكليزية أو أرقام";if(allUsers().some(function(u){return u.username==un}))return"اسم المستخدم مستعمل، اختر غيره";return""}
function norm(p){var n=String(p||"").replace(/\D/g,"");if(n.indexOf("00")==0)n=n.slice(2);if(n.indexOf("964")==0)return n;if(n[0]=="0")n=n.slice(1);return"964"+n}
function wa(p,t){return"https://wa.me/"+norm(p)+"?text="+encodeURIComponent(t)}
function waBtn(p,t,l){return p?'<a class="wa" target="_blank" rel="noopener" href="'+wa(p,t)+'">'+(l||"واتساب")+"</a>":'<span class="mu">لا يوجد رقم</span>'}
function ext(u){u=String(u||"").trim();return/^https?:\/\//i.test(u)?u:"https://"+u}
/* صلاحيات */
function vis(){var st=S().students;if(me.role=="teacher"&&me.sections&&me.sections.length)st=st.filter(function(s){return me.sections.indexOf(s.section)>-1});return st}
function mySecs(){return me.role=="teacher"&&me.sections&&me.sections.length?me.sections:S().sections}
function byId(id){return S().students.filter(function(s){return s.id==id})[0]}
function kids(){return me.role=="parent"?(me.children||[]).map(byId).filter(Boolean):[]}
function kid(){var k=kids();return k.filter(function(s){return s.id==ui.kid})[0]||k[0]||null}
function absCount(id,t){var n=0;for(var d in S().att)if(S().att[d][id]==(t||"A"))n++;return n}
function inSec(item,sec){return!item.section||item.section==sec}
function stuOpts(l,sel){return l.map(function(s){return'<option value="'+s.id+'"'+(s.id==sel?" selected":"")+">"+esc(s.name)+"</option>"}).join("")}
function secOpts(l,sel,all){return(all?'<option value="">كل الشعب</option>':"")+l.map(function(x){return"<option"+(x==sel?" selected":"")+">"+esc(x)+"</option>"}).join("")}
function chkList(g,items){return'<div class="chk">'+(items.map(function(i){return'<label><input type="checkbox" data-g="'+g+'" value="'+esc(i.v)+'">'+esc(i.t)+"</label>"}).join("")||'<span class="mu">لا توجد خيارات بعد</span>')+"</div>"}
function fld(id,l,v,t,x){return"<div><label for='"+id+"'>"+l+"</label><input id='"+id+"' type='"+(t||"text")+"' value='"+esc(v)+"' "+(x||"")+"></div>"}
function card(t,b){return"<section class='c'>"+(t?"<h3>"+t+"</h3>":"")+b+"</section>"}
function emp(m){return"<div class='em'>"+m+"</div>"}
function dl(name,obj,raw){var txt=raw||JSON.stringify(obj),type=raw?"text/csv;charset=utf-8":"application/json",C=window.Capacitor;
 try{if(C&&C.isNativePlatform&&C.isNativePlatform()&&C.Plugins&&C.Plugins.Filesystem&&C.Plugins.Share){C.Plugins.Filesystem.writeFile({path:name,data:btoa(unescape(encodeURIComponent(txt))),directory:"CACHE"}).then(function(r){return C.Plugins.Share.share({title:name,url:r.uri})}).catch(function(){toast("تعذر حفظ الملف")});return}}catch(e){}
 try{if(/Android|iPhone|iPad/i.test(navigator.userAgent)&&navigator.canShare){var f=new File([txt],name,{type:type});if(navigator.canShare({files:[f]})){navigator.share({files:[f],title:name}).catch(function(){});return}}}catch(e){}
 var u=URL.createObjectURL(new Blob([txt],{type:type})),l=document.createElement("a");l.href=u;l.download=name;l.click()}
function avatar(s,sm){return"<div class='av"+(sm?" sm":"")+"'>"+(s&&s.gender=="ذكر"?"👦":"👧")+"</div>"}
function age(b){if(!b)return"";var d=new Date(b);if(isNaN(d))return"";var a=Math.floor((Date.now()-d)/31557600000);return a>0&&a<40?a+" سنة":""}
function teachersFor(sec){return db.users.filter(function(u){return u.schoolId==me.schoolId&&u.role=="teacher"&&(!u.sections||!u.sections.length||u.sections.indexOf(sec)>-1)})}
function nVisible(a,sec){return!a.aud||a.aud==sec}
function unread(kind,s){return S().ann.filter(function(a){return a.kind==kind&&nVisible(a,s.section)&&!(me.read&&me.read[a.id])})}
function markRead(kind,s){me.read=me.read||{};var ch=false;S().ann.forEach(function(a){if(a.kind==kind&&nVisible(a,s.section)&&!me.read[a.id]){me.read[a.id]=1;ch=true}});if(ch)save()}

/* ---------- قراءة إكسل (xlsx) و CSV بدون مكتبات ---------- */
async function inflate(u8){var s=new Blob([u8]).stream().pipeThrough(new DecompressionStream("deflate-raw"));return new Uint8Array(await new Response(s).arrayBuffer())}
async function unzip(buf){var dv=new DataView(buf),u8=new Uint8Array(buf),e=-1;for(var i=u8.length-22;i>=0;i--)if(dv.getUint32(i,true)==0x06054b50){e=i;break}if(e<0)throw new Error("zip");
 var n=dv.getUint16(e+10,true),p=dv.getUint32(e+16,true),out={},td=new TextDecoder();
 for(var k=0;k<n;k++){var m=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),el=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true),name=td.decode(u8.subarray(p+46,p+46+nl));
  var ds=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true),data=u8.subarray(ds,ds+cs);out[name]={m:m,d:data};p+=46+nl+el+cl}
 out._get=async function(nm){var f=out[nm];if(!f)return null;var b=f.m==0?f.d:await inflate(f.d);return td.decode(b)};return out}
function colIdx(ref){var l=ref.replace(/\d/g,""),n=0;for(var i=0;i<l.length;i++)n=n*26+l.charCodeAt(i)-64;return n-1}
async function readXlsx(buf){var z=await unzip(buf),dp=new DOMParser(),ss=[],sx=await z._get("xl/sharedStrings.xml");
 if(sx)[].forEach.call(dp.parseFromString(sx,"text/xml").getElementsByTagName("si"),function(si){ss.push([].map.call(si.getElementsByTagName("t"),function(t){return t.textContent}).join(""))});
 var nm=Object.keys(z).filter(function(k){return/^xl\/worksheets\/sheet\d+\.xml$/.test(k)}).sort()[0];if(!nm)throw new Error("sheet");
 var doc=dp.parseFromString(await z._get(nm),"text/xml"),rows=[];
 [].forEach.call(doc.getElementsByTagName("row"),function(r){var row=[];[].forEach.call(r.getElementsByTagName("c"),function(c){var t=c.getAttribute("t"),v=c.getElementsByTagName("v")[0],x;
  if(t=="s")x=ss[+v.textContent];else if(t=="inlineStr")x=[].map.call(c.getElementsByTagName("t"),function(q){return q.textContent}).join("");else x=v?v.textContent:"";row[colIdx(c.getAttribute("r"))]=x});rows.push(row)});return rows}
function readCsv(text){text=text.replace(/^\uFEFF/,"");var d=(text.split("\n")[0].match(/\t/g)||[]).length?"\t":(text.split("\n")[0].match(/;/g)||[]).length>(text.split("\n")[0].match(/,/g)||[]).length?";":",";
 var rows=[],r=[],c="",q=false;for(var i=0;i<text.length;i++){var ch=text[i];if(q){if(ch=='"'){if(text[i+1]=='"'){c+='"';i++}else q=false}else c+=ch}else if(ch=='"')q=true;else if(ch==d){r.push(c);c=""}else if(ch=="\n"||ch=="\r"){if(ch=="\r"&&text[i+1]=="\n")i++;r.push(c);c="";rows.push(r);r=[]}else c+=ch}
 if(c||r.length){r.push(c);rows.push(r)}return rows.filter(function(x){return x.some(function(y){return String(y).trim()})})}
function nz(s){return String(s||"").toLowerCase().replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/\s+/g,"")}
var COLS=[["user",["مستخدم","username","user"]],["pass",["مرور","password","pass"]],["name",["اسمالطالب","الاسم","اسم","name","student"]],["section",["صف","شعب","section","class"]],["phone",["هاتف","موبايل","جوال","رقم","phone","mobile"]],["gender",["جنس","gender"]],["birth",["ميلاد","birth"]],["address",["عنوان","address"]],["sup",["مشرف","supervisor"]],["fee",["قسط","رسوم","fee"]]];
var COLS_T=[["user",["مستخدم","username","user"]],["pass",["مرور","password","pass"]],["name",["الاسم","اسم","name"]],["subject",["مادة","subject"]],["phone",["هاتف","موبايل","جوال","رقم","phone","mobile"]],["sections",["شعب","صف","section","class"]]];
function mapBy(rows,spec){if(rows.length<2)return[];var hd=rows[0].map(nz),idx={},used={};
 spec.forEach(function(c){for(var i=0;i<hd.length;i++){if(used[i]||!hd[i])continue;if(c[1].some(function(k){return hd[i].indexOf(nz(k))>-1})){idx[c[0]]=i;used[i]=1;break}}});
 if(idx.name==null)return[];
 return rows.slice(1).map(function(r){var o={};for(var k in idx){var v=r[idx[k]];o[k]=v==null?"":String(v).trim()}
  if(o.birth&&/^\d{5}$/.test(o.birth)){var d=new Date(Math.round((+o.birth-25569)*86400000));o.birth=d.toISOString().slice(0,10)}
  if(o.gender){o.gender=/ذكر|male|^m/i.test(o.gender)?"ذكر":"أنثى"}
  return o}).filter(function(o){return o.name})}
function mapRows(r){return mapBy(r,COLS)}
function mapTeachers(r){return mapBy(r,COLS_T)}
/* ---------- صفوف وشعب ودوامين ---------- */
function secLabel(cls,name,shift){return cls+" / "+name+" ("+shift+")"}
function shiftOf(l){return/\(بنات\)/.test(l||"")?"بنات":/\(بنين\)/.test(l||"")?"بنين":""}
function rpw(n){var ch="abcdefghjkmnpqrstuvwxyz23456789",s="",a=new Uint8Array(n||6);try{crypto.getRandomValues(a)}catch(e){for(var i=0;i<a.length;i++)a[i]=Math.floor(Math.random()*256)}for(var j=0;j<a.length;j++)s+=ch[a[j]%ch.length];return s}
function newUser(prefix){var u;do{u=prefix+Math.floor(1000+Math.random()*9000)}while(userOk(u));return u}
function credCard(){if(!ui.cred||!ui.cred.length)return"";return"<section class='c credc'><h3>قائمة حسابات الدخول ("+ui.cred.length+")</h3><p class='mu'>احفظ هذه القائمة أو اطبعها الآن: كلمات المرور لا تظهر مرة أخرى بعد مغادرة الصفحة.</p><div class='sc'><table><thead><tr><th>الاسم</th><th>النوع</th><th>اسم المستخدم</th><th>كلمة المرور</th></tr></thead><tbody>"+ui.cred.map(function(r){return"<tr><td>"+esc(r.n)+"</td><td>"+esc(r.t)+"</td><td dir='ltr' style='text-align:right'>"+esc(r.u)+"</td><td dir='ltr' style='text-align:right'><b>"+esc(r.p)+"</b></td></tr>"}).join("")+"</tbody></table></div><p class='np'><button class='b' data-a='printcred'>طباعة القائمة</button> <button class='b g' data-a='expcred'>تصدير CSV</button></p></section>"}
