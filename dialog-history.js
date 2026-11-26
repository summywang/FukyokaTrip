/* Lets the phone's back gesture close full-page details and sheets instead of leaving the site.
   DialogHistory.track(dialog) after showModal(); closing by button, Esc or back stays in sync. */
(function(root){
 'use strict';
 const stack=[];let ignorePops=0,closingFromPop=false;
 function track(dialog){
  if(!dialog||stack.includes(dialog))return;
  stack.push(dialog);
  try{history.pushState({dialogLayer:stack.length},'')}catch{}
 }
 // 'close' does not bubble, but capture listeners on document still see it.
 document.addEventListener('close',event=>{
  const index=stack.indexOf(event.target);
  if(index<0)return;
  const removed=stack.splice(index);
  for(const dialog of removed.slice(1))if(dialog.open)dialog.close();
  if(closingFromPop)return;
  ignorePops++;
  try{history.go(-removed.length)}catch{ignorePops--}
 },true);
 root.addEventListener('popstate',()=>{
  if(ignorePops){ignorePops--;return}
  const top=stack.pop();
  if(!top)return;
  closingFromPop=true;
  try{if(top.open)top.close()}finally{closingFromPop=false}
 });
 root.DialogHistory={track};
})(globalThis);
