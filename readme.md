Consulta los [controles de seguridad, contratos de cuentas y pasos de puesta en marcha](./SECURITY.md).

## Columna de observaciones de secciones

Si una base existente devuelve `Unknown column 'detalle_periodo.observacion'`, ejecutar
`npm run migrate:secciones` en el entorno de la API que utiliza esa base de datos y
reiniciar el servicio. La migración agrega únicamente una columna `TEXT NULL` si no
existe; conserva los registros y puede ejecutarse nuevamente. Está incluida también
en el directorio generado por `npm run build`.

`sequelize.sync()` crea tablas faltantes, pero no agrega columnas a tablas existentes.

## Las reglas convencionales para commits son las siguientes:

- chore: Cambios en tareas, configuración, y otros aspectos relacionados con el mantenimiento del proyecto.
- docs: Cambios en la documentación.
- feat: Nuevas características.
- fix: Correcciones de errores.
- style: Cambios que no afectan el significado del código (espacios en blanco, formato, punto y coma que faltan, etc.).
- test: Añadir o modificar pruebas.
