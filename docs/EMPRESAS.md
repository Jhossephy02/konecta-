# Conecta para empresas

## Jerarquía de administración

El **Superadmin de plataforma** registra empresas, crea su primer dueño, suspende o reactiva empresas y puede entrar en un contexto empresarial explícito para administrarlo. Las operaciones quedan en un historial. El Superadmin tiene acceso privilegiado: su credencial debe reservarse al operador de Conecta.

El **administrador de empresa** representa al dueño o a la persona que este autoriza. Crea cuentas de su propia empresa, asigna cargo, área, sede, perfil y responsable. No puede crear Superadmins, entrar en otra empresa ni cambiar sus propios permisos desde el formulario de personal.

Los perfiles empresariales son colaborador, supervisor, gerente, subgerente, Recursos Humanos, Planillas, capacitador, SST y administrador. El cargo es un texto editable: por ejemplo, operario, analista, asistente, jefe de tienda o director. El cargo no concede permisos por sí mismo.

Supervisores ven su equipo directo; gerentes y subgerentes ven su cadena de supervisión. Los detalles médicos y las justificaciones se restringen a su propietario, RR. HH., SST según el módulo y administradores. Las boletas se limitan al destinatario, Planillas y administradores. No existe aprobación de solicitudes propias.

## Alta y login

1. El Superadmin abre **Superadmin · Empresas → Integrar empresa**.
2. Registra nombre, dirección, dueño y correo. El sistema propone una contraseña inicial.
3. Puede cargar un logo. La dirección queda como `/conecta/mi-empresa/`.
4. El dueño entra con correo y contraseña en el login común; el portal utiliza la empresa almacenada en su cuenta, no una empresa indicada por el navegador.
5. En **Mi equipo → Crear colaborador**, el dueño genera las cuentas de su personal.

Los correos de acceso son únicos en toda la instalación. Una cuenta pertenece a una empresa; no hay membresías simultáneas en varias empresas. Los clientes no pueden elegir su empresa enviando un identificador a la API.

## Logo y colores

Se admiten PNG, JPG y WebP de hasta 2 MB y, en el formulario, hasta 4096 × 4096 píxeles. El navegador analiza una muestra del logo, descarta transparencia, blancos y colores casi grises, y propone el color dominante. Los logos sin color utilizable reciben un tono neutro. La paleta puede ajustarse antes de guardar.

La marca se aplica al menú, botones principales, fondos destacados y barras de avance. El texto de los botones se calcula en claro u oscuro según la luminancia del color. Esto no sustituye una auditoría completa de accesibilidad. El dueño puede actualizar nombre, logo y color desde **Empresa y permisos**. No se aceptan SVG aportados por clientes; el SVG original de Conecta sí se incluye como recurso propio.

## Cursos, asignaciones y permisos

El dueño puede crear cursos originales con lecciones y evaluación, y seleccionar los perfiles destinatarios. **Administrar cursos** permite cambiar perfiles, retirar y restaurar cursos. Retirar significa archivar: no borra los avances, evaluaciones ni constancias.

En **Empresa y permisos**, el dueño puede conceder o retirar por perfil: publicar contenido, crear cursos, retirar/restaurar cursos, asignar cursos y consultar seguimiento de capacitación. Estos cambios se aplican a las siguientes peticiones de sesiones ya abiertas. Delegar formación no concede alta de empresas, gestión de credenciales, boletas ni acceso clínico.

Cada persona tiene **Mi historial**, con lecciones e intentos de evaluación registrados desde esta versión. Se conserva la mejor nota. Al retirar una asignación, el historial sigue disponible y se bloquean nuevas actividades de ese curso. Los cuatro cursos iniciales son ejemplos compartidos, no cursos privados de una empresa.

## Boletas, faltas y justificaciones

Planillas o Administración entrega una boleta PDF a un destinatario y período. El destinatario descarga y puede confirmar recepción; esa confirmación no es una firma digital ni aceptación del cálculo. No se sobrescribe una boleta existente para el mismo período.

Un responsable registra una falta o tardanza dentro de su alcance. El colaborador crea una justificación vinculada a una incidencia propia y puede adjuntar evidencias mientras esté pendiente. RR. HH. o Administración resuelve. No hay cálculo automático de descuentos, sanciones ni decisiones laborales automáticas.

## Crear el primer Superadmin fuera de demostración

El script `server/provision.mjs` crea una cuenta real y no muestra la contraseña. No reemplaza cuentas existentes. Desde PowerShell, en la carpeta del proyecto:

```powershell
$env:CONECTA_SUPERADMIN_EMAIL = Read-Host 'Correo del Superadmin'
$env:CONECTA_SUPERADMIN_NAME = Read-Host 'Nombre'
$conectaRootSecret = Read-Host 'Contraseña de al menos 16 caracteres' -AsSecureString
$env:CONECTA_SUPERADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $conectaRootSecret).Password
node --env-file-if-exists=.env server/provision.mjs
Remove-Item Env:CONECTA_SUPERADMIN_PASSWORD
```

Después de comprobar el acceso, configura `DEMO_MODE=false` en `.env` y reinicia el servidor. No guardes contraseñas iniciales en archivos compartidos. La entrega local todavía requiere HTTPS, MFA/recuperación de cuentas, monitoreo, almacenamiento y respaldos externos antes de operar con datos reales.

## Criterios utilizados

Se validan permisos, propietario y empresa en el servidor, incluyendo descargas, exportación, cursos y adjuntos. El diseño sigue los criterios de autorización por petición y separación de clientes descritos en las guías oficiales de [Autorización de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) y [Seguridad para múltiples empresas de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html). Las pruebas funcionales no equivalen a una auditoría independiente de seguridad.
