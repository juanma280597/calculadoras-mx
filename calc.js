
var UMA=117.31,UMAM=3566.22,F=1.1321;
var T=[[0.01,0,1.92],[746.05,14.32,6.4],[6332.06,371.83,10.88],[11128.02,893.63,16],[12935.83,1182.88,17.92],[15487.72,1640.18,21.36],[31236.5,5004.12,23.52],[49233.01,9236.89,30],[93993.91,22665.17,32],[125325.21,32691.18,34],[375975.62,117912.32,35]];
var $=function(i){return document.getElementById(i)};
var mx=new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"});
var m=function(x){return mx.format(x)};
var num=function(i){var v=parseFloat($(i).value);return isNaN(v)||v<0?0:v};
function isr(x){var r=T[0];for(var i=0;i<T.length;i++){if(x>=T[i][0]*F)r=T[i]}return r[1]*F+(x-r[0]*F)*r[2]/100}
function imss(b){var s=b/30*1.0493;s=Math.min(s,25*UMA);var c=s*30.4*0.02375;if(s>3*UMA)c+=(s-3*UMA)*30.4*0.004;return c}
function neto(b){var sub=b<=11492.66?535.65:0;return b-(isr(b)-sub)-imss(b)}
function rows(a){return "<table>"+a.map(function(r){return "<tr"+(r[2]?' class="t"':"")+"><td>"+r[0]+"</td><td>"+r[1]+"</td></tr>"}).join("")+"</table>"}
function sueldo(){
 var modo=$("s_modo").value,v=num("s_monto"),b=v;
 if(modo==="nb"){var lo=v,hi=v*3+1000;for(var i=0;i<60;i++){var mid=(lo+hi)/2;if(neto(mid)<v)lo=mid;else hi=mid}b=(lo+hi)/2}
 var sub=b<=11492.66?535.65:0,i1=isr(b),im=imss(b),n=neto(b);
 $("s_res").innerHTML=(modo==="bn"?'<div>Sueldo neto mensual</div><div class="big">'+m(n)+"</div>":'<div>Sueldo bruto mensual</div><div class="big">'+m(b)+"</div>")+rows([["Sueldo bruto",m(b)],["ISR",("−"+m(i1))],["Subsidio al empleo","+"+m(sub)],["IMSS (obrero)","−"+m(im)],["Sueldo neto",m(n),1]]);
}
function vac(y){return y<=1?12:y<=5?10+2*y:y<=10?22:y<=15?24:y<=20?26:y<=25?28:y<=30?30:32}
function finiquito(){
 var s=num("f_sal"),d=s/30,ing=new Date($("f_ing").value),sa=new Date($("f_sali").value);
 if(!$("f_ing").value||!$("f_sali").value||sa<ing){$("f_res").innerHTML="Elige fechas válidas de ingreso y salida.";return}
 var DAY=864e5,tot=(sa-ing)/DAY+1,anios=tot/365,n=0;
 while(true){var a=new Date(ing);a.setFullYear(ing.getFullYear()+n+1);if(a<=sa)n++;else break}
 var an=new Date(ing);an.setFullYear(ing.getFullYear()+n);var dv=(sa-an)/DAY+1;
 var ini=new Date(sa.getFullYear(),0,1);if(ing>ini)ini=ing;var da=(sa-ini)/DAY+1;
 var pen=d*num("f_pen"),ag=d*15*da/365,vp=Math.max(0,vac(n+1)*dv/365-num("f_vd")),vm=vp*d,pv=vm*0.25,fin=pen+ag+vm+pv;
 var r=[["Sueldo pendiente",m(pen)],["Aguinaldo proporcional",m(ag)],["Vacaciones pendientes ("+vp.toFixed(1)+" días)",m(vm)],["Prima vacacional (25%)",m(pv)],["Total finiquito",m(fin),1]];
 var gran=fin;
 if($("f_tipo").value==="d"){
  var l90=d*90,l20=d*20*anios,pa=Math.min(d,2*315.04)*12*anios;
  r.push(["3 meses de indemnización",m(l90)],["20 días por año de servicio",m(l20)],["Prima de antigüedad",m(pa)]);
  gran=fin+l90+l20+pa;r.push(["Total finiquito + liquidación",m(gran),1]);
 }else if(anios>=15){var pa2=Math.min(d,2*315.04)*12*anios;gran=fin+pa2;r.splice(4,0,["Prima de antigüedad",m(pa2)]);r[r.length-1]=["Total finiquito",m(gran),1]}
 $("f_res").innerHTML='<div>Total estimado (bruto)</div><div class="big">'+m(gran)+"</div>"+rows(r);
}
function aguinaldo(){
 var s=num("a_sal"),d=s/30,dias=num("a_dias"),tr=Math.min(num("a_trab"),365),b=d*dias*tr/365,ex=Math.min(b,30*UMA),gr=b-ex,i=0;
 if(gr>0){var ad=gr/365*30.4;i=(isr(s+ad)-isr(s))/ad*gr;if(s<=11492.66)i=Math.max(0,i)}
 $("a_res").innerHTML='<div>Aguinaldo neto estimado</div><div class="big">'+m(b-i)+"</div>"+rows([["Aguinaldo bruto",m(b)],["Parte exenta (30 UMA)",m(ex)],["Parte gravada",m(gr)],["ISR estimado","−"+m(i)],["Aguinaldo neto",m(b-i),1]]);
}
function run(){if($("s_res"))sueldo();if($("f_res"))finiquito();if($("a_res"))aguinaldo()}
document.addEventListener("input",run);
(function(){if($("f_sali")){var t=new Date(),p=function(x){return x<10?"0"+x:x};$("f_sali").value=t.getFullYear()+"-"+p(t.getMonth()+1)+"-"+p(t.getDate())}run()})();
