# Capacitación en tablets compartidas

La interfaz se adapta a tablet vertical y horizontal, con espacio de trabajo completo hasta 1366 px y menú lateral desplegable. En el catálogo hay dos columnas en tablet; el lector pasa a una columna en vertical y permite ocultar el índice. El modo lectura amplía la zona de contenido.

Los botones principales y controles táctiles tienen un mínimo de 48 px. Las opciones de evaluación se presentan como filas grandes que se pueden tocar completas. El texto de lecciones mide 18 px en tablet y 20 px en modo lectura, con mayor interlineado. El avance aparece mediante transiciones y las páginas, cursos, diálogos y resultados tienen animaciones cortas de opacidad y desplazamiento. Con `prefers-reduced-motion: reduce` se desactivan las animaciones y el desplazamiento suave.

## Uso de una tablet entre trabajadores

1. Cada persona entra con su propia cuenta de empresa.
2. Completa una lección y pulsa el botón de avance para guardar ese paso.
3. Envía la evaluación para registrar el resultado.
4. Al terminar, utiliza **Cambiar trabajador** o **Terminar y cambiar trabajador**.
5. Confirma **Cerrar sesión y dejar la tablet**. El servidor revoca la sesión y la interfaz limpia los datos de la persona anterior antes de mostrar el acceso común.

Las respuestas de una evaluación todavía no enviada no se guardan. Cerrar el navegador por sí solo no equivale a cerrar sesión. No se implementó modo kiosco, trabajo sin conexión ni bloqueo automático por inactividad; esas funciones requieren definir la política de las tablets de la empresa.

## Verificación

Se revisó el curso de bienvenida en 768 × 1024 y 1024 × 768: sin desbordamiento horizontal observado, botones de avance de 48 px, opciones de evaluación de 58 px, lecciones secuenciales, modo lectura, aprobación y diálogo para cambio de trabajador. Estas pruebas emulan tamaños de pantalla en navegador; queda pendiente probar el modelo físico de tablet y su navegador.

## Mejoras de lectura y administración · 13 de octubre de 2026

El lector permite ajustar el texto de 18 a 24 px durante la sesión del curso. La evaluación conserva las selecciones al volver a las lecciones, resalta la opción elegida y muestra cuántas preguntas están respondidas; el envío se habilita al responder todas. Las respuestas sin enviar se mantienen únicamente en memoria y se pierden al salir del curso o cerrar sesión.

La administración conserva sus tablas en escritorio y permite desplazarlas dentro de su contenedor en pantallas pequeñas, con la primera columna fija. Los formularios se organizan en una columna en celular y los botones de los diálogos se distribuyen según el espacio disponible.

Validación local en el navegador de Codex: administración a 390 × 844 y 1440 × 900; curso a 768 × 1024 y evaluación a 1024 × 768, sin desbordamiento horizontal del documento observado. Se comprobó el ajuste a 20 px, el avance de tres lecciones y el bloqueo/habilitación del envío según las respuestas. No se envió esa evaluación de prueba. Sigue pendiente la validación en tablet física y Brave.
