(function(){
"use strict";
var root=document.documentElement,reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
/* contour background */
function makeNoise(seed){var perm=[],i,j,s=(seed*2654435761)>>>0||1;for(i=0;i<256;i++)perm[i]=i;
  function rnd(){s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}
  for(i=255;i>0;i--){j=Math.floor(rnd()*(i+1));var t=perm[i];perm[i]=perm[j];perm[j]=t}
  var p=new Uint8Array(512);for(i=0;i<512;i++)p[i]=perm[i&255];
  function g(h,x,y){switch(h&7){case 0:return x+y;case 1:return x-y;case 2:return -x+y;case 3:return -x-y;case 4:return x;case 5:return -x;case 6:return y;default:return -y}}
  function fade(t){return t*t*t*(t*(t*6-15)+10)}
  return function(x,y){var xf=Math.floor(x),yf=Math.floor(y),X=xf&255,Y=yf&255;x-=xf;y-=yf;
    var u=fade(x),v=fade(y),a=p[p[X]+Y],b=p[p[X+1]+Y],c=p[p[X]+Y+1],d=p[p[X+1]+Y+1];
    var l1=g(a,x,y)+u*(g(b,x-1,y)-g(a,x,y)),l2=g(c,x,y-1)+u*(g(d,x-1,y-1)-g(c,x,y-1));return l1+v*(l2-l1)}}
var nz=makeNoise(5),cv=document.getElementById("terrain"),cx=cv.getContext("2d"),W,H,DPR,CELL=14,grid,busy=false;
var tk=document.getElementById("tracks"),tcx=tk&&tk.getContext("2d");
var HOVFULL=.22,hov={x:0,y:0,amp:0,target:0,el:null,r:300};
var ptr={x:-999,y:-999,tx:-999,ty:-999,amp:0,target:0,r:170,last:0};
function fbm(x,y){var a=1,f=1,s=0,t=0;for(var o=0;o<3;o++){s+=a*nz(x*f,y*f);t+=a;a*=.5;f*=2}return s/t}
function size(){
  DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
  cv.width=W*DPR;cv.height=H*DPR;if(tk){tk.width=W*DPR;tk.height=H*DPR}
  grid=null;req()
}
function req(){if(!busy){busy=true;requestAnimationFrame(frame)}}
function frame(){
  busy=false;var moving=false;
  hov.amp+=(hov.target-hov.amp)*(reduce?1:.1);
  if(Math.abs(hov.target-hov.amp)>.003)moving=true;else hov.amp=hov.target;
  if(hov.el)moving=true;
  var pk=reduce?1:.2;ptr.x+=(ptr.tx-ptr.x)*pk;ptr.y+=(ptr.ty-ptr.y)*pk;
  ptr.amp+=(ptr.target-ptr.amp)*(reduce?1:.12);
  if(Math.abs(ptr.target-ptr.amp)>.003)moving=true;else ptr.amp=ptr.target;
  if(Math.abs(ptr.tx-ptr.x)>.5||Math.abs(ptr.ty-ptr.y)>.5)moving=true;
  if(ptr.target>0&&performance.now()-ptr.last<1500)moving=true;
  draw();
  if(moving)req();
}
function draw(){
  var cs=getComputedStyle(root),cMin=cs.getPropertyValue("--contour").trim(),cMaj=cs.getPropertyValue("--contour-index").trim();
  var cols=Math.ceil(W/CELL)+1,rows=Math.ceil(H/CELL)+1,gw=cols+1,off=scrollY*.18,S=.0019,i,j;
  if(!grid||grid.length!==gw*(rows+1))grid=new Float32Array(gw*(rows+1));
  var peaks=[],now=reduce?0:performance.now();
  if(hov.amp>.003)peaks.push([hov.x,hov.y,hov.amp,hov.r]);
  if(ptr.amp>.003)peaks.push([ptr.x,ptr.y,ptr.amp,ptr.r]);
  for(j=0;j<=rows;j++)for(i=0;i<=cols;i++){
    var px=i*CELL,py=j*CELL,v=fbm(px*S+10,(py+off)*S+10);
    for(var q=0;q<peaks.length;q++){var pk=peaks[q],dx=px-pk[0],dy=py-pk[1],d=Math.sqrt(dx*dx+dy*dy);v+=pk[2]*.14*Math.exp(-d/pk[3])*Math.cos(d*.06-now*.0022)}
    grid[j*gw+i]=v;
  }
  cx.setTransform(DPR,0,0,DPR,0,0);cx.clearRect(0,0,W,H);
  var minor=new Path2D(),major=new Path2D(),glows=peaks.map(function(){return {N:new Path2D(),M:new Path2D(),F:new Path2D()}}),STEP=.05;
  for(j=0;j<rows;j++)for(i=0;i<cols;i++){
    var a=grid[j*gw+i],b=grid[j*gw+i+1],c=grid[(j+1)*gw+i+1],d=grid[(j+1)*gw+i];
    var k0=Math.ceil(Math.min(a,b,c,d)/STEP),k1=Math.floor(Math.max(a,b,c,d)/STEP);
    for(var k=k0;k<=k1;k++){
      var L=k*STEP,path=k%5===0?major:minor,x0=i*CELL,y0=j*CELL,m=(a>L?8:0)|(b>L?4:0)|(c>L?2:0)|(d>L?1:0);
      if(m===0||m===15)continue;
      var T=[x0+CELL*(L-a)/(b-a),y0],R=[x0+CELL,y0+CELL*(L-b)/(c-b)],B=[x0+CELL*(L-d)/(c-d),y0+CELL],Lf=[x0,y0+CELL*(L-a)/(d-a)],s;
      switch(m){case 1:case 14:s=[Lf,B];break;case 2:case 13:s=[B,R];break;case 3:case 12:s=[Lf,R];break;case 4:case 11:s=[T,R];break;
        case 5:s=[Lf,T,B,R];break;case 6:case 9:s=[T,B];break;case 7:case 8:s=[Lf,T];break;case 10:s=[T,R,Lf,B];break}
      path.moveTo(s[0][0],s[0][1]);path.lineTo(s[1][0],s[1][1]);if(s.length>2){path.moveTo(s[2][0],s[2][1]);path.lineTo(s[3][0],s[3][1])}
      for(var q2=0;q2<peaks.length;q2++){
        var pk2=peaks[q2],gd=Math.hypot(x0+CELL/2-pk2[0],y0+CELL/2-pk2[1])/pk2[3];
        if(gd<1){
          var gs=glows[q2],gp=gd<.34?gs.N:gd<.67?gs.M:gs.F;
          gp.moveTo(s[0][0],s[0][1]);gp.lineTo(s[1][0],s[1][1]);
          if(s.length>2){gp.moveTo(s[2][0],s[2][1]);gp.lineTo(s[3][0],s[3][1])}
        }
      }
    }
  }
  cx.lineWidth=1;cx.strokeStyle=cMin;cx.stroke(minor);cx.lineWidth=1.2;cx.strokeStyle=cMaj;cx.stroke(major);
  cx.strokeStyle=cs.getPropertyValue("--accent-text").trim();cx.lineCap="round";
  peaks.forEach(function(pk,q){
    var ga=pk[2]/HOVFULL,gs=glows[q];
    cx.globalAlpha=.16*ga;cx.lineWidth=2;cx.stroke(gs.F);
    cx.globalAlpha=.34*ga;cx.lineWidth=1.6;cx.stroke(gs.M);
    cx.globalAlpha=.6*ga;cx.lineWidth=1.3;cx.stroke(gs.N);
  });
  cx.globalAlpha=1;
}
addEventListener("resize",size);addEventListener("scroll",req,{passive:true});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",req);
new MutationObserver(req).observe(root,{attributes:true,attributeFilter:["data-theme"]});
size();

/* ski tracks: two parallel lines that trail the cursor and fade */
if(tk){
  var trail=[],LIFE=2400,GAP=5,tRun=false,brk=true;
  var needTrail=function(){if(!tRun){tRun=true;requestAnimationFrame(drawTrail)}};
  var mid=function(p,q){return [(p[0]+q[0])/2,(p[1]+q[1])/2]};
  function drawTrail(){
    tRun=false;var now=performance.now(),i,n;
    while(trail.length&&now-trail[0].t>LIFE)trail.shift();
    tcx.setTransform(DPR,0,0,DPR,0,0);tcx.clearRect(0,0,W,H);
    n=trail.length;if(n<3)return;
    var L=[],R=[];
    for(i=0;i<n;i++){
      var a=trail[Math.max(0,i-3)],b=trail[Math.min(n-1,i+3)],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
      L.push([trail[i].x-dy/d*GAP,trail[i].y+dx/d*GAP]);R.push([trail[i].x+dy/d*GAP,trail[i].y-dx/d*GAP]);
    }
    tcx.strokeStyle=getComputedStyle(root).getPropertyValue("--accent-text").trim();
    tcx.lineCap="round";tcx.lineJoin="round";
    for(i=1;i<n-1;i++){
      if(trail[i].brk||trail[i+1].brk)continue;
      var age=(now-trail[i].t)/LIFE,f=Math.max(0,1-age);
      tcx.globalAlpha=.55*f*f;tcx.lineWidth=.6+1.4*f;
      var l0=mid(L[i-1],L[i]),l1=mid(L[i],L[i+1]),r0=mid(R[i-1],R[i]),r1=mid(R[i],R[i+1]);
      tcx.beginPath();tcx.moveTo(l0[0],l0[1]);tcx.quadraticCurveTo(L[i][0],L[i][1],l1[0],l1[1]);
      tcx.moveTo(r0[0],r0[1]);tcx.quadraticCurveTo(R[i][0],R[i][1],r1[0],r1[1]);tcx.stroke();
    }
    tcx.globalAlpha=1;needTrail();
  }
  if(!reduce)addEventListener("pointermove",function(e){
    if(e.pointerType==="touch")return;
    var l=trail[trail.length-1];
    if(l&&!brk&&Math.hypot(e.clientX-l.x,e.clientY-l.y)<6)return;
    trail.push({x:e.clientX,y:e.clientY,t:performance.now(),brk:brk});brk=false;
    if(trail.length>500)trail.shift();
    needTrail();
  },{passive:true});
  document.addEventListener("pointerleave",function(){brk=true});
}

/* giggle follows the cursor anywhere on the page */
if(!reduce){
  addEventListener("pointermove",function(e){
    if(e.pointerType==="touch")return;
    if(ptr.target===0){ptr.x=e.clientX;ptr.y=e.clientY}
    ptr.tx=e.clientX;ptr.ty=e.clientY;ptr.target=HOVFULL;ptr.last=performance.now();req();
  },{passive:true});
  document.addEventListener("pointerleave",function(){ptr.target=0;req()});
}

/* giggle: nearby contour lines glow when a card or image is hovered */
function setHover(el){
  hov.el=el;
  if(el){var r=el.getBoundingClientRect();hov.x=r.left+r.width/2;hov.y=r.top+r.height/2;hov.target=HOVFULL;hov.r=Math.hypot(r.width,r.height)*.55}
  else hov.target=0;
  req();
}
[].forEach.call(document.querySelectorAll(".frame,.flipcard"),function(el){
  el.addEventListener("pointerenter",function(e){if(e.pointerType!=="touch")setHover(el)});
  el.addEventListener("pointerleave",function(){setHover(null)});
  el.addEventListener("focusin",function(){setHover(el)});
  el.addEventListener("focusout",function(){setHover(null)});
});

/* contents: highlight the section being read */
var links=[].slice.call(document.querySelectorAll(".toc a")),secs=links.map(function(a){return document.getElementById(a.getAttribute("href").slice(1))});
function spy(){var cur=0,y=innerHeight*.3;secs.forEach(function(s,i){if(s&&s.getBoundingClientRect().top<y)cur=i});
  links.forEach(function(a,i){if(i===cur)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current")})}
if(links.length){addEventListener("scroll",spy,{passive:true});spy()}

/* click an image to enlarge it */
var dlg=document.getElementById("zoom"),big=dlg&&dlg.querySelector("img");
document.addEventListener("click",function(e){
  var f=e.target.closest(".frame");if(!f||!dlg||!dlg.showModal)return;
  var im=f.querySelector("img");big.src=im.currentSrc||im.src;big.alt=im.alt;dlg.showModal();
});
if(dlg){dlg.addEventListener("click",function(){dlg.close()})}

/* tap a flip card to turn it over */
document.addEventListener("click",function(e){
  var c=e.target.closest(".flipcard");if(!c)return;
  c.setAttribute("aria-pressed",c.getAttribute("aria-pressed")==="true"?"false":"true");
});
})();
