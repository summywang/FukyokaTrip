/* Downward dismissal: header, or content that is already scrolled to the top. */
(() => {
 'use strict';
 for (const sheet of document.querySelectorAll('.bottom-sheet')) {
  let gesture=null;
  function begin(target,x,y,id,type) {
   if(!sheet.open||target.closest('button,a,input,textarea,select,summary,label'))return;
   const header=target.closest('.sheet-header'),body=target.closest('.sheet-body');
   if(!header&&(!body||body.scrollTop>1))return;
   gesture={x,y,id,type,body,header:!!header,distance:0,dragging:false};
  }
  function move(event,x,y) {
   if(!gesture)return;
   const dx=x-gesture.x,dy=y-gesture.y;
   if(!gesture.dragging){
    if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>8){gesture=null;return}
    if(dy< -8){gesture=null;return}
    if(!gesture.header&&gesture.body.scrollTop>1){gesture=null;return}
    // Cancel native pull-to-refresh on the first downward content movement.
    if(dy>0&&Math.abs(dy)>=Math.abs(dx)&&event.cancelable)event.preventDefault();
    if(dy<8)return;
    gesture.dragging=true;sheet.classList.add('is-dragging');
    if(gesture.type==='pointer')sheet.setPointerCapture(gesture.id);
   }
   if(event.cancelable)event.preventDefault();
   gesture.distance=Math.max(0,dy);
   sheet.style.setProperty('--sheet-drag',Math.min(gesture.distance,sheet.clientHeight)+'px');
  }
  function finish(cancel=false) {
   if(!gesture)return;
   const current=gesture;gesture=null;
   sheet.classList.remove('is-dragging');sheet.style.removeProperty('--sheet-drag');
   if(current.type==='pointer'&&sheet.hasPointerCapture(current.id))sheet.releasePointerCapture(current.id);
   if(!cancel&&current.dragging&&current.distance>=Math.min(110,sheet.clientHeight*.2))sheet.close();
  }
  // Touchmove must be non-passive to stop Safari/Chrome's native refresh gesture.
  sheet.addEventListener('touchstart',event=>{
   if(event.touches.length!==1){finish(true);return}
   const touch=event.touches[0];begin(event.target,touch.clientX,touch.clientY,touch.identifier,'touch');
  },{passive:true});
  sheet.addEventListener('touchmove',event=>{
   if(gesture?.type!=='touch')return;
   if(event.touches.length!==1){finish(true);return}
   const touch=event.touches[0];if(touch.identifier===gesture.id)move(event,touch.clientX,touch.clientY);
  },{passive:false});
  sheet.addEventListener('touchend',()=>finish());
  sheet.addEventListener('touchcancel',()=>finish(true));
  sheet.addEventListener('pointerdown',event=>{
   if(event.pointerType==='touch'||event.button!==0)return;
   begin(event.target,event.clientX,event.clientY,event.pointerId,'pointer');
  });
  sheet.addEventListener('pointermove',event=>{
   if(gesture?.type==='pointer'&&gesture.id===event.pointerId)move(event,event.clientX,event.clientY);
  });
  sheet.addEventListener('pointerup',event=>{if(gesture?.type==='pointer'&&gesture.id===event.pointerId)finish()});
  sheet.addEventListener('pointercancel',event=>{if(gesture?.type==='pointer'&&gesture.id===event.pointerId)finish(true)});
  sheet.addEventListener('close',()=>finish(true));
 }
})();
