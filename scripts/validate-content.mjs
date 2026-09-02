import fs from 'node:fs';import path from 'node:path';
const files=fs.readdirSync('content').filter(f=>f.endsWith('.json'));let failed=false,sets=0;
function walk(obj,file){
 if(Array.isArray(obj)){obj.forEach(x=>walk(x,file));return}
 if(!obj||typeof obj!=='object')return;
 if(Array.isArray(obj.correct)&&Array.isArray(obj.wrong)){
   sets++;
   if(typeof obj.prompt!=='string'||!obj.prompt.trim())throw new Error(`${file}: missing prompt`);
   const c=new Set(obj.correct),w=new Set(obj.wrong);
   if(c.size!==obj.correct.length)throw new Error(`${file}: duplicate correct answers`);
   if(w.size!==obj.wrong.length)throw new Error(`${file}: duplicate wrong answers`);
   for(const x of c)if(w.has(x))throw new Error(`${file}: answer appears in correct and wrong`);
   if(!obj.correct.length)throw new Error(`${file}: no correct answer`);
 }
 for(const v of Object.values(obj))walk(v,file)
}
for(const file of files){
 try{const d=JSON.parse(fs.readFileSync(path.join('content',file),'utf8'));if(!d||typeof d!=='object')throw new Error('invalid root');walk(d,file);console.log('OK',file)}
 catch(e){failed=true;console.error('FAIL',file,e.message)}
}
if(failed)process.exit(1);console.log(`Validated ${files.length} packs and ${sets} question sets.`);
