# Inspección funcional — 12 de octubre de 2026

Referencias abiertas y autenticadas por el usuario en el navegador de Codex. Inspección de lectura: no se enviaron formularios, votos o evaluaciones en los sistemas originales. No se importaron contraseñas, boletas, datos de salud ni el historial personal de otros colaboradores. Los registros y contenidos de Conecta son ejemplos independientes.

## GISSAT

Referencia: https://www.sistemagissat.com/Home/Index

| Pantalla | Comportamiento observado | Implementación local |
|---|---|---|
| Inicio | Tarjetas de capacitaciones, encuestas, EPP, buzón, descanso y brigada; menú lateral y sesión | Inicio común con indicadores derivados de datos guardados |
| Mis capacitaciones | Pendiente / en curso / finalizado, búsqueda, filtros, tarjetas, detalle | Catálogo, búsqueda por título, categoría y estado; reproductor por lecciones |
| Detalle de capacitación finalizada | Módulos, contenido, resultado de examen, certificado y acta | Lecciones secuenciales, evaluación en servidor, constancia y acta imprimibles |
| Solicitud EPP | Alta y lista con equipo, color, talla, especificación, tipo y estado | Formulario, edición pendiente, seguimiento y adjuntos |
| Entregas EPP | Matriz con descripción, frecuencia, responsable, estado y acciones | Registro de recepción; la asignación real y renovación automática quedan pendientes |
| Seguimiento correctivo | Lista, filtros, agregar, fechas, tipo, ubicación y estado | Registro de hallazgo, responsable, fecha compromiso, edición y resolución |
| Buzón SST | Registro, descripción/consulta, lugar, fecha y hora | Formulario y seguimiento con adjuntos |
| Descanso médico | Fechas, centro de salud, diagnóstico, días y estado | Registro de período y seguimiento; no se copian diagnósticos reales |
| Brigadas | Organigrama por ubicación y búsqueda | Solicitud de participación; organigrama jerárquico no reproducido todavía |
| IPER C | El usuario recibe «Actualmente Ud. No tiene IPER C activo» | Registro local de peligros y controles; no se verificó la matriz de la referencia |
| Elecciones / participación / citas | Submenús: Participante; Participación, Consulta y Cargo entrega; Mis citas | Candidaturas, voto único local, consultas y solicitudes de cita |
| Resultados / gestante / homologación | Entradas del menú sin flujo interno visible en esta cuenta | Formularios locales independientes; pendientes de contraste |

Las tablas originales también muestran paginación y cantidades por página. La aplicación local incorpora búsqueda, filtros de fecha y estado, ordenación y paginación.

## WeConnect SuperApp

Referencia: https://weconnectsuperapp.pe/home

| Área | Observado | Implementación local |
|---|---|---|
| Inicio | Saludo, avatar, accesos y editor «Agregar más» | Inicio común y accesos persistentes, entre 3 y 8 |
| Perfil | Información personal, contacto de emergencia, experiencia, estudios, certificados e idiomas | Perfil propio editable y formulario complementario |
| Ausencias | Tipos de ausencia, filtros, estados, fechas y duración | Solicitud, edición/cancelación pendiente, revisión por administrador |
| Registro vacacional | Saldo, rango de fechas, total de días y confirmación | Rango de fechas validado y saldo de ejemplo; no replica el motor laboral de la empresa |
| Mi equipo | Lista de ausencias, saldo, calendario, filtros y descarga | Lista/calendario de registros autorizados, saldo local y exportación; directorio adicional |
| Documentos laborales | Filtro por tipo, lista de boletas y acciones de consulta/descarga | Solicitudes de documentos y adjuntos protegidos descargables; no genera boletas de pago |
| Talento y Learning | Desempeño/objetivos; avance de escuela, realizados/por realizar, acceso a aprendizaje | Objetivos locales y progreso de cursos; no integra evaluaciones reales de desempeño |
| Cumpleaños | Hoy, próximos y agrupación por mes | Vista mensual basada en cumpleaños que cada usuario registra |

Los saldos y tipos de licencia de la referencia dependen de reglas internas. No se consideran reglas legales universales. El cálculo de ejemplo usa días calendario y un saldo de ejemplo de 15 días.

## WeConnect 2.0 Aprendizaje — Cursalab

Referencia identificada en las pestañas del usuario: https://inretail.cursalab.io/anuncios

| Área | Observado | Implementación local |
|---|---|---|
| Anuncios | Carrusel con imágenes, texto y enlaces | Publicaciones de texto administrables y confirmación de lectura |
| Cursos | Escuelas, cursos, temas realizados, porcentajes y continuar | Categorías, lecciones y progreso persistente; creación de nuevos cursos por administrador |
| Sesiones | Hoy / próximas / historial; live, presencial y síncrono; sin sesiones asignadas | Publicación de sesiones, confirmación y calendario ICS; no hay integración con videoconferencia |
| Progreso | Asignados, pendientes, diplomas y avance por escuela | Indicadores y reportes de cursos; todos los cursos locales son visibles para todas las cuentas |
| Certificados | Diplomas, registro de capacitación, emisión, vista y descarga | Constancia y acta imprimibles; sin firma digital ni validez oficial |
| Tareas | Pendientes/terminadas, escuela y búsqueda; sin tareas asignadas | Publicación de tareas, fecha límite y entrega de respuesta escrita |
| Checklist | Pendientes/resultados y filtros; sin asignaciones | Listas administrables y confirmación completa de puntos |
| Videoteca | Sin resultados en esta cuenta | Enlaces de video publicados por administrador |
| Documentos y protocolos | Opción de menú y ruta de biblioteca | Biblioteca de texto y enlaces HTTPS |
| Otros menús | Cursos libres, historial, encuestas, notificaciones y ayuda | Filtros de cursos, actividad, valoración de encuesta y ayuda local; sin paridad verificada de esos flujos internos |

## Límite de fidelidad

La entrega es una implementación local funcional inspirada en las tres plataformas. No es una copia completa de sus servicios privados ni una integración con sus bases de datos. Los módulos sin datos asignados, sin permisos o sin formularios internos visibles se documentan como pendientes de contraste. No se inspeccionó la administración de las plataformas originales.

La réplica visual previa de GISSAT y del inicio WeConnect se conserva en `#gissat`, `#gissat-login` y `#weconnect`. Las funciones nuevas pertenecen al portal común.
