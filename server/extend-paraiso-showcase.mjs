import {DatabaseSync} from 'node:sqlite';
import {existsSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const allowed=process.argv.includes('--allow-demo-access');
if(!allowed)throw Error('Uso: node --env-file=.env server/extend-paraiso-showcase.mjs --allow-demo-access');

const path=resolve(process.env.DB_PATH||'data/portal.sqlite');
if(!existsSync(path))throw Error('No se encontró la base de datos. Inicia primero el portal.');
const db=new DatabaseSync(path);
db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=8000');

const company=db.prepare("SELECT id,name FROM companies WHERE slug='paraiso'").get();
if(!company)throw Error('No existe el espacio de muestra Paraíso de las Alas. Importa primero el paquete de presentación.');
const staff=db.prepare('SELECT * FROM users').all().filter(user=>{
  try{return JSON.parse(user.profile).companyId===company.id&&JSON.parse(user.profile).showcase===true;}catch{return false;}
});
if(staff.length<3)throw Error('Paraíso no contiene las cuentas de muestra esperadas. No se modificó nada.');
const trainer=staff.find(user=>user.role==='trainer')||staff.find(user=>user.role==='admin');
if(!trainer)throw Error('No hay un capacitador de muestra. No se modificó nada.');
const assetFor=kind=>db.prepare('SELECT id,name,kind FROM learning_assets WHERE company_id=? AND kind=? ORDER BY created LIMIT 1').get(company.id,kind);
const assets={presentation:assetFor('presentation'),video:assetFor('video'),document:assetFor('document'),image:assetFor('image')};
if(!assets.presentation||!assets.video)throw Error('Faltan PPT/PPTX o video de muestra. Reimporta el paquete de Paraíso.');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const documentToInsert=!assets.document?{id:'showcase-paraiso-guia-evaluacion-pdf',name:'guia-evaluacion-paraiso-muestra.pdf',kind:'document',mime:'application/pdf',bytes:readFileSync(resolve(root,'public/templates/evaluacion.pdf'))}:null;
if(documentToInsert&&documentToInsert.bytes.subarray(0,5).toString()!=='%PDF-')throw Error('La guía PDF de muestra no es válida. No se modificó nada.');
if(documentToInsert)assets.document=documentToInsert;

const roles=['employee','supervisor','manager','deputy','hr','trainer','sst','admin'];
const course=(id,title,kind,category,duration,dueDate,description,lessons,questions)=>({id,title,kind,category,duration,dueDate,description,icon:'graduation-cap',color:kind==='Capacitación'?'teal':'purple',targetRoles:roles,thumbnail:assets.image?.id||null,lessons,questions});
const courses=[
  course('showcase-paraiso-induccion-operativa-2026','Inducción operativa: Paraíso de las Alas · muestra','Capacitación','Inducción',35,'2026-11-15','Recorrido demostrativo por los protocolos del local. Debe validarlo la empresa antes de usarlo como formación oficial.',[
    {title:'Presentación del local',content:'Revisa la presentación de bienvenida y reconoce las áreas de atención, cocina y reparto.',materials:[assets.presentation.id]},
    {title:'Recorrido audiovisual',content:'Mira el video de muestra y conversa con tu responsable sobre el procedimiento aplicable en tu sede.',materials:[assets.video.id]}
  ],[
    {text:'¿Qué debes hacer antes de aplicar un procedimiento?',options:['Validarlo con el responsable de la empresa','Compartirlo externamente','Omitir la inducción'],answer:0},
    {text:'¿Dónde consultas el material de esta capacitación?',options:['En las lecciones asignadas','En una cuenta ajena','Solo por chat'],answer:0}
  ]),
  course('showcase-paraiso-manipulacion-2026','Manipulación higiénica de alimentos · muestra','Curso','Calidad',30,'2026-11-22','Contenido demostrativo para mostrar el ciclo de capacitación y evaluación de Paraíso de las Alas.',[
    {title:'Buenas prácticas',content:'Consulta el material PDF cargado como ejemplo. Los procedimientos finales deben ser aprobados por la empresa y SST.',materials:[assets.document.id]},
    {title:'Comprobación',content:'Completa la evaluación después de leer el material y conversar las dudas con tu responsable.',materials:[]}
  ],[
    {text:'¿Quién valida el contenido final de una capacitación?',options:['La empresa y el responsable correspondiente','Cualquier visitante','La miniatura del curso'],answer:0},
    {text:'¿Cuándo recibes la constancia?',options:['Al aprobar la evaluación','Al abrir el inicio','Al cambiar de empresa'],answer:0}
  ]),
  course('showcase-paraiso-servicio-2026','Experiencia de servicio en sala · muestra','Capacitación','Servicio',25,'2026-12-01','Ejemplo de capacitación dirigida a atención de clientes, caja y reparto.',[
    {title:'Atención cordial',content:'Usa un saludo claro, confirma el pedido y registra la información que corresponda en los canales de trabajo autorizados.',materials:[assets.video.id]},
    {title:'Cierre de atención',content:'Valida con tu supervisor las prácticas particulares del punto de venta.',materials:[]}
  ],[
    {text:'¿Qué ayuda a confirmar un pedido?',options:['Repetir la información de manera clara','Adivinar la solicitud','Evitar confirmar'],answer:0},
    {text:'¿Con quién validas prácticas del punto de venta?',options:['Con tu supervisor','Con una cuenta externa','Con nadie'],answer:0}
  ]),
  course('showcase-paraiso-epp-2026','Uso seguro de EPP en cocina · muestra','Curso','Seguridad y salud',20,'2026-11-08','Ejemplo de curso de SST para evidenciar fechas límite, progreso, diploma y materiales adjuntos.',[
    {title:'Revisión del equipo',content:'Inspecciona el equipo según el procedimiento vigente y comunícalo si detectas deterioro.',materials:[assets.presentation.id,assets.document.id]},
    {title:'Aplicación en la tarea',content:'El responsable de SST define los controles aplicables a cada tarea y sede.',materials:[]}
  ],[
    {text:'¿Qué haces si encuentras deterioro en un EPP?',options:['Lo comunico y sigo el procedimiento','Lo oculto','Lo uso sin revisar'],answer:0},
    {text:'¿Quién define los controles de SST?',options:['El responsable competente y los procedimientos aprobados','El material de muestra por sí solo','Una persona externa'],answer:0}
  ])
];

const owners={
  kitchen:staff.find(user=>user.role==='employee')||staff[0],
  cashier:staff.find(user=>JSON.parse(user.profile).position?.toLowerCase().includes('caja'))||staff.find(user=>user.role==='payroll')||staff[1],
  delivery:staff.find(user=>JSON.parse(user.profile).position?.toLowerCase().includes('repart'))||staff[2]
};
const records=[
  ['showcase-rest-kitchen-2026','descansos',owners.kitchen,{title:'Descanso médico · MUESTRA',date:'2026-10-26',endDate:'2026-10-27',description:'Registro ficticio para presentar el flujo de aprobación. No contiene información clínica real.'},'Aprobado'],
  ['showcase-rest-cashier-2026','descansos',owners.cashier,{title:'Descanso médico · MUESTRA',date:'2026-11-04',endDate:'2026-11-05',description:'Registro ficticio para mostrar fechas y estados. No usar como constancia médica.'},'En proceso'],
  ['showcase-absence-delivery-2026','ausencias',owners.delivery,{title:'Permiso · MUESTRA',date:'2026-11-12',endDate:'2026-11-12',description:'Solicitud ficticia para presentar la gestión de ausencias.'},'Pendiente'],
  ['showcase-epp-kitchen-2026','epp',owners.kitchen,{title:'Guantes',size:'M',color:'Negro',type:'Renovación',description:'Solicitud ficticia asociada a la capacitación de EPP.'},'Aprobado']
];
const content=[
  ['showcase-announcement-training-2026','anuncios',{title:'Calendario de capacitaciones · MUESTRA',description:'Se habilitaron cuatro formaciones de ejemplo para mostrar vencimientos, progreso y diplomas. El administrador debe reemplazar esta comunicación antes de operar con personal real.',dueDate:'2026-12-01'}],
  ['showcase-session-kitchen-2026','sesiones',{title:'Práctica guiada de cocina · MUESTRA',type:'Presencial',date:'2026-11-06',time:'10:00',description:'Sesión ficticia de acompañamiento. Confirmar horario real con la administración.',url:'',dueDate:'2026-11-06'}],
  ['showcase-task-service-2026','tareas',{title:'Confirmar lectura de protocolo · MUESTRA',date:'2026-11-20',description:'Actividad de demostración para ver tareas con fecha límite.',dueDate:'2026-11-20'}]
];

const now=new Date().toISOString();
let insertedCourses=0,insertedRecords=0,insertedContent=0;
db.exec('BEGIN IMMEDIATE');
try{
  if(documentToInsert)db.prepare('INSERT INTO learning_assets(id,company_id,user_id,name,mime,kind,bytes,created) VALUES(?,?,?,?,?,?,?,?)').run(documentToInsert.id,company.id,trainer.id,documentToInsert.name,documentToInsert.mime,documentToInsert.kind,documentToInsert.bytes,now);
  for(const value of courses){
    if(db.prepare('SELECT 1 FROM course_catalog WHERE id=?').get(value.id))continue;
    db.prepare('INSERT INTO course_catalog(id,data,company_id,active) VALUES(?,?,?,1)').run(value.id,JSON.stringify(value),company.id);
    insertedCourses++;
  }
  for(const [id,module,user,data,status] of records){
    if(db.prepare('SELECT 1 FROM records WHERE id=?').get(id))continue;
    db.prepare('INSERT INTO records(id,module,user_id,data,status,created,updated) VALUES(?,?,?,?,?,?,?)').run(id,module,user.id,JSON.stringify(data),status,now,now);
    insertedRecords++;
  }
  for(const [id,type,data] of content){
    if(db.prepare('SELECT 1 FROM content WHERE id=?').get(id))continue;
    db.prepare('INSERT INTO content(id,type,data,active,created,company_id) VALUES(?,?,?,?,?,?)').run(id,type,JSON.stringify(data),1,now,company.id);
    insertedContent++;
  }
  db.prepare('INSERT OR IGNORE INTO audit(id,company_id,actor_id,action,target,created) VALUES(?,?,?,?,?,?)').run('showcase-extension-audit-2026',company.id,trainer.id,'Datos de presentación ampliados','Cursos, capacitaciones y descansos ficticios',now);
  db.exec('COMMIT');
}catch(error){db.exec('ROLLBACK');throw error;}finally{db.close();}

console.log(`Paraíso de las Alas: ${insertedCourses} formaciones, ${insertedRecords} registros y ${insertedContent} publicaciones agregadas.`);
console.log(`Materiales verificados: PPT/PPTX (${assets.presentation.name}), video (${assets.video.name}) y documento/PDF (${assets.document.name}).`);
console.log('Todos los nuevos datos llevan la marca MUESTRA y la operación se puede ejecutar otra vez sin duplicar registros.');
