(function(){
"use strict";
/* Hidden edit mode. Unlocks in-page text editing for whoever knows the passphrase.
   Edits live in this browser tab only; nothing is saved to the site. */
var HASH="edb98484d250b7b9100d1c02d5db2f61a2e93dd1b9f3fb80197c8fab190505e2";
var css=document.createElement("style");
css.textContent="#pw{position:fixed;right:max(10px,env(safe-area-inset-right,0px));bottom:max(10px,env(safe-area-inset-bottom,0px));z-index:9999;display:flex;align-items:center;opacity:.22;transition:opacity .2s;text-shadow:none}"+
"#pw:hover,#pw:focus-within,#pw.on{opacity:.9}"+
"#pw input{width:58px;padding:3px 2px;border:0;border-bottom:1px solid var(--line-strong,#888);background:transparent;color:var(--ink,#000);font:11px/1 ui-monospace,Menlo,monospace;outline:0;text-align:center}"+
"#pw input:focus{width:110px}"+
"#pw input.bad{border-color:#c33}"+
"#pw button{border:0;background:transparent;color:var(--ink,#000);font:10px/1 ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;padding:3px 4px}"+
".editing [contenteditable=true]{outline:0}"+
".editing [contenteditable=true]:hover{box-shadow:0 0 0 1px var(--line-strong,#888)}"+
".editing [contenteditable=true]:focus{box-shadow:0 0 0 1.5px var(--accent,#e8471f)}";
document.head.appendChild(css);

var box=document.createElement("div");box.id="pw";
var inp=document.createElement("input");
inp.type="password";inp.id="pwInput";inp.autocomplete="off";inp.setAttribute("aria-label","Editor password");inp.placeholder="·";
var lock=document.createElement("button");lock.type="button";lock.textContent="Lock";lock.hidden=true;lock.setAttribute("aria-label","Stop editing");
box.appendChild(inp);box.appendChild(lock);document.body.appendChild(box);

var root=document.documentElement,editing=false;
function targets(){return [].filter.call(document.body.children,function(el){return !/^(CANVAS|SCRIPT|STYLE|DIALOG)$/.test(el.tagName)&&el!==box})}
function setEditing(on){
  editing=on;root.classList.toggle("editing",on);
  targets().forEach(function(el){if(on)el.setAttribute("contenteditable","true");else el.removeAttribute("contenteditable")});
  if(on){[].forEach.call(document.querySelectorAll(".legend button,.ctl button,.playhead,iframe,video,img"),function(el){el.setAttribute("contenteditable","false")})}
  else{[].forEach.call(document.querySelectorAll("[contenteditable=false]"),function(el){el.removeAttribute("contenteditable")})}
  inp.hidden=on;lock.hidden=!on;box.classList.toggle("on",on);
  if(!on){inp.value="";inp.blur()}
}
function sha(t){return crypto.subtle.digest("SHA-256",new TextEncoder().encode(t)).then(function(b){return [].map.call(new Uint8Array(b),function(x){return ("0"+x.toString(16)).slice(-2)}).join("")})}
inp.addEventListener("keydown",function(e){
  if(e.key!=="Enter")return;
  var v=inp.value;
  if(!(window.crypto&&crypto.subtle)){inp.classList.add("bad");return}
  sha(v).then(function(h){
    if(h===HASH){inp.classList.remove("bad");setEditing(true)}
    else{inp.classList.add("bad");inp.value="";setTimeout(function(){inp.classList.remove("bad")},900)}
  });
});
lock.addEventListener("click",function(){setEditing(false)});

/* while editing, cards and images should not navigate, zoom or drag */
addEventListener("click",function(e){
  if(!editing)return;
  if(e.target.closest("#pw"))return;
  if(e.target.closest(".frame,.stn:not(.next)"))e.stopPropagation();
},true);
addEventListener("pointerdown",function(e){
  if(editing&&e.target.closest(".tl"))e.stopPropagation();
},true);
})();
