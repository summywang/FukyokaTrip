/* Card list for japanese/index.html. Reads the itinerary the same way the main page does, but never writes it. */
(() => {
 'use strict';
 const C=globalThis.TripCore,DATA=globalThis.TRIP_DATA,J=globalThis.JPCore,UI=globalThis.JPUI;
 const $=id=>document.getElementById(id),esc=J.esc;
 if(!C||!DATA||!UI){$('jp-list').innerHTML='<p class="jp-empty">日文卡片載入失敗，請重新整理。</p>';return}

 function loadDays(){
  let state;
  try{const saved=localStorage.getItem('kyushu-2027-planner-v3');state=saved?C.validate(JSON.parse(saved)):C.initial(DATA)}catch{state=C.initial(DATA)}
  try{C.ensurePlans(state,DATA);C.refreshPhotos(state,DATA)}catch{state=C.initial(DATA)}
  C.initializeFlights(state);
  return state;
 }
 // ?now=2027-02-06T10:30 previews the in-trip view; plain clock times are read as Japan time.
 function currentTime(){
  const value=new URLSearchParams(location.search).get('now');
  if(!value)return new Date();
  const date=new Date(/([zZ]|[+-]\d\d:?\d\d)$/.test(value)?value:value+'+09:00');
  return Number.isNaN(date.getTime())?new Date():date;
 }

 function card(scenario,usageList,badge){
  const label=scenario.always?'隨時可用':J.usageLabel(usageList);
  return `<button type="button" class="jp-card" data-jp-open="${esc(scenario.id)}"><span class="jp-mark" lang="ja" aria-hidden="true"><ruby>${esc(scenario.mark)}<rt>${esc(scenario.reading)}</rt></ruby></span><span class="jp-card-copy"><span class="jp-card-title">${esc(scenario.title)}</span><span class="jp-card-usage">${esc(label)}</span></span>${badge?`<span class="jp-badge">${esc(badge)}</span>`:''}<span class="jp-chevron" aria-hidden="true"></span></button>`;
 }
 const group=(title,cards)=>cards.length?`<section class="jp-group"><h2 class="jp-group-title">${esc(title)}</h2><div class="jp-cards">${cards.join('')}</div></section>`:'';

 function render(){
  const state=loadDays(),days=state.days,merged=DATA.mergedSlots;
  $('jp-plan').textContent=`跟著目前的行程・${state.plan==='B'?'小倉城版本 (備案)':'由布院版本'}`;
  const usage=J.usage(days,{merged,kindOf:C.slotKind});
  const live=J.nowAndNext(days,currentTime(),merged),badges=new Map();
  let nowHtml='';
  if(live){
   const date=days[live.dayIndex].date,line=(label,slot)=>slot?`<p><span>${esc(label)}</span>${esc(slot.time)} ${esc(slot.title)}</p>`:'';
   for(const [slot,label] of [[live.current,'現在'],[live.next,'下一段']])if(slot)for(const id of J.scenariosForSlot({title:slot.title,time:slot.time,kind:C.slotKind(slot),date}))if(!badges.has(id))badges.set(id,label);
   nowHtml=live.current||live.next?`<div class="jp-now">${line('現在',live.current)}${line('下一段',live.next)}</div>`:'';
  }
  const ordered=J.orderedScenarios(UI.scenarios,usage);
  const cardFor=scenario=>card(scenario,usage.get(scenario.id),badges.get(scenario.id));
  const liveCards=[...badges.keys()].map(id=>UI.byId[id]).filter(Boolean).sort((a,b)=>(badges.get(a.id)==='現在'?0:1)-(badges.get(b.id)==='現在'?0:1));
  const rest=ordered.filter(scenario=>!badges.has(scenario.id));
  $('jp-now').innerHTML=nowHtml;
  $('jp-list').innerHTML=group('現在用得到',liveCards.map(cardFor))+group('跟著行程',rest.filter(s=>!s.always).map(cardFor))+group('隨時用得到',rest.filter(s=>s.always).map(cardFor));
 }

 // Return to the itinerary without reloading it when we came from there.
 $('jp-back').addEventListener('click',event=>{
  try{const from=new URL(document.referrer);if(from.origin===location.origin&&!from.pathname.includes('/japanese/')&&history.length>1){event.preventDefault();history.back()}}catch{}
 });
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')render()});
 render();
})();
