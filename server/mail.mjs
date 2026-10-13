import nodemailer from 'nodemailer';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
export function mailer(env=process.env){
 const production=env.NODE_ENV==='production',mode=env.MAIL_MODE||'disabled';
 if(!['disabled','smtp','preview'].includes(mode)||production&&mode==='preview')throw Error('MAIL_MODE inválido: preview solo se permite localmente.');
 if(mode==='smtp'&&(!env.SMTP_HOST||!env.MAIL_FROM||!env.SMTP_USER||!env.SMTP_PASSWORD))throw Error('Configura SMTP_HOST, SMTP_USER, SMTP_PASSWORD y MAIL_FROM.');
 const port=Number(env.SMTP_PORT||465),transport=mode==='smtp'?nodemailer.createTransport({host:env.SMTP_HOST,port,secure:port===465,requireTLS:port!==465,auth:{user:env.SMTP_USER,pass:env.SMTP_PASSWORD},connectionTimeout:10000,socketTimeout:15000,tls:{minVersion:'TLSv1.2'}}):null;
 async function send(to,subject,text){if(mode==='disabled')throw Object.assign(Error('El envío de correo aún no está configurado. Contacta a Administración.'),{status:503});if(mode==='preview'){const dir=resolve(dirname(env.DB_PATH||'data/portal.sqlite'),'mail-preview');await mkdir(dir,{recursive:true,mode:0o700});await writeFile(join(dir,randomUUID()+'.json'),JSON.stringify({to,subject,text,created:new Date().toISOString()}),{mode:0o600});return;}await transport.sendMail({from:env.MAIL_FROM,to,subject,text});}
 return {mode,send};
}
