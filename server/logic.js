/* ===== منطق الإجراءات — يعمل داخل الخادم فقط (يُحمَّل بعد core.js) ===== */
var FORM={},OUT={toast:"",err:"",dirty:false,newtok:false};
function save(){OUT.dirty=true}
function toast(m){OUT.toast=m}
function err(m){OUT.err=m}
function raw(i){var v=FORM[i];return v==null||typeof v=="object"?"":String(v)}
function val(i){return raw(i).trim()}
function isOn(i){return FORM[i]===true}
function has(i){return FORM[i]!==undefined}
function checked(g){var a=FORM["g:"+g];return Array.isArray(a)?a:[]}
function fkeys(p){return Object.keys(FORM).filter(function(k){return k.indexOf(p)==0})}
function hashPw(salt,p){return NODE.scrypt(p,salt)}
var PEND=[];
function mkUser(role,schoolId,name,username,pw,extra){var u={id:uid(),role:role,schoolId:schoolId,name:name,username:username,salt:uid()+uid(),hash:""};for(var k in extra)u[k]=extra[k];if(role=="teacher"||role=="parent")u.pwe=NODE.enc(pw);PEND.push({u:u,pw:pw});return u}
function setPw(u,pw,keep){u.salt=uid()+uid();u.hash="";if(keep&&(u.role=="teacher"||u.role=="parent"))u.pwe=NODE.enc(pw);else delete u.pwe;PEND.push({u:u,pw:pw})}
var FIELDS={lessons:["title","subject","section","url","text"],lib:["title","subject","url"],vids:["title","url"],events:["title","date","desc"],exsch:["subject","section","date","time","hall"],hw:["title","subject","section","due","desc"]};
var DELC=["ann","grades","evals","lessons","lib","vids","events","exsch","hw","exams"];
var PERM={lessons:["teacher","principal"],lib:["teacher","principal"],vids:["teacher","principal"],events:["principal"],exsch:["principal"],sched:["principal"],hw:["teacher","principal"],evals:["teacher"],sci:["teacher","principal"],adm:["principal"],grades:["teacher","principal"],exams:["teacher"]};
var REQ={exsch:"subject",lessons:"title",lib:"title",vids:"title",events:"title",hw:"title"};
function today(){var u=typeof ui!="undefined"&&ui?ui.today:"";if(/^\d{4}-\d{2}-\d{2}$/.test(u||""))return u;var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function okDate(x){return/^\d{4}-\d{2}-\d{2}$/.test(x||"")}
function okSec(x){return!x||S().sections.indexOf(x)>-1}
function num(x){var n=parseFloat(x);return isFinite(n)?n:NaN}
function mine(c,id){return(S()[c]||[]).filter(function(x){return x.id==id})[0]}
function markRead(kind,s){me.read=me.read||{};S().ann.forEach(function(a){if(a.kind==kind&&nVisible(a,s.section)&&!me.read[a.id]){me.read[a.id]=1;save()}})}
function str(x,n){return String(x==null?"":x).trim().slice(0,n||200)}

function doAction(a,i,d){d=d||{};if(!me)return;var R=me.role,P=R=="principal",T=R=="teacher",O=R=="owner",PA=R=="parent";
 /* ===== مسؤول النظام ===== */
 if(a=="addsch"&&O){var sn=val("sn"),pn=val("pn"),pu=val("pu").toLowerCase(),pp=raw("pw"),m=userOk(pu);if(!sn||!pn)return toast("اكتب اسم المدرسة واسم المدير");if(m)return toast(m);if(pp.length<6)return toast("كلمة المرور 6 أحرف على الأقل");var s={id:uid(),name:sn.slice(0,100),off:false,priv:false,year:yearLbl()};db.schools.push(s);db.data[s.id]=blank();db.users.push(mkUser("principal",s.id,pn.slice(0,100),pu,pp,{}));save();return toast("تم إنشاء المدرسة وحساب المدير")}
 if(a=="offsch"&&O){var s=school(i);if(s){s.off=!s.off;save()}return}
 if(a=="delsch"&&O){db.schools=db.schools.filter(function(s){return s.id!=i});delete db.data[i];db.users=db.users.filter(function(u){return u.schoolId!=i});save();return}
 /* ===== مشترك ===== */
 if(a=="pwu"){var u=findUser(i);if(!u||u.role=="owner")return;var okO=O&&u.role=="principal",okP=P&&u.schoolId==me.schoolId&&(u.role=="teacher"||u.role=="parent");if(!okO&&!okP)return;var np=raw("newpw");if(np.length<6)return toast("كلمة المرور 6 أحرف على الأقل");setPw(u,np,true);save();return toast("تم تغيير كلمة المرور")}
 if(a=="chpw"){if(me.hash!=hashPw(me.salt,raw("o1")))return toast("كلمة المرور الحالية غير صحيحة");var n=raw("o2");if(n.length<6)return toast("الجديدة 6 أحرف على الأقل");setPw(me,n);OUT.newtok=true;save();return toast("تم تغيير كلمة المرور")}
 if(a=="saveprof"&&T){me.phone=str(val("mph"),30);me.subject=str(val("msb"),60);save();return toast("تم الحفظ")}
 if(a=="markread"&&PA){var K=kid();if(K&&(d.k=="sci"||d.k=="adm"))markRead(d.k,K);return}
 if(O||!me.schoolId)return;
 /* ===== المدير ===== */
 if(P){
 if(a=="savestu"){var n=val("f_name");if(!n)return toast("اكتب اسم الطالب");var s=i?byId(i):null,o={name:n.slice(0,100),section:okSec(val("f_section"))?val("f_section"):"",phone:str(val("f_phone"),30),gender:val("f_gender")=="ذكر"?"ذكر":"أنثى",birth:okDate(val("f_birth"))?val("f_birth"):"",address:str(val("f_address"),150),sup:str(val("f_sup"),100)};if(has("f_fee"))o.fee=Math.max(0,num(val("f_fee"))||0);
  var sh=shiftOf(o.section);if(sh)o.gender=sh=="بنات"?"أنثى":"ذكر";if(s)for(var k in o)s[k]=o[k];else{o.id=uid();o.inst=[];S().students.push(o)}ui.edit=null;save();return toast("تم الحفظ")}
 if(a=="delstu"){var sc=S();["grades","evals","subs","results"].forEach(function(c){sc[c]=sc[c].filter(function(g){return g.sid!=i})});sc.students=sc.students.filter(function(s){return s.id!=i});for(var dd in sc.att)delete sc.att[dd][i];db.users.forEach(function(u){if(u.children)u.children=u.children.filter(function(c){return c!=i})});save();return}
 if(a=="addinst"){var s=byId(i),am=num(val("i_a"));if(!s||isNaN(am)||am<0)return toast("أدخل مبلغ القسط");s.inst=s.inst||[];s.inst.push({id:uid(),title:str(val("i_t"),60),amount:am,date:okDate(val("i_d"))?val("i_d"):today(),paid:false});save();return}
 if(a=="togpaid"){var s=byId(i),x=s&&(s.inst||[]).filter(function(y){return y.id==d.j})[0];if(x){x.paid=!x.paid;save()}return}
 if(a=="delinst"){var s=byId(i);if(s){s.inst=(s.inst||[]).filter(function(y){return y.id!=d.j});save()}return}
 if(a=="doimp"){var rows=Array.isArray(ui.imp)?ui.imp.slice(0,3000):[],added=0,skip=0,acc=0,sc=S(),cr=[];rows.forEach(function(o){o.name=str(o.name,100);if(!o.name)return;o.section=str(o.section,100);o.phone=str(o.phone,30);
  if(sc.students.some(function(s){return s.name==o.name&&s.section==o.section&&s.phone==o.phone})){skip++;return}
  var s={id:uid(),name:o.name,section:o.section,phone:o.phone,gender:o.gender=="ذكر"?"ذكر":"أنثى",birth:str(o.birth,10),address:str(o.address,150),sup:str(o.sup,100),fee:Math.max(0,num(o.fee)||0),inst:[]};var shh=shiftOf(s.section);if(shh)s.gender=shh=="بنات"?"أنثى":"ذكر";sc.students.push(s);added++;if(s.section&&sc.sections.indexOf(s.section)<0)sc.sections.push(s.section);
  var un=str(o.user,30).toLowerCase(),pw=String(o.pass||"");if(un&&pw){var ex=allUsers().filter(function(u){return u.username==un})[0];if(ex){if(ex.role=="parent"&&ex.schoolId==me.schoolId){ex.children.push(s.id);acc++}}else if(!userOk(un)&&pw.length>=6&&pw.length<=100){db.users.push(mkUser("parent",me.schoolId,"ولي أمر "+o.name,un,pw,{children:[s.id]}));acc++;cr.push({n:"ولي أمر "+o.name,t:"ولي أمر",u:un,p:pw})}}});
  ui.imp=null;ui.stat={added:added,skip:skip,acc:acc};ui.cred=cr.length?cr:null;save();return toast("تم استيراد "+added+" طالب"+(skip?" (تخطي "+skip+" مكرر)":"")+(acc?" — حسابات أولياء الأمور: "+acc:""))}
 if(a=="addtch"){var n=val("tn"),u=val("tu").toLowerCase(),p=raw("tp"),m=userOk(u);if(!n)return toast("اكتب اسم المعلم");if(m)return toast(m);if(p.length<6)return toast("كلمة المرور 6 أحرف على الأقل");db.users.push(mkUser("teacher",me.schoolId,n.slice(0,100),u,p,{subject:str(val("tm"),60),phone:str(val("tph"),30),sections:checked("ts").filter(okSec)}));save();return toast("تم إنشاء حساب المعلم")}
 if(a=="addpar"){var n=val("qn"),u=val("qu").toLowerCase(),p=raw("qp"),m=userOk(u);if(!n)return toast("اكتب اسم ولي الأمر");if(m)return toast(m);if(p.length<6)return toast("كلمة المرور 6 أحرف على الأقل");var ch=checked("pc").filter(byId);if(!ch.length)return toast("اختر طالباً واحداً على الأقل");db.users.push(mkUser("parent",me.schoolId,n.slice(0,100),u,p,{children:ch}));save();return toast("تم إنشاء حساب ولي الأمر")}
 if(a=="delu"){var u=findUser(i);if(!u||u.schoolId!=me.schoolId||(u.role!="teacher"&&u.role!="parent"))return;db.users=db.users.filter(function(x){return x.id!=i});save();return}
 if(a=="savesc"){var n=val("cn");if(!n)return;SC().name=n.slice(0,100);SC().priv=isOn("cpriv");S().info.phone=str(val("cp"),30);save();return toast("تم الحفظ")}
 if(a=="addclass"){var n=val("cc").slice(0,60);if(!n)return toast("اكتب اسم الصف");if(S().classes.some(function(c){return c.name==n}))return toast("الصف موجود");S().classes.push({id:uid(),name:n});save();return}
 if(a=="delclass"){var c=S().classes.filter(function(x){return x.id==i})[0];if(!c)return;S().secs.filter(function(x){return x.cls==c.name}).forEach(function(x){S().sections=S().sections.filter(function(l){return l!=x.label})});S().secs=S().secs.filter(function(x){return x.cls!=c.name});S().classes=S().classes.filter(function(x){return x.id!=i});save();return}
 if(a=="addsecs"){var cl=val("sc_cls"),nm=val("sc_names").split(/[,،]/).map(function(x){return x.trim().slice(0,30)}).filter(Boolean).slice(0,40),sh=val("sc_shift"),shs=sh=="بنين وبنات"?["بنين","بنات"]:sh=="بنات"?["بنات"]:["بنين"],n=0;if(!S().classes.some(function(c){return c.name==cl}))return toast("أضف صفاً أولاً");if(!nm.length)return toast("اكتب اسم الشعبة (مثل: أ)");
  shs.forEach(function(x){nm.forEach(function(y){var l=secLabel(cl,y,x);if(S().sections.indexOf(l)<0){S().sections.push(l);S().secs.push({id:uid(),cls:cl,name:y,shift:x,label:l});n++}})});save();return toast("أُضيفت "+n+" شعبة")}
 if(a=="delsec"){S().sections=S().sections.filter(function(x){return x!=i});S().secs=S().secs.filter(function(x){return x.label!=i});save();return}
 if(a=="setper"){var p=parseInt(val("np"));if(p>=1&&p<=10){S().info.periods=p;save()}return}
 if(a=="savesched"){var sec=ui.sec,N=10;if(!sec||!okSec(sec))return;S().sched=S().sched.filter(function(x){return x.section!=sec});var cnt=0;
  for(var p=1;p<=N;p++)DAYS.forEach(function(dy,di){if(!has("tt_s_"+di+"_"+p))return;var sj=str(val("tt_s_"+di+"_"+p),60);if(sj){S().sched.push({id:uid(),section:sec,day:dy,period:String(p),subject:sj,teacher:str(val("tt_t_"+di+"_"+p),60),by:me.name,byId:me.id,date:today()});cnt++}});ui.se=false;save();return toast("تم حفظ الجدول ("+cnt+" حصة)")}
 if(a=="doimpt"){var rows=Array.isArray(ui.impt)?ui.impt.slice(0,500):[],cr=[],n=0;rows.forEach(function(o){var nm=str(o.name,100);if(!nm)return;var un=str(o.user,30).toLowerCase(),pw=String(o.pass||"");if(!un||userOk(un))un=newUser("t");if(pw.length<6||pw.length>100)pw=rpw(7);var secs=String(o.sections||"").split(/[;؛|]/).map(function(x){return x.trim()}).filter(function(x){return S().sections.indexOf(x)>-1});
  db.users.push(mkUser("teacher",me.schoolId,nm,un,pw,{subject:str(o.subject,60),phone:str(o.phone,30),sections:secs}));cr.push({n:nm,t:"معلم",u:un,p:pw});n++});ui.impt=null;ui.stat={n:n};ui.cred=cr;save();return toast("تم إنشاء "+n+" حساب معلم")}
 if(a=="autopar"){var linked={};db.users.forEach(function(u){if(u.schoolId==me.schoolId&&u.role=="parent")(u.children||[]).forEach(function(c){linked[c]=1})});var groups={},list=[];
  S().students.forEach(function(s){if(linked[s.id])return;var k=(s.phone||"").replace(/\D/g,"")||("x"+s.id);if(!groups[k]){groups[k]={ph:s.phone,kids:[]};list.push(groups[k])}groups[k].kids.push(s)});
  var all=list.length;list=list.slice(0,20);ui.rem=all-list.length;var cr=[];list.forEach(function(g){var un=newUser("p"),pw=rpw(7),nm="ولي أمر "+g.kids.map(function(s){return s.name.split(" ")[0]}).join(" و ");db.users.push(mkUser("parent",me.schoolId,nm.slice(0,100),un,pw,{children:g.kids.map(function(s){return s.id})}));cr.push({n:nm+" ("+g.kids.map(function(s){return s.name}).join("، ")+")",t:"ولي أمر",u:un,p:pw})});ui.cred=cr;ui.stat={n:cr.length};save();return toast("تم إنشاء "+cr.length+" حساب")}
 if(a=="delstus"){var gone={};checked("sel").forEach(function(x){gone[x]=1});var sc=S(),n=0;sc.students.forEach(function(s){if(gone[s.id])n++});if(!n)return toast("لم تحدد أي طالب");["grades","evals","subs","results"].forEach(function(c){sc[c]=sc[c].filter(function(g){return!gone[g.sid]})});sc.students=sc.students.filter(function(s){return!gone[s.id]});for(var dd in sc.att)for(var k in gone)delete sc.att[dd][k];db.users.forEach(function(u){if(u.schoolId==me.schoolId&&u.children)u.children=u.children.filter(function(c){return!gone[c]})});save();return toast("تم حذف "+n+" طالب")}
 if(a=="delus"){var gone={},n=0;checked("sel").forEach(function(x){gone[x]=1});db.users=db.users.filter(function(u){if(gone[u.id]&&u.schoolId==me.schoolId&&(u.role=="teacher"||u.role=="parent")){n++;return false}return true});if(!n)return toast("لم تحدد أي حساب");save();return toast("تم حذف "+n+" حساب")}
 if(a=="markexp"){S().exp={year:SC().year,at:today()};save();return}
 if(a=="delarch"){S().arch=[];save();return toast("تم حذف الأرشيف القديم من الخادم")}
 if(a=="closeyear"){var sc=S(),yr=SC().year;if(!sc.exp||sc.exp.year!=yr)return toast("نزّل ملف الأرشيف أولاً ثم أنهِ السنة");
  var failed={};checked("fail").forEach(function(x){failed[x]=1});var info={};sc.secs.forEach(function(x){info[x.label]=x});var nx={};sc.classes.forEach(function(c){nx[c.name]=val("nx_"+c.id)});
  var moves=[],gone={},stay=0,grad=0;
  sc.students.forEach(function(s){var si=info[s.section],t=si?nx[si.cls]:"";if(failed[s.id]||!si||!t){stay++;return}if(t=="__grad"){gone[s.id]=1;grad++;return}if(!sc.classes.some(function(c){return c.name==t})){stay++;return}moves.push([s,secLabel(t,si.name,si.shift),t,si])});
  moves.forEach(function(m){var l=m[1];if(sc.sections.indexOf(l)<0){sc.sections.push(l);sc.secs.push({id:uid(),cls:m[2],name:m[3].name,shift:m[3].shift,label:l})}m[0].section=l});
  if(grad){sc.students=sc.students.filter(function(s){return!gone[s.id]});db.users=db.users.filter(function(u){if(u.schoolId!=me.schoolId||u.role!="parent"||!u.children)return true;var had=u.children.length;u.children=u.children.filter(function(c){return!gone[c]});return!(had&&!u.children.length)})}
  sc.att={};["grades","evals","hw","subs","exams","results","ann","lessons"].forEach(function(c){sc[c]=[]});sc.exp=null;SC().year=str(val("ny"),20)||yearLbl();db.users.forEach(function(u){if(u.schoolId==me.schoolId)u.read={}});save();
  return toast("تمت الأرشفة وبدأت السنة الجديدة — رُحّل "+moves.length+"، بقي "+stay+(grad?"، تخرّج "+grad:""))}
 }
 /* ===== المعلم والمدير ===== */
 if(T||P){
 var dt=okDate(ui.date)?ui.date:today();
 if(a=="st"){var s=byId(i);if(!s||vis().indexOf(s)<0||["P","A","L"].indexOf(d.s)<0)return;S().att[dt]=S().att[dt]||{};S().att[dt][i]=d.s;save();return}
 if(a=="addgr"){var v=num(val("gv")),mx=num(val("gx"))||100,s=byId(val("gs"));if(isNaN(v)||v<0||mx<=0||!s||vis().indexOf(s)<0)return toast("أدخل الطالب والدرجة");S().grades.push({id:uid(),sid:s.id,subject:str(val("gm"),60),exam:str(val("ge"),60),score:v,max:mx,term:TERMS.indexOf(val("gt"))>-1?val("gt"):"",date:today(),byId:me.id});save();return toast("تم الحفظ")}
 if(a=="addann"){var k=d.k;if(k!="sci"&&k!="adm")return;if(k=="adm"&&!P)return;if(!val("g_ann_title"))return toast("اكتب العنوان");var aud=val("g_ann_aud");if(!okSec(aud))return;if(T&&me.sections&&me.sections.length&&me.sections.indexOf(aud)<0)return toast("اختر شعبتك");S().ann.push({id:uid(),kind:k,title:str(val("g_ann_title"),150),body:str(val("g_ann_body"),3000),aud:aud,by:me.name,byId:me.id,date:today()});save();return toast("تم النشر")}
 if(a=="addg"){var c=d.c;if(!FIELDS[c]||!PERM[c]||PERM[c].indexOf(R)<0)return;var item={id:uid(),by:me.name,byId:me.id},pre="g_"+c+"_";FIELDS[c].forEach(function(f){item[f]=has(pre+f)?str(val(pre+f),(f=="text"||f=="desc")?3000:300):undefined});
  if(REQ[c]&&!item[REQ[c]])return toast("أكمل الحقول المطلوبة");if(item.section!=null&&!okSec(item.section))return;if(T&&item.section!=null&&me.sections&&me.sections.length&&me.sections.indexOf(item.section)<0)return toast("اختر شعبتك");
  if((c=="events"||c=="exsch")&&!okDate(item.date))item.date=today();if(c=="hw"&&!okDate(item.due))item.due=today();if(!item.date||c=="hw"||c=="lessons"||c=="lib"||c=="vids")item.date=today();S()[c].push(item);save();return toast("تمت الإضافة")}
 if(a=="addexam"&&T){var qs=[],bad=0;val("x_q").split("\n").slice(0,100).forEach(function(l){if(!l.trim())return;var p=l.split("|").map(function(x){return x.trim().slice(0,300)});var ai=parseInt(p[p.length-1])-1,o=p.slice(1,-1);if(p.length<4||isNaN(ai)||ai<0||ai>=o.length)bad++;else qs.push({q:p[0],o:o,a:ai})});
  var sec=val("x_sec");if(!okSec(sec))return;if(!val("x_t")||!qs.length)return toast("اكتب العنوان وسؤالاً واحداً على الأقل");if(bad)return toast("هناك "+bad+" سطر بصيغة خاطئة");if(me.sections&&me.sections.length&&me.sections.indexOf(sec)<0)return toast("اختر شعبتك");
  S().exams.push({id:uid(),title:str(val("x_t"),150),subject:str(val("x_s"),60),section:sec,mins:parseInt(val("x_m"))||30,qs:qs,by:me.name,byId:me.id,date:today()});save();return toast("تم نشر الاختبار")}
 if(a=="addev"&&T){var s=byId(val("ev_s"));if(!s||vis().indexOf(s)<0||RATES.indexOf(val("ev_r"))<0)return toast("اختر الطالب والتقييم");S().evals.push({id:uid(),sid:s.id,subject:str(val("ev_m"),60),rate:val("ev_r"),note:str(val("ev_n"),1000),by:me.name,byId:me.id,date:today()});save();return toast("تم حفظ التقييم")}
 }
 if(a=="delg"){var c=d.c;if(DELC.indexOf(c)<0)return;var x=mine(c,i);if(!x)return;var okd=c=="ann"?(P||(T&&x.byId==me.id)):(PERM[c]&&PERM[c].indexOf(R)>-1&&(P||x.byId==me.id));if(!okd)return;S()[c]=S()[c].filter(function(y){return y.id!=i});save();return}
 /* ===== ولي الأمر ===== */
 if(PA){var K=kid();if(!K)return;
 if(a=="subexam"){var e2=mine("exams",i);if(!e2||!inSec(e2,K.section))return;if(S().results.some(function(r){return r.eid==i&&r.sid==K.id}))return toast("سبق تسليم هذا الاختبار");var sc=0;e2.qs.forEach(function(q,n){var r=FORM["r:q"+n];if(r!=null&&+r==q.a)sc++});S().results.push({id:uid(),eid:i,sid:K.id,score:sc,max:e2.qs.length,date:today()});ui.take=null;save();return toast("درجتك: "+sc+"/"+e2.qs.length)}
 if(a=="subhw"){var h=mine("hw",i),t=val("sub_"+i);if(!h||!inSec(h,K.section)||!t)return toast("اكتب الحل");if(S().subs.some(function(x){return x.hid==i&&x.sid==K.id}))return;S().subs.push({id:uid(),hid:i,sid:K.id,text:t.slice(0,3000),date:today()});save();return toast("تم رفع الحل")}
 }
}
