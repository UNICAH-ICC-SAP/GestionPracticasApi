Consulta los [controles de seguridad, contratos de cuentas y pasos de puesta en marcha](./SECURITY.md).

## Columna de observaciones de secciones

Si una base existente devuelve `Unknown column 'detalle_periodo.observacion'`, ejecutar
`npm run migrate:secciones` en el entorno de la API que utiliza esa base de datos y
reiniciar el servicio. La migración agrega únicamente una columna `TEXT NULL` si no
existe; conserva los registros y puede ejecutarse nuevamente. Está incluida también
en el directorio generado por `npm run build`.

`sequelize.sync()` crea tablas faltantes, pero no agrega columnas a tablas existentes.

## Importar carga académica desde PDF o Excel

En el menú de administrador, entrar a **Cargas Académicas > Importar PDF o Excel**.
Seleccionar el período existente y la carrera de destino, cargar el archivo y pulsar
**Analizar archivo**. La vista previa no escribe datos. Muestra errores de catálogo,
fechas y conflictos de horarios; permite seleccionar las filas válidas para confirmar.
La confirmación vuelve a validar y guarda toda la selección en una transacción.
Las cargas existentes se conservan y los horarios idénticos se omiten.

Se admite PDF SAP con texto (hasta 250 páginas) y Excel `.xlsx`, máximo 10 MB y
3000 asignaciones. Los PDF escaneados necesitan reconocimiento de texto previo.
**Descargar datos en Excel** convierte la vista previa del PDF a una tabla editable;
después de corregirla se puede cargar nuevamente. Sin vista previa, el botón descarga
el formato vacío con los encabezados requeridos. Los identificadores y las secciones
deben conservarse como texto para no perder ceros iniciales.

Los docentes activos y las asignaturas con bloques deben existir en el catálogo.
La importación genera un registro por día y bloque de la carrera seleccionada;
no crea días intermedios entre lunes y miércoles. El calendario actual admite lunes
a sábado. Las fechas y el campus se conservan en `observacion`; los calendarios
existentes siguen mostrando horarios por período, sin filtrar esas fechas particulares.

Requiere Node.js 22.3 o posterior, instalar dependencias con `npm ci` y disponer de
la columna `detalle_periodo.observacion` (ver migración anterior). Las rutas
`POST /api/cargas/importar/preview`, `/confirm` y `/excel` requieren sesión de administrador.

## Las reglas convencionales para commits son las siguientes:

- chore: Cambios en tareas, configuración, y otros aspectos relacionados con el mantenimiento del proyecto.
- docs: Cambios en la documentación.
- feat: Nuevas características.
- fix: Correcciones de errores.
- style: Cambios que no afectan el significado del código (espacios en blanco, formato, punto y coma que faltan, etc.).
- test: Añadir o modificar pruebas.
