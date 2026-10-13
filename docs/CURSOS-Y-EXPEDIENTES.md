# Cursos y expedientes del trabajador

Actualización local del 13 de octubre de 2026. Cada nuevo ingreso abre Inicio. El superadmin sin contexto empresarial ve las empresas y sus logos cargados; las empresas sin logo mantienen sus iniciales. Su menú de plataforma se limita a Inicio, Empresas y Ayuda. Al administrar una empresa puede volver al contexto de plataforma. Un trabajador no ve los accesos de administración reservados por permisos.

## Crear cursos

En Mi aprendizaje, un perfil con permiso para crear cursos abre Crear curso. La categoría se elige en un selector. Seleccionar todos marca los perfiles de la empresa; Quitar selección los desmarca. La asignación también se puede cambiar desde Administrar cursos sin borrar el historial.

La miniatura admite PNG, JPG o WebP hasta 2 MB. Cada lección admite hasta tres materiales: imágenes hasta 2 MB, videos MP4 o WebM hasta 50 MB y PDF, DOCX, PPT o PPTX hasta 20 MB. Imágenes y videos aparecen dentro de la lección. Las presentaciones y documentos se descargan para abrirlos con una aplicación compatible; no se implementó conversión automática de PowerPoint a diapositivas web. El catálogo muestra la miniatura cargada.

El servidor comprueba permisos, empresa, límites y firmas básicas del formato. Los materiales se guardan como BLOB en SQLite y quedan incluidos en el respaldo. El límite actual es 512 MB de materiales por empresa, incluidos borradores cargados. No hay biblioteca de reutilización, limpieza automática de borradores ni análisis antivirus implementado. No se debe confundir una firma de formato con una inspección completa del archivo.

## Importar preguntas

La plantilla editable está en `public/templates/evaluacion.docx`; el ejemplo exportado está en `public/templates/evaluacion.pdf`. El formulario permite descargarlos e importar Word DOCX o PDF con texto seleccionable, de hasta 5 MB y 30 páginas de PDF. No admite Word DOC, documentos cifrados, escaneos ni OCR. Cada evaluación tiene de una a diez preguntas con dos a seis opciones y una respuesta correcta.

Conserva estas etiquetas y cambia su contenido:

```text
PREGUNTA: ¿Dónde revisas tus cursos?
A) En Mi aprendizaje
B) En Cumpleaños
C) En una cuenta ajena
RESPUESTA: A
```

La importación reemplaza las preguntas del borrador y muestra sus opciones y respuestas correctas para revisión. El curso se guarda cuando se pulsa Publicar curso. Las respuestas correctas se almacenan en el servidor y se eliminan de la respuesta del catálogo del trabajador. La evaluación se califica en el servidor.

La lectura del documento se ejecuta en un proceso separado con límite de tiempo de doce segundos, heap de 192 MB y dos importaciones simultáneas. Se limita la expansión de archivos DOCX a 32 MB y mil entradas. El procesamiento usa las APIs documentadas de [Mammoth](https://github.com/mwilliamson/mammoth.js) y [pdf-parse](https://www.npmjs.com/package/pdf-parse). La configuración de pnpm fija argparse 2.0.1 para la dependencia de CLI de Mammoth y elimina la dependencia vulnerable sprintf-js, según el [aviso GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). Se verificaron tanto la importación como la ayuda de esa CLI tras el cambio.

## Alta y cumpleaños

Crear colaborador permite registrar fecha de nacimiento e ingreso, celular, dirección y contacto de emergencia junto al cargo, área, sede, perfil y responsable. El calendario de cumpleaños se alimenta automáticamente del mes y día de la fecha de nacimiento. El directorio no expone el año de nacimiento ni los contactos privados. La cuenta puede completar su cumpleaños desde Mi perfil. El correo de recuperación sigue requiriendo verificación por su propietario.

## Documentos laborales

Documentos laborales contiene contratos, entregas de equipos, constancias, políticas internas y otros archivos PDF privados, hasta 10 MB por archivo. El dueño y Recursos Humanos seleccionan al destinatario y entregan el documento. El trabajador descarga únicamente sus archivos y puede confirmar recepción; esa confirmación registra fecha y no firma un contrato. Un supervisor o gerente no obtiene acceso a contratos ajenos por su rango. La base conserva los registros antiguos del módulo de solicitudes; no se transforman automáticamente en documentos entregados.

## Validación

Compilación correcta y 69 pruebas automáticas aprobadas, incluidas importación real de ambas plantillas, ausencia de claves de respuesta en el catálogo, asignación por rol, bloqueo entre empresas, descarga parcial de MP4, contratos privados, recepción por el destinatario y cumpleaños al dar de alta. La auditoría de dependencias de producción no informó vulnerabilidades conocidas al ejecutarse.

En el navegador de Codex se comprobó el ingreso desde una URL de Empresa y permisos hacia Inicio, el menú del trabajador sin enlaces administrativos, el Inicio del superadmin, los logos cargados, Seleccionar todos y la importación Word desde el formulario. La plantilla Word se renderizó con Aspose para revisión visual porque LibreOffice no está instalado; las marcas de evaluación aparecen únicamente en las imágenes internas de revisión, no en la plantilla DOCX ni en el PDF generado con ReportLab. La prueba de tablet física con Brave y las comprobaciones en el futuro servidor siguen pendientes.

Curso local de demostración: en Paraíso se publicó «Conoce tu portal · Demostración», con miniatura, video de presentación y dos preguntas importadas desde Word. Se comprobó con TEST-PARAISO-TRABAJADOR la redirección a Paraíso/Inicio, la miniatura y la carga de video de 60 segundos sin error en el navegador. No se completó ni evaluó el curso con esa cuenta. También se comprobó ausencia de desbordamiento de página a 390 px. El botón de completar quedó en el flujo normal después del material para no tapar texto en tablet.
