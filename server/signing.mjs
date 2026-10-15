import {createHash,randomUUID} from 'node:crypto';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {tenant,owner} from './access.mjs';
const platformLogo=readFileSync(new URL('./assets/franquisia-logo.png',import.meta.url)).toString('base64');

export function validateStrokes(strokes){
 if(!Array.isArray(strokes)||!strokes.length||strokes.length>100)throw Error('Dibuja una firma válida.');
 let points=0,length=0;
 for(const stroke of strokes){if(!Array.isArray(stroke)||stroke.length<2)throw Error('Firma incompleta.');points+=stroke.length;
  for(let i=0;i<stroke.length;i++){const p=stroke[i];if(!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)||n<0||n>1))throw Error('Coordenadas inválidas.');if(i)length+=Math.hypot(p[0]-stroke[i-1][0],p[1]-stroke[i-1][1]);}
 }if(points>2000||length<.08)throw Error('Dibuja una firma completa (máximo 2000 puntos).');return strokes;
}
const digest=value=>createHash('sha256').update(value).digest('hex');
const printable=s=>String(s).replace(/[^\x20-\x7e\xa0-\xff]/g,' ');
function drawSignature(page,strokes,x,y,w=240,h=80){for(const stroke of strokes)for(let i=1;i<stroke.length;i++)page.drawLine({start:{x:x+stroke[i-1][0]*w,y:y+(1-stroke[i-1][1])*h},end:{x:x+stroke[i][0]*w,y:y+(1-stroke[i][1])*h},thickness:1.5,color:rgb(.08,.17,.26)});}
export async function diplomaPdf(snapshot,signature){
 const pdf=await PDFDocument.create(),page=pdf.addPage([842,595]),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 page.drawRectangle({x:24,y:24,width:794,height:547,borderWidth:2,borderColor:rgb(.06,.46,.43)});
 const logo=async(bytes,x)=>{if(!bytes)return;const png=await sharp(Buffer.from(bytes,'base64'),{limitInputPixels:40_000_000}).resize({width:800,height:260,fit:'inside',withoutEnlargement:true}).png().toBuffer();const img=await pdf.embedPng(png),size=img.scaleToFit(210,60);page.drawImage(img,{x:x+(210-size.width)/2,y:505+(60-size.height)/2,width:size.width,height:size.height});};
 const branded=!!snapshot.platformLogo||!signature;if(branded){await logo(snapshot.platformLogo||platformLogo,60);await logo(snapshot.companyLogo,572);}
 const center=(text,y,size=18,strong=false)=>{text=printable(text);const f=strong?bold:font;size=Math.min(size,740/f.widthOfTextAtSize(text,1));page.drawText(text,{x:(842-f.widthOfTextAtSize(text,size))/2,y,size,font:f,color:rgb(.08,.18,.27)});};
 center('FRANQUISIA  |  '+snapshot.company,branded?487:525,branded?12:18,true);center('DIPLOMA DE APROBACIÓN',branded?442:455,30,true);center('Otorgado a',409,16);center(snapshot.name,365,28,true);center('Por completar y aprobar '+(snapshot.kind==='Capacitación'?'la capacitación':'el curso'),323,16);center(snapshot.title,282,23,true);center('Calificación: '+snapshot.score+'%  |  Duración: '+snapshot.duration+' minutos',244,14);center('Fecha de aprobación: '+snapshot.completed.slice(0,10),218,14);
 if(signature){drawSignature(page,JSON.parse(signature.strokes),301,102);center('Firma del participante · '+signature.signed_at.slice(0,10),85,11);}else center('Emitido automáticamente por Franquisia y '+snapshot.company,123,13);
 center('Registro: '+snapshot.reference,59,9);return pdf.save();
}
export function signing({db,fail,json,body,allCourses,companyInfo,audit}){
 db.exec(`CREATE TABLE IF NOT EXISTS diplomas(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),company_id TEXT NOT NULL,course_id TEXT NOT NULL,snapshot TEXT NOT NULL,UNIQUE(user_id,course_id));
 CREATE TABLE IF NOT EXISTS document_signatures(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),company_id TEXT NOT NULL,kind TEXT NOT NULL,target_id TEXT NOT NULL,document_hash TEXT NOT NULL,strokes TEXT NOT NULL,signed_at TEXT NOT NULL,signer_name TEXT NOT NULL,UNIQUE(user_id,kind,target_id));`);
 const logos=user=>({platformLogo,companyLogo:db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='company_logos'").get()?db.prepare('SELECT bytes FROM company_logos WHERE company_id=?').get(tenant(user))?.bytes?Buffer.from(db.prepare('SELECT bytes FROM company_logos WHERE company_id=?').get(tenant(user)).bytes).toString('base64'):null:null});
 function diploma(user,id){const progress=db.prepare('SELECT * FROM progress WHERE user_id=? AND course_id=? AND completed IS NOT NULL').get(user.id,id);if(!progress)fail(403,'Primero aprueba el curso.');const course=allCourses(user).find(c=>c.id===id);if(!course)fail(404,'Curso no encontrado.');let row=db.prepare('SELECT * FROM diplomas WHERE user_id=? AND course_id=? AND company_id=?').get(user.id,id,tenant(user));if(!row){const reference=randomUUID(),snapshot={...logos(user),reference,name:user.name,company:companyInfo(user).name,title:course.title,kind:course.kind||'Curso',score:progress.score,duration:course.duration,dueDate:course.dueDate||null,completed:progress.completed};db.prepare('INSERT INTO diplomas VALUES(?,?,?,?,?)').run(reference,user.id,tenant(user),id,JSON.stringify(snapshot));row=db.prepare('SELECT * FROM diplomas WHERE id=?').get(reference);}const value=JSON.parse(row.snapshot);if(!value.platformLogo&&!db.prepare("SELECT 1 FROM document_signatures WHERE user_id=? AND kind='course' AND target_id=?").get(user.id,id)){row.snapshot=JSON.stringify({...value,...logos(user)});db.prepare('UPDATE diplomas SET snapshot=? WHERE id=?').run(row.snapshot,row.id);}return row;}
 function target(user,kind,id){
  if(kind==='course'){const d=diploma(user,id);return {name:JSON.parse(d.snapshot).title,hash:digest(d.snapshot),owner:user.id,diploma:d};}
  const d=db.prepare('SELECT * FROM employee_documents WHERE id=? AND company_id=?').get(id,tenant(user));if(!d)fail(404,'Documento no encontrado.');if(d.user_id!==user.id&&!owner(user)&&user.role!=='hr')fail(403,'Documento privado.');return {name:d.title,hash:digest(Buffer.from(d.bytes)),owner:d.user_id,document:d};
 }
 async function route(req,res,path,user){
  const match=path.match(/^\/api\/(?:signatures\/(course|document)\/([\w-]+)|diplomas\/([\w-]+)(\/pdf)?|employee-documents\/([\w-]+)\/signed-pdf)$/);if(!match)return false;
  const kind=match[1]||(match[5]?'document':'course'),id=match[2]||match[3]||match[5],t=target(user,kind,id);
  const saved=db.prepare('SELECT * FROM document_signatures WHERE user_id=? AND company_id=? AND kind=? AND target_id=?').get(t.owner,tenant(user),kind,id);
  if(saved&&saved.document_hash!==t.hash)fail(409,'El contenido cambió. La firma pertenece a otra versión.');
  if(req.method==='POST'&&match[1]){
   if(t.owner!==user.id)fail(403,'Solo el destinatario puede firmar.');if(saved)fail(409,'Este documento ya está firmado.');const b=await body(req);if(b.consent!==true||b.documentHash!==t.hash)fail(409,'Revisa el documento y acepta firmar esta versión.');try{validateStrokes(b.strokes);}catch(e){fail(400,e.message);}
   const stamp=new Date().toISOString();const inserted=db.prepare('INSERT OR IGNORE INTO document_signatures VALUES(?,?,?,?,?,?,?,?,?)').run(randomUUID(),user.id,tenant(user),kind,id,t.hash,JSON.stringify(b.strokes),stamp,user.name);if(!inserted.changes)fail(409,'Este documento ya está firmado.');audit(user,'Documento firmado electrónicamente',id);return json(res,201,{ok:true,signedAt:stamp});
  }
  if(req.method!=='GET')fail(405,'Método no permitido.');
  if(match[4]||match[5]){let bytes;if(kind==='course')bytes=await diplomaPdf(JSON.parse(t.diploma.snapshot),saved);else{if(!saved)fail(409,'El documento aún no está firmado.');let pdf;try{pdf=await PDFDocument.load(t.document.bytes);}catch{fail(422,'No se puede agregar la firma a este PDF. Descarga el original y consulta con administración.');}const page=pdf.addPage([595,842]),font=await pdf.embedFont(StandardFonts.Helvetica);const text=(s,y,size=12)=>page.drawText(printable(s),{x:40,y,size,font,maxWidth:515,lineHeight:18});text('FRANQUISIA · CONSTANCIA DE FIRMA',780,19);text(t.name,735,15);text('Firmante: '+saved.signer_name,680);text('Empresa: '+companyInfo(user).name,650);text('Fecha UTC: '+saved.signed_at,620);drawSignature(page,JSON.parse(saved.strokes),70,430,400,130);text('Firma electrónica manuscrita del destinatario.',390);text('Vinculada al documento original mediante SHA-256:',340);text(saved.document_hash.slice(0,32),310,11);text(saved.document_hash.slice(32),290,11);text('Referencia: '+saved.id,240,10);bytes=await pdf.save();}
   res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="${kind==='course'?'diploma':'documento-firmado'}.pdf"`,'Cache-Control':'private, no-store'});res.end(Buffer.from(bytes));return true;
  }
  return json(res,200,{title:t.name,documentHash:t.hash,signature:saved?{strokes:JSON.parse(saved.strokes),signedAt:saved.signed_at,name:saved.signer_name}:null,...(t.diploma?{diploma:JSON.parse(t.diploma.snapshot)}:{})});
 }
 return {route,diploma};
}
