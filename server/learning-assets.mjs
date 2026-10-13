import {randomUUID} from 'node:crypto';
import {fork} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {tenant,teaching} from './access.mjs';

export function parseQuestions(text){
 const rows=text.replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean),questions=[];let current=null;
 for(const row of rows){
  const question=row.match(/^PREGUNTA\s*:\s*(.+)$/i),option=row.match(/^([A-F])\)\s*(.+)$/i),answer=row.match(/^RESPUESTA\s*:\s*([A-F])\s*$/i);
  if(question){if(current)questions.push(current);current={text:question[1],options:[],answer:null};}
  else if(current&&option){if(option[1].toUpperCase().charCodeAt(0)-65!==current.options.length)throw Error('Las opciones deben seguir el orden A), B), C).');current.options.push(option[2]);}
  else if(current&&answer){if(current.answer!==null)throw Error('Cada pregunta debe tener una sola respuesta.');current.answer=answer[1].toUpperCase().charCodeAt(0)-65;}
  else if(current&&current.answer===null&&!/^--\s*\d+\s+of\s+\d+\s*--$/.test(row)){
   if(current.options.length)current.options[current.options.length-1]+=' '+row;
   else current.text+=' '+row;
  }
 }
 if(current)questions.push(current);
 if(!questions.length||questions.length>10)throw Error('Usa entre 1 y 10 preguntas con las etiquetas de la plantilla.');
 for(const q of questions)if(q.text.length>300||q.options.length<2||q.options.length>6||q.options.some(o=>!o||o.length>200)||q.answer===null||q.answer>=q.options.length)throw Error('Revisa cada pregunta, sus 2 a 6 opciones y RESPUESTA: A, B o C.');
 return questions;
}
let importing=0;
function extract(bytes,kind){return new Promise((resolve,reject)=>{
 const child=fork(fileURLToPath(new URL('./question-import-worker.mjs',import.meta.url)),[],{execArgv:['--max-old-space-size=192'],stdio:['ignore','ignore','ignore','ipc']});
 let received=false;const timer=setTimeout(()=>{child.kill();reject(Error('La importación excedió el tiempo permitido.'));},12000);
 child.once('message',value=>{received=true;clearTimeout(timer);value.error?reject(Error(value.error)):resolve(value.text);});
 child.once('error',()=>{clearTimeout(timer);reject(Error('No se pudo procesar el archivo.'));});
 child.once('exit',code=>{clearTimeout(timer);if(code!==0||!received)reject(Error('No se pudo procesar el archivo.'));});
 child.send({bytes:bytes.toString('base64'),kind});
});}
export function learningAssets({db,fail,json,allCourses,audit}){
 db.exec('CREATE TABLE IF NOT EXISTS learning_assets(id TEXT PRIMARY KEY,company_id TEXT NOT NULL,user_id TEXT NOT NULL,name TEXT NOT NULL,mime TEXT NOT NULL,kind TEXT NOT NULL,bytes BLOB NOT NULL,created TEXT NOT NULL)');
 const types={'.png':['image/png','image'],'.jpg':['image/jpeg','image'],'.jpeg':['image/jpeg','image'],'.webp':['image/webp','image'],'.mp4':['video/mp4','video'],'.webm':['video/webm','video'],'.pdf':['application/pdf','document'],'.pptx':['application/vnd.openxmlformats-officedocument.presentationml.presentation','presentation'],'.ppt':['application/vnd.ms-powerpoint','presentation'],'.docx':['application/vnd.openxmlformats-officedocument.wordprocessingml.document','document']};
 async function upload(req,max){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>max)fail(413,'El archivo supera el límite permitido.');chunks.push(chunk);}req.checkAuth?.();if(!size)fail(400,'El archivo está vacío.');return Buffer.concat(chunks);}
 function filename(req){let name;try{name=decodeURIComponent(req.headers['x-file-name']||'');}catch{fail(400,'Nombre inválido.');}return name.replace(/[\\/\x00-\x1f]/g,'_').slice(0,150);}
 function signature(bytes,ext){return ext==='.pdf'?bytes.subarray(0,5).toString()==='%PDF-':ext==='.png'?bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a':['.jpg','.jpeg'].includes(ext)?bytes.subarray(0,3).toString('hex')==='ffd8ff':ext==='.webp'?bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP':ext==='.mp4'?bytes.subarray(4,8).toString()==='ftyp':ext==='.webm'?bytes.subarray(0,4).toString('hex')==='1a45dfa3':ext==='.ppt'?bytes.subarray(0,8).toString('hex')==='d0cf11e0a1b11ae1':bytes.subarray(0,4).toString('hex')==='504b0304';}
 function validateRefs(user,course){
  const ids=[course.thumbnail,...course.lessons.flatMap(l=>l.materials||[])].filter(Boolean);
  if(ids.length>31)fail(400,'Máximo 3 materiales por lección y una miniatura.');
  for(const id of ids){if(typeof id!=='string')fail(400,'Material inválido.');const a=db.prepare('SELECT company_id,user_id,kind FROM learning_assets WHERE id=?').get(id);if(!a||a.company_id!==tenant(user)||a.user_id!==user.id)fail(400,'Material no disponible para publicar.');if(id===course.thumbnail&&a.kind!=='image')fail(400,'La miniatura debe ser una imagen.');}
 }
 async function route(req,res,path,user){
  if(path==='/api/question-import'&&req.method==='POST'){
   if(!teaching(user)||tenant(user)==='platform')fail(403,'Selecciona tu empresa y un perfil con permiso para crear cursos.');
   const name=filename(req),ext=name.slice(name.lastIndexOf('.')).toLowerCase();if(!['.pdf','.docx'].includes(ext))fail(400,'Usa Word DOCX o PDF.');
   const bytes=await upload(req,5*1024*1024);if(!signature(bytes,ext))fail(400,'El archivo no corresponde a su extensión.');
   if(importing>=2)fail(429,'Hay otras importaciones en curso. Inténtalo en unos segundos.');importing++;try{return json(res,200,{questions:parseQuestions(await extract(bytes,ext.slice(1)))});}catch(e){fail(400,e.message);}finally{importing--;}
  }
  if(path==='/api/learning-assets'&&req.method==='POST'){
   if(!teaching(user)||tenant(user)==='platform')fail(403,'No tienes permiso para cargar materiales en este espacio.');
   const name=filename(req),ext=name.slice(name.lastIndexOf('.')).toLowerCase(),type=types[ext];if(!type)fail(400,'Usa imágenes, MP4, WebM, PDF, PPT, PPTX o DOCX.');
   const bytes=await upload(req,(type[1]==='video'?50:type[1]==='image'?2:20)*1024*1024);if(!signature(bytes,ext))fail(400,'El archivo no corresponde a su extensión.');
   const used=db.prepare('SELECT COALESCE(SUM(length(bytes)),0) n FROM learning_assets WHERE company_id=?').get(tenant(user)).n;if(used+bytes.length>512*1024*1024)fail(413,'Se alcanzó el espacio de materiales de esta empresa (512 MB).');
   const id=randomUUID();db.prepare('INSERT INTO learning_assets VALUES(?,?,?,?,?,?,?,?)').run(id,tenant(user),user.id,name,...type,bytes,new Date().toISOString());audit(user,'Material de formación cargado',id);return json(res,201,{id,name,mime:type[0],kind:type[1],size:bytes.length});
  }
  const match=path.match(/^\/api\/learning-assets\/([\w-]+)$/);if(match&&req.method==='GET'){
   const a=db.prepare('SELECT * FROM learning_assets WHERE id=? AND company_id=?').get(match[1],tenant(user));if(!a)fail(404,'Material no encontrado.');
   const course=allCourses(user).find(c=>c.active!==false&&c.assigned!==false&&(c.thumbnail===a.id||c.lessons.some(l=>l.materials?.includes(a.id))));if(!course&&!(teaching(user)&&a.user_id===user.id))fail(403,'El material no está asignado a tu cuenta.');
   const bytes=Buffer.from(a.bytes),inline=['image','video'].includes(a.kind),headers={'Content-Type':a.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':`${inline?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(a.name)}`,'Accept-Ranges':'bytes'};
   const range=req.headers.range;if(range){const m=range.match(/^bytes=(\d+)-(\d*)$/),start=Number(m?.[1]),end=m?.[2]?Number(m[2]):bytes.length-1;if(!m||start>end||end>=bytes.length){res.writeHead(416,{'Content-Range':`bytes */${bytes.length}`});res.end();return true;}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':end-start+1});res.end(bytes.subarray(start,end+1));return true;}
   res.writeHead(200,{...headers,'Content-Length':bytes.length});res.end(bytes);return true;
  }
  return false;
 }
 const details=id=>{const a=db.prepare('SELECT id,name,mime,kind,length(bytes) size FROM learning_assets WHERE id=?').get(id);return a||null;};
 return {route,validateRefs,details};
}
