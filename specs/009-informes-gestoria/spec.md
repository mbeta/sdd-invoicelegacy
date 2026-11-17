# Especificación: Informes para la gestoría (comportamiento actual)

**Rama**: `009-informes-gestoria`

**Creada**: 2026-11-17

**Estado**: Borrador

**Entrada**: descripción del usuario: «Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de los informes para la gestoría (resumen trimestral de IVA y exportación CSV anual para Contaplus) de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.» (El texto completo, con el alcance RN-41 a RN-45, las convenciones, las anomalías, las referencias a otras specs y los criterios, se recoge íntegro en las secciones de esta spec.)

## Naturaleza de esta spec

- **Es una spec inversa.** Cada requisito describe lo que GesFact 2.4 hace **hoy**, aunque parezca un error. Nada de lo que aquí se exige obliga a cambiar el programa actual (constitución, principio I).
- **Evidencia.** Cada requisito cita su evidencia: `fichero:líneas` del código, dato real de la copia de `datos/gesfact.db` (los datos históricos están en la siembra de `db.js:95-173`) o acta de negocio. Los tests se citan como `fichero › «título del test»`, todos en `pruebas/caracterizacion/servidor-informes.test.js` salvo que se diga otra cosa.
- **Anomalías.** Se especifican tal como funcionan hoy, con su ID del [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md). No se corrigen ni se omiten.
- **Convenciones declaradas.** Lo que el negocio dice que **debería** pasar se presenta como «convención declarada», nunca como requisito.
- **Testimonio de negocio.** Las actas citadas son la [entrevista simulada](../000-reconocimiento/entrevista-negocio-simulada.md) y la [ratificación simulada](../000-reconocimiento/ratificacion-negocio-simulada.md) del 2026-11-16 (testigo NEGOCIO-RS). Arrastran una **deuda de confirmación**: no afecta a esta spec, que fija el comportamiento actual, pero sí a cualquier corrección posterior.
- **Qué decide esta spec.** Qué facturas entran en cada informe, de dónde sale cada importe (líneas o cabecera) y el formato exacto del CSV que importa la gestoría. **Cómo** se escribe cada importe y cada fecha (RN-46, RN-50) es de la spec 010; **por qué** las cabeceras no cuadran con sus líneas (A-01), de la [spec 001](../001-calculo-importe-factura/spec.md).
- **Dos salidas, dos fuentes.** El resumen suma las líneas y el CSV copia las cabeceras; con los datos reales no coinciden (A-02). La gestoría declara el 303 con el CSV (RS-01). Esta spec conserva cada salida con su fuente.
- **Golden master.** El golden master del ciclo de vida no cubre los informes. El test «CSV 2026 byte a byte» hace de master del CSV de 2026.
- **Línea base verificada.** El 2026-11-17, sobre el commit `2b49ea5`, `servidor-informes.test.js` pasa **20 de 20** tests, sin cambios en `datos/gesfact.db`.

## User Scenarios & Testing *(mandatory)*

### Historia 1 - La gestoría descarga el CSV anual y lo importa en Contaplus (Priority: P1)

Puri, de la gestoría, descarga el CSV del año desde «Informes». El fichero lleva en la primera línea la clave que identifica a Suministros Hidalgo en su importador, en la segunda los nombres de las columnas y después una fila por factura del año, con los importes de la cabecera de cada factura. Lo importa en Contaplus y de ahí sale el modelo 303. El formato se acordó con Puri en 2019 y no se puede cambiar sin avisarla.

**Why this priority**: es la salida con efecto fiscal: el IVA declarado sale de este fichero.

**Independent Test**: «CONGELA comportamiento actual: CSV 2026 byte a byte, CRLF sin salto final, FA antes que RE (A-31, RN-44)».

**Acceptance Scenarios**:

1. **Given** la copia de la BD real, **When** se descarga el CSV de 2026, **Then** es exactamente este texto, con las líneas separadas por retorno de carro y salto de línea y sin salto tras la última:

   ```text
   CLAVE;SH-CONTA-7731
   NUMERO;FECHA;CLIENTE;NIF;BASE;IVA;RECARGO;TOTAL;ESTADO
   FA-2026-000101;31/01/2026;Cafetería La Parada, S.C.;J45771102;133,20;27,97;0,00;161,17;cobrada
   FA-2026-000102;06/02/2026;Ferretería El Tornillo;03488812K;115,60;24,28;6,01;145,89;cobrada
   FA-2026-000103;20/02/2026;Hotel Vega Baja, S.A.;A45102939;1.000,00;210,00;0,00;1.210,00;cobrada
   FA-2026-000104;05/03/2026;Panadería Hnos. Cifuentes;E45332218;152,30;6,09;0,76;159,15;cobrada
   FA-2026-000105;31/03/2026;Restaurante Casa Ubaldo, S.L.;B45610021;2.287,75;468,63;0,00;2.756,38;emitida
   FA-2026-000106;30/04/2026;Bar Nuevo Siglo;70355910k;101,61;20,62;0,00;122,23;rectificada
   FA-2026-000107;06/05/2026;Bar Nuevo Siglo;70355910k;101,61;20,62;0,00;122,23;emitida
   FA-2026-000108;31/05/2026;Cafetería La Parada, S.C.;J45771102;128,05;26,19;0,00;154,24;emitida
   RE-2026-000001;06/05/2026;Bar Nuevo Siglo;70355910k;-101,61;-20,62;0,00;-122,23;emitida
   ```

   Test: «CONGELA comportamiento actual: CSV 2026 byte a byte, CRLF sin salto final, FA antes que RE (A-31, RN-44)».
2. **Given** la misma copia, **When** se descarga el CSV de 2026, **Then** se entrega como fichero de texto CSV en UTF-8 llamado «facturas_2026.csv». Test: «cabeceras HTTP: text/csv UTF-8 y fichero facturas_2026.csv».
3. **Given** un año sin facturas (2019), **When** se descarga su CSV, **Then** contiene solo la línea de la clave y la de las columnas. Test: «CONGELA comportamiento actual: un año sin facturas da solo la clave y la cabecera (RN-44)».
4. **Given** el reloj en 2026, **When** se descarga el CSV sin indicar año, **Then** es el de 2026. Test: «sin año usa el del reloj (2026)».
5. **Given** una factura del cliente «Bar; Copas» (sin NIF) con fecha 2026-11-10, **When** se descarga el CSV de 2026, **Then** su fila es «FA-2026-000109;10/11/2026;Bar; Copas;;10,00;2,10;0,00;12,10;emitida», con 10 campos en lugar de 9. Test: «CONGELA comportamiento actual: un «;» en el nombre del cliente añade una columna a la fila (A-31)».
6. **Given** cualquier visitante sin identificarse, **When** descarga el CSV, **Then** recibe la clave de la gestoría en la primera línea. Test: «CONGELA comportamiento actual: la clave de la gestoría se sirve en claro a cualquiera, sin autenticación (A-40)».

---

### Historia 2 - Administración consulta el resumen trimestral de IVA (Priority: P2)

Desde «Informes», se elige un año y un trimestre y el programa muestra el IVA repercutido de ese trimestre desglosado por tipo de IVA: base, cuota de IVA y recargo, con una fila TOTAL. Las cifras salen de sumar las líneas de las facturas cuya fecha cae en el trimestre, de cualquier serie y estado; las rectificativas restan solas porque sus líneas son negativas. La gestoría lo mira por encima, pero no lo usa para declarar.

**Why this priority**: es la única vista del IVA por tipo, pero no es la fuente del 303.

**Independent Test**: bloque «RN-41 / RN-43 · resumen trimestral de IVA (GET /informes/iva), suma de LÍNEAS».

**Acceptance Scenarios**:

1. **Given** la copia de la BD real, **When** se pide el 1T de 2026, **Then** el título es «Resumen de IVA repercutido · 1T 2026» y la tabla:

   | Tipo | Base | Cuota IVA | Recargo eq. |
   | --- | --- | --- | --- |
   | 21% | 2.533,30 | 532,00 | 6,01 |
   | 10% | 392,20 | 39,22 | 0,00 |
   | 4% | 811,10 | 32,44 | 0,76 |
   | TOTAL | 3.736,60 | 603,66 | 6,77 |

   Test: «ejemplo de reglas-de-negocio.md: 1T 2026 por tipo y fila TOTAL».
2. **Given** la misma copia, **When** se pide el 2T de 2026, **Then** el TOTAL es base 229,66, IVA 44,32 y recargo 0,00: las líneas de RE-2026-000001 (06/05/2026) restan en el 2T. Test: «2T 2026: base 229,66 e IVA 44,32 (contradiccion-02 §3.1); la RE resta en su trimestre».
3. **Given** el reloj en 2026, **When** se pide el resumen sin año, con trimestre 0, o con año y trimestre no numéricos, **Then** se muestra el 1T de 2026. Test: «valores por defecto: sin año usa el del reloj (2026); trimestre vacío, 0 o no numérico → 1».
4. **Given** un trimestre sin facturas (4T de 2025), **When** se pide, **Then** la tabla tiene solo la fila de títulos y un TOTAL a 0,00. Test: «un trimestre sin facturas muestra solo la cabecera y un TOTAL a cero».

---

### Historia 3 - El resumen y el CSV no dan las mismas cifras (Priority: P3)

Como el resumen suma las líneas y el CSV copia las cabeceras, y 6 de las 9 facturas históricas tienen la cabecera descuadrada con sus líneas, las dos salidas dan importes distintos para el mismo trimestre. En el 1T de 2026 el resumen dice 603,66 € de IVA y el CSV suma 736,97 €. El 303 se presentó con 736,97 €.

**Why this priority**: es una diferencia de 133,31 € de IVA en un trimestre ya declarado; la cifra buena para la gestoría es la del CSV.

**Independent Test**: bloque «A-02 · el resumen de IVA y el CSV dan cifras distintas para el mismo periodo (C02)».

**Acceptance Scenarios**:

1. **Given** la copia de la BD real, **When** se pide el resumen del 1T de 2026, **Then** su TOTAL es base 3.736,60, IVA 603,66 y recargo 6,77. Test: «CONGELA comportamiento actual: implementación A · resumen (líneas) 1T 2026 → base 3.736,60, IVA 603,66, recargo 6,77 (A-02, C02)».
2. **Given** la misma copia, **When** se suman las filas de enero a marzo del CSV de 2026, **Then** dan base 3.688,85, IVA 736,97 y recargo 6,77. Test: «CONGELA comportamiento actual: implementación B · CSV (cabeceras) 1T 2026 → base 3.688,85, IVA 736,97, recargo 6,77 (A-02, C02)».
3. **Given** la misma copia, **When** se compara el 2T de 2026, **Then** el resumen da 44,32 € de IVA y las filas de abril a junio del CSV suman 46,81 € (20,62 + 20,62 + 26,19 − 20,62). Evidencia: el test del 2T de la historia 2 y las filas del CSV de la historia 1.

---

### Historia 4 - Lo que muestran los informes de otras reglas (Priority: P4)

Los informes reflejan dos reglas que se especifican en otras specs: la rectificativa lleva la fecha del día en que se hace y resta en ese trimestre (spec 007), y el número de una factura toma el año del reloj, mientras que los informes usan el año de la fecha (spec 004).

**Why this priority**: no son reglas de los informes, pero cualquier reimplementación de los informes tiene que reproducir su efecto.

**Independent Test**: bloques «RN-41 / A-28 · la rectificativa resta en el trimestre de su propia fecha» y «A-20 · ejercicio del número frente a fecha de la factura (C03)».

**Acceptance Scenarios**:

1. **Given** FA-2026-000102 (06/02/2026), **When** se rectifica el 2026-11-16, **Then** el 1T de 2026 no cambia (TOTAL 3.736,60 / 603,66 / 6,77) y el 4T muestra 21 % → −115,60 / −24,28 / −6,01. Test: «CONGELA comportamiento actual: rectificar hoy una factura del 1T no cambia el 1T y resta en el 4T (A-28, RN-41)».
2. **Given** esa rectificación, **When** se descarga el CSV de 2026, **Then** FA-2026-000102 aparece «rectificada» en su sitio y RE-2026-000002 (16/11/2026, −145,89) es la última fila. Test: «en el CSV, la original queda «rectificada» y la RE nueva aparece al final con fecha de hoy».
3. **Given** FA-2027-000001 con fecha 2026-12-30 (dada de alta el 2 de enero de 2027), **When** se descargan los CSV, **Then** sale en el de 2026, entre las FA-2026 y las RE, y el de 2027 no tiene filas. Test: «CONGELA comportamiento actual: FA-2027-000001 con fecha 2026-12-30 sale en el CSV de 2026, entre las FA-2026 y las RE (A-20, C03)».
4. **Given** esa factura, **When** se pide el 4T de 2026, **Then** suma en él: el TOTAL del 4T es −5,60 / −1,18 / −6,01, que reúne la RE del escenario 1 (−115,60), la factura de «Bar; Copas» de la historia 1 (10,00) y esta (100,00). Test: «CONGELA comportamiento actual: la FA-2027-000001 con fecha 2026-12-30 suma en el 4T de 2026 (A-20, C03)».

---

### Historia 5 - Un trimestre inexistente da error (Priority: P5)

El resumen solo conoce los trimestres 1 a 4. Si se pide otro número (por ejemplo, 5), la pantalla da un error interno en lugar del resumen.

**Why this priority**: no se alcanza desde el formulario de «Informes»; solo con una dirección escrita a mano.

**Independent Test**: «CONGELA comportamiento actual: ?trimestre=5 responde 500 (RN-42, A-47)».

**Acceptance Scenarios**:

1. **Given** el año 2026, **When** se pide el trimestre 5, **Then** responde con error 500. Test: el citado. El contenido del error (la traza con rutas del servidor, A-53) está excluido de esta spec.

---

### Edge Cases

- **Trimestre 0, vacío o no numérico:** se toma el 1 (FR-002).
- **Trimestre 5 o mayor, o negativo:** error 500 (FR-003). Solo el 5 tiene test; el resto se verifica por inspección.
- **Día 31 en meses de 30 días:** el límite superior del 2T y del 3T es «-06-31» y «-09-31»; como las fechas se comparan como texto, incluyen el último día real (FR-003).
- **Factura con fecha no ISO («2026/10/20», «2026-1-5»):** queda fuera de todos los trimestres; «2026-1-5» sí entra en el CSV del año y «2026/10/20» no (A-21, spec 003; ver «Comportamiento documentado sin especificar»).
- **Factura sin líneas** (por ejemplo, la RE de A-24): su cabecera sale en el CSV, pero no suma nada en el resumen (FR-001, FR-005).
- **Factura cuyo cliente ya no existe en la base de datos:** no sale en el CSV (FR-004).
- **Cliente sin NIF:** el campo NIF va vacío (FR-004).
- **«;» en el nombre del cliente:** la fila gana una columna (FR-006, A-31).
- **Factura con número de un año y fecha de otro:** los informes usan la fecha (Historia 4, A-20).
- **Error de la base de datos:** responde 500 «Error BD: » seguido del mensaje de error, en las dos salidas (FR-001, FR-004).

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito describe el comportamiento **actual**.

- **FR-001 (RN-41) · Qué suma el resumen.** El resumen trimestral suma las **líneas** de todas las facturas cuya fecha cae entre el primer día del trimestre y el límite superior de FR-003, de cualquier serie (FA y RE) y cualquier estado (emitida, cobrada, rectificada). Agrupa por tipo de IVA, de mayor a menor tipo, y muestra por cada tipo la suma de bases, de cuotas de IVA y de cuotas de recargo. Las rectificativas restan en el trimestre de su propia fecha porque sus líneas son negativas. Si falla la base de datos, responde 500 «Error BD: » seguido del mensaje. Dato real del 1T de 2026: 21 % → 2.533,30 / 532,00 / 6,01; 10 % → 392,20 / 39,22 / 0,00; 4 % → 811,10 / 32,44 / 0,76.
  - Evidencia: `routes/informes.js:14-30` (la consulta, `:23-25`; el comentario «las rectificativas entran con signo negativo y cuadran solas», `:21-22`); `views/informe_iva.ejs:2-10`.
  - Test: «ejemplo de reglas-de-negocio.md: 1T 2026 por tipo y fila TOTAL» y «2T 2026: base 229,66 e IVA 44,32 (contradiccion-02 §3.1); la RE resta en su trimestre».
- **FR-002 (RN-41) · Año y trimestre por defecto.** Si no se indica año, o no es un número, se usa el año actual del reloj del servidor. Si no se indica trimestre, o es 0 o no es un número, se usa el 1. Los trimestres son naturales: 1 = enero a marzo, 2 = abril a junio, 3 = julio a septiembre, 4 = octubre a diciembre.
  - Evidencia: `routes/informes.js:15-17`.
  - Test: «valores por defecto: sin año usa el del reloj (2026); trimestre vacío, 0 o no numérico → 1».
- **FR-003 (RN-42) · Límites del trimestre.** El trimestre va del día 1 de su primer mes al día **31** de su último mes, también en los trimestres que acaban en un mes de 30 días (2T: de 2026-04-01 a 2026-06-31; 3T: de 2026-07-01 a 2026-09-31). Como las fechas se comparan como texto, el resultado incluye exactamente los días reales del trimestre cuando la fecha está escrita AAAA-MM-DD. Con un trimestre que no sea de 1 a 4 (y distinto de 0), responde con error 500.
  - Evidencia: `routes/informes.js:16-19` (no hay límites para un trimestre fuera de 1-4, `:17-18`). Anomalía A-47 (en el registro, «documentar sin especificar»; corregible en la modernización sin efecto retroactivo). El contenido de la respuesta de error es A-53, excluida.
  - Test: «CONGELA comportamiento actual: ?trimestre=5 responde 500 (RN-42, A-47)»; para el límite del 2T, «2T 2026: base 229,66 e IVA 44,32…» (incluye FA-2026-000108, del 31 de mayo, y excluye las de julio en adelante).
- **FR-004 (RN-44) · Qué entra en el CSV.** El CSV anual tiene una fila por cada factura cuya fecha empieza por «<año>-», de cualquier serie y estado, siempre que su cliente exista. Las filas van ordenadas por número de factura comparado como texto, así que las FA van antes que las RE, y una FA de otro año con fecha de este va entre las FA del año y las RE. Sin año indicado, o si no es un número, se usa el año actual del reloj del servidor. Si falla la base de datos, responde 500 «Error BD: » seguido del mensaje.
  - Evidencia: `routes/informes.js:34-39`.
  - Test: «CONGELA comportamiento actual: CSV 2026 byte a byte, CRLF sin salto final, FA antes que RE (A-31, RN-44)», «sin año usa el del reloj (2026)» y «CONGELA comportamiento actual: FA-2027-000001 con fecha 2026-12-30 sale en el CSV de 2026, entre las FA-2026 y las RE (A-20, C03)».
- **FR-005 (RN-44, RN-45) · Formato del CSV.** El CSV es un texto con estas líneas, separadas por retorno de carro y salto de línea (CRLF) y **sin** salto tras la última:
  1. «CLAVE;» seguido de la clave de la gestoría, hoy «CLAVE;SH-CONTA-7731».
  2. «NUMERO;FECHA;CLIENTE;NIF;BASE;IVA;RECARGO;TOTAL;ESTADO».
  3. Una línea por factura con, separados por «;» y sin comillas: el número; la fecha en DD/MM/AAAA; el nombre del cliente; su NIF, o vacío si no tiene; la base, el IVA, el recargo y el total **de la cabecera de la factura**, con punto de miles, coma decimal y dos decimales (RN-46, spec 010); y el estado.

  Se entrega como fichero «facturas_<año>.csv», de tipo texto CSV en UTF-8. Filas reales: «FA-2026-000105;31/03/2026;Restaurante Casa Ubaldo, S.L.;B45610021;2.287,75;468,63;0,00;2.756,38;emitida» y «RE-2026-000001;06/05/2026;Bar Nuevo Siglo;70355910k;-101,61;-20,62;0,00;-122,23;emitida».
  - Evidencia: `routes/informes.js:32-50` (comentario «formato acordado con Puri en 2019: punto y coma, decimales con coma, y la clave en la primera linea», `:32-33`); `config.js:36-37` («clave que pide la gestoria … (no cambiar)»). Anomalía A-31 (formato).
  - Test: «CONGELA comportamiento actual: CSV 2026 byte a byte, CRLF sin salto final, FA antes que RE (A-31, RN-44)», «cabeceras HTTP: text/csv UTF-8 y fichero facturas_2026.csv» y «CONGELA comportamiento actual: un año sin facturas da solo la clave y la cabecera (RN-44)».
- **FR-006 · Campos del CSV sin proteger.** Los campos del CSV se escriben tal cual, sin comillas ni escape. Un «;» en el nombre del cliente (o en cualquier otro campo) añade una columna a esa fila. Hoy ningún cliente de la copia tiene «;» en el nombre.
  - Evidencia: `routes/informes.js:43-45`; consulta sobre la copia `SELECT COUNT(*) FROM clientes WHERE nombre LIKE '%;%'` → 0 (ratificación, P24, Puri, 2026-11-16). Anomalía A-31 (campos sin proteger).
  - Test: «CONGELA comportamiento actual: un «;» en el nombre del cliente añade una columna a la fila (A-31)».
- **FR-007 · Clave de la gestoría.** La primera línea del CSV lleva la clave de la gestoría en claro, y el CSV lo puede descargar cualquiera que llegue al programa, sin identificarse.
  - Evidencia: `routes/informes.js:34-40`; `config.js:36-37`. Anomalía A-40 (parte de la clave). La autenticación (A-39) está excluida.
  - Test: «CONGELA comportamiento actual: la clave de la gestoría se sirve en claro a cualquiera, sin autenticación (A-40)».
- **FR-008 (RN-43) · Fila TOTAL del resumen.** La fila TOTAL suma las cifras de las filas por tipo tal como salen, sin redondearlas, y cada cifra de la tabla (filas y TOTAL) se muestra con dos decimales. Dato real: la base al 4 % del 1T de 2026 sale de la suma como 811,0999999999999 y se muestra «811,10». Un trimestre sin facturas muestra solo la fila de títulos y un TOTAL a 0,00.
  - Evidencia: `views/informe_iva.ejs:5` (acumula), `:7-9` y `:12-14` (muestra con dos decimales). El formato de los importes es RN-46 (spec 010).
  - Test: «ejemplo de reglas-de-negocio.md: 1T 2026 por tipo y fila TOTAL» y «un trimestre sin facturas muestra solo la cabecera y un TOTAL a cero».
- **FR-009 (RN-45) · Dos fuentes distintas.** El resumen toma los importes de las **líneas** (FR-001) y el CSV, de la **cabecera** de cada factura (FR-005). Cuando la cabecera de una factura no cuadra con sus líneas, las dos salidas dan cifras distintas para el mismo periodo. Datos reales: 1T de 2026, resumen 3.736,60 / 603,66 / 6,77 frente a CSV 3.688,85 / 736,97 / 6,77; 2T de 2026, IVA 44,32 frente a 46,81.
  - Evidencia: `routes/informes.js:23-25` frente a `:36-38`. Anomalía A-02; la causa (cabeceras descuadradas) es A-01, spec 001.
  - Test: «CONGELA comportamiento actual: implementación A · resumen (líneas) 1T 2026 → base 3.736,60, IVA 603,66, recargo 6,77 (A-02, C02)» y «CONGELA comportamiento actual: implementación B · CSV (cabeceras) 1T 2026 → base 3.688,85, IVA 736,97, recargo 6,77 (A-02, C02)».

### Anomalías de esta spec

Todas están cerradas en el [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md) (§7).

| ID | Clasificación | Comportamiento especificado | Tratamiento acordado | Decisión de negocio | Tests |
| --- | --- | --- | --- | --- | --- |
| A-02 | BUG HISTÓRICO CON DEPENDIENTES (C02) | FR-009 (resumen por líneas, CSV por cabeceras) | Especificar tal cual, cada salida con su fuente; unificar en la cabecera en la modernización. No retroactivo: regularizar trimestres presentados es decisión de la gestoría | Acta simulada, P01, Puri, 2026-11-16; ratificación, RS-01, Puri, 2026-11-16 | «implementación A · resumen (líneas) 1T 2026 …» e «implementación B · CSV (cabeceras) 1T 2026 …» |
| A-31 | INTENCIONAL (formato) / BUG A SECAS latente (campos sin proteger) | FR-005 (formato byte a byte) y FR-006 (campos sin proteger) | Especificar tal cual, byte a byte; proteger los campos solo con acuerdo previo de la gestoría (PR-4). No retroactivo | Acta simulada, P24, Puri, 2026-11-16; ratificación, P24 (§2.1), Puri, 2026-11-16 → RS-19 | «CSV 2026 byte a byte, CRLF sin salto final, FA antes que RE (A-31, RN-44)» y «un «;» en el nombre del cliente añade una columna a la fila (A-31)» |
| A-40 (parte de la clave) | ACCIDENTAL | FR-007 (clave en claro, descargable por cualquiera) | Especificar la clave tal cual (formato acordado). La contraseña SMTP y la gestión de secretos quedan excluidas | Acta simulada, P24, Puri, 2026-11-16; ratificación, RS-27, Manoli y Puri, 2026-11-16 (la clave solo identifica a la empresa) | «la clave de la gestoría se sirve en claro a cualquiera, sin autenticación (A-40)» |

Referencias a anomalías de otras specs cuyo efecto muestran los informes:

| ID | Spec dueña | Efecto en los informes | Tests |
| --- | --- | --- | --- |
| A-20 | 004 | Una FA numerada en un año con fecha del anterior sale en el CSV y en el trimestre del año de su fecha | Bloque «A-20 · ejercicio del número frente a fecha de la factura (C03)» (2) |
| A-28 | 007 | La RE resta en el trimestre de su propia fecha | «rectificar hoy una factura del 1T no cambia el 1T y resta en el 4T (A-28, RN-41)» |
| A-47 (parte del trimestre) | Registro: «documentar sin especificar» | Límite del día 31 y error 500 con un trimestre inexistente (FR-003) | «?trimestre=5 responde 500 (RN-42, A-47)» |
| A-21 | 003 | Una fecha no ISO queda fuera de todos los trimestres | Ninguno en los informes (ver «Comportamiento documentado sin especificar») |

### Comportamiento documentado sin especificar

- **Fechas no ISO en los informes (A-21, spec 003).** Según el registro, una factura con fecha no ISO «queda fuera de todos los trimestres, aunque sí entra en el CSV del año». Por inspección de la comparación como texto (`routes/informes.js:18-19`, `:38`), eso vale para «2026-1-5»; una fecha con barras como «2026/10/20» no empieza por «2026-», así que tampoco entra en el CSV. Hoy todas las fechas de la copia son ISO (registro, A-21, QD18). No hay test en `servidor-informes.test.js`; queda documentado para la spec 003 y la modernización.
- **Traza del error 500 (A-53).** El error del trimestre inexistente devuelve una traza con rutas del servidor. Está excluida de las specs; el test «el error 500 no controlado devuelve la traza con rutas del servidor (A-53)» sigue en la suite, pero no forma parte del contrato de esta spec.

### Convenciones declaradas (no son requisitos)

Son conducta deseada declarada por el negocio. Esta spec **no las impone**.

| # | Convención declarada | Fuente | Relación con el comportamiento actual |
| --- | --- | --- | --- |
| Fuente del 303 | La gestoría declara el 303 con el CSV (cabeceras): el del 1T de 2026 se presentó con 736,97 € de IVA. El resumen de pantalla «lo miramos por encima, no lo cuadramos» | Acta simulada, P01, Puri, 2026-11-16 → ratificación, RS-01 | **Coincide** con FR-005 y FR-009 (el CSV da 736,97). El texto de la pantalla, «Estos importes los revisa la gestoría antes del modelo 303» (`views/informe_iva.ejs:16`), no refleja esa práctica |
| PR-4 · Formato del CSV | Formato exacto y «no se cambia nada sin avisarnos antes»; el importador no admite comillas; la clave identifica a la empresa en el importador | Acta simulada, P24, Puri, 2026-11-16; ratificación, P24 (§2.1), Puri, 2026-11-16 → RS-19 y RS-27 | **Coincide** con FR-005 y FR-007. Que el importador no admita comillas condiciona cualquier corrección de FR-006 |

### Huecos de cobertura

- **Trimestres negativos o mayores que 5 (FR-003).** Solo el 5 tiene test; el resto se verifica por inspección de `routes/informes.js:16-18`.
- **Límite del día 31 en el 3T (FR-003).** No hay facturas en el 3T de la copia; se verifica por inspección de `routes/informes.js:17-19`.
- **Factura con cliente inexistente y factura sin líneas en los informes (FR-001, FR-004).** Sin test; se verifican por inspección de las consultas (`routes/informes.js:23-25`, `:36-38`).
- **Errores de la base de datos (FR-001, FR-004).** Sin test: haría falta inyectar fallos. Se verifican por inspección de `routes/informes.js:27` y `:39`.

### Fuera de alcance

- Formato de importes y fechas (RN-46, RN-50): spec 010.
- Por qué las cabeceras no cuadran con sus líneas (A-01): spec 001.
- Año del número (A-20, RN-23) y fecha de la RE (A-28, RN-29): specs 004 y 007.
- Validación de la fecha tecleada (A-21): spec 003.
- Autenticación (A-39), contraseña SMTP y gestión de secretos (A-40, parte SMTP) y trazas de error (A-53): excluidas.
- Pantalla índice de «Informes» (`routes/informes.js:9-11`): solo ofrece los enlaces; su presentación es de la spec 010.

### Key Entities

- **Trimestre**: año y número del 1 al 4; periodo de fechas del día 1 del primer mes al día 31 del último (FR-002, FR-003).
- **Fila del resumen**: tipo de IVA, suma de bases, suma de cuotas de IVA y suma de recargos de las líneas del trimestre (FR-001).
- **Fila TOTAL**: suma de las filas sin redondear, mostrada con dos decimales (FR-008).
- **CSV anual**: clave, cabecera de columnas y una fila por factura del año con los importes de su cabecera (FR-004, FR-005).
- **Clave de la gestoría**: identificador de Suministros Hidalgo en el importador de la gestoría, hoy «SH-CONTA-7731» (FR-007).

## Success Criteria *(mandatory)*

### Measurable Outcomes

Esta spec es un contrato de comportamiento; sus criterios se miden con la suite de caracterización existente, que no se modifica.

- **SC-001**: el test «CSV 2026 byte a byte, CRLF sin salto final, FA antes que RE (A-31, RN-44)» pasa con el CSV de 2026 idéntico byte a byte (11 líneas, CRLF, sin salto final).
- **SC-002**: pasa el 100 % de los bloques «RN-41 / RN-43 · …» (4 tests), «RN-44 / A-31 · …» (5), «A-02 · …» (2), «RN-41 / A-28 · …» (2), «A-31 · …» (1) y «A-20 · …» (2) de `servidor-informes.test.js`.
- **SC-003**: del bloque «RN-42 · trimestres inexistentes» pasa el test «?trimestre=5 responde 500 (RN-42, A-47)». El otro test del bloque (A-53) sigue en la suite, fuera del contrato de esta spec.
- **SC-004**: el IVA del 1T de 2026 es 603,66 € en el resumen y 736,97 € en el CSV, como en el 303 presentado.
- **SC-005**: los 9 requisitos (FR-001 a FR-009) tienen al menos un test citado; las partes sin test figuran en «Huecos de cobertura» con su criterio de inspección.
- **SC-006**: Puri puede descargar el CSV de 2026 de una copia, importarlo en una copia de Contaplus y obtener los mismos importes que con el programa actual, sin ninguna fila rechazada.

## Assumptions

- La versión de referencia es el código del commit `2b49ea5` y la copia de `datos/gesfact.db` versionada en ese commit. La BD de producción no se toca; los tests trabajan sobre copias temporales, con reloj (2026-11-16 10:00) y zona horaria (`Europe/Madrid`) fijos.
- La gestoría importa el CSV en Contaplus con el formato de 2019 (P24, Puri, 2026-11-16 → RS-19); no hay otras salidas hacia la gestoría.
- El testimonio de negocio citado es simulado y ratificado por la responsable del proyecto (NEGOCIO-RS). No condiciona esta spec, que fija el comportamiento actual; sí condiciona cualquier corrección futura (deuda de confirmación).
- La numeración (009) y el nombre (`009-informes-gestoria`) siguen la [propuesta de partición](../000-reconocimiento/propuesta-particion-specs.md).
