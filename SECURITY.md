# Controles de acceso y activación

## Convenciones

La API conserva CommonJS, funciones asíncronas, cuatro espacios de indentación y los nombres de campos existentes. Los mensajes nuevos se escriben en español. Las contraseñas, los tokens de invitación y las credenciales SMTP no deben registrarse en consola.

## Roles y permisos

Los identificadores existentes son: administrador `1`, docente `2` y alumno `3`. Las altas y modificaciones administrativas requieren el rol de administrador. La configuración de correo requiere `CONFIG_EMAIL_TEMPLATE`; una asignación individual `DENY` prevalece sobre los permisos del rol. Los usuarios pueden consultar sus propios permisos, pero solo el administrador puede asignarlos o eliminarlos.

Las consultas de alumnos, docentes y ternas se filtran en el servidor. Los documentos pertenecen a un alumno y solo pueden gestionarlos el titular, los docentes asignados a su terna o el administrador. Un alumno no puede solicitar cambios de revisión ni reasignar un archivo a otra persona.

## Cuentas y contraseñas

- `POST /api/user/register`: solo administrador. Recibe `accountType` (`alumno` o `docente`) y `profile`. Para alumnos también recibe `detalleTernas`, con tres docentes distintos y los roles `coordina`, `estilo` y `tecnico`. La cuenta, el perfil y la terna se guardan en una transacción.
- `POST /api/user/signUp`: alta administrativa de una cuenta sin perfil, conservada por compatibilidad. Recibe `userId` y `accountType`; el cliente no puede asignar un rol numérico ni una contraseña.
- Las respuestas de alta incluyen un `invitationToken`. La web presenta al administrador un enlace de activación para compartir con el titular. El enlace vence en 24 horas y deja de funcionar al utilizarse o renovarse. No se envía una contraseña inicial compartida.
- `POST /api/user/activate`: recibe `invitationToken` y `newPassword`. La contraseña debe tener al menos 12 caracteres y un máximo de 72 bytes UTF-8, por el límite de bcrypt.
- `PUT /api/user/resetPassword`: requiere sesión y recibe `currentPassword` y `newPassword`. Solo modifica al usuario autenticado.
- `POST /api/user/invitation`: solo administrador. Recibe `userId`, invalida la contraseña, las sesiones y los enlaces anteriores, y devuelve otro `invitationToken`. La web ofrece la acción **Renovar acceso** en las listas de docentes y ternas.

Los tokens de sesión duran una hora y quedan invalidados al cambiar la contraseña. Las invitaciones tienen un propósito diferente y no se aceptan como sesiones. Las cuentas pendientes de cambio de contraseña solo pueden consultar su sesión o cambiar la contraseña.

## Puesta en marcha

1. Desplegar API y web juntas: cambian los contratos de alta y activación. Los tokens anteriores dejan de ser válidos; será necesario iniciar sesión de nuevo.
2. Conservar un `SECRET_TOKEN` robusto y estable en el entorno del servidor. Cambiarlo invalida todas las sesiones e invitaciones.
3. Verificar que `terna.ternaId` sea `AUTO_INCREMENT` en la base existente. La definición del modelo ahora lo declara explícitamente; `sync()` no migra automáticamente una tabla existente sin opciones de alteración. Las tablas del registro deben usar un motor transaccional, como InnoDB.
4. Renovar el acceso de las cuentas existentes que usaban la contraseña inicial compartida y entregar sus enlaces al titular. El cambio de código no sustituye automáticamente las contraseñas ya almacenadas.
5. Mantener privado el bucket GCP y comprobar sus permisos IAM. La autorización de la API no protege un objeto que sea público por configuración externa. La identidad de servicio necesita consultar metadatos para confirmar cargas.
6. Las credenciales SMTP existentes permanecen en el servidor. Se omiten en respuestas y se conservan al editar una plantilla sin proporcionar una nueva contraseña. Rotar las que pudieron estar expuestas en respuestas o logs anteriores.
7. Las credenciales locales `gestion-academica-*.json` quedan excluidas de Git. No incorporarlas al repositorio ni al frontend.

## Verificación

Ejecutar `npm test` y `npm run lint` en la API. Las pruebas HTTP usan una base simulada y el servicio GCP simulado; no realizan cambios en servicios externos. Cubren autorización, contraseñas, activación, exposición de credenciales, límites de archivos y propagación de errores de registro. La transacción real de MySQL, el envío SMTP y las políticas IAM deben comprobarse en un entorno de integración.
