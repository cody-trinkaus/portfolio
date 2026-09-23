(function(){
"use strict";
/* Hidden edit mode.
   Unlock: the passphrase is checked against a salted PBKDF2 hash (600k rounds).
   Save: commits the edited page to GitHub with a token you paste once; the token
   stays in this browser only. Nothing here can change the site without that token. */
var SALT="f1c1d72cfa975f9e8d3a583460900372",ITER=600000,HASH="3f1af5bdcfbcbe724ca4449ac6ffc390d8cb781825b42202365a58b1473defd1";
var REPO="cody-trinkaus/portfolio",BRANCH="main",TOK="pwTok";
var css=document.createElement("style");css.id="pwStyle";
css.textContent="#pw{display:flex;align-items:center;gap:4px;width:max-content;max-width:100%;margin:18px 0 0 auto;padding:4px 8px;border:1px solid var(--line-strong,#888);background:color-mix(in srgb,var(--ground,#fff) 70%,transparent);opacity:.7;transition:opacity .2s;text-shadow:none;font:10px/1 ui-monospace,Menlo,monospace;color:var(--ink,#000)}"+
"#pw:hover,#pw:focus-within,#pw.on{opacity:1}"+
"#pw input{width:92px;padding:3px 2px;border:0;border-bottom:1px solid var(--line-strong,#888);background:transparent;color:inherit;font:11px/1 ui-monospace,Menlo,monospace;outline:0}"+
"#pw input::placeholder{letter-spacing:.08em;text-transform:uppercase}#pw input.bad{border-color:#c33}"+
"#pw button{border:0;background:transparent;color:inherit;font:inherit;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;padding:3px 5px}"+
"#pw button:disabled{opacity:.5;cursor:default}#pw output{padding:0 6px;max-width:220px;text-align:right}"+
".editing [contenteditable=true]:hover{box-shadow:0 0 0 1px var(--line-strong,#888)}"+
".editing [contenteditable=true]:focus{outline:0;box-shadow:0 0 0 1.5px var(--accent,#e8471f)}";
document.head.appendChild(css);

var box=document.createElement("div");box.id="pw";
var inp=document.createElement("input");
inp.type="password";inp.id="pwInput";inp.autocomplete="off";inp.setAttribute("aria-label","Editor password");inp.placeholder="edit";
var msg=document.createElement("output");msg.hidden=true;msg.setAttribute("aria-live","polite");
function btn(t,l){var b=document.createElement("button");b.type="button";b.textContent=t;b.hidden=true;b.setAttribute("aria-label",l);return b}
var save=btn("Save","Save changes to the site"),lock=btn("Lock","Stop editing");
[inp,msg,save,lock].forEach(function(e){box.appendChild(e)});
(document.querySelector("footer")||document.querySelector(".contact")||document.body).appendChild(box);

var root=document.documentElement,editing=false;
function targets(){return [].filter.call(document.body.children,function(el){return !/^(CANVAS|SCRIPT|STYLE|DIALOG)$/.test(el.tagName)&&el!==box})}
function say(t){msg.textContent=t;msg.hidden=!t}
function setEditing(on){
  editing=on;root.classList.toggle("editing",on);
  targets().forEach(function(el){if(on)el.setAttribute("contenteditable","true");else el.removeAttribute("contenteditable")});
  if(on){box.setAttribute("contenteditable","false");[].forEach.call(document.querySelectorAll(".legend button,.ctl button,.playhead,iframe,video,img"),function(el){el.setAttribute("contenteditable","false")})}
  else{[].forEach.call(document.querySelectorAll("[contenteditable=false]"),function(el){el.removeAttribute("contenteditable")})}
  inp.hidden=on;save.hidden=lock.hidden=!on;box.classList.toggle("on",on);say("");
  if(!on){inp.value="";inp.blur()}
}
function hex(b){return [].map.call(new Uint8Array(b),function(x){return ("0"+x.toString(16)).slice(-2)}).join("")}
function unhex(s){var o=new Uint8Array(s.length/2);for(var i=0;i<o.length;i++)o[i]=parseInt(s.substr(i*2,2),16);return o}
function derive(pw){
  var enc=new TextEncoder();
  return crypto.subtle.importKey("raw",enc.encode(pw),"PBKDF2",false,["deriveBits"]).then(function(k){
    return crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:unhex(SALT),iterations:ITER},k,256)}).then(hex);
}
inp.addEventListener("keydown",function(e){
  if(e.key!=="Enter")return;
  if(!(window.crypto&&crypto.subtle)){inp.classList.add("bad");return}
  var v=inp.value;inp.disabled=true;
  derive(v).then(function(h){
    inp.disabled=false;
    if(h===HASH){inp.classList.remove("bad");setEditing(true)}
    else{inp.classList.add("bad");inp.value="";inp.focus();setTimeout(function(){inp.classList.remove("bad")},900)}
  },function(){inp.disabled=false});
});
lock.addEventListener("click",function(){setEditing(false)});

/* ---- save: serialise a clean copy of the page and commit it to GitHub ---- */
function cleanHTML(){
  var c=document.documentElement.cloneNode(true);
  function q(s){return [].slice.call(c.querySelectorAll(s))}
  q("#pw,#pwStyle").forEach(function(e){e.remove()});
  q("[contenteditable]").forEach(function(e){e.removeAttribute("contenteditable")});
  c.classList.remove("editing");if(!c.getAttribute("class"))c.removeAttribute("class");
  q("canvas").forEach(function(e){e.removeAttribute("width");e.removeAttribute("height")});
  q(".flipcard").forEach(function(e){e.setAttribute("aria-pressed","false")});
  q("[aria-current]").forEach(function(e){e.removeAttribute("aria-current")});
  q("dialog").forEach(function(d){d.removeAttribute("open");var i=d.querySelector("img");if(i){i.removeAttribute("src");i.setAttribute("alt","")}});
  var tr=c.querySelector("#track");if(tr){tr.innerHTML="";tr.removeAttribute("style")}   /* timeline cards are built from data in the page script */
  var lg=c.querySelector("#legend");if(lg)lg.innerHTML="";
  return "<!doctype html>\n"+c.outerHTML+"\n";
}
function b64(s){var b=new TextEncoder().encode(s),o="";for(var i=0;i<b.length;i+=0x8000)o+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(o)}
function fileName(){var p=location.pathname.split("/").pop();return /\.html$/.test(p)?p:"index.html"}
function gh(url,opt,tok){
  opt=opt||{};opt.cache="no-store";
  opt.headers=Object.assign({"Accept":"application/vnd.github+json","Authorization":"Bearer "+tok},opt.headers||{});
  return fetch(url,opt).then(function(r){return r.json().then(function(j){if(!r.ok){var e=new Error(j.message||r.status);e.status=r.status;throw e}return j})});
}
save.addEventListener("click",function(){
  var tok=null;try{tok=localStorage.getItem(TOK)}catch(x){}
  if(!tok){
    tok=prompt("Paste a GitHub token for "+REPO+" (fine-grained, Contents: read and write).\nIt is kept in this browser only.");
    if(!tok)return;tok=tok.trim();
  }
  var file=fileName(),api="https://api.github.com/repos/"+REPO+"/contents/"+file;
  save.disabled=true;say("Saving…");
  gh(api+"?ref="+BRANCH,{},tok).then(function(cur){
    return gh(api,{method:"PUT",body:JSON.stringify({message:"Edit "+file+" from the site",content:b64(cleanHTML()),sha:cur.sha,branch:BRANCH})},tok)
  }).then(function(){
    try{localStorage.setItem(TOK,tok)}catch(x){}
    say("Saved. Live in about a minute.");
  }).catch(function(err){
    if(err.status===401||err.status===403||err.status===404){try{localStorage.removeItem(TOK)}catch(x){}say("GitHub refused the token. Click Save to try another.")}
    else say("Could not save: "+err.message);
  }).then(function(){save.disabled=false});
});

/* while editing, cards and images should not navigate, zoom or drag */
addEventListener("click",function(e){
  if(!editing||e.target.closest("#pw"))return;
  if(e.target.closest(".frame,.stn:not(.next)"))e.stopPropagation();
},true);
addEventListener("pointerdown",function(e){
  if(editing&&e.target.closest(".tl"))e.stopPropagation();
},true);
})();
