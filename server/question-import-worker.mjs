process.once('message',async workerData=>{
try {
 const bytes=Buffer.from(workerData.bytes,'base64');let text='';
 if(workerData.kind==='docx'){
  const end=bytes.lastIndexOf(Buffer.from('504b0506','hex'));if(end<0)throw Error('ZIP inválido.');
  const count=bytes.readUInt16LE(end+10);let offset=bytes.readUInt32LE(end+16),expanded=0,document=false;
  if(count>1000)throw Error('Demasiadas entradas.');
  for(let i=0;i<count;i++){
   if(bytes.readUInt32LE(offset)!==0x02014b50||bytes.readUInt16LE(offset+8)&1)throw Error('Archivo inválido.');
   expanded+=bytes.readUInt32LE(offset+24);if(expanded>32*1024*1024)throw Error('Documento expandido demasiado grande.');
   const length=bytes.readUInt16LE(offset+28),name=bytes.subarray(offset+46,offset+46+length).toString();if(name==='word/document.xml')document=true;
   offset+=46+length+bytes.readUInt16LE(offset+30)+bytes.readUInt16LE(offset+32);
  }
  if(!document)throw Error('No es un documento Word.');
  const mammoth=await import('mammoth');text=(await mammoth.default.extractRawText({buffer:bytes})).value;
 }else{
  const {PDFParse}=await import('pdf-parse');const parser=new PDFParse({data:bytes,isEvalSupported:false});
  try{const result=await parser.getText();if(result.total>30)throw Error('Máximo 30 páginas.');text=result.text;}finally{await parser.destroy();}
 }
 if(text.length>100000)throw Error('El documento contiene demasiado texto.');
 process.send({text});
}catch{process.send({error:'No se pudo leer el documento. Usa la plantilla Word o un PDF con texto seleccionable de hasta 30 páginas.'});}

process.disconnect();
});
