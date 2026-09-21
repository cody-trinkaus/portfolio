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
function fbm(x,y){var a=1,f=1,s=0,t=0;for(var o=0;o<3;o++){s+=a*nz(x*f,y*f);t+=a;a*=.5;f*=2}return s/t}
function size(){DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;grid=null;req()}
function req(){if(!busy){busy=true;requestAnimationFrame(draw)}}
function draw(){
  busy=false;
  var cs=getComputedStyle(root),cMin=cs.getPropertyValue("--contour").trim(),cMaj=cs.getPropertyValue("--contour-index").trim();
  var cols=Math.ceil(W/CELL)+1,rows=Math.ceil(H/CELL)+1,gw=cols+1,off=scrollY*.18,S=.0019,i,j;
  if(!grid||grid.length!==gw*(rows+1))grid=new Float32Array(gw*(rows+1));
  for(j=0;j<=rows;j++)for(i=0;i<=cols;i++)grid[j*gw+i]=fbm(i*CELL*S+10,(j*CELL+off)*S+10);
  cx.setTransform(DPR,0,0,DPR,0,0);cx.clearRect(0,0,W,H);
  var minor=new Path2D(),major=new Path2D(),STEP=.05;
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
    }
  }
  cx.lineWidth=1;cx.strokeStyle=cMin;cx.stroke(minor);cx.lineWidth=1.2;cx.strokeStyle=cMaj;cx.stroke(major);
}
addEventListener("resize",size);addEventListener("scroll",req,{passive:true});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",req);
new MutationObserver(req).observe(root,{attributes:true,attributeFilter:["data-theme"]});
size();

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
})();
