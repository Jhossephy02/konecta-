export const contentTypes = [
 {id:'anuncios',title:'Anuncios',icon:'bullhorn',description:'Novedades y comunicaciones del portal.',fields:[['title','Título'],['description','Contenido','textarea']]},
 {id:'sesiones',title:'Sesiones',icon:'video',description:'Sesiones en vivo, cursos presenciales y síncronos.',fields:[['title','Sesión'],['type','Modalidad','select','Live|Presencial|Síncrono'],['date','Fecha','date'],['time','Hora','time'],['description','Detalle','textarea'],['url','Enlace de la sesión (opcional)','url']]},
 {id:'tareas',title:'Tareas',icon:'tasks',description:'Actividades de aprendizaje y entregas.',fields:[['title','Actividad'],['date','Fecha límite','date'],['description','Instrucciones','textarea']]},
 {id:'checklist',title:'Checklist',icon:'check-square',description:'Revisa los pasos y registra tu cumplimiento.',fields:[['title','Lista de verificación'],['description','Instrucciones','textarea'],['items','Un punto de verificación por línea','textarea']]},
 {id:'biblioteca',title:'Documentos y protocolos',icon:'book-open',description:'Recursos y procedimientos para consultar.',fields:[['title','Título del recurso'],['type','Tipo','select','Documento|Protocolo|Guía'],['description','Contenido','textarea'],['url','Enlace al recurso (opcional)','url']]},
 {id:'videoteca',title:'Videoteca',icon:'play-circle',description:'Videos y recursos de formación.',fields:[['title','Título'],['description','Descripción','textarea'],['url','Enlace HTTPS del video','url']]},
 {id:'eleccion-voto',title:'Votación del CSST',icon:'vote-yea',description:'Procesos de elección y voto único por participante.',fields:[['title','Proceso electoral'],['description','Instrucciones','textarea'],['items','Una candidatura por línea','textarea'],['date','Fecha de cierre','date']]},
];
export const seedContent = [
 ['anuncios',{title:'Tres espacios. Una sola experiencia.',description:'Bienvenido a Conecta. Aquí puedes consultar seguridad y salud, registrar solicitudes y continuar tu aprendizaje. Este entorno contiene datos de ejemplo.'}],
 ['anuncios',{title:'Tu avance tiene un lugar',description:'Encuentra tus cursos en Mi aprendizaje. Al completar las lecciones y aprobar la evaluación podrás imprimir una constancia de demostración.'}],
 ['checklist',{title:'Antes de comenzar mi jornada',description:'Lista de ejemplo para conocer el flujo. Adáptala a los procedimientos aprobados de tu organización.',items:'Revisé las instrucciones de mi tarea\nIdentifiqué el canal para reportar condiciones inseguras\nConozco dónde consultar los procedimientos de mi área'}],
 ['biblioteca',{title:'Guía del portal Conecta',type:'Guía',description:'1. Entra al módulo que necesites.\n2. Crea tu solicitud y completa los datos.\n3. Consulta su estado en la lista.\n4. Abre Mi aprendizaje para continuar un curso.\n5. Revisa Resumen y reportes para exportar tus registros.',url:''}],
 ['tareas',{title:'Mi primera propuesta de mejora',date:'2026-12-31',description:'Escribe una propuesta concreta para mejorar tu experiencia en el portal. Describe la necesidad y el resultado esperado.'}],
];
