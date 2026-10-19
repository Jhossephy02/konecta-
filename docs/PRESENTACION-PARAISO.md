# Datos para la presentación de Paraíso de las Alas

El paquete de presentación contiene datos ficticios para enseñar el portal. No representa jornadas, descansos médicos, documentos ni capacitaciones reales. Antes de operar con personal real, se debe retirar o reemplazar todo registro marcado como `MUESTRA`.

El comando siguiente amplía una instalación que ya tiene importado `showcase/paraiso-muestra.json.gz`. Es seguro repetirlo: conserva cuentas y registros existentes, y no duplica las cuatro formaciones, los descansos, las solicitudes ni las publicaciones.

```bash
node --env-file=.env server/extend-paraiso-showcase.mjs --allow-demo-access
```

Agrega cuatro formaciones de Paraíso con fecha límite, evaluación y diploma al aprobar: inducción operativa, manipulación higiénica de alimentos, experiencia de servicio y uso seguro de EPP. También agrega dos descansos médicos ficticios, una ausencia, una solicitud de EPP, un anuncio, una sesión y una tarea.

El script exige que ya existan en Paraíso los tres tipos de material del paquete: una presentación PPT/PPTX, un video y un documento PDF/DOCX. Cada uno queda adjunto a una lección para poder abrir la capacitación y mostrar la carga y el consumo de materiales. El video se reproduce dentro de la lección; PPT, Word y PDF se descargan para abrirse en una aplicación compatible. Los PDF laborales tienen vista previa con el botón de ojo.

## Auditoría de carga

La prueba automatizada de materiales carga un PNG y un MP4 válidos, verifica reproducción parcial del video, controla el acceso por rol y empresa, importa las preguntas desde Word y PDF, y entrega un PDF laboral con vista previa, fecha límite y firma requerida. La carga rechaza archivos que no corresponden a la extensión declarada.

Ejecuta localmente:

```bash
pnpm test
```

En una presentación, usa una cuenta de capacitador para abrir **Mi aprendizaje**, selecciona una formación de muestra y muestra sus materiales. Para mostrar un PDF privado, entra con el trabajador destinatario y abre **Documentos laborales**; el icono de ojo abre la vista previa sin descargarlo.
