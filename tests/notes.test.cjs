const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../trip-core.js');
require('../trip-data.js');
const DATA=globalThis.TRIP_DATA;
const fresh=()=>C.ensureNotes(C.initial(DATA),DATA);

test('old checklist migrates once, keeping text and archiving only checked items',()=>{
 const state=C.initial(DATA,{done:{A1:true,A2:false}});
 C.ensureNotes(state,DATA);
 assert.equal(state.notes.length,DATA.tasks.length);
 assert.equal(state.notes[0].title,DATA.tasks[0][1]);
 assert.equal(state.notes[0].body,DATA.tasks[0][2]);
 assert.equal(C.findNote(state,'note-A1').archived,true);
 assert.equal(C.findNote(state,'note-A2').archived,false);
 C.editNote(state,'note-A1',{title:'家人改過的筆記',body:'保留內容'});
 C.ensureNotes(state,DATA);
 assert.equal(C.findNote(state,'note-A1').title,'家人改過的筆記');
 const empty=fresh();empty.notes=[];C.ensureNotes(empty,DATA);assert.deepEqual(empty.notes,[]);
 C.validate(state);
});

test('add, edit, archive, restore and backup roundtrip retain all note content',()=>{
 const state=fresh(),id=C.addNote(state,{title:' 買伴手禮 ',body:'第一行\n第二行'});
 assert.equal(state.notes[0].id,id);
 assert.equal(C.findNote(state,id).title,'買伴手禮');
 C.editNote(state,id,{title:'買點心',body:'分兩袋'});
 C.archiveNote(state,id);assert.equal(C.findNote(state,id).archived,true);
 const imported=C.ensureNotes(C.validate(C.clone(state)),DATA);
 assert.deepEqual(imported.notes,state.notes);
 C.archiveNote(imported,id,false);
 assert.deepEqual(C.findNote(imported,id),{id,title:'買點心',body:'分兩袋',archived:false});
 assert.equal(C.findNote(state,id).archived,true);
});

test('note validation rejects corrupt imports and invalid edits without silently deleting notes',()=>{
 const state=fresh(),id=state.notes[0].id,before=C.clone(state);
 for(const values of [{title:' ',body:'x'},{title:'x'.repeat(181),body:''},{title:'x',body:'x'.repeat(8001)}])assert.throws(()=>C.editNote(state,id,values));
 assert.deepEqual(state,before);
 for(const change of [s=>s.notes.push(C.clone(s.notes[0])),s=>s.notes[0].body={},s=>s.notes[0].archived='yes',s=>s.notes=[null],s=>s.notes[0].id='bad id']){const copy=C.clone(state);change(copy);assert.throws(()=>C.validate(copy))}
 assert.throws(()=>C.archiveNote(state,id,'yes'));assert.throws(()=>C.editNote(state,'missing',{title:'x'}));
 const old=C.clone(state);delete old.notes;C.validate(old);C.ensureNotes(old,DATA);assert.equal(old.notes.length,DATA.tasks.length);
});
