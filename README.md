# Conecta — portal React unificado

Aplicación local que reúne seguridad y salud, vida laboral y aprendizaje, inspirada en GISSAT, WeConnect SuperApp y WeConnect 2.0 Aprendizaje (Cursalab).

La aplicación incluye API Node.js y base SQLite: las solicitudes, archivos, cuentas, publicaciones y avances se conservan después de reiniciar. Es independiente de los sistemas originales y utiliza datos de ejemplo.

## Abrir en esta laptop

1. Haz doble clic en `iniciar-portal.cmd`.
2. Abre http://127.0.0.1:3001.
3. Selecciona una empresa y un perfil de demostración. Para gestionar empresas, elige **Superadmin de plataforma**.
4. Mantén abierta la ventana del servidor mientras utilizas el portal.

Ya hay dependencias instaladas en esta carpeta. También puedes compilar y ejecutar directamente:

```powershell
node node_modules/vite/bin/vite.js build
node --env-file-if-exists=.env server/index.mjs
```

Para detener el servidor, pulsa Ctrl+C en su ventana. Si ya está funcionando en el puerto 3001, utiliza esa instancia; no inicies otra en el mismo puerto.

## Instalar en otro equipo

Requisitos: Node.js 24 o posterior y pnpm 11.25.0. Con una instalación oficial de Node que incluya npm:

```powershell
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Desarrollo con cambios automáticos: abre dos terminales, ejecuta `pnpm api` en una y `pnpm dev` en la otra. Vite redirige `/api` al servidor local del puerto 3001.

## Qué puedes probar

- Inicio con indicadores y accesos personalizados.
- Capacitación en tablet vertical y horizontal: botones táctiles, animaciones suaves, modo lectura y cambio seguro de trabajador. Consulta [docs/TABLETS.md](docs/TABLETS.md).
- Módulos de SST, EPP, ausencias, documentos y objetivos: crear, consultar, filtrar, ordenar, paginar, editar pendientes y cancelar.
- Como administrador: revisar estados, crear cuentas y publicar cursos, anuncios, tareas, sesiones, checklist y recursos.
- Adjuntos desde el detalle de una solicitud: PDF, PNG, JPG o TXT, hasta 5 MB y cinco archivos por registro.
- Cursos: completa lecciones en orden, responde la evaluación y aprueba con 70% o más. La mejor nota se conserva.
- Constancia y acta: **Ver e imprimir**; usa Guardar como PDF en el diálogo de impresión del navegador.
- Publicaciones: confirmar lectura, entregar una tarea, completar checklist, participar en sesiones y descargar un calendario ICS.
- Votación local: una respuesta por cuenta y proceso; el administrador ve los totales. No es un sistema electoral oficial.
- Perfil propio y datos complementarios, cumpleaños, directorio, calendario de ausencias y saldo de ejemplo.
- Exportación CSV y respaldo consistente de la base.

La réplica visual anterior se conserva en `/#gissat`, `/#gissat-login` y `/#weconnect`. Los nuevos flujos están en el portal común.

## Cuentas locales

El modo de demostración permite probar nueve perfiles empresariales en dos empresas, además del Superadmin de plataforma. Para crear cuentas con acceso por correo y contraseña, entra como administrador de empresa y abre **Mi equipo → Crear colaborador**. El formulario genera una contraseña inicial que puedes entregar por un canal privado.

El Superadmin utiliza **Superadmin · Empresas → Integrar empresa** para registrar una empresa, su dirección, dueño y logo. Cada empresa tiene su espacio `/conecta/<direccion>/`. Todas las cuentas usan el mismo formulario de acceso y se ubican automáticamente en la empresa que les corresponde. El dueño gestiona identidad, personal y permisos de formación en **Empresa y permisos**. Los cursos propios se asignan por perfil y pueden retirarse conservando el historial.

La paleta se propone a partir de un logo PNG, JPG o WebP; puede ajustarse manualmente. La guía completa, los alcances de permisos y el alta de un Superadmin real están en [docs/EMPRESAS.md](docs/EMPRESAS.md).

Puedes copiar `.env.example` a `.env` y cambiar `DEMO_MODE=false` después de crear y comprobar un Superadmin real y una cuenta administradora de empresa. Así se deshabilitan los botones y el endpoint de demostración. Las cuentas de las plataformas originales no se utilizan aquí.

Las sesiones duran ocho horas y se revocan al cerrar sesión. Las contraseñas se almacenan con scrypt y sal. No hay recuperación por correo ni SSO empresarial implementados.

## Respaldo y recuperación

Haz doble clic en `respaldar-portal.cmd` o ejecuta:

```powershell
node server/backup.mjs
```

El respaldo consistente se guarda con fecha en `backups/`. La base activa está en `data/portal.sqlite`. Los archivos adjuntos también están dentro de la base, por lo que el respaldo los incluye.

Guarda el ZIP del código y una copia del respaldo fuera de esta laptop. Que la carpeta esté dentro de OneDrive no demuestra que la sincronización esté activa o completa.

Para restaurar:

1. Detén el servidor y conserva una copia de toda la carpeta `data` actual.
2. Mueve la carpeta `data` actual a una ubicación de respaldo, sin sobrescribirla.
3. Crea una carpeta `data` nueva y copia el respaldo elegido como `data/portal.sqlite`.
4. Inicia el portal y verifica registros, cursos y archivos.

No copies solamente la base activa mientras está escribiendo: utiliza el script de respaldo, que contempla el diario WAL de SQLite. El archivo de respaldo contiene los datos de las cuentas locales; consérvalo de forma privada.

## Pruebas

```powershell
node --test tests/api.test.mjs
```

Las pruebas usan una base temporal fuera del proyecto. Cubren autenticación, permisos, aislamiento entre cuentas, validación, archivos, evaluaciones, publicaciones, checklist, voto único, cursos nuevos y persistencia tras reiniciar. No alteran la base de uso local.

## Docker

Preparado para Docker Desktop con backend Linux, si está instalado y ejecutándose:

```powershell
docker compose up --build -d
```

Abre http://localhost:8080. La aplicación usa Node y SQLite en el contenedor, con volúmenes para datos y respaldos. El puerto se publica únicamente en la interfaz local.

```powershell
docker compose exec portal node server/backup.mjs
docker compose down
```

No se ha ejecutado ni validado Docker en esta entrega. El desarrollo y las pruebas se verificaron con Node en Windows. La configuración Nginx previa se conserva como referencia, pero ya no es el servidor del contenedor.

## Alcance y requisitos

La preparación para **grupoamayo.com en aaPanel**, HTTPS, segundo factor y respaldos está en [PRODUCCION-AAPANEL.md](PRODUCCION-AAPANEL.md). La configuración local conserva el modo demostración; producción debe iniciar con una base vacía y `DEMO_MODE=false`. Los cambios se sincronizan mediante SSE entre sesiones autorizadas de la empresa. Usar una sola instancia del servidor.

El informe de esta revisión está en [docs/SEGURIDAD-TIEMPO-REAL.md](docs/SEGURIDAD-TIEMPO-REAL.md). Para repetir la prueba de carga aislada: `node scripts/load-local.mjs`.

Lee `docs/INSPECCION.md` para ver cada función observada, su adaptación y los límites de acceso encontrados. `docs/REQUISITOS.md` contiene recursos oficiales consultados, decisiones técnicas y requisitos pendientes para un uso empresarial.

Esta entrega permite entregar boletas PDF preparadas por la empresa; no calcula nómina ni importes. No sincroniza con las plataformas originales, no firma certificados ni aplica automáticamente políticas laborales. Los módulos con permisos restringidos o sin asignaciones no pueden afirmarse como réplicas verificadas completas.

# konecta-

## Acceso y recuperación

El acceso inicial usa ID y contraseña. Administración puede crear trabajadores sin correo y entregarles un ID; cada persona registra y verifica su correo de recuperación desde Mi perfil. Configuración SMTP y límites del modo local: [docs/ACCESO-Y-RECUPERACION.md](docs/ACCESO-Y-RECUPERACION.md). Los correos locales de prueba no se envían realmente. Las cuentas que ya tenían MFA lo confirman en una pantalla posterior.

## Presentación comercial

Con el servidor iniciado, abre `/brand/video.html` para reproducir y descargar el anuncio de Conecta con voz femenina. La versión animada editable está en `/brand/anuncio.html`. Guion y detalle de archivos: [docs/ANUNCIO-COMERCIAL.md](docs/ANUNCIO-COMERCIAL.md). La empresa de práctica «El Reino de las Alas · Demostración» conserva los datos ficticios de la simulación; no se ejecutó la limpieza cancelada.

