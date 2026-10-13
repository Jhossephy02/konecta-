# Validación de la entrega

Fecha de revisión: 12 de octubre de 2026 (hora de Bogotá).

- Compilación de producción de React/Vite: correcta.
- Pruebas de integración de la API: 44 aprobadas. Incluyen autenticación, diez perfiles, aislamiento entre empresas, alta por Superadmin, marca, delegación y retirada de permisos, persistencia, registros, archivos privados, boletas, faltas, justificaciones, asignaciones de cursos, historial, evaluaciones, votos y cierre de sesión.
- Revisión manual en navegador: inicio, navegación, solicitud de ausencia, curso completo, evaluación aprobada y vista imprimible de constancia. También se verificó una tardanza ficticia, su justificación y revisión por RR. HH., los perfiles administrativos, alta de una empresa con logo, detección del azul #1465D9, tema corporativo, publicación de un curso asignado a colaborador/supervisor y redirección a Empresa Horizonte desde el login común.
- Aprovisionamiento de un Superadmin real probado con demostración deshabilitada en una base temporal sin clientes de ejemplo.
- Revisión móvil a 390 × 844: menú y navegación utilizables, sin desbordamiento horizontal observado.
- Consola del navegador local: sin errores registrados durante la revisión final.
- Experiencia de capacitación en 768 × 1024 y 1024 × 768: sin desbordamiento lateral observado; texto efectivo de 18 px y 20 px en modo lectura; botón de avance de 48 px y respuestas de evaluación de 58 px. Se completaron las tres lecciones de bienvenida y la evaluación con 100%. El cambio de trabajador mostró el acceso común y, después de recargar, mantuvo cerrada la sesión. Revisión realizada mediante tamaños emulados, pendiente del dispositivo físico.

Los datos del portal son ejemplos locales. La aplicación no sincroniza cuentas ni registros con las tres plataformas de referencia. Las restricciones de inspección y las diferencias pendientes están en INSPECCION.md y REQUISITOS.md.

Docker queda preparado, pero no fue ejecutado en esta revisión. La constancia se comprobó en su vista imprimible; no se verificó una impresora ni un archivo PDF exportado. La entrega no constituye una auditoría de seguridad ni una validación de reglas laborales de producción.
