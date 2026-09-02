export async function extractWorksheetText(file,{provider='none',endpoint=''}={}){
  if(provider==='none') throw new Error('OCR provider not configured');
  if(provider==='custom'){
    const form=new FormData();form.append('file',file);
    const r=await fetch(endpoint,{method:'POST',body:form});
    if(!r.ok) throw new Error('OCR request failed');
    const data=await r.json();
    return data.text||'';
  }
  throw new Error('Unsupported OCR provider');
}
