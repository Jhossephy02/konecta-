import {industryTheme} from './industries.mjs';
const profiles={
 superadmin:{icon:'globe',label:'Superadmin',message:'Administra los espacios empresariales de la plataforma.'},
 admin:{icon:'user-tie',label:'Dueño / administración',message:'Organiza tu empresa y asigna responsabilidades a tu equipo.'},
 manager:{icon:'chart-line',label:'Gerencia',message:'Acompaña a tus equipos y revisa sus avances.'},
 deputy:{icon:'sitemap',label:'Subgerencia',message:'Coordina equipos y apoya la gestión de tu empresa.'},
 supervisor:{icon:'user-check',label:'Supervisión',message:'Acompaña a tu equipo y revisa las solicitudes a tu alcance.'},
 hr:{icon:'hands-helping',label:'GDH / Recursos Humanos',message:'Acompaña a las personas y gestiona sus procesos laborales.'},
 payroll:{icon:'file-invoice-dollar',label:'Planillas',message:'Gestiona la entrega privada de boletas de pago.'},
 trainer:{icon:'chalkboard-teacher',label:'Capacitación',message:'Prepara contenidos y acompaña el aprendizaje.'},
 sst:{icon:'hard-hat',label:'Seguridad y salud',message:'Acompaña la prevención y las solicitudes de seguridad.'}
};
export function roleTheme(role,position='',industry='general'){
 const title=String(position).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const detected=/subgerent/.test(title)?'deputy':/gerent/.test(title)?'manager':/supervisor|jefe/.test(title)?'supervisor':/\bgdh\b|recursos humanos|gestion.*human/.test(title)?'hr':null;
 const profile=profiles[role]||profiles[detected];
 if(profile)return {...profile,position:position||profile.label,industryIcon:industryTheme(industry).icon};
 if(/gestor/.test(title))return {icon:'tasks',label:'Gestión',position,industryIcon:industryTheme(industry).icon,message:'Organiza y da seguimiento a las tareas de tu cargo.'};
 const jobIcon=/cocin|chef/.test(title)?'utensils':/cajer/.test(title)?'cash-register':/repart|delivery/.test(title)?'motorcycle':null;const theme=industryTheme(industry);const employeeIcons={restaurant:'user',hardware:'hard-hat',fashion:'tshirt',retail:'cash-register',logistics:'truck',health:'user-nurse',education:'user-graduate',manufacturing:'user-cog',hospitality:'concierge-bell'};return {icon:jobIcon||employeeIcons[industry]||'user',label:'Colaborador',position:position||'Colaborador',industryIcon:theme.icon,message:theme.action};
}
