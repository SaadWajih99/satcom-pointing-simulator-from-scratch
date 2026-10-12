(() => {
"use strict";
const $ = id => document.getElementById(id);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const wrap=x=>((x%360)+360)%360;
const errAngle=(t,p)=>((t-p+540)%360)-180;
const val=id=>Number($(id).value);
const fmt=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):"—";
const S={running:true,time:0,last:null,acc:0,dt:.02,sampleClock:0,samples:[],targetAz:242,targetEl:65,
 az:{p:0,v:0,i:0,m:0,effort:0,h:[]},el:{p:0,v:0,i:0,m:0,effort:0,h:[]}};
function measure(a,name){
 const desired=S.time-val("delay")/1000;let p=a.p;
 for(let i=a.h.length-1;i>=0;i--)if(a.h[i].t<=desired){p=a.h[i].p;break;}
 p+=val("bias")+(Math.random()*2-1)*val("noise");
 return name==="az"?wrap(p):clamp(p,0,90);
}
function axisStep(a,name,dt){
 a.h.push({t:S.time,p:a.p});while(a.h.length>2&&a.h[1].t<S.time-2)a.h.shift();
 a.m=measure(a,name);
 const target=name==="az"?S.targetAz:S.targetEl;
 const e=name==="az"?errAngle(target,a.m):target-a.m;
 const kp=val(name+"-kp"),ki=val(name+"-ki"),kd=val(name+"-kd");
 const candidate=clamp(a.i+e*dt,-100,100);
 const limit=val(name+"-accel");
 const raw=kp*e+ki*candidate-kd*a.v;
 const command=clamp(raw,-limit,limit);
 if(Math.abs(raw)<=limit||Math.sign(e)!==Math.sign(raw))a.i=candidate;
 a.effort+=((command-a.effort)/.16)*dt;
 const wind=val("wind")*(name==="az"?1:.45);
 const accel=clamp(a.effort-val("damping")*.12*a.v+wind,-limit,limit);
 a.v=clamp(a.v+accel*dt,-val(name+"-speed"),val(name+"-speed"));
 let next=a.p+a.v*dt;
 if(name==="az")a.p=wrap(next);else{if(next<0){next=0;a.v=Math.max(0,a.v)}if(next>90){next=90;a.v=Math.min(0,a.v)}a.p=next}
}
function step(dt){
 S.time+=dt;axisStep(S.az,"az",dt);axisStep(S.el,"el",dt);
 S.sampleClock+=dt;if(S.sampleClock>=.1){S.sampleClock=0;S.samples.push({t:S.time,az:S.az.p,azT:S.targetAz,azE:errAngle(S.targetAz,S.az.p),elE:S.targetEl-S.el.p});}
 while(S.samples.length&&S.samples[0].t<S.time-30)S.samples.shift();
}
function drawChart(id,series,min,max,unit){
 const cv=$(id),r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1,w=Math.max(240,r.width),h=Math.max(160,r.height);
 if(cv.width!==Math.round(w*d)||cv.height!==Math.round(h*d)){cv.width=Math.round(w*d);cv.height=Math.round(h*d)}
 const c=cv.getContext("2d");c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,w,h);
 const p={l:39,r:9,t:13,b:24},pw=w-p.l-p.r,ph=h-p.t-p.b,end=Math.max(10,S.time),start=Math.max(0,end-10),data=S.samples.filter(x=>x.t>=start);
 c.font="10px system-ui";c.lineWidth=1;
 for(let i=0;i<=4;i++){let y=p.t+ph*i/4,x=p.l+pw*i/4,v=max-(max-min)*i/4;c.strokeStyle="#25414c";c.beginPath();c.moveTo(p.l,y);c.lineTo(w-p.r,y);c.stroke();c.fillStyle="#9ab3bd";c.textAlign="right";c.fillText(v.toFixed(0)+unit,p.l-5,y+3);c.textAlign="center";c.fillText((start+(end-start)*i/4).toFixed(0)+"s",x,h-6)}
 series.forEach(s=>{c.strokeStyle=s.color;c.lineWidth=2;c.beginPath();let begun=false;for(const q of data){let x=p.l+(q.t-start)/(end-start)*pw,y=p.t+(max-q[s.key])/(max-min)*ph;if(!begun){c.moveTo(x,y);begun=true}else c.lineTo(x,y)}c.stroke()});
}
function visuals(){
 const ep=v=>({x:160+Math.sin(v*Math.PI/180)*100,y:180-Math.cos(v*Math.PI/180)*100});
 for(const [id,v] of [["el-target-arm",S.targetEl],["el-actual-arm",S.el.p]]){const q=ep(v);$(id).setAttribute("x2",q.x);$(id).setAttribute("y2",q.y)}
 const ap=v=>({x:160+Math.sin(v*Math.PI/180)*70,y:110-Math.cos(v*Math.PI/180)*70});
 for(const [id,v] of [["az-target-arm",S.targetAz],["az-actual-arm",S.az.p]]){const q=ap(v);$(id).setAttribute("x2",q.x);$(id).setAttribute("y2",q.y)}
 drawChart("position-chart",[{key:"azT",color:"#f4bd62"},{key:"az",color:"#58e0dc"}],0,360,"°");
 drawChart("error-chart",[{key:"azE",color:"#58e0dc"},{key:"elE",color:"#f4bd62"}],-180,180,"°");
}
function render(){
 $("status-text").textContent=S.running?"SIMULATION ACTIVE":"SIMULATION PAUSED";$("status-text").parentElement.classList.toggle("paused",!S.running);$("pause-btn").textContent=S.running?"Pause":"Resume";
 $("sim-time").textContent=S.time.toFixed(2)+" s";
 for(const [n,a] of [["az",S.az],["el",S.el]]){const t=n==="az"?S.targetAz:S.targetEl,e=n==="az"?errAngle(t,a.m):t-a.m;$(`${n}-pos`).textContent=fmt(a.p)+"°";$(`${n}-measured`).textContent=fmt(a.m)+"°";$(`${n}-error`).textContent=fmt(e)+"°";$(`${n}-velocity`).textContent=fmt(a.v)+"°/s"}
 visuals();
}
function frame(t){
 try{if(S.last===null)S.last=t;const elapsed=clamp((t-S.last)/1000,0,.1);S.last=t;if(S.running){S.acc+=elapsed;let count=0;while(S.acc>=S.dt&&count<5){step(S.dt);S.acc-=S.dt;count++}if(count===5)S.acc=0}render()}
 catch(e){console.error("Simulation update failed:",e);$("status-text").textContent="ERROR — SEE CONSOLE"}
 requestAnimationFrame(frame);
}
function outputs(){
 const items=[["az-target","az-target-out",0,"°"],["el-target","el-target-out",0,"°"],
 ["az-kp","az-kp-out",1,""],["az-ki","az-ki-out",2,""],["az-kd","az-kd-out",1,""],
 ["el-kp","el-kp-out",1,""],["el-ki","el-ki-out",2,""],["el-kd","el-kd-out",1,""],
 ["az-speed","az-speed-out",0,"°/s"],["az-accel","az-accel-out",0,"°/s²"],["el-speed","el-speed-out",0,"°/s"],["el-accel","el-accel-out",0,"°/s²"],
 ["damping","damping-out",1,""],["wind","wind-out",1,"°/s²"],["delay","delay-out",0," ms"],["noise","noise-out",2,"°"],["bias","bias-out",2,"°"]];
 for(const [input,out,d,suffix] of items)$(out).textContent=val(input).toFixed(d)+suffix;
 S.targetAz=val("az-target");S.targetEl=val("el-target");
}
function reset(){S.time=0;S.last=null;S.acc=0;S.sampleClock=0;S.samples=[];for(const a of [S.az,S.el]){a.p=0;a.v=0;a.i=0;a.m=0;a.effort=0;a.h=[]}render()}
function scenario(type){
 if(type==="normal"){for(const [id,v] of [["az-kp",2.4],["az-ki",.08],["az-kd",.7],["el-kp",2.4],["el-ki",.08],["el-kd",.7],["delay",120],["noise",.15],["wind",0]])$(id).value=v}
 if(type==="noisy"){for(const [id,v] of [["delay",560],["noise",1.4],["wind",1.5]])$(id).value=v}
 if(type==="aggressive"){for(const [id,v] of [["az-kp",10],["az-ki",0],["az-kd",0],["el-kp",10],["el-ki",0],["el-kd",0]])$(id).value=v}
 outputs()
}
function init(){
 const must=["az-target","el-target","position-chart","error-chart","pause-btn","reset-btn","status-text"];
 const missing=must.filter(id=>!$(id));if(missing.length)throw Error("Missing HTML elements: "+missing.join(", "));
 document.querySelectorAll('input[type="range"]').forEach(el=>el.addEventListener("input",outputs));
 $("pause-btn").addEventListener("click",()=>{S.running=!S.running;S.last=null;render()});
 $("reset-btn").addEventListener("click",reset);$("clear-btn").addEventListener("click",()=>{S.samples=[];render()});
 $("scenario-normal").addEventListener("click",()=>scenario("normal"));$("scenario-noisy").addEventListener("click",()=>scenario("noisy"));$("scenario-aggressive").addEventListener("click",()=>scenario("aggressive"));
 outputs();render();requestAnimationFrame(frame);
}
try{init()}catch(e){console.error("Simulator initialisation failed:",e);const s=$("status-text");if(s)s.textContent="INITIALISATION ERROR — OPEN CONSOLE"}
})();