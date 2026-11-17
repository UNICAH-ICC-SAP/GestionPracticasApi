# Comparación con la versión estable

Referencias proporcionadas por el usuario:

- API: `d79aa35f9adbf3b6a0ae60d844c2f4edcc0c28ea`.
- Frontend: `059aed97d92c8df7319b2f0a173b02979ead1f0c`.

Esta revisión compara código y contratos; no certifica todos los recorridos en producción.
La comparación inicial abarca 55 archivos del API y 62 del frontend, incluyendo
cambios de seguridad y funciones posteriores a las referencias.

## Regresiones identificadas y corregidas localmente

| Flujo | Hallazgo | Corrección |
| --- | --- | --- |
| Carga docente | El frontend solicita secciones, pero la ruta exige administrador. | Lectura para docentes limitada a su identidad; escrituras reservadas al administrador. Pruebas de acceso propio, ajeno y administrativo. |
| Entrega de monografía | La tarjeta sustituye Entregar por Ver monografía incluso para alumnos con documentos pendientes o cambios solicitados. | Se restaura Entregar para alumnos en esos estados. |
| Perfil del alumno | La ruta calcula el alcance de acceso, pero el controlador de búsqueda lo ignora. | El alcance autenticado prevalece sobre el identificador recibido; prueba de suplantación. |

## Correcciones anteriores que deben llegar a producción

- El modelo de permisos vuelve a consultar la tabla `permissions`.
- La pantalla de correo no depende de recibir la contraseña SMTP.
- Las consultas de pensums esperan un período seleccionado.
- La base utilizada por Render debe ejecutar `npm run migrate:secciones` para agregar
  `detalle_periodo.observacion`. Su ausencia está confirmada por la respuesta de producción.

## Funciones posteriores a la referencia con integración incompleta

- Calendario: existe el controlador de disponibilidad, pero el modelo no se registra
  en `app/config/db.js` ni las rutas en `app/app.js`. Secciones usa ese modelo al
  guardar ciertos horarios. Antes de habilitarlo deben limitarse las operaciones al
  docente propietario o al administrador y hacerse atómicas las sustituciones.
- Comentarios: rutas y modelo sin registro en la aplicación; las rutas existentes
  tampoco autentican al usuario. No deben publicarse sin acceso por referencia y autor
  obtenido de la sesión.
- Reportes: archivo de rutas sin registro en la aplicación. Antes de publicarlo,
  definir permisos de lectura para los datos incluidos.
- Monografía: el frontend incorpora `getMonografiaCompleta`; no hay una ruta
  correspondiente en el router de ternas actual.
- Observaciones de secciones: controlador y fetcher existentes sin ruta registrada.

Estos puntos requieren completar contratos y permisos; restaurar acceso general
no sería una corrección compatible con los controles actuales.

## Límites y validación pendiente

Las pruebas del API usan dobles de base de datos y almacenamiento en los recorridos
de seguridad. No prueban el esquema real de Render ni subidas reales a GCP.
Las pruebas actuales del frontend cubren utilidades y constantes, no interacción
completa de las pantallas. La compilación comprueba tipos e integración de módulos.

Falta recorrer con cuentas de administrador, docente y alumno: acceso y menú,
altas e invitaciones, ternas, carga y revisión de documentos, pensums y secciones,
cargas, calendario y correo. Usar datos de prueba; no enviar correos reales ni
modificar registros de producción durante una comprobación de lectura.

No se realizó rollback, despliegue ni modificación de la base de producción.
