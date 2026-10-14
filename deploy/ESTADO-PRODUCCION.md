# Franquisia: estado de preparación para producción

Verificado localmente el 14 de octubre de 2026.

- 74 pruebas automatizadas aprobadas: permisos, empresas, sesiones, CSRF, recuperación, archivos y restauración de respaldos.
- Compilación correcta y auditoría de dependencias de producción sin vulnerabilidades conocidas.
- Paquete mínimo del servidor iniciado en NODE_ENV=production con dominio y secreto de prueba: exige proxy HTTPS, bloquea archivos privados y sirve el visor PDF.
- Dockerfile incluye los módulos compartidos del servidor. Compose requiere dominio y secreto, desactiva demostración y comprueba salud mediante HTTP con cabeceras del proxy.
- No se construyó una imagen Docker: Docker no está instalado en este equipo.

## Bloqueos antes de abrir a clientes

1. Configurar PUBLIC_ORIGIN, SESSION_SECRET persistente y SMTP en el .env privado del servidor. Usar deploy/grupoamayo.env.example como referencia.
2. Ejecutar `pnpm mail:verify`; después verificar recepción real de un código de alta y de recuperación.
3. Usar una base de producción independiente. La base local contiene cuentas, salarios y solicitudes ficticias para ventas. No publicarla como información real.
4. Aprovisionar un superadmin real con el comando existente `pnpm provision-superadmin` y completar su configuración de seguridad.
5. Ejecutar `pnpm build`, `pnpm test`, `pnpm audit --prod` y `pnpm check:production` con la configuración y la base definitivas.
6. En aaPanel verificar HTTPS, proxy, inicio automático, recuperación tras reinicio, eventos en tiempo real, subida/descarga y aislamiento entre dos empresas reales de prueba.
7. Configurar un respaldo periódico externo y probar su restauración en otro directorio antes de la apertura.

`pnpm check:production` solo inspecciona: no borra cuentas ni cambia la base.
`pnpm mail:verify` valida SMTP sin enviar mensajes y sin mostrar secretos.

La muestra local de Paraíso se conserva para presentaciones. No se ha desplegado en grupoamayo.com ni se ha probado correo real.
