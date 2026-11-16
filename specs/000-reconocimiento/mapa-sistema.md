# Mapa del sistema — GesFact 2.4

- **Fase**: 000 · Reconocimiento (documentación y protección)
- **Fecha**: 2026-11-16
- **Alcance**: todos los ficheros versionados del repositorio salvo `node_modules/` (tratado como bloque), `.specify/` y `.claude/` (herramientas de Spec Kit, ajenas al sistema).
- **Método**: lectura completa del código fuente, vistas, `package.json`, `package-lock.json` y de las versiones realmente instaladas en `node_modules/`; consultas SQL de **solo lectura** sobre una **copia** de `datos/gesfact.db` (la BD original no se ha abierto).

## Convenciones

- Toda afirmación lleva evidencia `fichero:líneas` o la consulta SQL que la respalda.
- Lo que no se puede demostrar se marca **SUPOSICIÓN** y se traslada a [Preguntas abiertas](#preguntas-abiertas).
- La **criticidad** es una *estimación* del impacto en el negocio si el módulo falla o cambia de comportamiento; su justificación sí está apoyada en evidencia.
- «Depende de» enumera solo dependencias internas del proyecto (más las librerías externas cuando son relevantes). «Dependen de él» incluye a quien lo carga con `require`, lo renderiza o lo enlaza.

---

## 1. Visión general

GesFact es una aplicación web de uso interno, monousuario en la práctica, que **emite, numera, imprime, cobra y rectifica facturas** de Suministros Hidalgo, S.L., **genera la remesa mensual de cuotas de contratos** y **prepara la información de IVA para la gestoría** (`server.js:1-7`, `routes/facturas.js:1`, `scripts/remesa_mensual.js:1`, `routes/informes.js:1`).

Hay dos puntos de entrada:

| Punto de entrada | Cómo se lanza | Evidencia |
|---|---|---|
| Servidor web (`server.js`) | `npm start` / `node server.js`, puerto 3000 | `package.json:5-8`, `config.js:22`, `server.js:44-55` |
| Remesa mensual (`scripts/remesa_mensual.js`) | A mano, el día 1, desde el ordenador de Marga: `node scripts/remesa_mensual.js AAAA-MM` | `scripts/remesa_mensual.js:3-7`, `views/index.ejs:9-10` |

---

## 2. Fichas por módulo

### 2.1 Núcleo de negocio

#### `services/calculo.js`
- **Responsabilidad**: calcula los importes de cada factura (base, IVA, recargo de equivalencia, descuento por volumen y total) y el importe prorrateado del último mes cuando se da de baja un contrato.
- **Depende de**: `lib/util.js` (`services/calculo.js:9`).
- **Dependen de él**: `routes/facturas.js:9,66` (alta de factura), `routes/contratos.js:7,39` (prorrateo de baja), `scripts/remesa_mensual.js:11,55` (remesa).
- **Criticidad**: **ALTA**. Determina cada euro facturado y declarado. El redondeo línea a línea está pactado con la gestoría y ya provocó la devolución de un trimestre completo cuando se cambió (`services/calculo.js:3-6`); el descuento por volumen es un acuerdo comercial (`services/calculo.js:36-43`); el recargo de equivalencia afecta a clientes minoristas (`services/calculo.js:11-23`).
- **Notas**:
  - Umbrales de descuento estrictos (`> 1000`, `> 5000`) (`services/calculo.js:40-41`); la BD contiene el caso límite de base exacta 1000 sin descuento, «comentado con la gestoría» (`db.js:138-139`).
  - El descuento se aplica redondeando el **precio unitario** de cada línea (`services/calculo.js:63-70`).
  - Conserva tipos de IVA antiguos 16/18/7/8 «por si hay que reabrir ejercicios viejos del Access» (`services/calculo.js:16-21`).
  - `calcularProrrateo` usa mes comercial de 30 días (`services/calculo.js:90-102`).

#### `lib/numeracion.js`
- **Responsabilidad**: asigna el número legal correlativo de cada factura ordinaria (`FA`) o rectificativa (`RE`), reiniciando la numeración cada año.
- **Depende de**: `db.js` (`lib/numeracion.js:12`) y de la tabla `contadores` (`db.js:76-81`).
- **Dependen de él**: `routes/facturas.js:10,71,138` (alta y rectificación), `scripts/remesa_mensual.js:12,57`.
- **Criticidad**: **ALTA**. Requisito legal: numeración correlativa y sin huecos por serie y año; desde la inspección de 2020 las facturas no se borran nunca (`lib/numeracion.js:3-6`). Ya hubo un incidente de números duplicados por grabación simultánea (`lib/numeracion.js:8-10`).
- **Notas**: lectura (`lib/numeracion.js:16`) y actualización (`lib/numeracion.js:32`) del contador en operaciones separadas, sin transacción. El año se toma del reloj del sistema, no de la fecha de la factura (`lib/numeracion.js:15`). Formato `SERIE-AAAA-NNNNNN` (`lib/numeracion.js:38-42`).

#### `lib/util.js`
- **Responsabilidad**: aplica las reglas comunes de redondeo de importes, cálculo de fechas de vencimiento, formato de fechas e importes «a la española» y la validación (mínima) del NIF de los clientes.
- **Depende de**: nada.
- **Dependen de él**: `services/calculo.js:9`, `routes/clientes.js:6`, `routes/contratos.js:6`, `routes/facturas.js:8`, `routes/informes.js:6`, `scripts/remesa_mensual.js:10`; y las vistas que reciben el objeto `util` por parámetro: `views/contratos.ejs:9`, `views/facturas.ejs:17,19`, `views/factura_detalle.ejs:11-12,28-40`, `views/informe_iva.ejs:7-14` (pasado en `routes/contratos.js:12`, `routes/facturas.js:25,111`, `routes/informes.js:28`).
- **Criticidad**: **ALTA**. `redondear2` es la base de todo el redondeo fiscal (`lib/util.js:4-7`); `sumarDias` fija los vencimientos (`lib/util.js:17-26`, usado en `routes/facturas.js:69` y `scripts/remesa_mensual.js:60`); `formatearImporte` y `fechaBonita` dan forma al CSV que importa la gestoría (`routes/informes.js:43-45`). Algunas funciones vienen del GesFact 1.x en Access (`lib/util.js:2`).
- **Notas**: `sumarDias` usa `Date` en hora local y el autor sospecha un desfase de un día por el cambio de hora (`lib/util.js:18-21`). `validarNIF` solo comprueba la longitud (`lib/util.js:41-48`).

### 2.2 Datos y configuración

#### `db.js`
- **Responsabilidad**: guarda y recupera toda la información del negocio (clientes, artículos, contratos, facturas, líneas y contadores) y, en una instalación vacía, carga los datos históricos de referencia que usa administración.
- **Depende de**: `config.js` (`db.js:9`), librería `sqlite3` (`db.js:8`), `fs`/`path` (`db.js:6-7`).
- **Dependen de él**: `server.js:11,22-25,44`, `lib/numeracion.js:12`, `routes/articulos.js:5`, `routes/clientes.js:5`, `routes/contratos.js:5`, `routes/facturas.js:7`, `routes/informes.js:5`, `scripts/remesa_mensual.js:9,23`.
- **Criticidad**: **ALTA**. Es la única vía de acceso a los datos. Abre la conexión al hacer `require` (`db.js:15`) y crea la carpeta si no existe (`db.js:11-13`). Si `clientes` está vacía, siembra 6 clientes, 8 artículos, 4 contratos, 9 facturas y contadores `FA=108`, `RE=1` (`db.js:83-87`, `db.js:93-181`), «no tocar, administración los usa de referencia» (`db.js:91-92`).
- **Notas**: importes en `REAL` y fechas en `TEXT` `YYYY-MM-DD` (`db.js:35,47,57-60,69-74`). Sin claves foráneas declaradas (`db.js:41-74`).

#### `datos/gesfact.db`
- **Responsabilidad**: es el almacén real de las facturas emitidas y de los datos maestros de la empresa.
- **Depende de**: nada (fichero SQLite). Lo crea/abre `db.js:15` en la ruta `config.js:20`.
- **Dependen de él**: todo el sistema a través de `db.js`. Marga hace copia a un pendrive los viernes (`LEEME.txt:18`).
- **Criticidad**: **ALTA**. Contiene facturas con valor legal y fiscal que no se pueden regenerar.
- **Notas (consultas sobre una copia)**:
  - `SELECT name, sql FROM sqlite_master` → el esquema coincide exactamente con `db.js:19-81`.
  - Recuentos: `clientes` 6, `articulos` 8, `contratos` 4, `facturas` 9, `lineas` 28 — los mismos que la siembra de `db.js:96-171`.
  - `SELECT * FROM contadores` → `FA/2026/108`, `RE/2026/1`, idénticos a `db.js:176-177`.
  - `SELECT serie, estado, COUNT(*), MIN(fecha), MAX(fecha) FROM facturas GROUP BY serie, estado` → última factura con fecha `2026-05-31`.
  - Ver Zonas oscuras, Z-10.

#### `config.js`
- **Responsabilidad**: fija los datos fiscales de la empresa que aparecen en cada factura, el IVA y los días de vencimiento por defecto, la clave que exige la gestoría en la exportación, la ubicación de la BD y el antiguo buzón de envío de facturas.
- **Depende de**: nada.
- **Dependen de él**: `server.js:12,49`, `db.js:9,11-15`, `routes/articulos.js:6,16`, `routes/facturas.js:12,68,111`, `routes/informes.js:7,40`, `services/email.js:9` (solo dentro de código comentado, `services/email.js:13-24`).
- **Criticidad**: **ALTA**. Los datos de `EMPRESA` salen impresos en la factura (`config.js:7-17`, `views/factura_detalle.ejs:5-7,43`); `CLAVE_EXPORT_GESTORIA` es obligatoria en el CSV (`config.js:36-37`, `routes/informes.js:40`); `RUTA_BD` decide qué BD se abre (`config.js:20`). Se copia a mano al servidor de la oficina y no debe renombrarse (`config.js:2-3`).
- **Notas**: `RUTA_BD` es relativa al directorio de trabajo (`config.js:20`). Contiene una contraseña SMTP en claro (`config.js:29-34`).

### 2.3 Pantallas y procesos (rutas)

#### `server.js`
- **Responsabilidad**: pone en marcha la aplicación de facturación, muestra el panel de inicio (facturas totales, pendientes de cobro, importe pendiente y clientes activos) y da acceso a todas las pantallas.
- **Depende de**: `express`, `body-parser` (`server.js:9-10`), `db.js` (`server.js:11`), `config.js` (`server.js:12`), los cinco routers (`server.js:38-42`), la vista `views/index.ejs` (`server.js:26`) y la carpeta `public/` (`server.js:18`).
- **Dependen de él**: nadie en el código; es el `main` y el script `start` (`package.json:5,7`).
- **Criticidad**: **MEDIA**. Sin él no hay aplicación, pero apenas contiene reglas de negocio: solo los cuatro indicadores del panel (`server.js:20-36`). Un fallo suyo es inmediato y visible, no silencioso. Si `db.inicializar` falla, el proceso termina (`server.js:44-48`).
- **Notas**: el «importe pendiente» suma solo serie `FA` en estado `emitida` (`server.js:24`).

#### `routes/facturas.js`
- **Responsabilidad**: permite emitir facturas nuevas, consultarlas e imprimirlas, marcarlas como cobradas y anularlas por completo con una factura rectificativa.
- **Depende de**: `db.js`, `lib/util.js`, `services/calculo.js`, `lib/numeracion.js`, `services/email.js`, `config.js` (`routes/facturas.js:7-12`); vistas `facturas`, `factura_nueva`, `factura_detalle` (`routes/facturas.js:25,35,111`).
- **Dependen de él**: `server.js:41`; enlazado desde `views/cabecera.ejs:13-14`, `views/facturas.ejs:16`, `views/factura_nueva.ejs:3`, `views/factura_detalle.ejs:48-50`.
- **Criticidad**: **ALTA**. Es el único camino de alta manual, cobro y rectificación de facturas: graba cabecera y líneas (`routes/facturas.js:74-99`), consume números legales (`routes/facturas.js:71,138`) y cambia estados (`routes/facturas.js:118,154`).
- **Notas**:
  - Alta: cliente, cálculo, vencimiento (`dias_pago` del cliente o `config.VENCIMIENTO_DIAS`), número, cabecera y líneas una a una, sin transacción (`routes/facturas.js:42-102`). Añade «Descuento volumen N% aplicado» a las observaciones (`routes/facturas.js:76`).
  - Rectificación total: copia espejo con signos invertidos, sin recalcular, y marca la original como `rectificada` (`routes/facturas.js:124-164`). No comprueba errores al insertar líneas ni al actualizar el estado (`routes/facturas.js:151-156`).
  - Cobro: solo de `emitida` a `cobrada` (`routes/facturas.js:117-122`).
  - El fichero «se ha ido haciendo grande» (`routes/facturas.js:2-3`).

#### `routes/informes.js`
- **Responsabilidad**: prepara el resumen trimestral de IVA repercutido que revisa la gestoría para el modelo 303 y genera el fichero CSV anual de facturas que la gestoría importa en su contabilidad.
- **Depende de**: `db.js`, `lib/util.js`, `config.js` (`routes/informes.js:5-7`); vistas `informes`, `informe_iva` (`routes/informes.js:10,28`).
- **Dependen de él**: `server.js:42`; enlazado desde `views/cabecera.ejs:18`, `views/informes.ejs:4-8`. Consumidor externo: la gestoría (Puri) (`routes/informes.js:32-33`).
- **Criticidad**: **ALTA**. Alimenta las declaraciones fiscales. El formato CSV está pactado (punto y coma, coma decimal, clave en la primera línea, CRLF) y cualquier variación rompe la importación de la gestoría (`routes/informes.js:32-50`).
- **Notas**: el resumen de IVA suma desde `lineas` por tipo, de modo que las rectificativas restan solas (`routes/informes.js:21-26`). El trimestre usa siempre día `31` como fin (`routes/informes.js:19`), que funciona por comparación de texto.

#### `routes/contratos.js`
- **Responsabilidad**: mantiene los contratos de cuota mensual (alquileres de máquinas y mantenimientos) y, al dar uno de baja a mitad de mes, calcula el importe del último mes que administración factura después a mano.
- **Depende de**: `db.js`, `lib/util.js`, `services/calculo.js` (`routes/contratos.js:5-7`); vista `contratos` (`routes/contratos.js:12`).
- **Dependen de él**: `server.js:40`; enlazado desde `views/cabecera.ejs:17`, `views/contratos.ejs:11`. Los contratos que mantiene son la entrada de `scripts/remesa_mensual.js:26-29`.
- **Criticidad**: **MEDIA**. Las fechas de alta/baja deciden qué se factura en la remesa (`scripts/remesa_mensual.js:28`) y el prorrateo de baja sirve de base a una factura manual (`routes/contratos.js:28-30`); pero no graba facturas por sí mismo.
- **Notas**: el importe del prorrateo solo se devuelve en la URL (`routes/contratos.js:40`) y la vista no lo muestra (`views/contratos.ejs:17`). Ver Z-6. No hay formulario de alta (Z-5).

#### `routes/clientes.js`
- **Responsabilidad**: da de alta y de baja a los clientes, incluido si están en recargo de equivalencia y sus días de pago.
- **Depende de**: `db.js`, `lib/util.js` (`routes/clientes.js:5-6`); vista `clientes` (`routes/clientes.js:11`).
- **Dependen de él**: `server.js:38`; enlazado desde `views/cabecera.ejs:15`, `views/clientes.ejs:11,16`.
- **Criticidad**: **MEDIA**. Los campos `recargo_equivalencia` y `dias_pago` cambian el importe y el vencimiento de las facturas (`services/calculo.js:49`, `routes/facturas.js:68`); los datos fiscales del cliente salen en la factura (`views/factura_detalle.ejs:18-20`). La validación «fuerte» la hace Marga a ojo (`routes/clientes.js:16`).
- **Notas**: la baja es lógica (`activo = 0`) (`routes/clientes.js:32-37`).

#### `routes/articulos.js`
- **Responsabilidad**: mantiene el catálogo de artículos y servicios con su precio y tipo de IVA, que sirve de ayuda para rellenar las facturas.
- **Depende de**: `db.js`, `config.js` (`routes/articulos.js:5-6`); vista `articulos` (`routes/articulos.js:11`).
- **Dependen de él**: `server.js:39`; enlazado desde `views/cabecera.ejs:16`, `views/articulos.ejs:9,14`. Los artículos activos alimentan el desplegable de `views/factura_nueva.ejs:22-24` (`routes/facturas.js:33`).
- **Criticidad**: **BAJA**. La factura no lee el precio de la BD sino del formulario (`routes/facturas.js:50-63`); el catálogo solo autocompleta (`public/js/factura.js:1-2`).
- **Notas**: baja lógica (`routes/articulos.js:26-31`).

#### `scripts/remesa_mensual.js`
- **Responsabilidad**: genera y graba de golpe las facturas de las cuotas mensuales de todos los contratos vigentes en un mes, prorrateando los que empiezan o terminan dentro de él.
- **Depende de**: `db.js`, `lib/util.js`, `services/calculo.js`, `lib/numeracion.js` (`scripts/remesa_mensual.js:9-12`).
- **Dependen de él**: nadie en el código. Lo lanza una persona a mano (`scripts/remesa_mensual.js:3-7`, `views/index.ejs:9-10`).
- **Criticidad**: **ALTA**. Graba facturas reales y consume numeración en lote (`scripts/remesa_mensual.js:57-75`); un error o una doble ejecución no se puede deshacer borrando (`lib/numeracion.js:3-6`).
- **Notas**:
  - Prorratea por los **días reales del mes** (`scripts/remesa_mensual.js:43-51`), a diferencia de la baja de contratos (30 días, `services/calculo.js:95-102`).
  - Fecha de factura = último día del mes facturado (`scripts/remesa_mensual.js:59`); vencimiento `dias_pago || 30` fijo, sin usar `config.VENCIMIENTO_DIAS` (`scripts/remesa_mensual.js:60`).
  - No envía email ni filtra clientes dados de baja (`scripts/remesa_mensual.js:26-29`).
  - Llama a `db.inicializar`, por lo que contra una BD vacía sembraría los datos históricos (`scripts/remesa_mensual.js:23`, `db.js:83-87`).
  - Lo escribió Roberto (becario) en 2021 (`scripts/remesa_mensual.js:6-7`, `server.js:4`).

#### `services/email.js`
- **Responsabilidad**: debería enviar cada factura al cliente por correo; hoy solo avisa por consola de que hay que enviarla a mano.
- **Depende de**: `config.js` (`services/email.js:9`), aunque solo lo usa el código comentado (`services/email.js:12-25`).
- **Dependen de él**: `routes/facturas.js:11,93`.
- **Criticidad**: **BAJA** en su estado actual: siempre llama a `cb(null)` sin hacer nada (`services/email.js:26-28`). El envío real se hace a mano desde el Outlook de Marga imprimiendo la factura a PDF (`services/email.js:3-6`). Pasaría a ALTA si se reactivase.

### 2.4 Presentación

#### `views/factura_detalle.ejs`
- **Responsabilidad**: es el documento de factura que se imprime o guarda en PDF y se entrega al cliente, con los datos de empresa, cliente, líneas, totales y datos registrales; además ofrece los botones de cobro y rectificación.
- **Depende de**: `cabecera`/`pie` (`views/factura_detalle.ejs:1,54`), objetos `f`, `lineas`, `util`, `empresa` (`routes/facturas.js:111`).
- **Dependen de él**: `routes/facturas.js:111`.
- **Criticidad**: **ALTA**. Es lo que recibe el cliente (`services/email.js:4-5`); incluye menciones obligatorias como NIF y registro mercantil (`views/factura_detalle.ejs:5-7,43`) y la referencia a la factura rectificada (`views/factura_detalle.ejs:13`).
- **Notas**: botones de cobro/rectificación solo para `emitida` y serie `FA` (`views/factura_detalle.ejs:47-52`).

#### `views/factura_nueva.ejs`
- **Responsabilidad**: es el formulario de emisión de facturas, con hasta seis líneas, ayuda de catálogo y observaciones.
- **Depende de**: `cabecera`/`pie`, `public/js/factura.js` (`views/factura_nueva.ejs:28`), datos `clientes` y `articulos` (`routes/facturas.js:35`).
- **Dependen de él**: `routes/facturas.js:35`; envía a `POST /facturas/nueva` (`views/factura_nueva.ejs:3`).
- **Criticidad**: **MEDIA**. Los nombres de campo (`desc`, `cant`, `precio`, `iva`, `obs`) son el contrato con la ruta (`views/factura_nueva.ejs:15-18,25`, `routes/facturas.js:41,50-53`); solo ofrece IVA 21/10/4 (`views/factura_nueva.ejs:18`).

#### `views/informes.ejs` y `views/informe_iva.ejs`
- **Responsabilidad**: dan acceso a los informes y muestran el resumen trimestral de IVA por tipo con su total.
- **Depende de**: `cabecera`/`pie`; `util` para el formato (`views/informe_iva.ejs:7-14`).
- **Dependen de ellas**: `routes/informes.js:10,28`.
- **Criticidad**: **MEDIA**. La gestoría revisa estos importes antes del modelo 303 (`views/informe_iva.ejs:16`). Los totales se suman en la propia vista sin redondear (`views/informe_iva.ejs:5`).

#### `views/facturas.ejs`, `views/clientes.ejs`, `views/articulos.ejs`, `views/contratos.ejs`, `views/index.ejs`
- **Responsabilidad**: muestran los listados de facturas (filtrables por estado), clientes, artículos y contratos con sus formularios de alta/baja, y el panel de inicio con el recordatorio de la remesa.
- **Depende de**: `cabecera`/`pie` (línea 1 y última de cada una); `util` en `facturas.ejs` y `contratos.ejs`.
- **Dependen de ellas**: `routes/facturas.js:25`, `routes/clientes.js:11`, `routes/articulos.js:11`, `routes/contratos.js:12`, `server.js:26`.
- **Criticidad**: **BAJA**. Solo presentan datos y formularios sencillos; no calculan importes.

#### `views/cabecera.ejs` y `views/pie.ejs`
- **Responsabilidad**: dan el marco común a todas las pantallas (menú de navegación, hoja de estilos y pie con el contacto de soporte: Julián, ext. 22).
- **Depende de**: `public/css/estilos.css` (`views/cabecera.ejs:6`).
- **Dependen de ellas**: todas las demás vistas (`<%- include('cabecera') %>` / `include('pie')`).
- **Criticidad**: **BAJA**. El menú es la única navegación (`views/cabecera.ejs:11-19`).

#### `public/js/factura.js`
- **Responsabilidad**: al elegir un artículo en una línea de factura, rellena automáticamente su precio y tipo de IVA.
- **Depende de**: la estructura HTML de `views/factura_nueva.ejs:15-23` (`.campo-desc`, `#lista-articulos`, `.campo-precio`, `select[name="iva"]`).
- **Dependen de él**: `views/factura_nueva.ejs:28`.
- **Criticidad**: **BAJA**. Comodidad de 2021; antes se copiaba a mano (`public/js/factura.js:1-2`). El usuario puede sobrescribir el precio.

#### `public/css/estilos.css`
- **Responsabilidad**: da el aspecto visual y oculta menús y botones al imprimir la factura.
- **Depende de**: nada. **Dependen de él**: `views/cabecera.ejs:6`.
- **Criticidad**: **BAJA**, con una salvedad: la regla `@media print` es la que deja limpia la factura impresa/PDF (`public/css/estilos.css:28`).

### 2.5 Ficheros de proyecto y documentación

| Fichero | Responsabilidad (negocio) | Depende de / dependen de él | Criticidad |
|---|---|---|---|
| `package.json` | Declara qué librerías necesita el programa para funcionar y cómo arrancarlo (`package.json:5-16`). | Lo usa `npm install` (`LEEME.txt:7`). | **MEDIA**: una reinstalación sin él deja la aplicación sin arrancar. |
| `package-lock.json` | Debería fijar las versiones exactas instaladas. | Lo usa `npm`. | **BAJA** en la práctica: no refleja lo instalado (ver Z-9). |
| `node_modules/` (versionado, 2013 ficheros según `git ls-files node_modules`) | Contiene las librerías ya instaladas, incluido el binario nativo de SQLite para Windows (`node_modules/sqlite3/build/Release/node_sqlite3.node`). | Lo cargan todos los `require` externos. | **ALTA**: es la instalación que de verdad funciona y no es reproducible con el lockfile (Z-9). |
| `LEEME.txt` | Instrucciones de instalación en la oficina, tareas pendientes y política de copias de seguridad. | Ninguna. | **BAJA**: desactualizado (`LEEME.txt:20`, «11/03/2019 (aprox)»), pero es la única fuente escrita de la copia de seguridad (`LEEME.txt:18`). |
| `datos/migracion_mysql_2018.sql` | Volcado de prueba de una migración a MySQL que nunca se hizo. | Ninguna referencia en código. | **NULA** (ver Z-1). |
| `CLAUDE.md`, `.specify/`, `.claude/` | Guía y herramientas de esta fase de documentación (Spec Kit). | Ajenos al sistema en ejecución. | Fuera de alcance. |

---

## 3. (a) Diagrama de dependencias

```text
 PUNTOS DE ENTRADA
 ─────────────────
 npm start ──► server.js ─────────────────────────────────────────────┐
                 │  (dashboard "/" → views/index.ejs)                 │
                 │                                                    │
                 ├──► routes/clientes.js ──┐                          │
                 ├──► routes/articulos.js ─┤                          │
                 ├──► routes/contratos.js ─┼──► services/calculo.js   │
                 ├──► routes/facturas.js ──┤        │                 │
                 │        │   │   │        │        ▼                 │
                 │        │   │   │        └──► lib/util.js ◄─────────┼── (vistas reciben `util`)
                 │        │   │   └──► services/email.js ──► config.js (solo código comentado)
                 │        │   └──► lib/numeracion.js ──┐              │
                 └──► routes/informes.js               │              │
                          │                            ▼              │
 node scripts/            │            ┌──────────► db.js ◄───────────┘
 remesa_mensual.js ───────┼────────────┤             │
   ├─► services/calculo.js│            │             ├──► config.js (RUTA_BD)
   ├─► lib/numeracion.js ─┼────────────┘             ▼
   ├─► lib/util.js        │                   datos/gesfact.db  (SQLite, ruta relativa al cwd)
   └─► db.js              │
                          ▼
              CSV ──► Contaplus de la gestoría (externo)

 Todos los routers requieren db.js; facturas/informes/articulos requieren además config.js.

 PRESENTACIÓN
 ────────────
 server.js / routes/* ──render──► views/*.ejs ──include──► cabecera.ejs ──► public/css/estilos.css
                                                      └──► pie.ejs
 views/factura_nueva.ejs ──<script>──► public/js/factura.js

 SIN CONEXIÓN CON EL RESTO
 ─────────────────────────
 datos/migracion_mysql_2018.sql   LEEME.txt   (módulo de albaranes: fuera del repo)
```

Matriz de `require` internos (fila = quien requiere):

| | config | db | util | numeracion | calculo | email |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `server.js` | ✔ `:12` | ✔ `:11` | | | | |
| `db.js` | ✔ `:9` | | | | | |
| `lib/numeracion.js` | | ✔ `:12` | | | | |
| `services/calculo.js` | | | ✔ `:9` | | | |
| `services/email.js` | ✔ `:9` | | | | | |
| `routes/clientes.js` | | ✔ `:5` | ✔ `:6` | | | |
| `routes/articulos.js` | ✔ `:6` | ✔ `:5` | | | | |
| `routes/contratos.js` | | ✔ `:5` | ✔ `:6` | | ✔ `:7` | |
| `routes/facturas.js` | ✔ `:12` | ✔ `:7` | ✔ `:8` | ✔ `:10` | ✔ `:9` | ✔ `:11` |
| `routes/informes.js` | ✔ `:7` | ✔ `:5` | ✔ `:6` | | | |
| `scripts/remesa_mensual.js` | | ✔ `:9` | ✔ `:10` | ✔ `:12` | ✔ `:11` | |

---

## 4. (b) Tecnologías y versiones reales

Deducidas del código, de `package.json`, de `package-lock.json` y de los `package.json` dentro de `node_modules/` (lo realmente instalado). **No** se ha tomado nada de `LEEME.txt`.

| Tecnología | Versión real | Evidencia | Observaciones |
|---|---|---|---|
| **Node.js** (runtime) | No declarada | `package.json` no tiene campo `engines` | Mínimo deducible del árbol instalado: **Node ≥ 10** (`engines` de `prebuild-install`, `tar`, `node-abi`, `semver` en `node_modules/*/package.json`). Esto **contradice** el «node 8» de `LEEME.txt:5`. En esta máquina: v24.11.0 (`node -v`). Versión de la oficina: SUPOSICIÓN → P-1. |
| **npm** | ≥ 7 (SUPOSICIÓN) | `package-lock.json:4` `"lockfileVersion": 3` | El formato 3 lo generan npm 7 y posteriores. |
| **Express** | **4.22.3** instalada | `node_modules/express/package.json` | `package.json:14` pide `^4.22.2`; el lockfile dice 4.22.2 (`package-lock.json:273-274`). |
| **body-parser** | **1.20.9** instalada | `node_modules/body-parser/package.json` | `package.json:12` pide `^1.20.5`; lockfile 1.20.5 (`package-lock.json:49-50`). Solo se usa `urlencoded({extended:false})` (`server.js:17`). |
| **EJS** | **3.1.10** | `node_modules/ejs/package.json`, `package-lock.json:204-205` | Motor de vistas (`server.js:16`); usa `include()` de EJS ≥ 2 (`views/*.ejs:1`). |
| **sqlite3** (driver Node) | **5.1.7** | `node_modules/sqlite3/package.json`, `package-lock.json:853-855` | Binario nativo N-API versionado en git (`node_modules/sqlite3/build/Release/node_sqlite3.node`). |
| **Motor SQLite** | **3.44.2** (2023-11-24) | `require('sqlite3').VERSION` / `SOURCE_ID` | Es el que lleva compilado el binario anterior. |
| Módulos nativos de Node | `fs`, `path` | `db.js:6-7` | — |
| Estilo de código | CommonJS, ES5 (`var`, callbacks anidados, sin promesas) | p. ej. `server.js:9-36`, `routes/facturas.js:42-102` | — |
| Front-end | HTML + EJS, CSS plano, JavaScript de navegador sin librerías | `views/*.ejs`, `public/css/estilos.css`, `public/js/factura.js` | Usa `NodeList.forEach`, `Element.closest` y `<datalist>` (`public/js/factura.js:3,8`, `views/factura_nueva.ejs:22`): exige un navegador moderno. |
| Formato de intercambio | CSV `;`, coma decimal, CRLF, UTF-8 sin BOM | `routes/informes.js:40-49` | Consumido por el Contaplus de la gestoría (`services/calculo.js:4`). |
| Correo (`nodemailer`) | **No instalado** | `services/email.js:8`; no existe `node_modules/nodemailer` | Desinstalado en 2023 según el comentario. |
| Tests / linter / build | Ninguno | `package.json:6-8` solo tiene `start` | Los tests previstos usarán `node:test` (requiere Node ≥ 18). |

---

## 5. (c) Zonas oscuras

Todo lo que existe en el proyecto y no encaja limpiamente en el mapa anterior.

### Código muerto o inalcanzable

**Z-1. Volcado de migración a MySQL (fichero huérfano).** `datos/migracion_mysql_2018.sql` no lo referencia ningún código; solo `LEEME.txt:12-13` y `config.js:19`, `db.js:3-4`. Su propia cabecera dice que nunca se ejecutó y que el esquema está desfasado (`datos/migracion_mysql_2018.sql:1-3`): solo define `clientes` y `facturas` con columnas distintas (`datos/migracion_mysql_2018.sql:4-5`).

**Z-2. Envío de facturas por email desactivado.** El cuerpo real de `enviarFactura` está comentado (`services/email.js:12-25`) y depende de `nodemailer`, que no está instalado (`services/email.js:8`). Por tanto `config.SMTP` (`config.js:27-34`) solo lo usa código muerto. La ruta de alta sigue llamando al servicio (`routes/facturas.js:93`), que solo escribe en consola (`services/email.js:26-28`). La remesa ni siquiera lo llama (`scripts/remesa_mensual.js:9-12`).

**Z-3. Configuración sin uso o inalcanzable.**
- `config.EMPRESA.email` (`config.js:15`) no se usa en ninguna vista ni ruta (la factura imprime nombre, NIF, dirección, CP, población, teléfono y registro: `views/factura_detalle.ejs:5-7,43`).
- `config.IVA_DEFECTO` (`config.js:24-25`) solo se aplica si `tipo_iva` llega vacío (`routes/articulos.js:16`), pero el formulario siempre envía un valor del `<select>` (`views/articulos.ejs:18`): desde la interfaz es inalcanzable.
- `config.EMPRESA.telefono` contiene un marcador `'925 511 XXX'` (`config.js:14`) que se imprime tal cual en las facturas (`views/factura_detalle.ejs:7`).

**Z-4. Funciones exportadas sin consumidor externo.** `recargoPara`, `calcularLinea` y `porcentajeDescuento` (`services/calculo.js:105-107`) y `formatear` (`lib/numeracion.js:46`) se exportan pero solo se usan dentro de su propio módulo (búsqueda en todo el código fuera de `node_modules/`). No es código muerto, pero sí superficie pública sin uso.

### Funcionalidades a medias

**Z-5. Alta de contratos sin pantalla.** Existe `POST /contratos/nuevo` (`routes/contratos.js:16-26`), pero `views/contratos.ejs` no tiene formulario de alta (solo el de baja, `views/contratos.ejs:11-13`). Los contratos actuales solo pueden venir de la siembra (`db.js:115-120`) o de grabación directa. SUPOSICIÓN → P-3.

**Z-6. Importe del prorrateo de baja «en la barra de direcciones».** La baja calcula el importe y lo pasa como parámetro `?prorrateo=` (`routes/contratos.js:40`), pero la ruta `GET /contratos` no lo lee ni lo pasa a la vista (`routes/contratos.js:9-14`). La propia pantalla indica leerlo en la URL (`views/contratos.ejs:17`). La factura de prorrateo se emite a mano (`routes/contratos.js:28-30`).

**Z-7. Módulo de albaranes inexistente.** Según `LEEME.txt:15-16`, Roberto empezó un módulo de albaranes en 2021 que está en su ordenador. En el repositorio no hay rastro (ninguna ruta, tabla ni vista; `db.js:19-81`, `server.js:38-42`).

**Z-8. Rectificación parcial imposible y rectificación de cobradas solo por URL.** Solo existe abono total (`routes/facturas.js:124-129`). La ruta permite rectificar facturas `cobrada` (solo rechaza `rectificada` y serie `RE`, `routes/facturas.js:132-133`), pero el botón solo aparece para `emitida` (`views/factura_detalle.ejs:47`).

### Infraestructura y datos que no encajan

**Z-9. `package-lock.json` no describe lo instalado.** El lockfile tiene 77 paquetes (claves de `packages` en `package-lock.json`), mientras que `node_modules/` contiene 184, de los cuales **108 no aparecen en el lockfile** (todo el árbol de `sqlite3`: `prebuild-install`, `node-gyp`, `tar`, `node-addon-api`…) y **7 tienen una versión distinta** (`express` 4.22.2→4.22.3, `body-parser` 1.20.5→1.20.9, `qs` 6.15.3→6.16.2, `encodeurl` 2.0.0→2.0.3, `on-finished` 2.4.1→2.4.2, `proxy-addr` 2.0.7→2.0.8, `brace-expansion` 2.1.1→2.1.8). La entrada de `sqlite3` solo tiene `version`, sin `resolved`, `integrity` ni dependencias (`package-lock.json:853-855`). Un `npm ci` en otra máquina no reproduciría con certeza esta instalación.

**Z-10. La BD versionada es idéntica a la siembra.** Esquema, recuentos (6/8/4/9/28) y contadores (`FA=108`, `RE=1`) de `datos/gesfact.db` coinciden exactamente con `cargarDatosIniciales` (`db.js:93-181`), y la última factura es del `2026-05-31`, casi seis meses antes de la fecha de este documento, aunque la remesa se lanza todos los meses (`scripts/remesa_mensual.js:7`). O la BD del repositorio es una foto antigua o no es la de producción. SUPOSICIÓN → P-2.

**Z-11. Facturas históricas de remesa que el script actual no puede producir.** Las facturas sembradas «Remesa enero» y «Remesa mayo» tienen varias líneas con artículos (`db.js:126-130`, `db.js:168-171`), pero el script crea exactamente una línea por factura (`scripts/remesa_mensual.js:54,66-68`). Además hay cantidades fraccionarias atípicas para artículos por caja/unidad (0,44 cajas de vasos, 0,32 de portes, 0,97 de café…: `db.js:130,136,143,147,154,158,171`) que parecen calculadas hacia atrás para cuadrar un importe. SUPOSICIÓN → P-4.

**Z-12. Ficheros sensibles versionados.** `datos/gesfact.db` y `node_modules/` están en git (`git ls-files`); no hay `.gitignore`. `config.js:29-34` guarda una contraseña SMTP en claro.

**Z-13. Directorio `specs/` vacío hasta este documento** y ningún test en el repositorio (`package.json:6-8`).

### Hallazgos colaterales (para el registro de anomalías)

Se anotan aquí porque el registro aún no tiene ruta (`TODO(RUTA_REGISTRO_ANOMALIAS)`); **no se han corregido**.

| Id | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| H-1 | Riesgo | Numeración leída y actualizada sin transacción: posible número duplicado con dos usuarios a la vez. | `lib/numeracion.js:8-10,16-35` |
| H-2 | Riesgo | El año del número sale del reloj, no de la fecha de la factura: la remesa de diciembre lanzada el 1 de enero tendría fecha del año anterior y número del nuevo. | `lib/numeracion.js:15`, `scripts/remesa_mensual.js:59` |
| H-3 | Riesgo | Alta y rectificación graban cabecera y líneas sin transacción; la rectificación ignora errores de las líneas y del cambio de estado. | `routes/facturas.js:74-99,148-158` |
| H-4 | Rareza | Dos prorrateos distintos: 30 días comerciales en la baja y días reales en la remesa. | `services/calculo.js:95-102`, `scripts/remesa_mensual.js:47-51` |
| H-5 | Rareza | Vencimiento por defecto: la remesa usa `30` fijo y la factura manual `config.VENCIMIENTO_DIAS`. | `scripts/remesa_mensual.js:60`, `routes/facturas.js:68` |
| H-6 | Rareza | La remesa no excluye clientes dados de baja. | `scripts/remesa_mensual.js:26-29` |
| H-7 | Riesgo | Todo depende del directorio de trabajo: lanzar la remesa desde otra carpeta crearía una BD nueva, la sembraría y facturaría contratos de ejemplo. | `config.js:20`, `db.js:11-15,83-87`, `scripts/remesa_mensual.js:23` |
| H-8 | Bug (según el autor) | Posible desfase de un día en vencimientos por el cambio de hora. | `lib/util.js:18-21` |
| H-9 | Riesgo | `validarNIF` solo comprueba la longitud. | `lib/util.js:41-48` |

---

## Preguntas abiertas

| Id | Pregunta | Origen |
|---|---|---|
| P-1 | ¿Qué versión de Node está instalada en el ordenador de la oficina? El árbol instalado exige ≥ 10 y los tests previstos ≥ 18. | §4, `LEEME.txt:5` |
| P-2 | ¿Es `datos/gesfact.db` la BD real de producción? Si lo es, ¿por qué no tiene facturas posteriores a mayo de 2026 ni nada distinto de la siembra? | Z-10 |
| P-3 | ¿Cómo se dan de alta hoy los contratos nuevos si no hay formulario? | Z-5 |
| P-4 | ¿Cómo se generaron las facturas históricas de remesa con varias líneas y cantidades fraccionarias? | Z-11 |
| P-5 | ¿Se sigue lanzando la remesa todos los días 1 y desde qué carpeta exacta? | H-2, H-7 |
| P-6 | ¿Cuál es el estado real del módulo de albaranes de Roberto? | Z-7 |
