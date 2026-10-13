# Acceso por ID y recuperación por correo

El formulario inicial muestra ID, contraseña y «Olvidé mi contraseña». Los accesos anteriores por correo siguen siendo aceptados para evitar bloquear cuentas existentes. Una cuenta que ya tiene MFA activo conserva una segunda pantalla de comprobación; el autenticador no aparece en el formulario inicial ni se desactiva silenciosamente. En producción los perfiles sensibles conservan la política de MFA.

Administración puede crear al trabajador sin correo, con ID manual de 4–32 letras, números o guiones, o uno automático. El ID es único globalmente porque hay un inicio de sesión común para todas las empresas. Se muestran ID y contraseña inicial al completar el alta, y el ID queda disponible en el panel de personal. No se pueden asignar IDs de otras personas ni duplicados.

Después de entrar, el trabajador abre «Mi perfil → Tu correo y celular». Confirma la contraseña actual, escribe su correo personal y celular en formato internacional, y verifica el correo con el código recibido. El correo pendiente no se convierte en destino de recuperación hasta confirmarlo. El celular se almacena como contacto: no se envían SMS ni se considera verificado.

Desde «Olvidé mi contraseña», se solicita un código indicando el ID. La respuesta no revela si existe una cuenta o correo. El código vence en diez minutos, admite cinco intentos y se consume una sola vez. Se guarda con HMAC ligado al identificador del desafío, nunca en claro. La nueva contraseña debe tener al menos 16 caracteres. Al restablecerla se revocan las sesiones y los demás códigos de recuperación. MFA, si existe, se conserva. Sin correo verificado, Administración mantiene el mecanismo asistido de recuperación existente.

## Configurar el envío real

Variables privadas: `MAIL_MODE=smtp`, `SMTP_HOST`, `SMTP_PORT` (465 con TLS directo o 587 con STARTTLS obligatorio), `SMTP_USER`, `SMTP_PASSWORD` y `MAIL_FROM`. No introducir contraseñas SMTP en el chat ni en Git. Se conserva validación de certificado y TLS 1.2 como mínimo. El remitente y su dominio deben estar autorizados por el proveedor. Verificar SPF, DKIM, DMARC y entrega real antes de habilitarlo para trabajadores.

`MAIL_MODE=disabled` deja el envío deshabilitado y explica que falta configurar el correo. `MAIL_MODE=preview` solo funciona en desarrollo y guarda mensajes en la carpeta privada `data/mail-preview`, fuera de los archivos web y del repositorio. Contienen códigos temporales: no compartir la carpeta. No se muestran códigos en respuestas API, consola o interfaz. Producción rechaza preview al arrancar.

La entrega SMTP no se ha validado contra un proveedor real porque todavía no se han configurado sus credenciales. Las pruebas usan mensajes privados locales. Las solicitudes anónimas de recuperación responden sin esperar al proveedor para reducir diferencias de tiempo; si el proceso cae antes de completar el envío, la persona debe solicitar otro código. No hay cola persistente de correo en esta versión.

Referencias: [OWASP Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) y [Nodemailer SMTP](https://nodemailer.com/smtp).
