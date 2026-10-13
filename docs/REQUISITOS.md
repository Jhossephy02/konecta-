# Requisitos y decisiones técnicas

Investigación realizada el 12 de octubre de 2026 sobre documentación oficial, junto con la inspección de las tres plataformas. Estas elecciones corresponden a una aplicación local revisable; no existe una única combinación que sea la mejor para cualquier despliegue.

## Tecnología aplicada

| Recurso | Uso en este proyecto | Motivo y fuente |
|---|---|---|
| React 19.3.0 | Componentes, formularios, navegación y estado | Mantener datos derivados fuera del estado duplicado y compartir datos desde la raíz. [Gestión del estado](https://react.dev/learn/managing-state) |
| Vite 8.3.4 | Desarrollo y compilación de producción | Herramienta de construcción del proyecto React existente. [Guía oficial](https://vite.dev/guide/) |
| Node.js 24+ | API HTTP, sesiones y validación | Runtime ya disponible; reduce la infraestructura necesaria para probar el proyecto |
| SQLite incorporado a Node | Usuarios, registros, archivos, contenido y aprendizaje | Persistencia local con consultas parametrizadas. [Documentación](https://nodejs.org/api/sqlite.html) |
| Crypto de Node | Scrypt con sal por contraseña, tokens aleatorios y hash de tokens | Evitar contraseñas en texto y tokens almacenados directamente. [Documentación](https://nodejs.org/api/crypto.html) |
| WAI / WCAG 2.2 | Etiquetas, foco visible, teclado, diálogo nativo y diseño adaptable | Base de accesibilidad; no se afirma certificación de conformidad. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) y [diálogos modales](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) |
| OWASP ASVS | Referencia para controles de sesión, autorización, validación y archivos | Lista de referencia para futuras revisiones de seguridad. No equivale a una auditoría ASVS. [Proyecto oficial](https://owasp.org/projects/asvs) |
| Pruebas integradas de Node | Pruebas de integración contra una base temporal | Verificar permisos, aislamiento y flujos sin instalar otro runtime |

Se fijaron las versiones existentes en `package.json` y `pnpm-lock.yaml`. El portal nuevo utiliza Inter local con su licencia OFL incluida. Los recursos de las réplicas anteriores se conservan como referencia.

## Funciones implementadas

- Diez perfiles, incluido Superadmin; empresas con dueño, personal, jerarquías y permisos delegables de formación. Login común con ubicación automática en el espacio de la empresa. Acceso de demostración configurable.
- Sesiones HttpOnly, SameSite=Strict, caducidad y revocación al cerrar sesión; límite de intentos de acceso.
- Portal común con búsqueda, accesos personalizados, actividad y diseño adaptable.
- Solicitudes con formularios específicos, validación de opciones/fechas, filtros, ordenación, paginación, consulta, edición pendiente y cancelación. Administración resuelve estados.
- Archivos PDF, PNG, JPG y TXT de hasta 5 MB, cinco por registro. Validación básica de formato y descarga según propietario, perfil, equipo y empresa.
- Cursos con lecciones en orden, evaluación calculada en servidor, mejor nota, progreso persistente y constancias de ejemplo imprimibles.
- Cursos propios, preguntas, asignación por perfil, retirada/restauración e historial de lecciones e intentos. Permisos de creación y gestión delegables por el dueño.
- Logo propio y paleta propuesta automáticamente, con ajuste de color y contraste de botones.
- Entrega privada de boletas PDF, registro de recepción, faltas/tardanzas y justificaciones vinculadas con evidencias.
- Publicación de anuncios, sesiones, tareas, checklist, recursos y procesos de votación. Participación persistente y un voto por cuenta y proceso.
- Perfil y datos complementarios propios, directorio limitado, cumpleaños mensual, ausencias, calendario y saldo de ejemplo.
- Exportación CSV con neutralización de fórmulas y copias consistentes de SQLite.

## Requisitos antes de un uso empresarial

| Prioridad | Requisito pendiente | Motivo |
|---|---|---|
| Alta | Confirmar flujos no accesibles y obtener reglas aprobadas | IPERC no activo, módulos sin asignaciones y administración original no visible |
| Alta | Identidad empresarial, recuperación de acceso y MFA/SSO | El acceso local actual no está conectado al directorio de la empresa |
| Alta | HTTPS, cookie Secure y despliegue administrado | Esta entrega escucha en 127.0.0.1; el acceso de demostración se deshabilita antes de exponer datos reales |
| Alta | Validación empresarial de permisos por sede y responsables clínicos | Ya existe separación por empresa, diez perfiles y jerarquías explícitas. Debe validarse la matriz con cada cliente, especialmente el acceso de RR. HH. y SST a datos médicos |
| Alta | Reglas de ausencias, saldo, horarios, feriados, documentación y aprobación | El saldo y los días calendario actuales son ejemplos, sin motor de nómina |
| Alta | Política de respaldo externo y prueba periódica de restauración | Un respaldo guardado solamente en el mismo equipo no cubre pérdida de disco |
| Media | PostgreSQL y almacenamiento de objetos para múltiples servidores | SQLite es suficiente para revisión local; escalar requiere evaluar concurrencia, respaldo y operación. [Respaldo PostgreSQL](https://www.postgresql.org/docs/current/backup.html) |
| Media | Validación y versionado de contenido formativo por especialistas | El material incluido es original de demostración, no un programa oficial de SST |
| Media | Asignaciones individuales, intentos configurables y vencimientos | Los cursos propios ya se asignan por perfil dentro de cada empresa; faltan reglas individuales y fechas límite configurables |
| Media | SCORM/xAPI y multimedia interna si los cursos lo requieren | No se inspeccionaron paquetes ni reproductores originales no disponibles |
| Media | Firma de certificados y actas, cargos de recepción y trazabilidad | La impresión local actual no es firma electrónica ni constancia oficial |
| Media | Protección avanzada de archivos, retención y monitoreo | La validación de formato local no sustituye análisis antimalware ni políticas de almacenamiento |
| Media | Auditoría de accesibilidad y pruebas con usuarios | Las verificaciones realizadas son funcionales y visuales, no una certificación WCAG |
| Opcional | TypeScript para una siguiente fase de mantenimiento | React lo soporta, pero no es condición para React; la base existente es JavaScript. [Guía oficial](https://react.dev/learn/typescript) |

No se añadieron servicios de pago, correos automáticos ni conexiones a las cuentas empresariales. La implementación puede probarse sin esos servicios.
