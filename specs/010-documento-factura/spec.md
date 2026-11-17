# Especificación: Documento de factura y presentación de importes (comportamiento actual)

**Rama**: `010-documento-factura`

**Creada**: 2026-11-17

**Estado**: Borrador

**Entrada**: descripción del usuario: «Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del documento de factura que recibe el cliente (contenido impreso, formato de importes y fechas, envío por correo) y de las presentaciones de importes de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.» (El texto completo, con el alcance RN-46, RN-50 y RN-51, las convenciones, las anomalías y los criterios, se recoge íntegro en las secciones de esta spec.)

## Naturaleza de esta spec

- **Es una spec inversa.** Cada requisito describe lo que GesFact 2.4 hace **hoy**, aunque parezca un error. Nada de lo que aquí se exige obliga a cambiar el programa actual (constitución, principio I).
- **Evidencia.** Cada requisito cita su evidencia: `fichero:líneas` del código, dato real de la copia de `datos/gesfact.db` (los datos históricos están en la siembra de `db.js:95-173`) o acta de negocio. Los tests se citan como `fichero › «título del test»`, todos en `pruebas/caracterizacion/`.
- **Anomalías.** Se especifican tal como funcionan hoy, con su ID del [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md). No se corrigen ni se omiten.
- **Convenciones declaradas.** Lo que el negocio dice que **debería** pasar se presenta como «convención declarada», nunca como requisito.
- **Testimonio de negocio.** Las actas citadas son la [entrevista simulada](../000-reconocimiento/entrevista-negocio-simulada.md) y la [ratificación simulada](../000-reconocimiento/ratificacion-negocio-simulada.md) del 2026-11-16 (testigo NEGOCIO-RS). Arrastran una **deuda de confirmación**: no afecta a esta spec, que fija el comportamiento actual, pero sí a cualquier corrección posterior.
- **Qué decide esta spec.** Lo que el cliente recibe y lee: qué contiene la factura impresa, cómo se escriben en ella los importes, las cantidades y las fechas, y qué pasa con el envío por correo. También cómo escriben los importes las pantallas internas, que no siguen el formato de la factura. **Cuánto** vale cada importe es de las specs [001](../001-calculo-importe-factura/spec.md) y [002](../002-descuento-volumen/spec.md); qué filas lleva el CSV, de la [spec 009](../009-informes-gestoria/spec.md).
- **Externo frente a interno.** Se **especifican** los formatos de lo que ven el cliente y la gestoría: la factura, el listado de facturas, el resumen de IVA y el CSV. Los de las pantallas internas (panel, artículos, contratos, aviso de la baja y consola de la remesa) se **documentan sin especificar** (A-19).
- **Cómo se verifica la factura impresa.** No hay instantánea del documento completo ([LEEME de la suite](../../pruebas/caracterizacion/LEEME.md), «Fuera de la red»): los criterios de la factura impresa se verifican por fragmentos.
- **Golden master.** No tiene casos en el golden master del ciclo de vida.
- **Línea base verificada.** El 2026-11-17, sobre el commit `2b49ea5`, `servidor-facturas.test.js`, `servidor-informes.test.js`, `util.test.js` y `anomalias-calculo.test.js` pasan **128 de 128** tests, sin cambios en `datos/gesfact.db`.

## User Scenarios & Testing *(mandatory)*

### Historia 1 - Administración imprime la factura y la envía a mano (Priority: P1)

Marga abre el detalle de una factura y pulsa «Imprimir / PDF». El navegador imprime solo el documento: los datos de la empresa, el número y la fecha, los datos del cliente, las líneas, los totales y la inscripción en el Registro Mercantil. Guarda el PDF y lo envía al cliente desde su Outlook, porque el programa no envía correos desde 2022.

**Why this priority**: es el documento fiscal que recibe el cliente.

**Independent Test**: `servidor-facturas.test.js` › bloque «RN-51 · lo que se imprime en la factura (GET /facturas/:id)».

**Acceptance Scenarios**:

1. **Given** FA-2026-000101, **When** se abre su detalle, **Then** responde 200 y el documento lleva el teléfono «925 511 XXX», la cantidad «0.44» de la línea del vaso de caña con su precio «21,60» y la inscripción «Insc. R.M. de Toledo, Tomo 1.482, Folio 90, Hoja TO-28.315». Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: teléfono «925 511 XXX» y cantidad con punto decimal «0.44» (A-44, RN-51)».
2. **Given** RE-2026-000001, **When** se abre su detalle, **Then** el documento muestra «Rectifica a: FA-2026-000106» en negrita, no muestra «Vencimiento:» y la cantidad de la línea de café sale «-0.97». Test: `servidor-facturas.test.js` › «RN-51 · la rectificativa imprime «Rectifica a:», no imprime vencimiento y la cantidad sale «-0.97»».
3. **Given** una FA emitida, una cobrada y una RE, **When** se abre su detalle, **Then** solo la FA emitida muestra los botones de cobro y de rectificación. Test: `servidor-facturas.test.js` › «RN-51 · los botones de cobro y rectificación solo salen en FA emitidas».
4. **Given** una factura que no existe (999), **When** se abre su detalle, **Then** responde 404 «Factura no encontrada». Test: `servidor-facturas.test.js` › «una factura inexistente responde 404 «Factura no encontrada»».

---

### Historia 2 - Los importes y las fechas del documento van en formato español (Priority: P2)

En la factura, en el listado de facturas, en el resumen de IVA y en el CSV de la gestoría, los importes llevan punto de miles, coma decimal y dos decimales, y las fechas van como día/mes/año. Es el formato acordado con la gestoría.

**Why this priority**: es lo que leen el cliente y la gestoría; cualquier cambio de formato rompe la importación en Contaplus (spec 009).

**Independent Test**: `util.test.js` › bloques «RN-46 · formatearImporte: punto de miles, coma decimal, dos decimales» y «RN-50 · fechaBonita: AAAA-MM-DD → DD/MM/AAAA sin validar».

**Acceptance Scenarios**:

1. **Given** los importes 1234.5, −122.23, 1234567.891, 1.005, 0.005, −0.001 y un valor no numérico, **When** se escriben, **Then** salen «1.234,50», «-122,23», «1.234.567,89», «1,00», «0,01», «-0,00» y «0,00». Test: `util.test.js` › «ejemplos de reglas-de-negocio.md» (bloque RN-46).
2. **Given** 999,99, 1.000 y 1.000,01, **When** se escriben, **Then** salen «999,99», «1.000,00» y «1.000,01». Test: `util.test.js` › «frontera del separador de miles: 999,99 / 1.000 / 1.000,01».
3. **Given** 999,995 y 999.999,999, **When** se escriben, **Then** el redondeo añade un grupo de miles: «1.000,00» y «1.000.000,00». Test: `util.test.js` › «el redondeo de toFixed puede añadir un grupo de miles: 999,995 → «1.000,00»; 999.999,999 → «1.000.000,00»».
4. **Given** 0, −0 y −1234.5, **When** se escriben, **Then** salen «0,00», «0,00» y «-1.234,50». Test: `util.test.js` › «cero, cero negativo y negativos grandes».
5. **Given** un importe vacío, inexistente, «abc» o «12», **When** se escribe, **Then** salen «0,00», «0,00», «0,00» y «12,00». Test: `util.test.js` › «vacíos e inexistentes: null, undefined y texto no numérico → «0,00»; texto numérico se formatea».
6. **Given** la fecha 2026-05-31, **When** se escribe, **Then** sale «31/05/2026»; una fecha vacía o inexistente sale vacía. Tests: `util.test.js` › «ejemplo de reglas-de-negocio.md: 2026-05-31 → 31/05/2026» y «vacíos e inexistentes → cadena vacía».
7. **Given** una fecha mal grabada «31/05/2026» o sin ceros «2026-1-5», **When** se escribe, **Then** sale «undefined/undefined/31/05/2026» o «5/1/2026». Tests: `util.test.js` › «CONGELA comportamiento actual: una fecha mal grabada sale como «undefined/undefined/31/05/2026» (RN-50)» y «CONGELA comportamiento actual: una fecha sin ceros se reordena sin rellenar: 2026-1-5 → 5/1/2026 (A-21)».

---

### Historia 3 - El programa no envía la factura por correo (Priority: P3)

Al grabar una factura, el programa intenta «enviarla», pero el envío está desactivado desde 2022: solo deja un aviso en la consola del servidor con el número de la factura y el correo del cliente, y continúa como si se hubiera enviado. Las facturas se envían a mano desde el Outlook de Marga. Nadie debe reactivar el envío sin hablar con Manoli, que lleva el contrato de Arsys y el dominio.

**Why this priority**: el cliente no recibe la factura si Marga no la envía a mano; el programa no deja constancia de qué falta por enviar.

**Independent Test**: `servidor-facturas.test.js` › «CONGELA comportamiento actual: el email no se envía, solo escribe un aviso en consola (A-35, RN-20)».

**Acceptance Scenarios**:

1. **Given** el alta de FA-2026-000109 para Cafetería La Parada (correo `laparada@gmail.com`), **When** se graba, **Then** no se envía ningún correo y la consola del servidor muestra `[email] AVISO: envio desactivado. Factura FA-2026-000109 pendiente de enviar a mano a laparada@gmail.com`. Test: el citado.

---

### Historia 4 - La factura muestra datos actuales y un teléfono sin completar (Priority: P4)

El documento se compone cada vez que se abre: los datos de la empresa salen de la configuración, con el teléfono a medio escribir («925 511 XXX»), y el aviso de régimen de recargo sale de la marca **actual** del cliente, no de la que tenía al emitirse la factura.

**Why this priority**: hoy no hay efecto real (no hay pantalla para cambiar clientes y ninguno ha cambiado de régimen), pero un PDF reimpreso podría no coincidir con el enviado.

**Independent Test**: `servidor-facturas.test.js` › «CONGELA comportamiento actual: la marca de recargo impresa es la ACTUAL del cliente, no la de la emisión (A-44)».

**Acceptance Scenarios**:

1. **Given** una factura del cliente 1 grabada sin recargo, **When** se marca al cliente 1 en recargo en la copia y se vuelve a abrir la factura, **Then** aparece «Cliente en régimen de recargo de equivalencia», aunque la factura sigue con recargo 0. Test: el citado.
2. **Given** cualquier factura, **When** se abre, **Then** el teléfono de la empresa es «925 511 XXX». Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: teléfono «925 511 XXX» y cantidad con punto decimal «0.44» (A-44, RN-51)».

---

### Historia 5 - Las pantallas internas escriben los importes de otra forma (Priority: P5)

El panel de inicio, los listados de artículos y contratos, el aviso del prorrateo de una baja y la consola de la remesa escriben los importes con punto decimal y sin separador de miles («3032.85»), y redondean algunos medios céntimos de forma distinta a como se grabaron. Nadie usa esas pantallas como fuente.

**Why this priority**: no llega al cliente ni a la gestoría; solo es un riesgo de transcripción.

**Independent Test**: `anomalias-calculo.test.js` › bloque «A-19 · lo que se muestra se redondea distinto de lo que se graba (C05)»; `servidor-informes.test.js` › «CONGELA comportamiento actual: el importe del panel usa toFixed, con punto decimal y sin miles: «3032.85» (A-19, C05)».

**Acceptance Scenarios**:

1. **Given** la copia de la BD real, **When** se abre el panel, **Then** el importe pendiente sale «3032.85 €», mientras que en una factura el mismo importe saldría «3.032,85». Tests: `servidor-informes.test.js` › el citado; `anomalias-calculo.test.js` › «CONGELA comportamiento actual: el formato del panel y el de la factura difieren para el mismo importe (A-19, C05)».
2. **Given** los importes 2,675 y −19,425, **When** se graban, se muestran en una pantalla interna y se escriben en la factura, **Then** se graban 2,68 y −19,42; la pantalla interna muestra «2.67» y «-19.43»; la factura, «2,67» y «-19,43». Tests: `anomalias-calculo.test.js` › «CONGELA comportamiento actual: implementación C · redondear2, lo que se graba (A-19, C05)», «… implementación B · toFixed(2), panel/artículos/contratos/URL de baja (A-19, C05)» e «… implementación A · formatearImporte, factura/CSV/resumen (A-19, C05)».
3. **Given** los 2.000.001 medios céntimos del barrido E7, **When** se compara lo que se graba con lo que muestran las pantallas internas, **Then** difieren en 868.744. Test: `anomalias-calculo.test.js` › «CONGELA comportamiento actual: barrido E7, 868.744 de 2.000.001 medios céntimos difieren entre redondear2 y toFixed (A-19, C05)».

---

### Edge Cases

- **Rectificativa:** el título sigue siendo «FACTURA <número>»; lleva «Rectifica a: <número>» y no lleva vencimiento (FR-003, FR-004).
- **Cliente sin NIF, dirección, código postal o población:** el hueco sale vacío, con los separadores (FR-005).
- **Línea sin recargo:** la celda de recargo sale en blanco, no «0,00»; la fila «Recargo equivalencia» de los totales solo sale si la factura tiene recargo (FR-006, FR-007).
- **Cantidad decimal o negativa:** se imprime con punto decimal y sin formatear («0.44», «-0.97») (FR-006).
- **Precio con más de dos decimales:** se imprime redondeado a dos con el redondeo de la factura, que puede no coincidir con el que se usó para grabar la base (A-19). Hoy no hay ningún importe con más de dos decimales en la copia.
- **Medio céntimo:** «1,005» sale «1,00» y «0,005», «0,01» (FR-001).
- **Importe infinito:** sale «Infinity,undefined» (A-51; documentado sin especificar).
- **Fecha mal grabada o sin ceros:** se reordena sin validar (FR-002).
- **Factura cuyo cliente ya no existe, o error al leerla:** responde 404 «Factura no encontrada» (FR-009).
- **Error al leer las líneas:** responde 500 «Error BD: » seguido del mensaje (FR-009).
- **Cliente sin correo:** el aviso de consola dice «(sin email)» (FR-010).

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito describe el comportamiento **actual**.

- **FR-001 (RN-46) · Formato de importes en los documentos externos.** En la factura, el listado de facturas, el resumen de IVA y el CSV de la gestoría, cada importe se escribe con punto de miles, coma decimal y exactamente dos decimales, con «-» delante si es negativo. El redondeo a dos decimales es el de la representación decimal del importe, que no siempre sube el medio céntimo («1,005» → «1,00»; «0,005» → «0,01») y puede añadir un grupo de miles («999,995» → «1.000,00»). Un importe muy pequeño negativo sale «-0,00»; el cero negativo, «0,00». Un importe vacío, inexistente o no numérico sale «0,00»; un texto numérico se escribe como su número.
  - Evidencia: `lib/util.js:50-58` (formatearImporte); usos en `views/factura_detalle.ejs:28-40`, `views/facturas.ejs:19`, `views/informe_iva.ejs:7-14`, `routes/informes.js:44-45`.
  - Test: `util.test.js` › bloque «RN-46 · formatearImporte: punto de miles, coma decimal, dos decimales» (5 tests, sin contar el de A-51).
- **FR-002 (RN-50) · Formato de fechas en los documentos externos.** Las fechas grabadas como AAAA-MM-DD se escriben como DD/MM/AAAA. No se valida nada: el texto se parte por los guiones y se reordena, así que una fecha sin ceros sale sin ceros («2026-1-5» → «5/1/2026») y una sin guiones sale con «undefined» («31/05/2026» → «undefined/undefined/31/05/2026»). Una fecha vacía o inexistente sale vacía.
  - Evidencia: `lib/util.js:28-33` (fechaBonita); usos en `views/factura_detalle.ejs:11-12`, `views/facturas.ejs:17`, `views/contratos.ejs:9`, `routes/informes.js:43`.
  - Test: `util.test.js` › bloque «RN-50 · fechaBonita: AAAA-MM-DD → DD/MM/AAAA sin validar» (4 tests).
- **FR-003 (RN-51) · Contenido fijo de la factura impresa.** El documento lleva siempre, en este orden: el nombre de la empresa en negrita, su NIF, su dirección, su código postal y población y su teléfono; el título «FACTURA <número>» (también en las rectificativas); «Fecha: DD/MM/AAAA»; «Estado: » seguido del estado; los datos del cliente; la tabla de líneas; «Base imponible», «IVA» y «TOTAL» con el símbolo €; y la inscripción registral. Datos de empresa actuales: Suministros Hidalgo, S.L.; B45812390; Pol. Ind. La Vega, nave 7; 45200 Illescas (Toledo); 925 511 XXX; Insc. R.M. de Toledo, Tomo 1.482, Folio 90, Hoja TO-28.315. El teléfono se imprime literalmente «925 511 XXX». El correo de la empresa no se imprime.
  - Evidencia: `views/factura_detalle.ejs:5-11`, `:14`, `:17-19`, `:22-38`, `:40`, `:43`; `config.js:7-17`. El teléfono es A-44.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: teléfono «925 511 XXX» y cantidad con punto decimal «0.44» (A-44, RN-51)».
- **FR-004 (RN-51) · Contenido condicional de la cabecera.** «Vencimiento: DD/MM/AAAA» sale solo si la factura tiene vencimiento (las rectificativas no lo tienen). «Rectifica a: <número>», en negrita, sale solo si la factura rectifica a otra. Dato real: RE-2026-000001 → «Rectifica a: FA-2026-000106», sin vencimiento.
  - Evidencia: `views/factura_detalle.ejs:12-13`.
  - Test: `servidor-facturas.test.js` › «RN-51 · la rectificativa imprime «Rectifica a:», no imprime vencimiento y la cantidad sale «-0.97»».
- **FR-005 (RN-51) · Datos del cliente.** El documento lleva «Cliente:» con el nombre y el NIF separados por « · », y debajo la dirección, « · », el código postal y la población; un dato que falta sale vacío. Si el cliente está **hoy** en régimen de recargo de equivalencia, añade en cursiva «Cliente en régimen de recargo de equivalencia». Todos estos datos son los actuales del cliente, no los que tenía al emitirse la factura.
  - Evidencia: `views/factura_detalle.ejs:17-21`; la lectura une la factura con el cliente actual (`routes/facturas.js:105-106`). Anomalía A-44 (marca de recargo actual).
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: la marca de recargo impresa es la ACTUAL del cliente, no la de la emisión (A-44)».
- **FR-006 (RN-51) · Tabla de líneas.** Una fila por línea con: descripción; cantidad **sin formatear**, con punto decimal («0.44», «-0.97»); precio, base y cuota de IVA con el formato de FR-001; tipo de IVA como el número seguido de «%» («21%»); y la cuota de recargo con el formato de FR-001 solo si no es 0 (si es 0, la celda va en blanco). La columna de recargo («Rec. eq.») sale siempre. El orden de las líneas es de la spec 003 (A-46).
  - Evidencia: `views/factura_detalle.ejs:23-34` (cantidad sin formatear en `:27`; recargo en blanco en `:32`). El formato de la cantidad es parte de A-19.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: teléfono «925 511 XXX» y cantidad con punto decimal «0.44» (A-44, RN-51)» y «RN-51 · la rectificativa imprime «Rectifica a:», no imprime vencimiento y la cantidad sale «-0.97»».
- **FR-007 (RN-51) · Totales y observaciones.** La fila «Recargo equivalencia» sale solo si la factura tiene recargo. Las observaciones salen debajo de los totales solo si existen. Los importes de los totales son los de la cabecera de la factura.
  - Evidencia: `views/factura_detalle.ejs:37-42`.
  - Test: los fragmentos de la factura impresa (Historia 1) no comprueban estas dos filas; ver «Huecos de cobertura».
- **FR-008 (RN-51) · Botones fuera del documento.** Debajo del documento salen siempre el botón «Imprimir / PDF» y, solo en las facturas de la serie FA en estado «emitida», «Marcar cobrada» y el campo de motivo con «Rectificar (abono total)». Nada de eso sale al imprimir: al imprimir solo sale el documento.
  - Evidencia: `views/factura_detalle.ejs:45-53`; `public/css/estilos.css:28` (oculta la cabecera, el menú, el pie y los botones al imprimir).
  - Test: `servidor-facturas.test.js` › «RN-51 · los botones de cobro y rectificación solo salen en FA emitidas» (comprueba «Marcar cobrada»; la impresión se verifica por inspección).
- **FR-009 (RN-51) · Factura inexistente.** Si la factura no existe, su cliente no existe o falla la lectura de la cabecera, responde 404 «Factura no encontrada». Si falla la lectura de las líneas, responde 500 «Error BD: » seguido del mensaje.
  - Evidencia: `routes/facturas.js:105-110`.
  - Test: `servidor-facturas.test.js` › «una factura inexistente responde 404 «Factura no encontrada»».
- **FR-010 · Envío por correo desactivado.** Al grabar una factura del alta, el programa llama al envío por correo, que no envía nada: escribe en la consola del servidor «[email] AVISO: envio desactivado. Factura », el número, « pendiente de enviar a mano a » y el correo del cliente (o «(sin email)» si no tiene) y devuelve que todo ha ido bien. No queda constancia en la base de datos de qué facturas faltan por enviar. La remesa no llama al envío.
  - Evidencia: `services/email.js:3-6` («FUERA DE SERVICIO desde 2022 … Hablar con Manoli antes de reactivar esto»), `:26-28`; `config.js:27-28`. La llamada desde el alta (`routes/facturas.js:93-95`) es de la spec 003. Anomalía A-35.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: el email no se envía, solo escribe un aviso en consola (A-35, RN-20)».

### Anomalías de esta spec

Todas están cerradas en el [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md) (§7).

| ID | Clasificación | Comportamiento especificado | Tratamiento acordado | Decisión de negocio | Tests |
| --- | --- | --- | --- | --- | --- |
| A-19 | ACCIDENTAL (C05) | FR-001 y FR-006 (formatos externos: importes y cantidad sin formatear). Las pantallas internas se documentan sin especificar | Especificar los formatos externos; documentar los internos; corregir los internos en la modernización, sin efecto retroactivo | Ninguna para clasificar. Que las pantallas internas no se usan como fuente: acta simulada, P28, Marga, 2026-11-16 → RS-22 | `anomalias-calculo.test.js` › bloque «A-19 · …» (5); `servidor-informes.test.js` › «el importe del panel usa toFixed, con punto decimal y sin miles: «3032.85» (A-19, C05)» |
| A-35 | INTENCIONAL | FR-010 (envío desactivado, aviso en consola) | Especificar tal cual («no tocar»); recuperar el envío en la modernización con Manoli. No retroactivo | Acta simulada, P31, Manoli, 2026-11-16; ratificación, N-13, Julián, 2026-11-16 → RS-23 (Manoli, Julián) | `servidor-facturas.test.js` › «el email no se envía, solo escribe un aviso en consola (A-35, RN-20)» |
| A-44 | ACCIDENTAL | FR-003 (teléfono «925 511 XXX») y FR-005 (marca de recargo actual) | Especificar tal cual; completar el teléfono. No retroactivo: los PDF ya enviados no cambian | Acta simulada, P34, Marga, 2026-11-16 → RS-31 | `servidor-facturas.test.js` › «teléfono «925 511 XXX» y cantidad con punto decimal «0.44» (A-44, RN-51)» y «la marca de recargo impresa es la ACTUAL del cliente, no la de la emisión (A-44)» |
| A-51 | ACCIDENTAL | Ninguno: se documenta sin especificar (ver abajo) | Documentar sin especificar; corregible en la modernización sin efecto retroactivo | Ninguna | `util.test.js` › «CONGELA comportamiento actual: Infinity se formatea como «Infinity,undefined» (A-51)» |

### Comportamiento documentado sin especificar

- **Formatos de las pantallas internas (A-19).** El importe pendiente del panel (`views/index.ejs:6`), los precios de artículos (`views/articulos.ejs:8`), las cuotas de contratos (`views/contratos.ejs:8`), el prorrateo de la baja en la dirección de la página (`routes/contratos.js:40`) y la consola de la remesa (`scripts/remesa_mensual.js:71`) escriben los importes con punto decimal, dos decimales y sin separador de miles («3032.85»). Su redondeo del medio céntimo no siempre coincide con el que se graba (868.744 de 2.000.001 casos en el barrido E7) ni, en negativos, con el de la factura. Nadie las usa como fuente (P28, Marga). Sus tests siguen en la suite y protegen el comportamiento, pero no forman parte del contrato externo de esta spec.
- **Importe infinito (A-51).** Un importe infinito se escribiría «Infinity,undefined» (o «-Infinity,undefined»). Ningún importe de la copia es infinito y no se alcanza con datos válidos.
- **Datos del cliente actuales (hallazgo de lectura).** No solo la marca de recargo (A-44): el nombre, el NIF y la dirección impresos también son los actuales del cliente (`routes/facturas.js:105-106`). Hoy no hay pantalla para modificar clientes, así que no pueden cambiar (registro, A-44, DATOS). Propuesta: ampliar A-44 en el registro con este matiz.

### Convenciones declaradas (no son requisitos)

Son conducta deseada declarada por el negocio. Esta spec **no las impone**.

| # | Convención declarada | Fuente | Relación con el comportamiento actual |
| --- | --- | --- | --- |
| Formato español | Todo documento externo (factura y CSV) va en formato español: coma decimal y punto de miles; el formato del CSV no se toca sin avisar a la gestoría (PR-4) | Comentario «formato acordado con Puri en 2019: punto y coma, decimales con coma» (`routes/informes.js:32-33`); acta simulada, P24, Puri, 2026-11-16 → PR-4 | **Coincide** con FR-001 y FR-002. La cantidad impresa con punto decimal (FR-006) es la excepción |
| PR-5 · Correo | Nadie toca el dominio ni la configuración de correo sin Manoli | Acta simulada, P31, Manoli, 2026-11-16 → ratificación, RS-23 | **Coincide** con FR-010 (el envío sigue desactivado) |
| Recuperar el envío | Dirección quiere recuperar el envío por correo en la modernización | Acta simulada, P32, Dirección, 2026-11-16 | **Diverge** del comportamiento actual (FR-010); es un objetivo de la modernización, no de esta spec |

### Huecos de cobertura

- **Documento completo.** No hay instantánea del HTML de la factura (LEEME, «Fuera de la red»): el orden de FR-003 y los textos fijos que no aparecen en los fragmentos se verifican por inspección de `views/factura_detalle.ejs:5-43`.
- **Fila de recargo, celda de recargo en blanco y observaciones (FR-006, FR-007).** Ningún fragmento las comprueba; se verifican por inspección de `views/factura_detalle.ejs:32`, `:39` y `:42`.
- **Impresión sin botones (FR-008).** Se verifica por inspección de `public/css/estilos.css:28`; el test de los botones solo comprueba «Marcar cobrada».
- **Cliente inexistente y error al leer las líneas (FR-009).** Sin test; inspección de `routes/facturas.js:105-110`.
- **Cliente sin correo en el aviso (FR-010).** Sin test; inspección de `services/email.js:26-27`.

### Fuera de alcance

- Contenido y orden del CSV de la gestoría (que usa FR-001 y FR-002): spec 009.
- Cálculo de los importes que se imprimen: specs 001 y 002.
- Llamada al envío dentro del alta y estado inicial «emitida» (RN-20): spec 003.
- Orden de las líneas impresas (A-46): spec 003.
- Contraseña SMTP en la configuración (A-40, parte SMTP): excluida.

### Key Entities

- **Factura impresa**: documento compuesto al abrir el detalle con los datos de la empresa (configuración), de la factura (cabecera y líneas grabadas) y del cliente (datos actuales).
- **Datos de la empresa**: nombre, NIF, dirección, código postal, población, teléfono e inscripción registral (FR-003).
- **Importe externo**: importe escrito con punto de miles, coma decimal y dos decimales (FR-001).
- **Fecha externa**: fecha escrita DD/MM/AAAA, sin validar (FR-002).
- **Aviso de envío**: línea en la consola del servidor que sustituye al correo (FR-010).

## Success Criteria *(mandatory)*

### Measurable Outcomes

Esta spec es un contrato de comportamiento; sus criterios se miden con la suite de caracterización existente, que no se modifica.

- **SC-001**: pasa el 100 % del bloque «RN-51 · lo que se imprime en la factura (GET /facturas/:id)» de `servidor-facturas.test.js` (5 tests) y el test «el email no se envía, solo escribe un aviso en consola (A-35, RN-20)».
- **SC-002**: en `util.test.js` pasan los 5 tests de formato del bloque «RN-46 · formatearImporte: …», incluida la frontera 999,99 / 1.000 / 1.000,01, y los 4 del bloque «RN-50 · fechaBonita: …».
- **SC-003**: pasa el 100 % del bloque «A-19 · …» de `anomalias-calculo.test.js` (5 tests) y el test del panel «3032.85» de `servidor-informes.test.js`. Estos tests fijan los formatos internos, documentados sin especificar.
- **SC-004**: los 10 requisitos (FR-001 a FR-010) tienen al menos un test citado, salvo FR-007, cuyas filas figuran en «Huecos de cobertura» con su criterio de inspección.
- **SC-005**: Marga puede imprimir a PDF una factura de una copia y comprobar, sin consultar el código, que contiene exactamente los datos, formatos y textos que describe esta spec, sin botones en el papel.

## Assumptions

- La versión de referencia es el código del commit `2b49ea5` y la copia de `datos/gesfact.db` versionada en ese commit. La BD de producción no se toca; los tests trabajan sobre copias temporales, con reloj (2026-11-16 10:00) y zona horaria (`Europe/Madrid`) fijos.
- El PDF que recibe el cliente es la impresión del navegador de la vista de detalle, como dice el comentario de `services/email.js:4-5`; no hay otra plantilla de factura.
- El testimonio de negocio citado es simulado y ratificado por la responsable del proyecto (NEGOCIO-RS). No condiciona esta spec, que fija el comportamiento actual; sí condiciona cualquier corrección futura (deuda de confirmación).
- La numeración (010) y el nombre (`010-documento-factura`) siguen la [propuesta de partición](../000-reconocimiento/propuesta-particion-specs.md).
