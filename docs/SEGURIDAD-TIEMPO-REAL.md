# Revisión local · 13 de octubre de 2026

Implementación React y Node 24, SQLite, un solo proceso. No se ha desplegado en grupoamayo.com ni se ha accedido a aaPanel. La demostración local sigue habilitada para continuar trabajando.

## Cambios

- CSRF vinculado a la sesión, validación de origen y bloqueo de solicitudes cross-site.
- Cookies HttpOnly/SameSite Strict; Secure y prefijo __Host en producción. Validación de dominio y HTTPS detrás de proxy de confianza.
- Scrypt asíncrono para inicio de sesión y límites de intentos persistentes por cuenta e IP.
- Cambio obligatorio de contraseña inicial en producción; TOTP y códigos de recuperación de un uso. MFA obligatorio para superadmin, administración, RR. HH., planillas y SST. Secretos cifrados con AES-256-GCM.
- Recuperación administrada con token de 15 minutos, sin eliminar MFA. Cambio de contraseña revoca otras sesiones. Un token inválido devuelve un error controlado: se corrigió una promesa sin await que podía detener el servidor.
- Eventos SSE sin contenido sensible y aislados por empresa; reconexión y revisión de sesión. Cursos, contenidos, solicitudes, equipos y boletas vuelven a consultar datos autorizados después de los avisos.
- Conflictos 409 en registros modificados desde otra sesión. Los borradores del formulario de permisos no se sustituyen automáticamente.
- CSP, bloqueo de rutas privadas, cabeceras de seguridad y límites de conexión/archivos.
- Respaldo SQLite consistente y verificación de integridad; prueba de restauración de registros y adjuntos con WAL activo.

## Evidencia

Resultado final: **59 pruebas aprobadas, cero fallos**, y compilación de producción correcta. La batería incluye diez roles, aislamiento entre empresas, jerarquía, boletas y adjuntos privados, evaluación en servidor, persistencia, CSRF, suplantación de origen, límites de intentos, contraseña inicial, MFA y recuperación. Las pruebas utilizan bases temporales; no alteran los datos del portal local.

La prueba de lectura de bootstrap con 24 clientes concurrentes ejecutó 720 consultas: cero errores, mediana 57 ms, percentil 95 de 66 ms y máximo 84 ms. Equipo local Windows, Node v24.19.0, datos de demostración pequeños. No incluye cientos de empleados, grandes adjuntos ni escrituras masivas, y no permite prometer capacidad en el VPS. Reporte: `artifacts/load-report.json`.

El análisis de dependencias no encontró vulnerabilidades publicadas en las dependencias analizadas (0 bajas, medias, altas o críticas). Reporte: `artifacts/dependency-audit.json`. No sustituye una auditoría externa.

Prueba visual: anuncio de demostración publicado en una pestaña y recibido automáticamente en otra, sin recarga. A 768×1024, ancho del documento 768 px, sin desbordamiento horizontal y estado «En tiempo real». Evidencia: `artifacts/tiempo-real-tablet.jpg`. Queda por validar el hardware y navegador de las tablets de la empresa.

## Pendiente antes de lanzamiento

Instalar el servicio en aaPanel, HTTPS real, permisos Linux, bloqueo de puertos, almacenamiento y respaldo externo cifrado, ensayo de recuperación en el VPS, supervisión del servicio y carga representativa. Las plantillas están en `deploy/` y el procedimiento en `PRODUCCION-AAPANEL.md`. No usar múltiples procesos: la difusión SSE todavía es local al proceso.

Los certificados de cursos no llevan firma digital verificable y las boletas se entregan como PDFs cargados por la empresa: el sistema no calcula nómina. No hay correo de recuperación automático configurado. Los avisos se reciben cuando la tablet está conectada; no se confirman escrituras sin conexión.

