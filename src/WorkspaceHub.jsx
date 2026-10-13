import {Icon} from './ui';
import './workspace-hub.css';
export default function WorkspaceHub({data}){
 const p=data.user.permissions;
 const areas=[
  {id:'learning',title:'Aprendizaje',icon:'graduation-cap',description:'Capacítate y conserva tu recorrido.',links:[['aprendizaje','Mis cursos'],['historial','Historial'],['certificados','Constancias']]},
  {id:'people',title:'Mi vida laboral',icon:'id-card',description:'Tus documentos y solicitudes, a mano.',links:[['boletas','Boletas'],['faltas','Faltas y tardanzas'],['justificaciones','Justificaciones'],['ausencias','Ausencias'],['documentos','Documentos laborales']]},
  {id:'safety',title:'Seguridad y salud',icon:'shield-alt',description:'Prevención y atención en el trabajo.',links:[['iper','Peligros y controles'],['correctivos','Acciones correctivas'],['epp','Equipos de protección'],['descansos','Descanso médico']]},
  {id:'connect',title:'Mi empresa',icon:'bullhorn',description:'Información para mantenerte al día.',links:[['anuncios','Anuncios'],['sesiones','Sesiones'],['tareas','Tareas'],['biblioteca','Protocolos'],['checklist','Checklist']]},
 ];
 if(p.workforce||p.audit||p.platform||p.teach||p.manageCourses||p.assignCourses)areas.push({id:'manage',title:'Gestión del equipo',icon:'users-cog',description:'Administra lo que corresponde a tu rol.',links:[...(p.workforce?[['seguimiento','Seguimiento']]:[]),...((p.teach||p.manageCourses||p.assignCourses)?[['cursos-admin','Gestionar cursos']]:[]),...(p.audit?[['empresa','Empresa y permisos']]:[]),...(p.platform?[['plataforma','Gestionar empresas']]:[])]});
 return <section className="u-workspace-hub" aria-labelledby="workspace-hub-title"><div className="u-section-heading"><div><span className="u-eyebrow">UN SOLO ESPACIO PARA TU DÍA</span><h2 id="workspace-hub-title">Tu empresa, en un solo lugar</h2><p>Entra a cada área con tu misma cuenta.</p></div></div><div className="u-workspace-areas">{areas.map(area=><article key={area.id}><span className="u-workspace-area-icon"><Icon name={area.icon}/></span><h3>{area.title}</h3><p>{area.description}</p><nav aria-label={area.title}>{area.links.map(([id,title])=><a key={id} href={'#'+id}>{title}<Icon name="arrow-right"/></a>)}</nav></article>)}</div></section>;
}
