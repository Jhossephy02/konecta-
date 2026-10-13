# Despliegue preparado para grupoamayo.com

Esta configuración todavía no se ha instalado ni validado en tu servidor. No sustituye la revisión del VPS, certificado, permisos de archivos y copias externas. Mantener una sola instancia Node: SQLite y los eventos SSE de esta versión no ofrecen sincronización entre procesos.

1. Instalar Node 24, Nginx y HTTPS en aaPanel. Crear usuario de sistema `conecta` sin acceso interactivo. Directorio de aplicación `/www/server/conecta`, datos `/www/server/conecta-data`, configuración `/www/server/conecta-config`, respaldos `/www/backup/conecta`. Dar al usuario acceso a datos y respaldos; configuración privada 600. No publicar esos directorios como raíz web.
2. Subir el código, instalar las dependencias del lockfile con `pnpm install --frozen-lockfile` y ejecutar `pnpm build`. Conservar la aplicación como solo lectura para el servicio.
3. Copiar `deploy/grupoamayo.env.example` a `/www/server/conecta-config/production.env`; generar y reemplazar SESSION_SECRET. No usar el texto de ejemplo. Conservar esta clave de forma privada: perderla impide descifrar MFA. Iniciar con base vacía; no copiar los usuarios de demostración locales.
4. Crear el superadmin con `node --env-file=/www/server/conecta-config/production.env server/provision.mjs`, proporcionando CONECTA_SUPERADMIN_EMAIL y CONECTA_SUPERADMIN_PASSWORD mediante un entorno privado temporal. Retirarlas después; nunca incluirlas en el código. Primer acceso exige cambiar contraseña; superadmin, administración, RR. HH., planillas y SST requieren autenticador en producción. Guardar los códigos de recuperación.
5. Ajustar la ruta real de Node en `deploy/conecta.service`, instalar el servicio y arrancarlo. Usar una instancia; no combinar con PM2 cluster ni un segundo gestor de procesos. Bloquear el puerto 3001 desde Internet; Node escucha únicamente en loopback.
6. Configurar el sitio HTTPS de grupoamayo.com con las locations de `deploy/nginx-locations.conf`, validar `nginx -t` y recargar. aaPanel gestiona el certificado y la redirección HTTP → HTTPS. Revisar cualquier sitio existente antes de sustituir su configuración. No cachear respuestas API ni eventos. Nginx sobrescribe las cabeceras de proxy para impedir suplantación.
7. Ejecutar la batería local `node --test tests/*.test.mjs`. En el servidor comprobar inicio de sesión real, cookies Secure, MFA, alta de empresa, límites entre empresas, boleta privada, carga de archivos y dos tablets recibiendo cambios sin recarga. Reiniciar el servicio y comprobar persistencia y reconexión. Medir carga en el VPS antes de fijar capacidad comercial.

## Respaldo y recuperación

Ejecutar diariamente `node --env-file=/www/server/conecta-config/production.env server/backup.mjs` como usuario conecta. El respaldo usa la API SQLite y comprueba integridad. Conservar también SESSION_SECRET y configuración, cifrados, fuera del servidor. Automatizarlo en aaPanel con la ruta absoluta real de Node; supervisar errores. No se borran copias automáticamente: acordar retención y vigilar espacio.

Para restaurar: detener el servicio, preservar los datos actuales, restaurar el archivo SQLite y la misma clave secreta, ajustar propietario/permisos y reiniciar. No reemplazar una base abierta ni mezclar WAL/SHM antiguos. Ensayar este proceso en una carpeta aislada antes del lanzamiento. Los adjuntos y logos están dentro de SQLite.

La recuperación de contraseña se solicita al administrador: verifica identidad y entrega un token de 15 minutos por canal privado. No elimina MFA. Si se pierde el autenticador, utilizar un código de recuperación de un solo uso. No hay recuperación automática por correo configurada.

## Alcance de tiempo real y seguridad

Eventos SSE notifican cambios confirmados a sesiones de la misma empresa; cada cliente consulta nuevamente los datos según sus permisos. El superadmin puede recibir avisos globales. Los eventos no transportan boletas, contraseñas ni contenido personal. Se reconecta tras un corte; sin conexión no se confirman escrituras. Hay un máximo de seis conexiones por cuenta. No se ofrece edición colaborativa de textos; los registros detectan versiones obsoletas con respuesta 409.

Sesiones de ocho horas y vencimiento por inactividad de peticiones de 30 minutos en producción, CSRF ligado a sesión, límites de intentos persistentes, permisos comprobados por servidor, secretos MFA cifrados, auditoría, CSP y cabeceras de seguridad. Una actualización automática puede generar actividad de sesión: cerrar sesión al terminar en la tablet compartida. El análisis de dependencias y las pruebas automatizadas no equivalen a una certificación ni a una auditoría externa de penetración.
