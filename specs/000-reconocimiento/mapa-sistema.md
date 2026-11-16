# Mapa del sistema — GesFact 2.4

**Reconocimiento inicial del sistema heredado de Suministros Hidalgo, S.L.** Fecha: 2026-11-16. Fase: documentar y proteger (ver `.specify/memory/constitution.md`).

Este documento describe **lo que el sistema hace hoy**, con evidencia (`fichero:líneas`). No propone cambios. Los comportamientos frágiles se registran como anomalías (§6), no se corrigen. Las consultas SQL se han hecho en solo lectura sobre una **copia** de `datos/gesfact.db`.

## 1. Visión general

Aplicación web interna que **emite, numera, imprime, cobra y rectifica facturas**, genera la **remesa mensual de contratos** y prepara el **IVA para la gestoría** (`server.js:1-7`, `routes/facturas.js:1`, `scripts/remesa_mensual.js:1`, `routes/informes.js:1`).

Dos puntos de entrada:

- **Servidor web**: `npm start` → `node server.js`, puerto 3000 (`package.json:5-8`, `config.js:22`, `server.js:44-55`).
- **Remesa mensual**: `node scripts/remesa_mensual.js AAAA-MM`, a mano el día 1 desde el ordenador de Marga (`scripts/remesa_mensual.js:3-7`, `views/index.ejs:9-10`).

## 2. Módulos y ficheros relevantes

### Núcleo de negocio

#### `services/calculo.js`

- **Responsabilidad de negocio:** calcula base, IVA, recargo de equivalencia, descuento por volumen y total de cada factura, y el importe prorrateado al dar de baja un contrato.
- **Depende de:** `lib/util.js` (`services/calculo.js:9`).
- **Quién depende de él:** alta de facturas (`routes/facturas.js:66`), remesa (`scripts/remesa_mensual.js:55`), baja de contratos (`routes/contratos.js:39`).
- **Criticidad: ALTA.** Decide cada euro facturado. El redondeo por línea está pactado con la gestoría: cambiarlo en 2019 hizo que devolvieran un trimestre entero (`services/calculo.js:3-6`).
- **Notas:** descuento con umbrales estrictos `> 1000` / `> 5000`, aplicado al precio unitario de cada línea (`services/calculo.js:39-43,63-70`); conserva los tipos de IVA antiguos 16/18/7/8 (`services/calculo.js:16-21`); `calcularProrrateo` usa un mes fijo de 30 días (`services/calculo.js:95-102`).

#### `lib/numeracion.js`

- **Responsabilidad de negocio:** asigna el número legal correlativo de cada factura (`FA` ordinaria, `RE` rectificativa), reiniciando cada año.
- **Depende de:** `db.js` y la tabla `contadores` (`lib/numeracion.js:12`, `db.js:76-81`).
- **Quién depende de él:** alta y rectificación (`routes/facturas.js:71,138`), remesa (`scripts/remesa_mensual.js:57`).
- **Criticidad: ALTA.** Por obligación legal la numeración es correlativa y sin huecos, y las facturas no se borran nunca (`lib/numeracion.js:3-6`). Ya hubo números duplicados al grabar dos personas a la vez (`lib/numeracion.js:8-10`).
- **Notas:** lee y actualiza el contador sin transacción (`lib/numeracion.js:16,32`); el año sale del reloj (`lib/numeracion.js:15`); formato `SERIE-AAAA-NNNNNN` (`lib/numeracion.js:38-42`).

#### `lib/util.js`

- **Responsabilidad de negocio:** redondeo, vencimientos, formato de fechas e importes a la española y validación de NIF.
- **Depende de:** nada.
- **Quién depende de él:** `services/calculo.js:9`, todas las rutas salvo artículos, `scripts/remesa_mensual.js:10` y las vistas que reciben `util` (`routes/facturas.js:25,111`, `routes/contratos.js:12`, `routes/informes.js:28`). Es el módulo con más dependientes.
- **Criticidad: ALTA.** `redondear2` sostiene todo el cálculo fiscal (`lib/util.js:5-7`); `formatearImporte` y `fechaBonita` dan forma al CSV de la gestoría (`routes/informes.js:43-45`). Parte viene del GesFact 1.x en Access (`lib/util.js:2`).
- **Notas:** `sumarDias` tiene un desfase de un día según la zona horaria (`lib/util.js:17-26`; ver `flujo-factura.md`); `validarNIF` solo mira la longitud (`lib/util.js:41-48`).

### Datos y configuración

#### `db.js`

- **Responsabilidad de negocio:** guarda clientes, artículos, contratos, facturas, líneas y contadores; en una instalación vacía carga los datos históricos de referencia.
- **Depende de:** `config.js`, `sqlite3`, `fs`/`path` (`db.js:6-9`).
- **Quién depende de él:** `server.js`, `lib/numeracion.js`, todas las rutas y la remesa (`server.js:11`, `lib/numeracion.js:12`, `scripts/remesa_mensual.js:9`).
- **Criticidad: ALTA.** Es el único acceso a los datos. Abre la BD al hacer `require` y crea la carpeta si falta (`db.js:11-15`). Si `clientes` está vacía, siembra 6 clientes, 8 artículos, 4 contratos, 9 facturas y contadores `FA=108`, `RE=1` (`db.js:83-87,93-181`).
- **Notas:** importes en `REAL`, fechas en texto `YYYY-MM-DD` (`db.js:35,47,57-60,69-74`); sin claves foráneas (`db.js:41-74`).

#### `datos/gesfact.db`

- **Responsabilidad de negocio:** almacén real de facturas emitidas y datos maestros.
- **Quién depende de él:** todo el sistema a través de `db.js` (`db.js:15`, `config.js:20`). Marga lo copia a un pendrive los viernes (`LEEME.txt:18`).
- **Criticidad: ALTA.** Contiene facturas con valor legal que no se pueden regenerar.
- **Notas:** esquema, recuentos (6/8/4/9/28) y contadores idénticos a la siembra de `db.js`; última factura `2026-05-31` (consultas sobre `sqlite_master`, `COUNT(*)` por tabla y `contadores`). Ver S2.

#### `config.js`

- **Responsabilidad de negocio:** datos fiscales de la empresa que salen en la factura, IVA y vencimiento por defecto, clave de la gestoría, ruta de la BD y antiguo buzón de correo.
- **Depende de:** nada.
- **Quién depende de él:** `server.js:12`, `db.js:9`, `routes/articulos.js:6`, `routes/facturas.js:12`, `routes/informes.js:7`, `services/email.js:9` (solo en código comentado).
- **Criticidad: ALTA.** Los datos de `EMPRESA` se imprimen en la factura (`views/factura_detalle.ejs:5-7,43`); la clave es obligatoria en el CSV (`routes/informes.js:40`). Se copia a mano al servidor y no debe renombrarse (`config.js:2-3`).
- **Notas:** `RUTA_BD` es relativa al directorio de trabajo (`config.js:20`); contraseña SMTP en claro (`config.js:29-34`).

### Rutas (interfaz web)

#### `server.js`

- **Responsabilidad de negocio:** arranca el programa y muestra el panel de inicio: facturas totales, pendientes de cobro, importe pendiente y clientes activos (`server.js:20-36`).
- **Depende de:** `express`, `body-parser`, `db.js`, `config.js` y los cinco routers (`server.js:9-12,38-42`).
- **Quién depende de él:** nadie; es el punto de entrada (`package.json:5,7`).
- **Criticidad: MEDIA.** Sin él no hay programa, pero apenas tiene reglas de negocio. El importe pendiente solo suma la serie `FA` (`server.js:24`).

#### `routes/facturas.js`

- **Responsabilidad de negocio:** todo lo que se hace con una factura desde el navegador: listarla, crearla, imprimirla, marcarla como cobrada y rectificarla entera.
- **Depende de:** `db.js`, `lib/util.js`, `services/calculo.js`, `lib/numeracion.js`, `services/email.js`, `config.js` (`routes/facturas.js:7-12`).
- **Quién depende de él:** `server.js:41` lo monta en `/facturas`.
- **Criticidad: ALTA.** Crea documentos fiscales y cambia estados (`routes/facturas.js:74-99,118,154`). La rectificativa invierte signos sin recalcular (`routes/facturas.js:124-164`). Detalle completo en `flujo-factura.md`.

#### `routes/informes.js`

- **Responsabilidad de negocio:** resumen trimestral de IVA para el modelo 303 y CSV anual que importa la gestoría.
- **Depende de:** `db.js`, `lib/util.js`, `config.js` (`routes/informes.js:5-7`).
- **Quién depende de él:** `server.js:42`; consumidor externo: la gestoría (`routes/informes.js:32-33`).
- **Criticidad: ALTA.** Alimenta las declaraciones fiscales. El formato del CSV está pactado (`;`, coma decimal, clave en la primera línea, CRLF) (`routes/informes.js:32-50`).
- **Notas:** el IVA se suma desde `lineas` y el CSV desde la cabecera de `facturas` (`routes/informes.js:23-25,36-38`); el trimestre termina siempre en día `31` (`routes/informes.js:19`).

#### `routes/contratos.js`

- **Responsabilidad de negocio:** contratos de cuota mensual y cálculo del último mes al dar uno de baja; esa factura se emite luego a mano.
- **Depende de:** `db.js`, `lib/util.js`, `services/calculo.js` (`routes/contratos.js:5-7`).
- **Quién depende de él:** `server.js:40`; sus contratos son la entrada de la remesa (`scripts/remesa_mensual.js:26-29`).
- **Criticidad: MEDIA.** Las fechas de alta y baja deciden qué factura la remesa, pero el módulo no graba facturas.
- **Notas:** el prorrateo solo se devuelve en la URL (`routes/contratos.js:40`); no hay formulario de alta (§5).

#### `routes/clientes.js` y `routes/articulos.js`

- **Responsabilidad de negocio:** alta y baja lógica de clientes (con recargo de equivalencia y días de pago) y del catálogo de artículos (`routes/clientes.js:32-37`, `routes/articulos.js:26-31`).
- **Depende de:** `db.js`; clientes además `lib/util.js`, artículos `config.js` (`routes/clientes.js:5-6`, `routes/articulos.js:5-6`).
- **Quién depende de ellos:** `server.js:38-39`; los artículos activos rellenan el desplegable de la factura (`routes/facturas.js:33`).
- **Criticidad:** clientes **MEDIA**: `recargo_equivalencia` y `dias_pago` cambian importe y vencimiento (`services/calculo.js:49`, `routes/facturas.js:68`). Artículos **BAJA**: la factura usa el precio del formulario, no el del catálogo (`routes/facturas.js:57-62`).

### Procesos y servicios

#### `scripts/remesa_mensual.js`

- **Responsabilidad de negocio:** graba de golpe las facturas de cuota de todos los contratos vigentes en un mes, prorrateando los que empiezan o terminan dentro de él.
- **Depende de:** `db.js`, `lib/util.js`, `services/calculo.js`, `lib/numeracion.js` (`scripts/remesa_mensual.js:9-12`).
- **Quién depende de él:** nadie; lo lanza una persona a mano (`scripts/remesa_mensual.js:3-7`). Lo escribió Roberto (becario) en 2021.
- **Criticidad: ALTA.** Graba facturas reales en lote; un error no se deshace borrando (`lib/numeracion.js:3-6`).
- **Notas:** prorratea por días reales del mes, no por 30 (`scripts/remesa_mensual.js:43-51`); vencimiento `dias_pago || 30` sin usar `config` (`scripts/remesa_mensual.js:60`); llama a `db.inicializar`, que siembra datos si la BD está vacía (`scripts/remesa_mensual.js:23`).

#### `services/email.js`

- **Responsabilidad de negocio:** debería enviar la factura al cliente; hoy solo avisa por consola de que hay que enviarla a mano.
- **Quién depende de él:** solo el alta de facturas (`routes/facturas.js:93`).
- **Criticidad: BAJA** mientras siga desactivado (`services/email.js:26-28`). Las facturas se envían a mano desde el Outlook de Marga (`services/email.js:3-6`).

### Presentación

- **`views/factura_detalle.ejs` — ALTA.** Es la factura que recibe el cliente: datos de empresa, NIF, registro mercantil y factura rectificada (`views/factura_detalle.ejs:5-7,13,43`). Los botones de cobro y rectificación solo salen en facturas `FA` `emitida` (`views/factura_detalle.ejs:47-52`).
- **`views/factura_nueva.ejs` — MEDIA.** Formulario de seis líneas. Los nombres de campo (`desc`, `cant`, `precio`, `iva`, `obs`) son el contrato con la ruta (`views/factura_nueva.ejs:15-18,25`); solo ofrece IVA 21/10/4 (`views/factura_nueva.ejs:18`).
- **`views/informes.ejs` / `informe_iva.ejs` — MEDIA.** La gestoría revisa estos importes; los totales se suman en la vista sin redondear (`views/informe_iva.ejs:5`).
- **Resto de vistas (`facturas`, `clientes`, `articulos`, `contratos`, `index`, `cabecera`, `pie`) — BAJA.** Listados, formularios simples y menú (`views/cabecera.ejs:11-19`).
- **`public/js/factura.js` — BAJA.** Autorrellena precio e IVA al elegir artículo (`public/js/factura.js:1-15`).
- **`public/css/estilos.css` — BAJA.** Salvo la regla `@media print`, que deja limpia la factura impresa (`public/css/estilos.css:28`).

### Ficheros de proyecto

- **`package.json` — MEDIA.** Dependencias y arranque (`package.json:5-16`).
- **`package-lock.json` — BAJA.** No refleja lo instalado (§5).
- **`node_modules/` (versionado) — ALTA.** Es la instalación que funciona, con el binario de SQLite para Windows, y no es reproducible con el lockfile (§5).
- **`LEEME.txt` — BAJA.** Desactualizado (`LEEME.txt:20`), pero es lo único escrito sobre las copias de seguridad (`LEEME.txt:18`).
- **`datos/migracion_mysql_2018.sql` — NULA.** Migración nunca hecha (§5).

## 3. Diagrama de dependencias

```text
 npm start ──► server.js ──► routes/clientes.js ──┐
                 │           routes/articulos.js ─┤
                 │           routes/contratos.js ─┼──► services/calculo.js ──► lib/util.js
                 │           routes/facturas.js ──┤
                 │             │   └──► services/email.js (desactivado)
                 │             └──────► lib/numeracion.js ──┐
                 │           routes/informes.js             │
                 │                                          ▼
 node scripts/remesa_mensual.js ──► calculo, numeracion, util, db.js ──► datos/gesfact.db
                                                            ▲            (ruta relativa al cwd)
                          todos los routers ────────────────┘
 routes/informes.js ──► CSV ──► Contaplus de la gestoría (externo)
 views/*.ejs ──► cabecera.ejs / pie.ejs ──► public/css/estilos.css
 Sin conexión: datos/migracion_mysql_2018.sql, LEEME.txt, módulo de albaranes (fuera del repo)
```

## 4. Tecnologías y versiones reales

Deducidas de `package.json`, `package-lock.json` y lo instalado en `node_modules/` (no de `LEEME.txt`).

| Tecnología | Versión | Evidencia |
| --- | --- | --- |
| Node.js | No declarada; el árbol instalado exige **≥ 10** (contradice el «node 8» de `LEEME.txt:5`). Local: v24.11.0 | `engines` de `prebuild-install`, `tar`, `node-abi`, `semver`. Ver S1 |
| npm | ≥ 7 (SUPOSICIÓN) | `package-lock.json:4` `lockfileVersion: 3` |
| Express | 4.22.3 instalada (el lockfile dice 4.22.2) | `node_modules/express/package.json`, `package.json:14` |
| body-parser | 1.20.9 instalada (el lockfile dice 1.20.5) | `node_modules/body-parser/package.json`, `server.js:17` |
| EJS | 3.1.10 | `node_modules/ejs/package.json` |
| sqlite3 / motor SQLite | 5.1.7 / 3.44.2 | `node_modules/sqlite3/package.json`, `require('sqlite3').VERSION` |
| Estilo | CommonJS, ES5, callbacks | `server.js:9-36`, `routes/facturas.js:42-102` |
| Front-end | HTML + EJS, CSS y JS sin librerías; requiere navegador moderno | `public/js/factura.js:3,8`, `views/factura_nueva.ejs:22` |
| nodemailer | No instalado | `services/email.js:8` |
| Tests / linter / build | Ninguno | `package.json:6-8` |

## 5. Zonas oscuras

- **Migración a MySQL huérfana.** `datos/migracion_mysql_2018.sql` no lo usa ningún código; nunca se ejecutó y su esquema está desfasado (`datos/migracion_mysql_2018.sql:1-5`).
- **Email desactivado.** El envío real está comentado y `nodemailer` no está instalado (`services/email.js:8,12-25`); `config.SMTP` solo lo usa código muerto.
- **Configuración sin uso.** `EMPRESA.email` no aparece en ninguna vista (`config.js:15`); `IVA_DEFECTO` es inalcanzable desde la interfaz (`routes/articulos.js:16`, `views/articulos.ejs:18`); el teléfono `'925 511 XXX'` se imprime tal cual (`config.js:14`, `views/factura_detalle.ejs:7`).
- **Exportaciones sin uso externo.** `recargoPara`, `calcularLinea`, `porcentajeDescuento` y `formatear` solo se usan dentro de su módulo (`services/calculo.js:105-107`, `lib/numeracion.js:46`).
- **Alta de contratos sin pantalla.** Existe `POST /contratos/nuevo` (`routes/contratos.js:16-26`), pero la vista no tiene formulario (`views/contratos.ejs:11-13`). Ver S3.
- **Prorrateo «en la barra de direcciones».** El importe de la baja va en `?prorrateo=` y la vista no lo muestra (`routes/contratos.js:9-14,40`, `views/contratos.ejs:17`).
- **Albaranes inexistentes.** Están a medias en el ordenador de Roberto (`LEEME.txt:15-16`); en el repo no hay rastro. Ver S6.
- **Rectificación solo total.** No hay abono parcial; las facturas cobradas solo se pueden rectificar escribiendo la URL a mano (`routes/facturas.js:132-133`, `views/factura_detalle.ejs:47`).
- **Lockfile desalineado.** 77 paquetes en el lockfile frente a 184 instalados; 108 no figuran (todo el árbol de `sqlite3`) y 7 tienen otra versión. `npm ci` no reproduciría esta instalación.
- **BD idéntica a la siembra.** Ver la ficha de `datos/gesfact.db` y S2.
- **Facturas históricas de remesa imposibles con el script actual.** Tienen varias líneas y cantidades fraccionarias raras (0,44 cajas, 0,97 kg…); el script crea una sola línea (`db.js:126-130,168-171`, `scripts/remesa_mensual.js:54`). Ver S4.
- **Ficheros sensibles en git.** `datos/gesfact.db`, `node_modules/` y la contraseña SMTP; no hay `.gitignore`.

## 6. Anomalías y suposiciones registradas en este documento (índice)

- **A1** Numeración leída y actualizada sin transacción → posibles duplicados — §2, `lib/numeracion.js:8-10,16-35`.
- **A2** El año del número sale del reloj, no de la fecha de la factura (remesa de diciembre lanzada el 1 de enero) — §2, `lib/numeracion.js:15`, `scripts/remesa_mensual.js:59`.
- **A3** Alta y rectificación graban cabecera y líneas sin transacción; la rectificación ignora errores — §2, `routes/facturas.js:74-99,148-158`.
- **A4** Dos prorrateos distintos: 30 días en la baja, días reales en la remesa — §2, `services/calculo.js:95-102`, `scripts/remesa_mensual.js:47-51`.
- **A5** Vencimiento por defecto: la remesa usa 30 fijo y el alta `config.VENCIMIENTO_DIAS` — §2, `scripts/remesa_mensual.js:60`, `routes/facturas.js:68`.
- **A6** La remesa no excluye clientes dados de baja — §2, `scripts/remesa_mensual.js:26-29`.
- **A7** Lanzar la remesa desde otra carpeta crea una BD nueva, la siembra y factura contratos de ejemplo — §2, `config.js:20`, `db.js:11-15,83-87`.
- **A8** `sumarDias` con desfase de un día según la zona horaria — §2, `lib/util.js:17-26`.
- **A9** `validarNIF` solo comprueba la longitud — §2, `lib/util.js:41-48`.
- **A10** Lockfile que no describe lo instalado — §5.
- **A11** BD, `node_modules/` y contraseña SMTP versionados — §5, `config.js:29-34`.
- **S1** Versión de Node en la oficina (`LEEME.txt` dice 8; el árbol instalado exige ≥ 10 y los tests ≥ 18) — §4 (pregunta a Julián).
- **S2** ¿Es `datos/gesfact.db` la BD de producción? Es idéntica a la siembra y no tiene facturas posteriores a mayo de 2026 — §2 (pregunta a Marga).
- **S3** Cómo se dan de alta hoy los contratos, si no hay formulario — §5 (pregunta a Marga).
- **S4** Cómo se generaron las facturas históricas de remesa con varias líneas — §5 (pregunta a Julián).
- **S5** Si la remesa se sigue lanzando el día 1 y desde qué carpeta — A2, A7 (pregunta a Marga).
- **S6** Estado real del módulo de albaranes — §5 (pregunta a Roberto).

Ninguna de estas anomalías se corrige en esta fase. Se documentan para trasladarlas al registro de anomalías y, en su caso, a decisión escrita del negocio.
