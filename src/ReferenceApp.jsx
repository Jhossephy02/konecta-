import { useEffect, useState } from 'react';

const navItems = [
  ['home', 'Inicio'], ['list-alt', 'IPER C'], ['clipboard-check', 'Seguimiento correctivo'], ['graduation-cap', 'Capacitaciones'],
  ['hard-hat', 'Gestión de EPP'], ['users', 'Elecciones del CSST'], ['people-arrows', 'Participación y consulta'],
  ['inbox', 'Buzón de SST'], ['users-cog', 'Brigadas'], ['file-alt', 'Entrega de resultados'],
  ['user-md', 'Descanso médico'], ['female', 'Mujer gestante/lactante'], ['calendar-alt', 'Programación de citas'],
];
const appBrands = [
  ['a','aqua'], ['∞','love'], ['oh!','oh'], ['IXP','ixp'], ['✚','plaza-vea'],
  ['✺','real-plaza'], ['■','interbank'], ['▣','jokr-mark'], ['JOKR','jokr'],
  ['makro','makro'], ['Mass✓','mass'], ['merkao','merkao'], ['✚','mass-plus'],
  ['oe','oechsle'], ['▰','cine'], ['✓','check'], ['⌂','promart-mini'],
  ['◎','target'], ['✿','purple'], ['🍅','tomato'], ['◌','pink'],
];
const shortcutOptions = ['Home','Mi Perfil','Certificados y constancias','Otros','Talento y Learning','Mi equipo','Ausencias','Salud','Documentos laborales','Cumpleaños'];

function Hardhat() {
  return <svg className="hardhat" viewBox="0 0 48 48" aria-label="Logo Promart"><path fill="#e68b27" stroke="#324b56" strokeWidth="2" d="M7 28a17 17 0 0 1 34 0v4H7z"/><path fill="#f5bf38" stroke="#324b56" strokeWidth="2" d="M4 30h40v6H4zM17 13V8h6v5m5 0V8h6v7"/><path fill="#d84f32" d="M22 19h4v6h6v4h-6v6h-4v-6h-6v-4h6z"/></svg>;
}
function PromartLogo() { return <div className="promart"><svg className="promart-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M2 11.2 10.4 3h4.8l6.8 6.6v4.2h-4.2v-2.4l-5-4.8-6.3 6.1v5.1h15.1V22H2v-8.9l8.2-7.9"/></svg><span>PROMART</span><small>HOMECENTER</small></div>; }
function Icon({ name, size = 20 }) {
  const aliases = { training: 'graduation-cap', survey: 'graduation-cap', helmet: 'hard-hat', medical: 'stethoscope', people: 'users', 'user-circle': 'user' };
  const regular = ['bell', 'user', 'clock', 'exclamation-circle'].includes(name);
  return <i className={`${regular ? 'far' : 'fas'} fa-${aliases[name] || name}`} style={{ fontSize: size }} aria-hidden="true"/>;
}
function Portrait() {
  return <img className="portrait" src="/images/weconnect/user-init.png" alt="Avatar de Edgar"/>;
}
function Header({ portal, onMenu, notify }) {
  return portal ? <header className="portalbar"><button className="hamb" aria-label="Abrir menú" onClick={onMenu}><Icon name="bars"/></button><span className="portal-title">Portal del colaborador</span><img className="intercorp-logo" src="/images/weconnect/logo-intercorp.svg" alt="Intercorp Retail"/><span className="portal-actions"><button className="icon-button" aria-label="Notificaciones" onClick={() => notify('No tienes notificaciones nuevas')}><Icon name="bell"/></button><button className="icon-button" aria-label="Perfil" onClick={() => notify('Perfil de Edgar')}><Icon name="user"/></button></span></header>
    : <header className="topbar"><Hardhat /><button className="hamb" aria-label="Abrir menú" onClick={onMenu}><Icon name="bars"/></button><PromartLogo /><div className="bar-spacer"/><button className="icon-button" onClick={() => notify('No tienes notificaciones nuevas')} aria-label="Notificaciones"><Icon name="bell"/></button><button className="user-button" onClick={() => notify('Sesión de Edgar')}><span className="user-circle"><Icon name="user-circle" size={24}/></span><span>EDGAR</span></button></header>;
}
function Sidebar({ expanded }) {
  return <aside className={`sidebar${expanded ? ' expanded' : ''}`}><nav className="side-nav">{navItems.map(([icon,label],i)=><a className={`side-link${i===0?' active':''}`} key={label} href="#"><span className="side-icon"><Icon name={icon}/></span><span className="side-label">{label}</span></a>)}</nav></aside>;
}
function Metric({ label, value, tone = '' }) { return <div className={`stat ${tone}`}><span>{label}</span><b>{value}</b></div>; }
function DashboardCard({ title, icon, tone = '', stats, detailTitle, detail, link, secondDetail = false }) {
  return <article className="card"><div className="card-head"><span className={`card-icon ${tone}`}>{icon}</span>{title}</div><div className="stats">{stats.map((stat,i)=><Metric key={i} {...stat}/>)}</div>{secondDetail ? <div className="inline-detail"><strong>{detailTitle}</strong><p>{detail}</p></div> : <div className="detail"><strong>{detailTitle}</strong><p>{detail}</p></div>}<a className="card-link" href="#">{link}　→</a></article>;
}
function Dashboard({ menuOpen }) {
  return <div className="layout"><div className="sidebar-wrap"><Sidebar expanded={menuOpen}/></div><main className="content"><div className="session">◷ <strong>La sesión expira en: 16:02 min</strong></div><div className="crumb">Home　/　Inicio</div><section className="dash-grid">
    <DashboardCard title="Capacitaciones" icon={<Icon name="training" size={29}/>} stats={[{label:'Pendientes',value:'1'},{label:'Completadas',value:'12'}]} detailTitle={<><Icon name="clock" size={14}/> Próxima capacitación</>} detail="USO, CUIDADO Y CONSERVACIÓN DE EPPS - 05/10/2026 - 12:00 AM" link="Ver todas las capacitaciones"/>
    <DashboardCard title="Encuestas" icon={<Icon name="training" size={29}/>} stats={[{label:'Pendientes',value:'0'},{label:'Completadas',value:'0'}]} detailTitle={<><Icon name="clock" size={14}/> Próxima encuesta</>} detail="" link="Ver todas las encuestas"/>
    <DashboardCard title="Gestión EPP" icon={<Icon name="helmet" size={27}/>} tone="amber" stats={[{label:'En proceso',value:'0'},{label:'Asignados',value:'0'}]} detailTitle={<><Icon name="clock" size={14}/> Recordatorio</>} detail="0 EPP requieren renovación próximamente" link="Gestionar EPP"/>
    <DashboardCard title="Buzón SST" icon={<Icon name="inbox" size={27}/>} stats={[{label:'Pendientes',value:'0'},{label:'Procesados',value:'0'}]} detailTitle="Por tipo:" detail="Inspecciones　0　　Consultas　0" link="Ver buzón completo"/>
    <DashboardCard title="Descanso Médico" icon={<Icon name="medical" size={27}/>} tone="rose" stats={[{label:'Solicitudes activas',value:'0'},{label:'Total este año',value:'0',tone:'blue'}]} detailTitle={<><Icon name="exclamation-circle" size={14}/> Activo ahora</>} detail="Sin descansos médicos activos" link="Ver descansos médicos"/>
    <DashboardCard title="Brigadas" icon={<Icon name="people" size={27}/>} tone="amber" stats={[{label:'Mi brigada',value:'(Sin brigada)'}]} detailTitle="0 miembros　 ·  (Sin rol)" detail="Mi rol　　Última actualización: —" link="Ver organigrama" secondDetail/>
  </section></main></div>;
}
function GissatLogin({ notify }) {
  const [visible, setVisible] = useState(false);
  return <main className="gissat-login"><header className="login-hero"><span>Bienvenido a</span><strong>GISSAT</strong><small>Gestión Integral de Seguridad y Salud en el Trabajo</small></header><section className="login-card"><img className="login-logo" src="/images/gissat/logo-main.png" alt="GISSAT"/><h1>Inicia sesión</h1><p className="login-subtitle">Por favor, ingrese los datos solicitados</p><form onSubmit={(event) => {event.preventDefault(); notify('Esta réplica es una vista de demostración y no valida credenciales.');}}><label className="login-field"><span>Usuario</span><input name="usuario" autoComplete="username" aria-label="Usuario" required/></label><label className="login-field"><span>Contraseña</span><input name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" aria-label="Contraseña" required/><button type="button" className="password-toggle" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={()=>setVisible(!visible)}><Icon name={visible ? 'eye' : 'eye-slash'} size={18}/></button></label><p className="recaptcha-copy">Este sitio esta protegido por reCAPTCHA. Aplican la <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Política de Privacidad</a> de Google y los <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">Términos del Servicio</a>.</p><button className="login-submit" type="submit">Iniciar sesión</button></form><a className="forgot-password" href="#gissat-login" onClick={(event)=>{event.preventDefault();notify('Recuperación de contraseña no disponible en esta réplica.');}}>Olvidé mi contraseña</a><a className="demo-dashboard" href="#gissat">Abrir tablero de demostración</a></section><button className="gissat-chat" onClick={()=>notify('Asistente virtual GISSAT')} aria-label="Abrir chat"><img src="/images/gissat/chatbot.png" alt=""/></button></main>;
}
function ShortcutEditor({ selected, setSelected, onClose, onSave }) {
  const toggle = (option) => setSelected((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
  return <div className="shortcut-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="shortcut-modal" role="dialog" aria-modal="true" aria-labelledby="shortcut-title"><button className="shortcut-close" onClick={onClose} aria-label="Cerrar editor">×</button><h2 id="shortcut-title">Editar accesos directos</h2><div className="shortcut-options">{shortcutOptions.map((option) => <label className="shortcut-option" key={option}><input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)}/><span>{option}</span></label>)}</div><p className="shortcut-hint">{selected.length < 3 ? 'Debes elegir 3 accesos directos como mínimo' : `${selected.length} accesos directos seleccionados`}</p><footer className="shortcut-footer"><button className="shortcut-back" onClick={onClose}>←　Regresar</button><button className="shortcut-save" disabled={selected.length < 3} onClick={onSave}>Guardar cambios</button></footer></section></div>;
}
function Portal({ toggleApps, appsOpen, notify, selected, setSelected, onSave }) {
  return <main className="portal"><section className="portal-stage"><div className="welcome">¡Hola, Edgar!</div><Portrait/><button className="add-app" onClick={toggleApps}><span className="add-square">＋</span><span>Agregar más</span></button></section><div className="app-rail">{appBrands.map(([brand,slug],i)=><button className={`brand-mini brand-${slug}`} key={`${brand}-${i}`} onClick={()=>notify(`Acceso a ${brand}`)}>{brand}</button>)}</div>{appsOpen&&<ShortcutEditor selected={selected} setSelected={setSelected} onClose={toggleApps} onSave={onSave}/>}</main>;
}
export default function App() {
  const getView = () => location.hash === '#weconnect' ? 'portal' : location.hash === '#gissat-login' ? 'login' : 'gissat';
  const [view,setView]=useState(getView);
  const [menuOpen,setMenuOpen]=useState(false);
  const [appsOpen,setAppsOpen]=useState(false);
  const [selectedShortcuts,setSelectedShortcuts]=useState([]);
  const [notice,setNotice]=useState('');
  const isPortal=view==='portal';
  useEffect(() => {
    const update = () => { setView(getView()); window.scrollTo(0,0); };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => { document.title = isPortal ? 'We Connect SuperApp' : view === 'login' ? 'GISSAT - Login' : 'GISSAT - INICIO'; }, [isPortal,view]);
  function notify(message){setNotice(message);window.clearTimeout(window.noticeTimer);window.noticeTimer=window.setTimeout(()=>setNotice(''),2200);}
  return <div className={isPortal?'app portal-mode':'app'}>{view==='login'?<GissatLogin notify={notify}/>:<><Header portal={isPortal} onMenu={()=>setMenuOpen(!menuOpen)} notify={notify}/>{isPortal?<><Portal toggleApps={()=>setAppsOpen(!appsOpen)} appsOpen={appsOpen} notify={notify} selected={selectedShortcuts} setSelected={setSelectedShortcuts} onSave={()=>{setAppsOpen(false);notify('Accesos directos actualizados')}}/>{menuOpen&&<div className="portal-menu">Inicio　 ·　 Aplicaciones　 ·　 Mi perfil</div>}</>:<Dashboard menuOpen={menuOpen}/>}</>}{notice&&<div className="notice">{notice}</div>}</div>;
}
