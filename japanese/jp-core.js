/* Pure helpers for the travel-Japanese cards. No DOM, storage or network. */
(function(root){
 'use strict';
 const RUBY=/\{([^{}|]+)\|([^{}|]+)\}/g;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

 // "{肉|にく}を" -> [{base:'肉',ruby:'にく'},{base:'を'}]
 function parseRuby(text){
  const parts=[],source=String(text??'');let last=0;
  for(const match of source.matchAll(RUBY)){
   if(match.index>last)parts.push({base:source.slice(last,match.index)});
   parts.push({base:match[1],ruby:match[2]});last=match.index+match[0].length;
  }
  if(last<source.length)parts.push({base:source.slice(last)});
  return parts;
 }
 const rubyHtml=text=>parseRuby(text).map(part=>part.ruby?`<ruby>${esc(part.base)}<rt>${esc(part.ruby)}</rt></ruby>`:esc(part.base)).join('');
 const plainText=text=>parseRuby(text).map(part=>part.base).join('');
 // Speech uses the written kanji, except counted words ("5人", "4泊") where engines often pick the wrong reading.
 const speechText=text=>parseRuby(text).map(part=>part.ruby&&/\d/.test(part.base)?part.ruby:part.base).join('').replace(/○+/g,'');

 // Which cards a slot needs, matched on the slot's current title so edits and the A/B switch follow along.
 const TAIWAN=/台灣/;
 const SNOW_DATES=['2/7','2/8'];
 function scenariosForSlot(slot){
  const title=String(slot.title||''),time=String(slot.time||''),kind=slot.kind||'activity',date=String(slot.date||'');
  if(kind==='flight'||TAIWAN.test(time))return [];
  const ids=[],add=id=>{if(!ids.includes(id))ids.push(id)};
  const meal=/午餐|晚餐|用餐/.test(title);
  const drive=(kind==='transport'||/^前往/.test(title))&&!/纜車|下山|接駁|取車|交車/.test(title);
  const place=!drive&&!meal;
  if(/入境/.test(title))add('immigration');
  if(/租車|取車|還車|交車/.test(title))add('rental');
  if(/加油/.test(title))add('gas');
  if(/報到|安檢|出境|登機|國際線/.test(title)&&!/湯屋|天拝/.test(title))add('airport');
  if(/早餐/.test(title))add('konbini');
  if(/入住|退房/.test(title))add('lodging');
  if(/YUNOA|湯屋|溫泉|泡湯/.test(title)||(place&&/天拝/.test(title)))add('onsen');
  if(meal)add('restaurant');
  if(place&&/海洋世界|纜車|小倉城/.test(title))add('tickets');
  if(/門司港散策|湯之坪|逛街|購物|鋼彈/.test(title))add('shopping');
  if(drive)add('driving');
  if(drive&&SNOW_DATES.includes(date))add('snow');
  if(place&&/夜景|散策|公園|湖/.test(title))add('basics');
  if(place&&/散策|海洋世界|逛街|購物|鋼彈|小倉城|夜景|公園|湖/.test(title))add('baby');
  if(!ids.length)add('basics');
  return ids;
 }

 // Same rule as the itinerary list: a merged child stays hidden only while it and its parent are unedited originals.
 function isMergedChild(slot,days,merged){
  const merge=merged?.[slot.id];
  if(!merge||slot.custom||slot.title!==merge.title||slot.time!==merge.time)return false;
  for(const day of days)for(const parent of day.slots)if(parent.id===merge.parent)return !parent.custom&&parent.title===merge.parentTitle&&parent.time===merge.parentTime;
  return false;
 }

 // kindOf(slot) comes from TripCore.slotKind so flights and drives are classified the same way as the itinerary.
 function usage(days,{merged,kindOf=()=> 'activity'}={}){
  const map=new Map();
  days.forEach((day,dayIndex)=>day.slots.forEach((slot,slotIndex)=>{
   if(isMergedChild(slot,days,merged))return;
   for(const id of scenariosForSlot({title:slot.title,time:slot.time,kind:kindOf(slot),date:day.date})){
    if(!map.has(id))map.set(id,[]);
    map.get(id).push({dayIndex,slotIndex,date:day.date,slotId:slot.id,title:slot.title,time:slot.time});
   }
  }));
  return map;
 }

 function usageLabel(list){
  if(!list?.length)return '隨時可用';
  // Consecutive trip days collapse into a range: 2/5、2/6、2/7 -> 2/5–2/7.
  const days=[...new Set(list.map(item=>item.dayIndex))].sort((a,b)=>a-b),dateOf=index=>list.find(item=>item.dayIndex===index).date,runs=[];
  for(const day of days){const run=runs.at(-1);if(run&&day===run.end+1)run.end=day;else runs.push({start:day,end:day})}
  const text=runs.map(run=>run.start===run.end?dateOf(run.start):`${dateOf(run.start)}${run.end-run.start>1?'–':'、'}${dateOf(run.end)}`).join('、');
  return `${text} · ${list.length} 段行程`;
 }

 // Trip cards in itinerary order of first use; "always" cards (baby, emergency, basics) follow in data order.
 function orderedScenarios(scenarios,usageMap){
  const first=scenario=>{if(scenario.always)return Infinity;const list=usageMap.get(scenario.id);return list?.length?list[0].dayIndex*1000+list[0].slotIndex:Infinity};
  return scenarios.map((scenario,index)=>({scenario,index})).sort((a,b)=>first(a.scenario)-first(b.scenario)||a.index-b.index).map(item=>item.scenario);
 }

 const SETTING_VALUES={vegCount:['unset','1','2','3','4','5'],egg:['unset','ok','no'],dairy:['unset','ok','no'],shared:['unset','ok','separate']};
 function normalizeSettings(raw){
  const source=raw&&typeof raw==='object'?raw:{},settings={};
  for(const [key,values] of Object.entries(SETTING_VALUES))settings[key]=values.includes(String(source[key]))?String(source[key]):'unset';
  return settings;
 }

 // Lines for the staff-facing vegetarian card. Unset items are left out rather than guessed.
 function dietLines(diet,raw){
  const settings=normalizeSettings(raw),lines=[diet.opening];
  const count=diet.who.counts[settings.vegCount];
  lines.push(count?{ja:`{私|わたし}たちのうち、${count[0]}はベジタリアンです。`,ro:`Watashitachi no uchi, ${count[1]} wa bejitarian desu.`,zh:`我們之中有 ${settings.vegCount} 位素食者。`}:diet.who.unset);
  lines.push(...diet.core);
  if(settings.egg!=='unset')lines.push(diet.egg[settings.egg]);
  if(settings.dairy!=='unset')lines.push(diet.dairy[settings.dairy]);
  if(settings.shared!=='unset')lines.push(diet.shared[settings.shared]);
  lines.push(...diet.closing);
  return lines;
 }

 const TAGS={no:{cls:'no',label:'不行'},ask:{cls:'ask',label:'要問'},ok:{cls:'ok',label:'通常可以'}};
 function tagFor(tag,raw){
  if(!tag)return null;
  if(tag==='egg'||tag==='dairy'){
   const value=normalizeSettings(raw)[tag];
   return value==='ok'?{cls:'ok',label:'可以'}:value==='no'?{cls:'no',label:'不行'}:{cls:'unset',label:'未確認'};
  }
  return TAGS[tag]||null;
 }

 // Trip dates in Japan time. Returns null outside 2027/2/5–2/9.
 const TRIP=['2027-02-05','2027-02-06','2027-02-07','2027-02-08','2027-02-09'];
 function tripMoment(now){
  const date=now instanceof Date?now:new Date(now);
  if(Number.isNaN(date.getTime()))return null;
  const jst=new Date(date.getTime()+9*3600000);
  const iso=jst.toISOString().slice(0,10),dayIndex=TRIP.indexOf(iso);
  return dayIndex<0?null:{dayIndex,minutes:jst.getUTCHours()*60+jst.getUTCMinutes()};
 }
 function slotRange(time){
  const text=String(time||'');
  if(TAIWAN.test(text))return null;
  const toMin=(h,m)=>Number(h)*60+Number(m);
  const range=text.match(/(\d{1,2}):(\d{2})\s*[–—~～-]\s*(\d{1,2}):(\d{2})/);
  if(range)return {start:toMin(range[1],range[2]),end:toMin(range[3],range[4])};
  const start=text.match(/^(\d{1,2}):(\d{2})/);
  return start?{start:toMin(start[1],start[2]),end:/後/.test(text)?24*60:toMin(start[1],start[2])+30}:null;
 }
 // Current and next slots of today's plan, skipping merged children.
 function nowAndNext(days,now,merged){
  const moment=tripMoment(now);
  if(!moment||!days[moment.dayIndex])return null;
  const slots=days[moment.dayIndex].slots.filter(slot=>!isMergedChild(slot,days,merged)).map(slot=>({slot,range:slotRange(slot.time)})).filter(item=>item.range);
  const current=slots.find(item=>item.range.start<=moment.minutes&&moment.minutes<item.range.end)?.slot||null;
  const next=slots.find(item=>item.range.start>moment.minutes&&item.slot!==current)?.slot||null;
  return {dayIndex:moment.dayIndex,current,next};
 }

 const api={esc,parseRuby,rubyHtml,plainText,speechText,scenariosForSlot,isMergedChild,usage,usageLabel,orderedScenarios,normalizeSettings,dietLines,tagFor,tripMoment,slotRange,nowAndNext,SETTING_VALUES};
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.JPCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
