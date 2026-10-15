# Auditoría local de Franquisia — 15 de octubre de 2026

Resultado: 91 pruebas aprobadas, 0 fallos. Compilación de producción correcta. `pnpm audit --prod` no reportó vulnerabilidades conocidas en las dependencias instaladas.

## Escenarios comprobados

- Cinco empresas ficticias y 45 cuentas nuevas: cinco dueños y ocho perfiles de personal por empresa (colaborador, supervisor, gerente, subgerente, GDH, planillas, capacitador y SST).
- Inicio de sesión por identificador, dos sesiones independientes del mismo usuario y cierre de una sin cerrar la otra.
- Separación de empresas y bloqueo de acceso a documentos privados de otros usuarios.
- Capacitación vencida que se puede completar, evaluación en servidor y diploma automático al aprobar.
- Firma exclusiva del destinatario, consentimiento, versión del documento, rechazo de doble firma y PDF con el original y constancia de firma.
- Persistencia de cuentas, diplomas y firmas después de reiniciar el proceso.
- Revisión visual de la guía del capacitador en tablet de 768 × 1024 y celular de 390 × 760; apertura del editor, selección de categoría, fecha y cierre sin publicación.
- PDF con dos logos, título largo y fecha de aprobación en horario de Perú, renderizado e inspeccionado visualmente.

## Correcciones incluidas

1. La guía distingue permiso de crear cursos de los permisos de administración o asignación, y conduce al catálogo antes de señalar el editor.
2. Una actualización de la guía no se anuncia falsamente como un ascenso.
3. La máscara del tutorial conserva su alineación dentro de los formularios y evita el desbordamiento provocado por la animación del diálogo.
4. Los diplomas nuevos usan la fecha local de Perú. Los registros firmados anteriores conservan su versión.
5. Los logos se archivan por huella SHA-256 y se reutilizan entre diplomas, sin duplicar la imagen en cada registro nuevo.
6. El registro de firma incluye contexto de empresa y documento, referencia y una huella de evidencia; se comprueba su integridad antes de mostrarlo.
7. La carga de logos comprueba que la imagen se puede decodificar, además de su extensión y cabecera, con límite de 16 megapíxeles.
8. El diagnóstico distingue las cuentas reales sin correo corporativo de las muestras y reconoce los usuarios de demostración heredados.

## Alcance y pendientes

Las cuentas masivas se crearon en bases temporales aisladas y se retiraron al finalizar las pruebas. No se cargaron en el servidor ni se modificaron cuentas reales. La revisión visual usó dimensiones de navegador; no certifica dispositivos físicos ni redes distintas. Los cambios deben desplegarse y verificarse en el servidor. La entrega real de correo sigue requiriendo configuración SMTP y una prueba de recepción. Las pruebas de seguridad ejecutadas no constituyen una certificación externa ni garantizan ausencia de vulnerabilidades.

## Reproducción

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm audit --prod
```

Desarrollador: cosmiko025.
