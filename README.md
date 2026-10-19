# Franquisia

Portal empresarial en React con API Node.js y SQLite. Integra capacitación, personal, documentos laborales, boletas, solicitudes, comunicación y seguridad y salud. Cada empresa tiene su identidad, usuarios y permisos.

La instalación normal comienza sin cuentas, cursos, publicaciones ni empresas ficticias. No existe acceso de demostración en el formulario de ingreso. Las bases de datos, credenciales, archivos privados y respaldos no se publican en GitHub.

## Instalación local

Requiere Node.js 24 y pnpm 11.25.0.

```powershell
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm build
```

Si `.env` ya existe, conserva su configuración privada. El correo está deshabilitado inicialmente; configura un proveedor SMTP antes de usar recuperación por correo con trabajadores.

## Crear el superadmin real

Desde PowerShell, en la carpeta del proyecto:

```powershell
./scripts/create-superadmin.ps1
```

El script solicita nombre, correo y contraseña de al menos dieciséis caracteres, con entrada oculta y confirmación. No guarda la contraseña en un archivo ni la imprime. Muestra el ID generado; también se acepta el correo en el campo ID del acceso. No reemplaza cuentas existentes.

En un servidor también se puede ejecutar `server/provision.mjs` con las variables privadas `CONECTA_SUPERADMIN_EMAIL`, `CONECTA_SUPERADMIN_NAME` y `CONECTA_SUPERADMIN_PASSWORD`, y la ruta `DB_PATH` de producción. No incluir secretos en comandos compartidos ni en Git.

## Iniciar y administrar

```powershell
pnpm start
```

Abre http://127.0.0.1:3001. El superadmin integra empresas y sus administradores desde Inicio. Dentro de una empresa, el dueño crea trabajadores desde Mi equipo y configura sus permisos. Si la empresa ya existe sin administrador, el superadmin puede entrar a su espacio y crear una cuenta con perfil Administrador de empresa.

El acceso es común: cada cuenta se dirige a su empresa y abre Inicio. La vista global del superadmin contiene las empresas; al seleccionar una se muestran los módulos empresariales. El acceso a datos y operaciones se verifica en el servidor.

## Funciones

- Cursos con categorías, asignación por perfiles, miniaturas, videos, imágenes y materiales descargables.
- Plantillas Word/PDF e importación de preguntas y respuestas con revisión antes de publicar.
- Capacitación para tablet, texto ajustable, progreso personal y evaluaciones calificadas en el servidor.
- Personal, jerarquías, permisos por perfil y por cuenta, cumpleaños y contactos.
- Contratos y otros PDF privados por trabajador, con confirmación de recepción.
- Entrega privada de boletas PDF; los importes se preparan en el sistema de planillas de la empresa.
- Faltas, justificaciones, ausencias y solicitudes de seguridad y salud, según alcance y permisos.
- Anuncios, recursos, sesiones, checklist, tareas, auditoría y actualización mediante eventos del servidor.

## Verificación y respaldo

```powershell
pnpm test
pnpm backup
```

Las pruebas automáticas utilizan bases temporales. Sus datos ficticios solo se habilitan con `NODE_ENV=test` y `DEMO_MODE=true`; no aparecen en la instalación normal. Los respaldos se guardan en `backups` y deben copiarse fuera del servidor.

## Despliegue

La configuración para aaPanel está en `deploy` y [docs/PRODUCCION-AAPANEL.md](docs/PRODUCCION-AAPANEL.md). El repositorio incluye Dockerfile; requiere validar Docker y el entorno de servidor antes de desplegar. La limpieza de ejemplos no sustituye las pruebas de HTTPS, SMTP, recuperación, copias externas y dispositivos físicos.

Guías de uso: [cursos y expedientes](docs/CURSOS-Y-EXPEDIENTES.md), [tablets](docs/TABLETS.md), [acceso y recuperación](docs/ACCESO-Y-RECUPERACION.md) y [empresas](docs/EMPRESAS.md). Para una demostración aislada de Paraíso de las Alas está la [guía de presentación](docs/PRESENTACION-PARAISO.md). Los informes históricos describen validaciones anteriores; no son instrucciones para restaurar ejemplos en la instalación actual.

## Crédito de desarrollo

Desarrollado por **cosmiko025**. Véase [CREDITS.md](CREDITS.md).
