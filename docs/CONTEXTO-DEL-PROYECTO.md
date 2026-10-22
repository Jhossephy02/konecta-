# Contexto del proyecto Franquisia

Actualizado: 22 de octubre de 2026.

Este documento reúne el contexto acordado durante el desarrollo para que cualquier persona pueda continuar el proyecto sin depender del historial del chat. No incluye contraseñas, secretos, códigos de recuperación ni datos personales reales.

## Propósito

**Franquisia** es un portal empresarial multiempresa para centralizar capacitación, documentos laborales, solicitudes, comunicaciones y seguimiento de equipos. Su uso prioritario es en tablets de empresa para colaboradores, aunque la parte administrativa debe funcionar correctamente en computadora y celular.

El producto se presenta inicialmente con una empresa ficticia de muestra: **Paraíso de las Alas**. Los registros de esa demostración deben conservarse mientras se use para ventas o presentaciones; deben estar claramente identificados como muestras antes de cargar información real.

## Nombre, marca y autoría

- Nombre actual del software: **Franquisia**.
- Dominio de publicación: `https://franquicia.grupoamayo.com`.
- La interfaz evita asumir que un ID es necesariamente un DNI o RUC; el acceso dice simplemente **ID**.
- Los diplomas incorporan Franquisia y la empresa del colaborador.
- El crédito visible de desarrollo es: **Desarrollado por cosmiko025**.
- La identidad visual de cada empresa puede incluir su logo, paleta, industria y nombres personalizados.

## Capacidades implementadas

### Acceso y seguridad

- Inicio de sesión con ID y contraseña.
- Recuperación de acceso por correo personal verificado cuando SMTP esté configurado.
- Sesiones seguras, cierre de sesión y revocación de sesiones.
- CSRF, limitación de intentos de inicio de sesión, cabeceras de seguridad y validación de origen.
- Segundo factor TOTP disponible para cuentas que lo habiliten; no debe aparecer como requisito para las cuentas que no lo usen.
- Las contraseñas de demostración son temporales y no son adecuadas para una operación real.
- Las credenciales, secretos de sesión y ajustes SMTP no se almacenan en Git.

### Personas, jerarquía y permisos

Roles disponibles:

- Colaborador.
- Supervisor o jefe.
- Gerente.
- Subgerente.
- Recursos Humanos.
- Planillas.
- Capacitador.
- Responsable de SST.
- Administrador de empresa.
- Superadmin de plataforma.

Los permisos parten de un rol predeterminado y el dueño o administrador puede conceder o revocar permisos específicos. Cada usuario tiene una interfaz y acciones condicionadas por sus permisos. El aislamiento por empresa impide acceder a datos, documentos, adjuntos y contenidos de otra organización.

Cuando una persona cambia de rol o recibe nuevos permisos, la bienvenida y la guía práctica se actualizan para explicar las nuevas acciones disponibles.

### Capacitación

- Catálogo, creación, publicación y asignación de cursos por perfil.
- Lecciones, evaluaciones, progreso e historial por persona.
- Fechas límite y alertas de cursos vencidos o próximos a vencer.
- Materiales adjuntos: imágenes, video, PDF, Word y PowerPoint, con validación del archivo y límites de tamaño.
- Importación de preguntas desde plantilla Word/PDF.
- Miniaturas para cursos.
- Diplomas emitidos tras aprobar, con las dos marcas: Franquisia y empresa.
- Cursos de muestra de Paraíso de las Alas sobre inducción, higiene, servicio y EPP.

### Documentos y procesos laborales

- Boletas privadas por colaborador.
- Contratos, memorandos y documentos laborales entregados a un destinatario concreto.
- Vista previa PDF antes de descargar.
- Confirmación de recepción y firma electrónica manuscrita desde celular o tablet.
- PDF firmado inmutable, con evidencia de quién, cuándo y qué versión se firmó.
- Solicitudes, descansos, justificaciones y ausencias según la jerarquía autorizada.

### Operación empresarial

- Alta y administración de empresas desde Superadmin.
- Cambio explícito de contexto para Superadmin.
- Anuncios, sesiones, tareas, checklist, videoteca, biblioteca y votación de CSST.
- Directorio, equipo, reportes y exportación CSV cuando el rol lo permite.
- Cumpleaños a partir de la información registrada en el perfil laboral.
- Tiempo real para actualizaciones relevantes, con estado visible de conexión.

## Guía práctica y experiencia de usuario

La guía de bienvenida no solo describe pantallas: propone acciones reales que la persona debe completar. Sus pasos cambian de acuerdo con el rol, los permisos, los módulos habilitados y si existen cursos asignados.

Características actuales:

- Mensaje de bienvenida con opción de comenzar u omitir.
- Resaltado visual animado del objetivo de cada paso.
- Progreso de la guía y reanudación.
- Pasos separados para trabajador, supervisor, gerente, RR. HH., capacitador, administrador y Superadmin.
- Nueva guía cuando se recibe un ascenso o permisos adicionales.
- Respeto por la preferencia del sistema de reducir movimiento y por la opción individual de ocultar animaciones.

## Diseño para dispositivos

- Capacitación optimizada para tablets en orientación vertical y horizontal.
- Controles táctiles de al menos 48 px para botones, campos y respuestas.
- Menú lateral tipo cajón en tablet y celular.
- Barra superior fija en pantallas con contenido largo para no perder búsqueda, perfil y navegación.
- Menú móvil más estrecho para conservar contexto visual de la pantalla actual.
- Tablas con desplazamiento horizontal controlado y primera columna fija en pantallas pequeñas.
- Acciones de lección y formularios acomodados para uso táctil.
- Inicio de sesión móvil compacto para priorizar credenciales sobre el bloque visual de presentación.
- En Inicio, cada persona puede abrir **Ajustar mi vista** y elegir densidad compacta, normal o amplia; también puede activar o desactivar animaciones. Esta preferencia se guarda por cuenta, sin afectar a otras personas.

## Datos de muestra

La demostración debe permanecer disponible mientras se presente el producto, con la indicación de que no son datos reales.

Incluye o puede incluir:

- Empresa ficticia Paraíso de las Alas.
- Usuarios ficticios de varios roles.
- Cursos, capacitaciones, tareas, sesiones, documentos y boletas ficticias.
- Dos descansos médicos de muestra sin detalle clínico.
- Materiales de demostración PPT/PPTX, video y PDF ya existentes o creados con recursos propios del proyecto.

El script de ampliación es idempotente: no duplica información si se ejecuta más de una vez.

```bash
node --env-file=.env server/extend-paraiso-showcase.mjs --allow-demo-access
```

No ejecutar este script sobre una empresa real sin revisar previamente qué registros se crearán.

## Arquitectura técnica

- Frontend: React y Vite.
- Backend: Node.js con servidor HTTP propio.
- Persistencia: SQLite.
- Archivos: adjuntos almacenados y controlados por el servidor.
- Tiempo real: mecanismo de actualización aislado por empresa.
- Pruebas: `node --test tests/*.test.mjs`.
- Administrador de paquetes: pnpm 11.
- Requisito de Node: 24 o superior.

Repositorio Git:

```text
https://github.com/Jhossephy02/konecta-.git
```

Rama principal: `main`.

## Producción actual

Ruta de la aplicación en el servidor:

```text
/www/wwwroot/GA/DATAX/Franquisia
```

Servicio systemd:

```text
franquicia.service
```

El servidor se ejecuta en `127.0.0.1:3001` y aaPanel/Nginx realiza el proxy inverso HTTPS. La base SQLite y las copias de respaldo fueron movidas para permanecer dentro de la ruta de Franquisia:

```text
/www/wwwroot/GA/DATAX/Franquisia/data/portal.sqlite
/www/wwwroot/GA/DATAX/Franquisia/backups/
```

La configuración privada está en `.env`, con permisos restringidos. No debe copiarse al repositorio ni compartirse por chat.

## Actualización estándar del servidor

Ejecutar desde la terminal del servidor:

```bash
cd /www/wwwroot/GA/DATAX/Franquisia

export PATH="$HOME/.local/franquisia-tools/node_modules/node/bin:$HOME/.local/franquisia-tools/node_modules/.bin:$PATH"

pnpm backup &&
git pull --ff-only origin main &&
pnpm install --frozen-lockfile &&
pnpm test &&
pnpm build &&
sudo systemctl restart franquicia &&
sudo systemctl status franquicia --no-pager -l
```

El estado final esperado es `active (running)`.

## Últimos cambios publicados

| Commit | Cambio |
| --- | --- |
| `fab1d16` | Navegación táctil mejorada en páginas largas: barra superior fija y ajustes móviles. |
| `750884f` | Preferencias personales de densidad de vista y animaciones. |
| `6b553c3` | Guía práctica basada en rol y permisos. |
| `89e769f` | Cursos y material de presentación para Paraíso, con auditoría de carga. |
| `61f11d6` | Revisión de firma, recepción y diplomas ya firmados. |

## Validación reciente

En el último ciclo local se ejecutaron correctamente:

```bash
pnpm test
pnpm build
pnpm audit --prod
```

Resultado de pruebas: **94 aprobadas, 0 fallidas**. La auditoría informó que no había vulnerabilidades conocidas de dependencias de producción en ese momento.

## Pendientes antes de usar con personas reales

1. Configurar SMTP real y ejecutar la verificación de correo para recuperación de contraseña.
2. Reemplazar accesos de muestra por IDs y contraseñas iniciales únicos, con una política de contraseñas definida por la empresa.
3. Definir un proceso de eliminación o archivado de toda la información ficticia antes de cargar trabajadores reales.
4. Hacer respaldo probado de la base y de adjuntos, con restauración verificada.
5. Definir responsables de privacidad, retención documental y tratamiento de firmas electrónicas según las reglas de cada empresa y país.
6. Verificar monitoreo, espacio disponible, renovación de SSL y actualizaciones del servidor.
7. Ejecutar pruebas de aceptación desde Brave en las tablets reales que se usarán en operación.

## Documentos relacionados

- [Seguridad y tiempo real](SEGURIDAD-TIEMPO-REAL.md)
- [Acceso y recuperación](ACCESO-Y-RECUPERACION.md)
- [Cursos y expedientes](CURSOS-Y-EXPEDIENTES.md)
- [Presentación de Paraíso](PRESENTACION-PARAISO.md)
- [Simulación de roles](SIMULACION-ROLES.md)
- [Tablets](TABLETS.md)
- [Auditoría](AUDITORIA-2026-10-15.md)
- [Requisitos](REQUISITOS.md)

