export const industries=[
 {id:'general',label:'Servicios / otro rubro',icon:'building',learn:'graduation-cap',practice:'hand-pointer',welcome:'Tu equipo, conectado',action:'Conoce las herramientas para tu trabajo diario.'},
 {id:'restaurant',label:'Restaurantes y alimentos',icon:'utensils',learn:'concierge-bell',practice:'clipboard-list',welcome:'Un gran servicio empieza con tu equipo',action:'Prepárate para atender, coordinar pedidos y trabajar en equipo.'},
 {id:'hardware',label:'Ferretería y mejoramiento del hogar',icon:'tools',learn:'hard-hat',practice:'toolbox',welcome:'Construyamos un equipo preparado',action:'Aprende sobre atención, productos y trabajo seguro.'},
 {id:'fashion',label:'Ropa, moda y calzado',icon:'tshirt',learn:'tags',practice:'shopping-bag',welcome:'El estilo también está en cómo atendemos',action:'Prepárate para asesorar, organizar productos y atender a tus clientes.'},
 {id:'retail',label:'Comercio y supermercados',icon:'shopping-cart',learn:'store',practice:'barcode',welcome:'Cada atención cuenta',action:'Conoce tu operación, tus productos y tus herramientas de trabajo.'},
 {id:'logistics',label:'Transporte y logística',icon:'truck',learn:'route',practice:'boxes',welcome:'Un equipo que llega más lejos',action:'Prepárate para coordinar entregas y trabajar con seguridad.'},
 {id:'health',label:'Salud y bienestar',icon:'heartbeat',learn:'book-medical',practice:'clipboard-check',welcome:'Preparados para cuidar mejor',action:'Conoce los protocolos y las herramientas de tu organización.'},
 {id:'education',label:'Educación y formación',icon:'school',learn:'book-open',practice:'chalkboard-teacher',welcome:'Aprender nos hace crecer',action:'Explora tus recursos, capacitaciones y actividades.'},
 {id:'manufacturing',label:'Industria y manufactura',icon:'industry',learn:'cogs',practice:'hard-hat',welcome:'La calidad empieza en las personas',action:'Prepárate para seguir procedimientos y trabajar de forma segura.'},
 {id:'hospitality',label:'Hotelería y turismo',icon:'hotel',learn:'concierge-bell',practice:'suitcase',welcome:'Cada experiencia empieza contigo',action:'Conoce los recursos para recibir, atender y coordinar mejor.'}
];
export const industryTheme=id=>industries.find(item=>item.id===id)||industries[0];
