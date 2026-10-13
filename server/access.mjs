export const roles = [
  {id:'employee',label:'Colaborador',description:'Sus solicitudes, boletas y aprendizaje.'},
  {id:'supervisor',label:'Supervisor / jefe',description:'Seguimiento de su equipo directo y revisión inicial.'},
  {id:'manager',label:'Gerente',description:'Seguimiento de su cadena de equipos y revisión inicial.'},
  {id:'deputy',label:'Subgerente',description:'Seguimiento de equipos asignados y permisos delegados.'},
  {id:'hr',label:'Recursos Humanos',description:'Ausencias, justificaciones y documentos laborales de la empresa.'},
  {id:'payroll',label:'Planillas',description:'Entrega de boletas privadas por colaborador.'},
  {id:'trainer',label:'Capacitador',description:'Cursos, contenidos y avance de aprendizaje de la empresa.'},
  {id:'sst',label:'Responsable de SST',description:'Solicitudes de seguridad y salud de la empresa.'},
  {id:'admin',label:'Administrador de empresa',description:'Configuración, usuarios y operación de su empresa.'},
  {id:'superadmin',label:'Superadmin de plataforma',description:'Alta de empresas, administradores y supervisión de la plataforma.'},
];
export const companyRoles=roles.filter(r=>r.id!=='superadmin');
let policyProvider=()=>({});
let accountPolicyProvider=()=>({});
export const delegablePermissions=['publish','teach','manageCourses','assignCourses','workforce','payroll','audit','approveLabor','approveJustifications','approveSafety','approveMedical'];
export function configurePolicies(provider,accounts=()=>({})){policyProvider=provider;accountPolicyProvider=accounts;}
export const owner=user=>['admin','superadmin'].includes(user.role);
export const tenant = user => JSON.parse(user.profile).companyId || 'demo-company';
export const medical = new Set(['resultados','descansos','gestantes','citas']);
export const labor = new Set(['ausencias','documentos','faltas','justificaciones','objetivos','encuestas']);
export const publishing = user => permissionSummary(user).publish;
export const teaching = user => permissionSummary(user).teach;
export const payroll = user => permissionSummary(user).payroll;
export function reportsTo(owner,leader,users){
  let current=owner;const visited=new Set();
  while(current&&!visited.has(current.id)){
    visited.add(current.id);const boss=JSON.parse(current.profile).supervisorId;
    if(boss===leader.id)return true;
    if(!['manager','deputy'].includes(leader.role))return false;
    current=users.find(u=>u.id===boss&&tenant(u)===tenant(leader));
  }
  return false;
}
export function canRead(user,record,users){
  const owner=users.find(u=>u.id===record.user_id);
  if(!owner||tenant(owner)!==tenant(user))return false;
  if(owner.id===user.id||['admin','superadmin'].includes(user.role))return true;
  const data=typeof record.data==='string'?JSON.parse(record.data):record.data||{};
  if(medical.has(record.module)||(record.module==='ausencias'&&['Descanso Médico','Accidente en el trabajo'].includes(data.title)))return ['hr','sst'].includes(user.role);
  if(user.role==='hr')return labor.has(record.module);
  if(user.role==='sst')return !labor.has(record.module);
  if(['manager','deputy','supervisor'].includes(user.role))return labor.has(record.module)&&reportsTo(owner,user,users);
  return false;
}
export function canResolve(user,record,users){
  if(record.user_id===user.id||!canRead(user,record,users))return false;
  if(owner(user))return true;
  const p=permissionSummary(user);
  if(record.module==='justificaciones')return p.approveJustifications;
  if(medical.has(record.module))return p.approveMedical;
  return labor.has(record.module)?p.approveLabor:p.approveSafety;
}
export function canReview(user,record,users){return record.user_id!==user.id&&['supervisor','manager','deputy'].includes(user.role)&&canRead(user,record,users);}
export function permissionSummary(user){
  const full=owner(user),defaults={publish:full||['hr','trainer','sst'].includes(user.role),teach:full||user.role==='trainer',manageCourses:full||user.role==='trainer',assignCourses:full||user.role==='trainer',payroll:full||user.role==='payroll',users:full,workforce:full||['hr','trainer','manager','deputy','supervisor'].includes(user.role),audit:full||user.role==='hr',platform:user.role==='superadmin',approveLabor:full||user.role==='hr',approveJustifications:full||['hr','supervisor','manager','deputy'].includes(user.role),approveSafety:full||user.role==='sst',approveMedical:full||['hr','sst'].includes(user.role)};
  if(full)return defaults;
  const overrides=policyProvider(tenant(user),user.role)||{};
  for(const key of ['publish','teach','manageCourses','assignCourses','workforce'])if(typeof overrides[key]==='boolean')defaults[key]=overrides[key];
  const account=accountPolicyProvider(tenant(user),user.id)||{};
  for(const key of delegablePermissions)if(typeof account[key]==='boolean')defaults[key]=account[key];
  return defaults;
}
