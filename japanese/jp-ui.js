/* Shared UI for the travel-Japanese cards: the card sheet, the staff-facing full screen, speech and settings.
   Used by the itinerary detail page (chips) and by japanese/index.html (card list). */
(() => {
 'use strict';
 const P=globalThis.JP_PHRASES,J=globalThis.JPCore;
 if(!P||!J)return;
 const {esc,rubyHtml}=J;
 const SETTINGS_KEY='kyushu-2027-japanese-v1',DISPLAY_KEY='kyushu-2027-japanese-display-v1';
 const byId=Object.fromEntries(P.scenarios.map(scenario=>[scenario.id,scenario]));
 const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
 const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{toast('這個瀏覽器無法儲存設定，重新整理後會回到預設。')}};
 let settings=J.normalizeSettings(read(SETTINGS_KEY)),display=J.normalizeDisplay(read(DISPLAY_KEY)),registry=[],openId=null,showLines=null,toastTimer=0;

 const ICON={
  close:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  slow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 9.5a3.5 3.5 0 0 1 0 5"/></svg>',
  show:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  gear:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>'
 };
 const gearButton=`<button type="button" class="sheet-close jp-gear" data-jp-display-open aria-label="顯示設定">${ICON.gear}</button>`;

 // Dialogs are added before sheet-gestures.js runs, so the sheets get the same drag-to-close as other sheets.
 document.body.insertAdjacentHTML('beforeend',`
<dialog id="jp-sheet" class="bottom-sheet jp-sheet" aria-labelledby="jp-sheet-title"><div class="sheet-header"><div class="sheet-handle" aria-hidden="true"></div><div class="dialog-head"><h2 id="jp-sheet-title"></h2><div class="jp-head-actions">${gearButton}<button type="button" class="sheet-close" data-jp-close="jp-sheet" aria-label="關閉日文卡">${ICON.close}</button></div></div></div><div id="jp-sheet-body" class="sheet-body jp-sheet-body"></div></dialog>
<dialog id="jp-show" class="jp-show" aria-label="放大給對方看"><div class="jp-show-bar"><button type="button" class="jp-tool jp-show-play" data-jp-show-play>${ICON.play}<span>播放</span></button><div class="jp-head-actions">${gearButton}<button type="button" class="sheet-close" data-jp-close="jp-show" aria-label="關閉放大畫面">${ICON.close}</button></div></div><div id="jp-show-body" class="jp-show-body"></div></dialog>
<dialog id="jp-display" class="bottom-sheet jp-display-sheet" aria-labelledby="jp-display-title"><div class="sheet-header"><div class="sheet-handle" aria-hidden="true"></div><div class="dialog-head"><h2 id="jp-display-title">顯示設定</h2><button type="button" class="sheet-close" data-jp-close="jp-display" aria-label="關閉顯示設定">${ICON.close}</button></div></div><div id="jp-display-body" class="sheet-body"></div></dialog>
<div id="jp-toast" class="jp-toast" role="status" hidden></div>`);
 const $=id=>document.getElementById(id);

 // Modal dialogs sit in the top layer, so the toast moves into the last open one to stay visible.
 function toast(message){const el=$('jp-toast'),host=[...document.querySelectorAll('dialog[open]')].pop()||document.body;if(el.parentNode!==host)host.appendChild(el);el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true},3200)}

 // Display choices are CSS switches on <html>, so every open card follows at once without re-rendering.
 function applyDisplay(){for(const key of J.DISPLAY_KEYS)document.documentElement.dataset[`jp${key[0].toUpperCase()}${key.slice(1)}`]=display[key]?'on':'off'}
 applyDisplay();

 // Speech uses the phone's own Japanese voice; nothing is sent anywhere.
 let voiceWarned=false;
 function speak(lines,slow=false){
  const synth=globalThis.speechSynthesis;
  if(!synth||typeof SpeechSynthesisUtterance!=='function'){toast('這個瀏覽器不支援語音播放。');return}
  synth.cancel();
  const voices=synth.getVoices(),voice=voices.find(v=>/^ja(-|_|$)/i.test(v.lang));
  if(!voice&&voices.length&&!voiceWarned){voiceWarned=true;toast('手機裡沒有日文語音，可以到系統設定的「語音」下載日文。')}
  for(const line of lines){
   const utterance=new SpeechSynthesisUtterance(J.speechText(line.ja));
   utterance.lang='ja-JP';utterance.rate=slow?0.6:0.9;if(voice)utterance.voice=voice;
   synth.speak(utterance);
  }
 }

 const remember=lines=>registry.push(lines)-1;
 function tools(index,{show=true}={}){
  return `<div class="jp-tools"><button type="button" class="jp-tool" data-jp-say="${index}">${ICON.play}<span>播放</span></button><button type="button" class="jp-tool" data-jp-say="${index}" data-slow>${ICON.slow}<span>慢速</span></button>${show?`<button type="button" class="jp-tool" data-jp-show="${index}">${ICON.show}<span>放大</span></button>`:''}</div>`;
 }
 // Furigana above, romaji under each word group, Chinese centred below.
 const lineHtml=line=>`<span class="jp-line" lang="ja">${J.chunks(line).map(chunk=>`<span class="jp-chunk"><span class="jp-chunk-ja">${rubyHtml(chunk.ja)}</span><span class="jp-chunk-ro" lang="ja-Latn">${esc(chunk.ro)}</span></span>`).join('')}</span><span class="jp-zh">${esc(line.zh)}</span>`;
 function phrase(item){
  const index=remember([item]);
  const replies=item.reply?.length?`<div class="jp-replies"><p class="jp-reply-label">可以這樣回</p>${item.reply.map(reply=>`<div class="jp-phrase jp-reply">${lineHtml(reply)}${tools(remember([reply]))}</div>`).join('')}</div>`:'';
  return `<div class="jp-phrase">${lineHtml(item)}${tools(index)}${replies}</div>`;
 }
 function word(item){
  const tag=J.tagFor(item.tag,settings),index=remember([item]);
  return `<div class="jp-phrase jp-word">${lineHtml(item)}<div class="jp-word-foot">${tag?`<span class="jp-tag is-${tag.cls}">${esc(tag.label)}</span>`:''}<button type="button" class="jp-tool" data-jp-say="${index}" aria-label="播放 ${esc(J.plainText(item.ja))}">${ICON.play}<span>播放</span></button></div></div>`;
 }

 const OPTION_LABELS={
  vegCount:{label:'素食人數',options:{unset:'未設定','1':'1 位','2':'2 位','3':'3 位','4':'4 位','5':'5 位'}},
  egg:{label:'蛋',options:{unset:'未設定',ok:'可以吃',no:'不吃'}},
  dairy:{label:'奶',options:{unset:'未設定',ok:'可以吃',no:'不吃'}},
  shared:{label:'共用鍋具',options:{unset:'未設定',ok:'可以',separate:'要分開'}}
 };
 function dietSection(){
  const lines=J.dietLines(P.diet,settings),index=remember(lines);
  const controls=Object.entries(OPTION_LABELS).map(([key,{label,options}])=>`<label class="jp-setting"><span>${esc(label)}</span><select data-jp-setting="${key}">${J.SETTING_VALUES[key].map(value=>`<option value="${value}"${settings[key]===value?' selected':''}>${esc(options[value])}</option>`).join('')}</select></label>`).join('');
  return `<section class="jp-section jp-diet" aria-labelledby="jp-diet-title"><h3 id="jp-diet-title">素食說明（給店員看）</h3><div class="jp-diet-actions"><button type="button" class="primary jp-diet-show" data-jp-show="${index}">${ICON.show}<span>放大給店員看</span></button><button type="button" class="jp-tool" data-jp-say="${index}">${ICON.play}<span>播放全部</span></button></div><div class="jp-diet-lines">${lines.map(line=>`<div class="jp-phrase">${lineHtml(line)}</div>`).join('')}</div><div class="jp-settings">${controls}</div><p class="jp-hint">蛋、奶、共用鍋具和人數還沒確認；選「未設定」時，卡片上不會提到。</p></section>`;
 }
 const SECTION_TITLES={say:'我要說',hear:'對方可能說',read:'看得懂'};
 function section(part){
  if(part.type==='diet')return dietSection();
  const base=SECTION_TITLES[part.type]||'',title=part.type==='read'?`${base}：${part.title||''}`:part.title?`${base}・${part.title}`:base;
  const body=part.items.map(part.type==='read'?word:phrase).join('');
  return `<section class="jp-section jp-${part.type}"><h3>${esc(title)}</h3>${body}</section>`;
 }
 function scenarioHtml(scenario){
  registry=[];
  const intro=scenario.intro?`<p class="jp-intro">${esc(scenario.intro)}</p>`:'';
  const tips=scenario.tips?.length?`<ul class="jp-tips">${scenario.tips.map(tip=>`<li>${esc(tip)}</li>`).join('')}</ul>`:'';
  return intro+tips+scenario.sections.map(section).join('');
 }

 const track=dialog=>{if(!dialog.open){dialog.showModal();globalThis.DialogHistory?.track(dialog)}};
 function open(id){
  const scenario=byId[id];if(!scenario)return;
  openId=id;
  $('jp-sheet-title').textContent=scenario.title;
  $('jp-sheet-body').innerHTML=scenarioHtml(scenario);
  $('jp-sheet-body').scrollTop=0;
  track($('jp-sheet'));
 }
 function rerender(){
  if(!openId||!$('jp-sheet').open)return;
  const body=$('jp-sheet-body'),top=body.scrollTop;
  body.innerHTML=scenarioHtml(byId[openId]);body.scrollTop=top;
 }
 function show(lines){
  showLines=lines;
  $('jp-show-body').innerHTML=`<div class="jp-show-lines${lines.length>1?' is-many':''}">${lines.map(line=>`<div class="jp-show-line">${lineHtml(line)}</div>`).join('')}</div>`;
  track($('jp-show'));
  $('jp-show-body').scrollTop=0;
 }

 const DISPLAY_ROWS=[
  {key:'furigana',label:'振假名',hint:'漢字上方的平假名',icon:'<span lang="ja">あ</span>'},
  {key:'romaji',label:'羅馬拼音',hint:'每個詞組下方',icon:'ABC'},
  {key:'chinese',label:'中文翻譯',hint:'每句最下方',icon:'中'}
 ];
 const SAMPLE={ja:'{大人|おとな} {5人|ごにん}と {赤|あか}ちゃん {1人|ひとり}です。',ro:'Otona / gonin to / akachan / hitori desu.',zh:'五位大人和一個寶寶。'};
 function renderDisplay(){
  $('jp-display-body').innerHTML=`<div class="jp-phrase jp-display-sample" aria-label="預覽">${lineHtml(SAMPLE)}</div><div class="jp-switches">${DISPLAY_ROWS.map(row=>`<div class="jp-switch-row"><span class="jp-switch-icon" aria-hidden="true">${row.icon}</span><span class="jp-switch-copy"><span class="jp-switch-label" id="jp-switch-${row.key}">${esc(row.label)}</span><span class="jp-switch-hint">${esc(row.hint)}</span></span><button type="button" class="jp-switch" role="switch" aria-checked="${display[row.key]}" aria-labelledby="jp-switch-${row.key}" data-jp-display="${row.key}"><span></span></button></div>`).join('')}</div><p class="jp-hint">日文本身一定會顯示。設定只存在這支手機，也套用在「放大給對方看」。</p>`;
 }

 document.addEventListener('click',event=>{
  const target=event.target.closest('[data-jp-open],[data-jp-say],[data-jp-show],[data-jp-show-play],[data-jp-close],[data-jp-display-open],[data-jp-display]');
  if(!target)return;
  if(target.dataset.jpOpen){open(target.dataset.jpOpen);return}
  if(target.dataset.jpClose){$(target.dataset.jpClose).close();return}
  if(target.hasAttribute('data-jp-display-open')){renderDisplay();track($('jp-display'));return}
  if(target.dataset.jpDisplay){const key=target.dataset.jpDisplay;display={...display,[key]:!display[key]};write(DISPLAY_KEY,display);applyDisplay();target.setAttribute('aria-checked',String(display[key]));return}
  if(target.hasAttribute('data-jp-show-play')){if(showLines)speak(showLines);return}
  const lines=registry[Number(target.dataset.jpSay??target.dataset.jpShow)];
  if(!lines)return;
  if(target.dataset.jpSay!==undefined)speak(lines,target.hasAttribute('data-slow'));else show(lines);
 });
 document.addEventListener('change',event=>{
  const select=event.target.closest('select[data-jp-setting]');
  if(!select)return;
  settings=J.normalizeSettings({...settings,[select.dataset.jpSetting]:select.value});
  write(SETTINGS_KEY,settings);rerender();
 });
 for(const id of ['jp-sheet','jp-show'])$(id).addEventListener('close',()=>globalThis.speechSynthesis?.cancel());

 // Chips for one itinerary slot: {title,time,kind,date}.
 function slotChips(slot){
  const ids=J.scenariosForSlot(slot).filter(id=>byId[id]);
  if(!ids.length)return '';
  return `<section class="jp-slot" aria-labelledby="jp-slot-title"><h3 id="jp-slot-title" class="jp-slot-title">這段的日文</h3><div class="jp-chips">${ids.map(id=>`<button type="button" class="jp-chip" data-jp-open="${esc(id)}"><span class="jp-chip-mark" lang="ja">${esc(byId[id].mark)}</span><span>${esc(byId[id].chip)}</span></button>`).join('')}</div></section>`;
 }

 globalThis.JPUI={open,slotChips,scenarios:P.scenarios,byId,gearButton};
})();
