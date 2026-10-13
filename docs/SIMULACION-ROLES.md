# Simulación local por roles

Ejecutada el 13 de octubre de 2026: **133 comprobaciones, cero fallos** en una empresa separada, «Empresa Simulación · Cursos y RR. HH.», ruta `/conecta/simulacion-mv68q6ju/`. Los datos son ficticios. Se crearon cuentas de práctica con contraseñas aleatorias no publicadas; no son credenciales de producción.

Se crearon dos cursos originales: inducción y trabajo seguro, y atención y comunicación. Los diez perfiles completaron las dos lecciones de inducción y aprobaron su evaluación con 100 %, conservando progreso e historial. Planillas entregó nueve PDFs de boleta de octubre de 2026, marcados «SIMULACIÓN — SIN VALIDEZ LEGAL»; cada destinatario descargó y confirmó su propia boleta.

| Perfil | Resultado de justificaciones | Boletas |
|---|---|---|
| Colaborador | Presenta; no aprueba | Su boleta |
| Supervisor | Aprueba las de su equipo directo | Su boleta |
| Subgerente | Aprueba las de su cadena de equipo | Su boleta |
| Gerente | Aprueba las de su cadena de equipo | Su boleta |
| Dueño / Administrador | Aprueba las de su empresa | Entrega y consulta dentro de su empresa |
| RR. HH. | Aprueba las de su empresa | Su boleta |
| Planillas | No aprueba justificaciones | Entrega y consulta dentro de su empresa |
| Capacitador | No aprueba justificaciones; crea cursos | Su boleta |
| SST | No aprueba justificaciones laborales | Su boleta |
| Superadmin | Aprueba en la empresa seleccionada | Administración en el contexto seleccionado |

Se comprobó el bloqueo de autoaprobaciones, modificación de resoluciones finales, descarga de boleta ajena por jefes y acceso desde otra empresa. La nueva aprobación de jefes se limita a justificaciones; no amplía su acceso a módulos clínicos ni les permite resolver automáticamente otras solicitudes. Una justificación y sus adjuntos serán visibles a sus responsables: usar módulos médicos para documentación clínica privada.

No es una aprobación escalonada obligatoria: cualquiera de los responsables autorizados puede decidir y la primera resolución cierra la solicitud. Las boletas no requieren aprobación de todos los jefes: Planillas las entrega y el titular acusa recepción.

El script `node scripts/simulate-company.mjs` reproduce la simulación únicamente contra el servidor local con demostración habilitada. Cada ejecución crea otra empresa y datos nuevos; no borra ni sustituye empresas existentes. Informe detallado local: `artifacts/simulacion-roles.json` (excluido del repositorio).
