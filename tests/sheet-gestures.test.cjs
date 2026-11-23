const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../sheet-gestures.js'),'utf8');
function setup({header=false,scrollTop=0,interactive=false}={}){
 const handlers=new Map(),classes=new Set(),styles=new Map(),capture=new Set(),body={scrollTop};
 const sheet={open:true,clientHeight:650,classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)},style:{setProperty:(k,v)=>styles.set(k,v),removeProperty:k=>styles.delete(k)},addEventListener:(type,fn,options)=>handlers.set(type,{fn,options}),setPointerCapture:id=>capture.add(id),hasPointerCapture:id=>capture.has(id),releasePointerCapture:id=>capture.delete(id),close(){this.open=false;handlers.get('close').fn()}};
 const target={closest:selector=>selector==='.sheet-header'?(header?{}:null):selector==='.sheet-body'?(header?null:body):(interactive?{}:null)};
 vm.runInNewContext(code,{document:{querySelectorAll:()=>[sheet]}});
 const fire=(type,x=120,y=100)=>{const event={target,touches:type==='touchend'?[]:[{identifier:1,clientX:x,clientY:y}],cancelable:true,defaultPrevented:false,preventDefault(){this.defaultPrevented=true}};handlers.get(type).fn(event);return event};
 return {sheet,styles,classes,handlers,fire};
}
test('downward touch at content top prevents native refresh and dismisses after sufficient distance',()=>{
 const h=setup();assert.equal(h.handlers.get('touchmove').options.passive,false);
 h.fire('touchstart',120,100);assert.equal(h.fire('touchmove',121,105).defaultPrevented,true);
 h.fire('touchmove',121,245);assert.equal(h.styles.get('--sheet-drag'),'145px');
 h.fire('touchend');assert.equal(h.sheet.open,false);assert.equal(h.styles.has('--sheet-drag'),false);
});
test('normal scrolling, horizontal note gestures and controls do not dismiss the sheet',()=>{
 for(const options of [{scrollTop:40},{interactive:true}]){const h=setup(options);h.fire('touchstart');assert.equal(h.fire('touchmove',120,280).defaultPrevented,false);h.fire('touchend');assert.equal(h.sheet.open,true)}
 const h=setup();h.fire('touchstart');assert.equal(h.fire('touchmove',240,105).defaultPrevented,false);h.fire('touchend');assert.equal(h.sheet.open,true);
 const up=setup();up.fire('touchstart');assert.equal(up.fire('touchmove',120,30).defaultPrevented,false);up.fire('touchend');assert.equal(up.sheet.open,true);
});
test('short or cancelled pulls snap back, while the header can dismiss above scrolled content',()=>{
 for(const cancel of [false,true]){const h=setup();h.fire('touchstart');h.fire('touchmove',120,cancel?290:140);h.fire(cancel?'touchcancel':'touchend');assert.equal(h.sheet.open,true);assert.equal(h.styles.has('--sheet-drag'),false);assert.equal(h.classes.has('is-dragging'),false)}
 const header=setup({header:true,scrollTop:300});header.fire('touchstart');header.fire('touchmove',120,250);header.fire('touchend');assert.equal(header.sheet.open,false);
});
