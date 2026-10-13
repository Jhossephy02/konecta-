# Validación local inicial para paquete empresarial

Escenario acordado: cinco empresas, permisos predeterminados por rol y excepciones por cuenta administradas por el dueño. Navegador objetivo: Brave. No se ha solicitado acceso al servidor ni aaPanel para esta etapa.

## Permisos individuales

En Empresa y permisos, el dueño puede abrir «Permisos individuales» de cada trabajador y escoger Heredar, Permitir o Denegar. La prioridad es: rol predeterminado → configuración del rol dentro de la empresa → excepción de la cuenta. Las cuentas de dueño y superadmin conservan su autoridad y no son objetivos delegables de esta pantalla.

Se permite personalizar formación, publicación, seguimiento, boletas, auditoría y resolución de solicitudes visibles. Las excepciones no conceden administración de plataforma ni creación de credenciales. Una autorización de aprobación no amplía la visibilidad de los registros ni elimina la prohibición de autoaprobar. El acceso a boletas sí abarca las boletas de la empresa y se indica expresamente al dueño. Guardar un cambio revoca las sesiones del trabajador; al ingresar nuevamente recibe los permisos vigentes.

Batería automatizada: 67 pruebas aprobadas, cero fallos. Compilación de producción correcta. No se ha validado un contenedor Docker en esta etapa.

## Prueba de carga

Supuesto técnico de prueba, no límite contratado: 50 trabajadores por empresa, 250 en total y 50 clientes concurrentes, diez por empresa. No se conoce todavía el número real de usuarios por cliente.

1.000 operaciones en base temporal: 750 consultas y 250 actualizaciones de perfil. Cero errores. Se comprobó el contexto de empresa y un directorio de 50 personas en las 750 respuestas de lectura. Mediana 149 ms, percentil 95 de 212 ms, máximo 281 ms. Duración del tramo concurrente: 3.215 ms, Node v24.19.0 en Windows. No incluye tiempo de iniciar las 50 sesiones, grandes boletas, video simultáneo ni una auditoría completa de rendimiento. No permite prometer capacidad del VPS.

Repetir con 
ode scripts/load-five-companies.mjs`; el informe se guarda en `artifacts/load-five-companies.json`. El script usa base temporal y no toca las empresas del portal local.

## Correo y navegador

No se conserva la contraseña personal proporcionada en el chat. Para SMTP de Gmail se necesita una contraseña de aplicación o integración autorizada. Google documenta el requisito de verificación en dos pasos: https://support.google.com/accounts/answer/185833. El propietario de la cuenta debe crear y configurar el secreto de forma privada. `scripts/configure-gmail.ps1` permite introducirlo de forma oculta y guardarlo en `.env`, fuera de Git. No se envió ningún mensaje real usando esa contraseña personal.

Brave está instalado en la laptop. Su presencia no acredita una prueba de navegación en Brave. Los ensayos de interfaz deben indicar explícitamente el navegador utilizado; una simulación de viewport no reemplaza la prueba de teclado táctil, rendimiento, almacenamiento y reconexión en una tablet física.


Prueba visual del panel individual en el navegador integrado: viewports 768×1024 y 1024×768, sin desbordamiento horizontal. Brave no estaba expuesto en los navegadores controlables, por lo que queda pendiente la prueba directa en Brave y una tablet física.

