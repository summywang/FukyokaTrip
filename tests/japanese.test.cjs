const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const C=require('../trip-core.js'),J=require('../japanese/jp-core.js'),P=require('../japanese/phrases.js');
const sandbox={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../trip-data.js'),'utf8'),sandbox);const DATA=JSON.parse(JSON.stringify(sandbox.TRIP_DATA));
const fresh=()=>{const state=C.initial(DATA);C.initializeFlights(state);return state};
const chips=(slot,date)=>J.scenariosForSlot({title:slot.title,time:slot.time,kind:C.slotKind(slot),date});
const allLines=()=>{const lines=[];const visit=line=>{lines.push(line);for(const reply of line.reply||[])visit(reply)};
 for(const scenario of P.scenarios)for(const section of scenario.sections)for(const item of section.items||[])visit(item);
 const d=P.diet;[d.opening,d.who.unset,...d.core,...Object.values(d.egg),...Object.values(d.dairy),...Object.values(d.shared),...d.closing].forEach(visit);
 for(const [ruby] of Object.values(d.who.counts))lines.push({ja:ruby,ro:'x',zh:'x'});
 return lines};

test('every line has Japanese, romaji and Chinese, and every kanji carries furigana',()=>{
 const lines=allLines();assert(lines.length>200);
 for(const line of lines){
  for(const key of ['ja','ro','zh'])assert(typeof line[key]==='string'&&line[key].trim(),`${key} missing: ${line.ja}`);
  const outside=line.ja.replace(/\{[^{}|]+\|[^{}|]+\}/g,'');
  assert(!/[{}|]/.test(outside),`broken ruby markup: ${line.ja}`);
  assert(!/\p{Script=Han}/u.test(outside),`kanji without furigana: ${line.ja}`);
  for(const part of J.parseRuby(line.ja))if(part.ruby)assert(/^[\p{Script=Hiragana}ー]+$/u.test(part.ruby),`reading must be hiragana: ${part.ruby}`);
  assert(!/\p{Script=Han}|[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(line.ro),`romaji contains Japanese script: ${line.ro}`);
 }
});

test('ruby renders as escaped <ruby> markup and speech reads counted words by their reading',()=>{
 assert.equal(J.rubyHtml('{肉|にく}<b>'),'<ruby>肉<rt>にく</rt></ruby>&lt;b&gt;');
 assert.equal(J.plainText('{大人|おとな}{5人|ごにん}です'),'大人5人です');
 assert.equal(J.speechText('{大人|おとな}{5人|ごにん}と{赤|あか}ちゃん{1人|ひとり}'),'大人ごにんと赤ちゃんひとり');
 assert.equal(J.speechText('{予約|よやく}した○○です'),'予約したです');
});

test('scenario data is complete and each card has a unique id, chip and mark',()=>{
 const ids=new Set();
 for(const scenario of P.scenarios){
  assert(!ids.has(scenario.id));ids.add(scenario.id);
  for(const key of ['title','chip','mark','reading'])assert(scenario[key],`${scenario.id} ${key}`);
  assert(scenario.sections.length);for(const section of scenario.sections)assert(['say','hear','read','diet'].includes(section.type));
 }
 assert.equal(P.scenarios.filter(s=>s.sections.some(section=>section.type==='diet')).length,1);
});

test('every Japan-side itinerary slot in both plans gets at least one card that exists',()=>{
 const state=fresh(),known=new Set(P.scenarios.map(s=>s.id));
 for(const day of [...state.days,...state.altDays])for(const slot of day.slots){
  const ids=chips(slot,day.date);
  if(C.slotKind(slot)==='flight'||/台灣/.test(slot.time)){assert.deepEqual(ids,[]);continue}
  assert(ids.length,`no card for ${day.date} ${slot.title}`);for(const id of ids)assert(known.has(id),id);
 }
});

test('slots map to the expected situations',()=>{
 const state=fresh(),find=(days,title)=>{for(const day of days)for(const slot of day.slots)if(slot.title===title)return chips(slot,day.date);throw Error(title)};
 assert.deepEqual(find(state.days,'福岡抵達入境與租車'),['immigration','rental']);
 assert.deepEqual(find(state.days,'晚餐吉塚'),['restaurant']);
 assert.deepEqual(find(state.days,'早餐・退房'),['konbini','lodging']);
 assert.deepEqual(find(state.days,'皿倉山纜車購票・上山'),['tickets']);
 assert.deepEqual(find(state.days,'前往由布院'),['driving','snow']);
 assert.deepEqual(find(state.days,'入住YUNOA 由布院'),['lodging','onsen']);
 assert.deepEqual(find(state.days,'前往還車門市與加油'),['rental','gas','driving']);
 assert.deepEqual(find(state.days,'安檢 出境 候機與登機'),['airport']);
 assert.deepEqual(find(state.altDays,'天拝之鄉家族湯屋'),['onsen']);
 assert.deepEqual(find(state.altDays,'午餐天拝之鄉周邊'),['restaurant']);
 assert(!find(state.days,'午餐海洋世界周邊').includes('tickets'));
 assert(!find(state.days,'前往海之中道海洋世界').includes('baby'));
});

test('usage follows the plan on screen, hides merged children and orders cards by first use',()=>{
 const state=fresh(),usage=J.usage(state.days,{merged:DATA.mergedSlots,kindOf:C.slotKind});
 assert.equal(usage.get('rental').filter(item=>item.slotId==='day-0-slot-3').length,0);
 assert.equal(J.usageLabel(usage.get('restaurant')),'2/5–2/9 · 7 段行程');
 assert.equal(J.usageLabel(usage.get('rental')),'2/5、2/9 · 3 段行程');
 assert.equal(J.usageLabel(undefined),'隨時可用');
 const order=J.orderedScenarios(P.scenarios,usage).map(s=>s.id);
 assert.deepEqual(order.slice(0,4),['immigration','rental','lodging','restaurant']);
 assert.deepEqual(order.slice(-3),['baby','emergency','basics']);
 assert.equal(usage.get('onsen').length,1);
 C.switchPlan(state,'B');
 const planB=J.usage(state.days,{merged:DATA.mergedSlots,kindOf:C.slotKind});
 assert.deepEqual(planB.get('onsen').map(item=>item.title),['天拝之鄉家族湯屋']);
});

test('the vegetarian card leaves unconfirmed egg, dairy, cookware and head count out until set',()=>{
 const base=J.dietLines(P.diet,{}).map(line=>line.zh).join('\n');
 assert.match(base,/我們之中有素食者/);assert.match(base,/高湯/);assert.match(base,/蔥、蒜、韭菜/);
 assert.doesNotMatch(base,/蛋|乳製品|鍋子/);
 const set=J.dietLines(P.diet,{vegCount:'2',egg:'ok',dairy:'no',shared:'separate'});
 const text=set.map(line=>line.zh).join('\n');
 assert.match(text,/2 位素食者/);assert.match(text,/蛋可以吃/);assert.match(text,/乳製品也不能吃/);assert.match(text,/分開的鍋子/);
 assert(set.some(line=>line.ja.includes('{2人|ふたり}')));
 assert.deepEqual(J.normalizeSettings({egg:'maybe',vegCount:9,dairy:'ok'}),{vegCount:'unset',egg:'unset',dairy:'ok',shared:'unset'});
 assert.deepEqual(J.tagFor('egg',{}),{cls:'unset',label:'未確認'});
 assert.deepEqual(J.tagFor('dairy',{dairy:'no'}),{cls:'no',label:'不行'});
 assert.deepEqual(J.tagFor('no',{}),{cls:'no',label:'不行'});
});

test('in-trip view finds the current and next slot in Japan time and nothing outside the trip',()=>{
 const state=fresh();
 assert.equal(J.nowAndNext(state.days,new Date('2026-11-26T12:00:00+09:00'),DATA.mergedSlots),null);
 const live=J.nowAndNext(state.days,new Date('2027-02-06T10:30:00+09:00'),DATA.mergedSlots);
 assert.equal(live.dayIndex,1);assert.equal(live.current.title,'海之中道海洋世界');assert.equal(live.next.title,'午餐海洋世界周邊');
 const arrival=J.nowAndNext(state.days,new Date('2027-02-05T18:30:00+09:00'),DATA.mergedSlots);
 assert.equal(arrival.current.title,'福岡抵達入境與租車');assert.equal(arrival.next.title,'入住吉塚 Airbnb');
 const evening=J.nowAndNext(state.days,new Date('2027-02-07T17:00:00+09:00'),DATA.mergedSlots);
 assert.equal(evening.current.title,'入住YUNOA 由布院');
 assert.equal(J.tripMoment('2027-02-04T15:30:00Z').dayIndex,0);
});
