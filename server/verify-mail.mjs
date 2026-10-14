import {mailer} from './mail.mjs';
try{await mailer().verify();console.log('SMTP: conexión y autenticación correctas. Todavía debes comprobar que un código llegue a una bandeja real.');}catch{console.error('SMTP no disponible o configuración rechazada. Revisa MAIL_MODE, host, puerto, usuario, contraseña y remitente en el archivo privado .env. No se muestran credenciales.');process.exitCode=1;}
