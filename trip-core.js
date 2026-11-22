/* Pure planner operations. No accounts, API keys, or network requests. */
(function(root){
 'use strict';
 const clone=value=>JSON.parse(JSON.stringify(value));
 const uid=()=>globalThis.crypto?.randomUUID?.()||'p-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 function googleUrl(value){
  let url;try{url=new URL(String(value).trim())}catch{throw Error('請貼上完整的 Google 地圖分享連結。')}
  if(url.protocol!=='https:'||url.username||url.password||url.port)throw Error('請使用 https 的 Google 地圖連結。');
  const host=url.hostname.toLowerCase();
  const short=host==='maps.app.goo.gl'&&url.pathname.length>1;
  const old=host==='goo.gl'&&url.pathname.startsWith('/maps/');
  const google=/^(www\.|maps\.)?google\.(com|com\.tw|co\.jp)$/.test(host);
  if(!short&&!old&&!(google&&(host.startsWith('maps.')||url.pathname==='/maps'||url.pathname.startsWith('/maps/'))))throw Error('這不是 Google 地圖的地點連結，請從 Google 地圖按「分享」取得連結。');
  for(const key of [...url.searchParams.keys()])if(/^(utm_|g_st$|g_ep$|fbclid$)/.test(key))url.searchParams.delete(key);
  return url.href;
 }
 function titleFromUrl(value){const url=new URL(googleUrl(value));const segment=url.pathname.match(/\/place\/([^/]+)/)?.[1];try{return (segment?decodeURIComponent(segment.replace(/\+/g,' ')):url.searchParams.get('query')||url.searchParams.get('q')||'新收藏地點').slice(0,180)}catch{return '新收藏地點'}}
 const searchUrl=query=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);
 function durationLabel(value){const match=String(value||'').match(/(\d{1,2}):(\d{2})\s*[–—~～-]\s*(\d{1,2}):(\d{2})/);if(!match)return '停留時間未定';const [h1,m1,h2,m2]=match.slice(1).map(Number);if(h1>23||h2>23||m1>59||m2>59)return '停留時間未定';let minutes=h2*60+m2-h1*60-m1;if(minutes<0)minutes+=1440;const hours=Math.floor(minutes/60),rest=minutes%60;return '停留 '+(hours?hours+' 小時':'')+(hours&&rest?' ':'')+(rest||!hours?rest+' 分鐘':'')}

 // Flight details are transcribed from the user's 2026/11/19 planning document.
 const FLIGHTS={
  'day-0-slot-1':{number:'BR104',label:'去程航班',fromCode:'TPE',fromName:'桃園',fromTime:'13:40',fromZone:'台灣時間',fromOffset:8,fromTerminal:'航廈待核對',toCode:'FUK',toName:'福岡',toTime:'16:55',toZone:'日本時間',toOffset:9,toTerminal:'國際線',note:'依目前規劃；出發航廈、登機時間與完整機票待核對。'},
  'day-4-slot-8':{number:'AK1511',label:'回程航班',fromCode:'FUK',fromName:'福岡',fromTime:'16:40',fromZone:'日本時間',fromOffset:9,fromTerminal:'國際線',toCode:'TPE',toName:'桃園',toTime:'18:30',toZone:'台灣時間',toOffset:8,toTerminal:'T1（待核對）',note:'2/9 日期沿用原規劃，日期、航廈及報到規定仍須核對完整機票。'}
 };
 function initializeFlights(state){for(const day of state.days)for(const slot of day.slots){if(slot.flight||slot.custom||!FLIGHTS[slot.id])continue;slot.flight=clone(FLIGHTS[slot.id]);const clock=String(slot.time).match(/^(\d{1,2}:\d{2})/);if(clock)slot.flight[slot.id==='day-0-slot-1'?'fromTime':'toTime']=clock[1];const number=slot.title.match(/\b[A-Z]{2}\d{3,4}\b/);if(number)slot.flight.number=number[0]}return state}
 function flightDurationLabel(flight){const parse=value=>{const m=String(value).match(/^(\d{1,2}):(\d{2})$/);if(!m||+m[1]>23||+m[2]>59)return null;return +m[1]*60 + +m[2]};const from=parse(flight.fromTime),to=parse(flight.toTime);if(from===null||to===null)return '飛行時間待確認';let minutes=to-flight.toOffset*60-from+flight.fromOffset*60;if(minutes<0)minutes+=1440;return '飛行 '+Math.floor(minutes/60)+' 小時'+(minutes%60?' '+minutes%60+' 分鐘':'')}
 function slotKind(slot){if(slot.flight)return 'flight';if(slot.kind==='transport')return 'transport';if(slot.kind==='activity')return 'activity';if(slot.asset==='C03'||slot.asset==='S04'||/接駁至國際線/.test(slot.title))return 'transport';return 'activity'}
 function transportEstimate(slot){const duration=durationLabel(slot.time);if(duration!=='停留時間未定')return duration.replace(/^停留 /,'預估 ');if(/回福岡.*1\.5.*2/.test(slot.note))return '回福岡約 1.5–2 小時';return '預估時間待確認'}
 function validateFlight(flight){if(!flight||typeof flight!=='object')throw Error('航班資料不正確。');if(!String(flight.number||'').trim())throw Error('請填寫航班編號。');for(const key of ['number','label','fromCode','fromName','fromTime','fromZone','fromTerminal','toCode','toName','toTime','toZone','toTerminal','note'])if(typeof flight[key]!=='string'||flight[key].length>2000)throw Error('航班資料不正確。');for(const key of ['fromTime','toTime'])if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(flight[key]))throw Error('請填寫有效的航班時間。');for(const key of ['fromOffset','toOffset'])if(!Number.isFinite(flight[key])||Math.abs(flight[key])>14)throw Error('航班時區資料不正確。')}
 // Task ids whose meaning changed with the 2026/11/23 itinerary; their old ticks are not carried over.
 const CHANGED_TASKS=['A3','A5','A8','A9','A10'];
 function legacyPlaces(legacy){const list=Array.isArray(legacy.places)?legacy.places:[];return list.filter(place=>place&&typeof place.id==='string'&&!/^place-P0\d$/.test(place.id)).map(place=>({id:place.id,title:String(place.title||'').slice(0,180),url:String(place.url||''),note:String(place.note||'').slice(0,8000),asset:typeof place.asset==='string'?place.asset:''})).filter(place=>{try{googleUrl(place.url);return /^[A-Za-z0-9_-]{1,100}$/.test(place.id)&&place.title.trim()}catch{return false}})}
 function initial(data,legacy={}){const done=clone(legacy.done||{});for(const key of CHANGED_TASKS)delete done[key];return {version:1,day:Number.isInteger(legacy.day)&&legacy.day>=0&&legacy.day<5?legacy.day:0,done,places:[
  ...legacyPlaces(legacy)
 ],days:buildDays(data.days,'day-'),plan:'A',altDays:planBDays(data)}}
 function buildDays(days,prefix,offset=0){return days.map((day,d)=>({...clone(day),slots:day.slots.map((slot,s)=>({id:`${prefix}${d+offset}-slot-${s}`,title:slot.activity,time:slot.time,note:slot.reminder,url:searchUrl(slot.map.query),asset:slot.primary_asset,secondary:slot.secondary_assets||[],custom:false,alternatives:[],...(slot.gallery?{gallery:clone(slot.gallery)}:{}),...(slot.kind?{kind:slot.kind}:{})}))}))}
 // Plan B replaces days 2–3 (2/7–2/8). The plan not on screen waits in altDays, so edits to either plan are kept.
 const PLAN_DAYS=[2,3];
 function planBDays(data){return data.planB?buildDays(data.planB.days,'plan-b-',PLAN_DAYS[0]):[]}
 function ensurePlans(state,data){if(!Array.isArray(state.altDays)){state.plan='A';state.altDays=planBDays(data)}return state}
 // Photos added to the built-in itinerary after a browser saved its copy: refresh them on original (non-custom) slots by id. Titles, times and notes stay as the family edited them.
 function refreshPhotos(state,data){const fresh=new Map();for(const day of [...buildDays(data.days,'day-'),...planBDays(data)])for(const slot of day.slots)fresh.set(slot.id,slot);for(const day of [...state.days,...(state.altDays||[])])for(const slot of day.slots){const source=!slot.custom&&fresh.get(slot.id);if(!source)continue;if(data.renamed&&Object.hasOwn(data.renamed,slot.title)&&data.renamed[slot.title]===source.title)slot.title=source.title;if(slot.title!==source.title)continue;slot.asset=source.asset;if(source.gallery)slot.gallery=clone(source.gallery);else delete slot.gallery}return state}
 function switchPlan(state,plan){if(!['A','B'].includes(plan))throw Error('方案只能是 A 或 B。');if(state.plan===plan)return;const shown=state.days.splice(PLAN_DAYS[0],PLAN_DAYS.length,...state.altDays);state.altDays=shown;state.plan=plan}
 const placed=(state,id)=>[...state.days,...(state.altDays||[])].some(day=>day.slots.some(slot=>slot.placeId===id||slot.alternatives.some(alt=>alt.placeId===id)));
 function findSlot(state,id){for(let day=0;day<state.days.length;day++){const index=state.days[day].slots.findIndex(slot=>slot.id===id);if(index>=0)return {day,index,slot:state.days[day].slots[index]}}throw Error('找不到這段行程。')}
 function findPlace(state,id){const place=state.places.find(place=>place.id===id);if(!place)throw Error('找不到這個收藏地點。');return place}
 function addPlace(state,values){const url=googleUrl(values.url);if(state.places.some(place=>place.url===url))throw Error('這個連結已收藏，請使用現有地點。');const place={id:uid(),title:(values.title||titleFromUrl(url)).trim().slice(0,180),url,note:(values.note||'').slice(0,8000),asset:''};state.places.unshift(place);return place.id}
 function updatePlace(state,id,values){const place=findPlace(state,id),url=googleUrl(values.url),title=String(values.title||'').trim();if(!title)throw Error('請填寫地點名稱。');Object.assign(place,{title:title.slice(0,180),url,note:String(values.note||'').slice(0,8000)})}
 function schedule(state,id,{day,time,mode,afterId}){const place=findPlace(state,id);if(placed(state,id))throw Error('這個地點已排入行程，請先移回待安排再重新安排。');if(!Number.isInteger(day)||!state.days[day])throw Error('請選擇日期。');let index=state.days[day].slots.length-1;
  if(afterId){index=state.days[day].slots.findIndex(slot=>slot.id===afterId);if(index<0)throw Error('找不到指定的行程位置。')}
  if(mode==='alternative'){if(!afterId)throw Error('請選擇要搭配的主行程。');state.days[day].slots[index].alternatives.push({id:uid(),placeId:id});return state.days[day].slots[index].id}
  if(mode!=='main')throw Error('請選擇主行程或備選。');
  const slot={id:uid(),placeId:id,title:place.title,time:String(time||'時間待定').trim().slice(0,80),note:place.note,url:place.url,asset:place.asset,secondary:[],custom:true,alternatives:[]};
  state.days[day].slots.splice(index+1,0,slot);return slot.id;
 }
 function moveSlot(state,id,direction){const found=findSlot(state,id),next=found.index+direction;if(next<0||next>=state.days[found.day].slots.length)return;const slots=state.days[found.day].slots;[slots[found.index],slots[next]]=[slots[next],slots[found.index]]}
 function editSlot(state,id,values){const found=findSlot(state,id),title=String(values.title||'').trim(),day=Number(values.day),url=values.url?googleUrl(values.url):'';if(!title||!state.days[day])throw Error('請確認行程名稱與日期。');if(values.flight)validateFlight(values.flight);Object.assign(found.slot,{title:title.slice(0,180),time:String(values.time||'時間待定').slice(0,80),note:String(values.note||'').slice(0,8000),url});
  if(values.flight){found.slot.flight=clone(values.flight);found.slot.time=values.flight.fromTime+(values.flight.fromOffset===8?' 台灣':'')}
  if(values.kind&&['activity','transport'].includes(values.kind))found.slot.kind=values.kind;
  if(found.slot.placeId)Object.assign(findPlace(state,found.slot.placeId),{title:found.slot.title,note:found.slot.note,url:found.slot.url});
  if(day!==found.day){state.days[found.day].slots.splice(found.index,1);state.days[day].slots.push(found.slot)}return day;
 }
 function removeSlot(state,id){const found=findSlot(state,id);state.days[found.day].slots.splice(found.index,1)}
 function detachAlternative(state,slotId,altId){const {slot}=findSlot(state,slotId);slot.alternatives=slot.alternatives.filter(alt=>alt.id!==altId)}
 function removePlace(state,id){if(placed(state,id))throw Error('請先將地點移回待安排。');state.places=state.places.filter(place=>place.id!==id)}
 function validate(state){
  const text=(v,max)=>typeof v==='string'&&v.length<=max;
  const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
  if(!state||state.version!==1||!Number.isInteger(state.day)||state.day<0||state.day>4||!Array.isArray(state.days)||state.days.length!==5||!Array.isArray(state.places)||state.places.length>1000)throw Error('不是有效的九州行程備份。');
  const ids=new Set(),placeIds=new Set();
  for(const place of state.places){if(!id(place.id)||ids.has(place.id)||!text(place.title,180)||!place.title.trim()||!text(place.note,8000)||!text(place.url,8192)||!(place.asset===undefined||text(place.asset,40)))throw Error('收藏地點格式不正確。');googleUrl(place.url);ids.add(place.id);placeIds.add(place.id)}
  const assigned=new Set();const assign=pid=>{if(!placeIds.has(pid)||assigned.has(pid))throw Error('地點安排資料重複或不完整。');assigned.add(pid)};
  if(state.altDays!==undefined&&(!Array.isArray(state.altDays)||state.altDays.length!==2||!['A','B'].includes(state.plan)))throw Error('A／B 方案資料不正確。');
  for(const day of [...state.days,...(state.altDays||[])]){if(!text(day.date,20)||!text(day.title,180)||!text(day.stay,180)||!text(day.note,8000)||!Array.isArray(day.slots)||day.slots.length>500)throw Error('每日行程格式不正確。');for(const slot of day.slots){if(!id(slot.id)||ids.has(slot.id)||!text(slot.title,180)||!slot.title.trim()||!text(slot.time,80)||!text(slot.note,8000)||!text(slot.url,8192)||!Array.isArray(slot.alternatives)||!Array.isArray(slot.secondary)||!slot.secondary.every(item=>typeof item==='string'&&item.length<=40)||!(slot.asset===undefined||typeof slot.asset==='string'&&slot.asset.length<=40))throw Error('行程時段格式不正確。');if(slot.gallery!==undefined&&!(Array.isArray(slot.gallery)&&slot.gallery.length<=10&&slot.gallery.every(group=>group&&text(group.title,80)&&Array.isArray(group.assets)&&group.assets.length<=20&&group.assets.every(item=>text(item,40)))))throw Error('行程照片分組格式不正確。');ids.add(slot.id);if(slot.flight)validateFlight(slot.flight);if(slot.url)googleUrl(slot.url);if(slot.placeId)assign(slot.placeId);for(const alt of slot.alternatives){if(!id(alt.id)||ids.has(alt.id))throw Error('備選行程格式不正確。');ids.add(alt.id);assign(alt.placeId)}}}
  if(!state.done||typeof state.done!=='object'||Array.isArray(state.done))throw Error('待辦格式不正確。');
  return state;
 }
 const api={clone,ensurePlans,refreshPhotos,switchPlan,durationLabel,initializeFlights,flightDurationLabel,slotKind,transportEstimate,googleUrl,titleFromUrl,initial,placed,findSlot,findPlace,addPlace,updatePlace,schedule,moveSlot,editSlot,removeSlot,detachAlternative,removePlace,validate};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TripCore=api;
})(globalThis);
