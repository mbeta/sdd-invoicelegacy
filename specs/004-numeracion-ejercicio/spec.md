# Especificación: Numeración legal, series y fecha de los documentos (comportamiento actual)

**Rama**: `004-numeracion-ejercicio`

**Creada**: 2026-11-16

**Estado**: Borrador

**Entrada**: descripción del usuario: «Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la numeración legal de facturas (formato, series, contadores, año y reserva del número) y de la fecha por defecto de los documentos de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.» (El texto completo, con el alcance RN-21 a RN-26 y RN-49, las convenciones, las anomalías y los criterios, se recoge íntegro en las secciones de esta spec.)

## Naturaleza de esta spec

- **Es una spec inversa.** Cada requisito describe lo que GesFact 2.4 hace **hoy**, aunque parezca un error. Nada de lo que aquí se exige obliga a cambiar el programa actual (constitución, principio I).
- **Evidencia.** Cada requisito cita su evidencia: `fichero:líneas` del código, dato real de la copia de `datos/gesfact.db` o acta de negocio. Los tests se citan como `fichero › «título del test»`, todos en `pruebas/caracterizacion/`.
- **Anomalías.** Se especifican tal como funcionan hoy, con su ID del [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md). No se corrigen ni se omiten.
- **Convenciones declaradas.** Lo que el negocio dice que **debería** pasar se presenta como «convención declarada», nunca como requisito.
- **Testimonio de negocio.** Las actas citadas son la [entrevista simulada](../000-reconocimiento/entrevista-negocio-simulada.md) y la [ratificación simulada](../000-reconocimiento/ratificacion-negocio-simulada.md) del 2026-11-16 (testigo NEGOCIO-RS). Arrastran una **deuda de confirmación**: no afecta a esta spec, que fija el comportamiento actual, pero sí a cualquier corrección posterior.
- **Por qué importa.** La numeración de las facturas es una obligación legal: debe ser correlativa por serie y año, y desde la inspección de 2020 las facturas no se borran nunca (`lib/numeracion.js:3-6`). Esta spec fija cómo se numera hoy, incluidos los casos en que el programa incumple esa obligación.
- **Línea base verificada.** El 2026-11-16, sobre el commit `2b49ea5`, los seis ficheros de test citados (`numeracion`, `util`, `golden-master`, `servidor-facturas`, `remesa` y `servidor-informes`) pasan **160 de 160** tests.

## User Scenarios & Testing *(mandatory)*

### Historia 1 - Cada factura recibe el siguiente número de su serie y año (Priority: P1)

Cada vez que se emite una factura, el programa le da el siguiente número de su serie: FA para las ordinarias (alta manual y remesa) y RE para las rectificativas. Cada serie lleva su propio contador por año, que empieza en 1. El número tiene la forma SERIE-AAAA-NNNNNN, con el correlativo relleno con ceros hasta 6 cifras.

**Why this priority**: es el identificador legal de cada factura, el que la gestoría y una inspección usan para comprobar que la serie es correlativa.

**Independent Test**: `numeracion.test.js` › bloques «RN-21 · formato SERIE-AAAA-NNNNNN» y «RN-22 / RN-26 · un contador por serie y año».

**Acceptance Scenarios**:

1. **Given** la copia de la BD real (contadores FA/2026 = 108 y RE/2026 = 1; última ordinaria FA-2026-000108), **When** se pide el siguiente número FA en 2026, **Then** es FA-2026-000109 y el contador pasa a 109. Tests: `numeracion.test.js` › «ejemplo de reglas-de-negocio.md: la última ordinaria real es FA-2026-000108» y «el siguiente FA de la BD real es FA-2026-000109 y el contador pasa a 109».
2. **Given** la misma copia, **When** se pide el siguiente número RE, **Then** es RE-2026-000002, con su propio contador. Test: `numeracion.test.js` › «la serie RE tiene su propio contador: RE-2026-000002».
3. **Given** el reloj en enero de 2027, **When** se piden una FA, una RE y otra FA, **Then** salen FA-2027-000001, RE-2027-000001 y FA-2027-000002, y los contadores de 2026 no cambian. Test: `numeracion.test.js` › «ejemplo de reglas-de-negocio.md: en 2027 la primera FA es FA-2027-000001 y la primera RE es RE-2027-000001».
4. **Given** los correlativos 0 y 1, **When** se formatean, **Then** se rellenan a 6 cifras. Test: `numeracion.test.js` › «cero y uno se rellenan a 6 cifras».
5. **Given** una serie que no es FA ni RE («XX»), **When** se pide un número, **Then** se abre su propio contador y sale XX-2026-000001. Test: `numeracion.test.js` › «CONGELA comportamiento actual: la serie no se valida; una serie desconocida abre su contador (RN-26)».

---

### Historia 2 - El año del número es el del reloj al emitir, no el de la fecha de la factura (Priority: P2)

El programa pone en el número el año del reloj en el momento de numerar, no el de la fecha de la factura. Como la remesa de diciembre se lanza el primer día laborable de enero, sus facturas llevan fecha de diciembre y número del año siguiente. Ya pasó en enero de 2026 con la remesa de diciembre de 2025.

**Why this priority**: es un error con efectos fiscales cada enero (ejercicio cruzado) y ya hay facturas emitidas así que no se pueden renumerar (A-20, PR-2).

**Independent Test**: `numeracion.test.js` (frontera de año), `servidor-facturas.test.js` (alta) y `remesa.test.js` (remesa de diciembre).

**Acceptance Scenarios**:

1. **Given** el reloj en hora de Madrid, **When** se numera el 31/12/2026 a las 23:59 y el 01/01/2027 a las 00:00, **Then** el primero lleva 2026 y el segundo 2027. Test: `numeracion.test.js` › «CONGELA comportamiento actual: frontera de año en hora de Madrid, 31/12 23:59 → 2026; 01/01 00:00 → 2027 (A-20, RN-23)».
2. **Given** el reloj en el 10/01/2027, **When** se graba en el alta una factura con fecha 2026-12-20, **Then** recibe FA-2027-000001. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: el 10/01/2027 una factura con fecha 2026-12-20 recibe FA-2027-000001 (A-20, RN-17, C03)».
3. **Given** la remesa de diciembre de 2026 lanzada el 1 de enero de 2027, **When** se ejecuta, **Then** emite facturas con fecha 2026-12-31 y número FA-2027-…, empezando por FA-2027-000001. Test: `remesa.test.js` › «CONGELA comportamiento actual: la remesa de diciembre lanzada el 1 de enero numera en el año siguiente (A-20, C03, RN-23)».

---

### Historia 3 - El número se gasta antes de grabar, y nada impide repetirlo (Priority: P3)

El programa reserva el número (avanza el contador) **antes** de grabar la factura. Si la grabación falla, el número se pierde y queda un hueco en la serie. Además, la lectura del contador y su actualización son dos pasos separados, y nada impide que dos facturas tengan el mismo número: si dos personas graban a la vez, pueden recibir el mismo. Ya pasó el 2 de enero de 2021.

**Why this priority**: incumple la correlatividad legal (huecos y duplicados). Hoy no hay huecos ni duplicados en los datos, pero las condiciones se dan: Paco y Marga graban a veces a la vez.

**Independent Test**: `servidor-facturas.test.js` (hueco) y `numeracion.test.js` › bloque «RN-25 · nada impide dos facturas con el mismo número»; de punta a punta, GM-09.

**Acceptance Scenarios**:

1. **Given** un alta con la cantidad vacía, **When** se envía, **Then** responde con error 500, el contador avanza a FA-2026-000111 y no hay ninguna factura con ese número; la siguiente factura grabada salta a FA-2026-000112. Tests: `servidor-facturas.test.js` › «CONGELA comportamiento actual: una línea con cantidad vacía da 500 y consume el número FA-2026-000111 (A-22, RN-24)» y «CONGELA comportamiento actual: «1.234,56» se lee como 1,234; la siguiente factura salta al FA-2026-000112 (A-05, RN-16, A-22)»; GM-09.
2. **Given** tres peticiones de número FA a la vez, **When** se atienden, **Then** las tres reciben FA-2026-000109 y el contador solo avanza a 109. Test: `numeracion.test.js` › «CONGELA comportamiento actual: tres peticiones simultáneas reciben el mismo número y el contador solo avanza uno (A-23, RN-25)».
3. **Given** el reloj en un año sin contador todavía (2028-01-03), **When** se piden dos números a la vez, **Then** uno recibe FA-2028-000001 y el otro falla con un error de restricción de la base de datos. Test: `numeracion.test.js` › «CONGELA comportamiento actual: la primera numeración de un año pedida dos veces a la vez hace fallar una con SQLITE_CONSTRAINT (A-52)».

---

### Historia 4 - «Hoy» es la fecha del equipo donde corre el programa (Priority: P4)

Cuando un documento necesita la fecha de hoy, el programa usa la fecha local del equipo donde corre: es la fecha por defecto del alta de facturas, la fecha de toda rectificativa y la fecha por defecto del alta y de la baja de contratos.

**Why this priority**: decide la fecha de documentos legales (las rectificativas siempre llevan la de hoy) y, en la frontera de medianoche, también su año.

**Independent Test**: `util.test.js` › bloque «RN-49 · hoy: fecha local del equipo».

**Acceptance Scenarios**:

1. **Given** el reloj en el 16/11/2026 a las 10:00 de Madrid, **When** se pide «hoy», **Then** es 2026-11-16. Test: `util.test.js` › «con el reloj en 16/11/2026 10:00 de Madrid devuelve 2026-11-16».
2. **Given** las 00:30 del 1 de abril en Madrid, **When** se pide «hoy», **Then** ya es 1 de abril. Test: `util.test.js` › «ejemplo de reglas-de-negocio.md: a las 00:30 del 1 de abril en Madrid es ya 1 de abril».
3. **Given** el 31/12 a las 23:59 de Madrid y un minuto después, **When** se pide «hoy», **Then** es 2026-12-31 y luego 2027-01-01. Test: `util.test.js` › «fin de año: el 31/12 a las 23:59 de Madrid es 2026-12-31 y un minuto después 2027-01-01».
4. **Given** un alta de factura sin fecha el 2026-11-16, **When** se graba, **Then** lleva fecha 2026-11-16. Test: `servidor-facturas.test.js` › «RN-17 · sin fecha se usa la de hoy en el servidor (2026-11-16) y vence el 2026-12-16».
5. **Given** la rectificación de una factura de otra fecha, **When** se graba la RE, **Then** lleva la fecha de hoy (2026-11-16), no la de la original. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: la RE se fecha hoy (2026-11-16), no con la fecha de la original (A-28, RN-29)». Que la RE se feche hoy es de la spec 007; aquí solo se fija qué es «hoy».

---

### Edge Cases

- **Correlativo a partir de 999.999:** pasa a 7 cifras sin aviso, y entonces los números dejan de ordenarse bien como texto (A-47, documentado sin especificar).
- **Medianoche del 31 de diciembre:** el año del número cambia con la hora local del equipo (FR-004).
- **Equipo con otra zona horaria:** «hoy» y el año del número siguen la hora local del equipo; la misma hora UTC puede ser otro día en otra zona. Test: `util.test.js` › «CONGELA comportamiento actual: la misma hora UTC es otro día en Buenos Aires (A-38)». El efecto en el vencimiento (A-38) es de la spec 008.
- **Primer número del año pedido a la vez por el alta y la remesa:** uno de los dos falla (A-52). Si falla la remesa de enero, queda cortada a mitad (spec 006).
- **Grabación que falla después de numerar:** hueco en la serie (FR-005). Ocurre, por ejemplo, con una cantidad o un precio vacíos en el alta (spec 003).
- **Serie desconocida:** abre su propio contador sin aviso (FR-008).
- **Doble clic en «Rectificar»:** dos RE con el mismo número (A-54); se especifica en la spec 007.

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito describe el comportamiento **actual**.

- **FR-001 (RN-21) · Formato del número.** El sistema forma el número como SERIE-AAAA-NNNNNN: la serie, un guion, el año con 4 cifras, un guion y el correlativo relleno con ceros a la izquierda hasta 6 cifras. A partir de 999.999 el correlativo ocupa 7 cifras, sin aviso. Dato real: la última ordinaria es FA-2026-000108.
  - Evidencia: `lib/numeracion.js:38-42` (`formatear`); `db.js:52` (comentario del esquema, «FA-2026-000123»). El paso a 7 cifras es A-47.
  - Test: `numeracion.test.js` › los cuatro tests de «RN-21 · formato SERIE-AAAA-NNNNNN».
- **FR-002 (RN-22) · Un contador por serie y año.** El sistema lleva un contador por cada combinación de serie y año, que guarda el último correlativo emitido. El primer número de una serie en un año es el 000001. Datos reales: contadores FA/2026 = 108 y RE/2026 = 1.
  - Evidencia: `lib/numeracion.js:14-27`; `db.js:76-81` (contador con clave serie + año); contadores iniciales en `db.js:176-177`.
  - Test: `numeracion.test.js` › «el siguiente FA de la BD real es FA-2026-000109 y el contador pasa a 109», «la serie RE tiene su propio contador: RE-2026-000002» y «ejemplo de reglas-de-negocio.md: en 2027 la primera FA es FA-2027-000001 y la primera RE es RE-2027-000001»; los contadores finales de todos los casos del golden master.
- **FR-003 (RN-22) · Apertura del contador del año.** Si no existe contador para la serie y el año, el sistema lo crea a cero y reserva el 1. Si dos peticiones intentan crearlo a la vez, una obtiene el 000001 y la otra falla con un error de restricción de la base de datos («SQLITE_CONSTRAINT»).
  - Evidencia: `lib/numeracion.js:18-23`; `db.js:76-81`. El fallo simultáneo es A-52.
  - Test: `numeracion.test.js` › «CONGELA comportamiento actual: la primera numeración de un año pedida dos veces a la vez hace fallar una con SQLITE_CONSTRAINT (A-52)».
- **FR-004 (RN-23) · Año del número.** El sistema toma el año del número del reloj del equipo, en hora local, en el momento de numerar, sin mirar la fecha de la factura. Frontera en hora de Madrid: 31/12 a las 23:59 → año en curso; 01/01 a las 00:00 → año siguiente. Ejemplo: la remesa de diciembre de 2026 lanzada el 1 de enero de 2027 emite FA-2027-000001 con fecha 2026-12-31.
  - Evidencia: `lib/numeracion.js:15`. Anomalía A-20.
  - Test: `numeracion.test.js` › «CONGELA comportamiento actual: frontera de año en hora de Madrid, 31/12 23:59 → 2026; 01/01 00:00 → 2027 (A-20, RN-23)»; `servidor-facturas.test.js` › «CONGELA comportamiento actual: el 10/01/2027 una factura con fecha 2026-12-20 recibe FA-2027-000001 (A-20, RN-17, C03)»; `remesa.test.js` › «CONGELA comportamiento actual: la remesa de diciembre lanzada el 1 de enero numera en el año siguiente (A-20, C03, RN-23)».
- **FR-005 (RN-24) · Reserva del número antes de grabar.** El sistema avanza el contador y obtiene el número **antes** de grabar la factura. Si después la grabación falla, el contador no retrocede: el número queda gastado y la serie tiene un hueco. Ejemplo: un alta con un importe vacío consume un número y la siguiente factura grabada lleva el siguiente.
  - Evidencia: `lib/numeracion.js:30-35`; `routes/facturas.js:71-78` (alta). Anomalía A-22.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: una línea con cantidad vacía da 500 y consume el número FA-2026-000111 (A-22, RN-24)»; GM-09.
- **FR-006 (RN-25) · Lectura y actualización sin exclusión.** El sistema lee el último correlativo y lo actualiza en dos pasos separados, sin impedir que otra petición lea el mismo valor entre medias. Varias peticiones simultáneas reciben el mismo número y el contador solo avanza uno.
  - Evidencia: `lib/numeracion.js:16` (lectura), `:32` (actualización); el comentario de `:8-10` recoge el incidente del 2 de enero de 2021 («no ha vuelto a pasar (creo)»). Anomalía A-23.
  - Test: `numeracion.test.js` › «CONGELA comportamiento actual: tres peticiones simultáneas reciben el mismo número y el contador solo avanza uno (A-23, RN-25)».
- **FR-007 (RN-25) · Números repetidos admitidos.** El sistema no impide grabar dos facturas con el mismo número: el número de factura no está protegido contra repeticiones. Ejemplo: dos altas simultáneas que reciben las dos FA-2026-000109 se graban las dos.
  - Evidencia: `db.js:52` (`numero TEXT NOT NULL`, sin restricción de unicidad); el único índice de la base de datos es el del contador (registro, A-23, QD11). Anomalía A-23. Datos reales: no hay números repetidos (ratificación, N-12).
  - Test: por el lado de la numeración, el mismo de FR-006. La grabación de dos facturas con el mismo número está probada en el camino de la rectificación (`servidor-facturas.test.js` › «CONGELA comportamiento actual: las dos rectificativas del doble clic llevan el mismo número RE-2026-000004 (A-54)», spec 007). Para el alta no hay test de punta a punta (ver «Huecos de cobertura»).
- **FR-008 (RN-26) · Series.** El sistema numera en la serie FA las facturas del alta manual y de la remesa, y en la serie RE las rectificativas. No hay serie de abonos. El sistema no valida la serie: una serie desconocida abre su propio contador. Dato real: RE-2026-000001 rectifica FA-2026-000106.
  - Evidencia: `routes/facturas.js:71` (alta, FA), `:138` (rectificación, RE); `scripts/remesa_mensual.js:57` (remesa, FA); `db.js:156`, `:160` (FA-2026-000106 y RE-2026-000001).
  - Test: `numeracion.test.js` › «la serie RE tiene su propio contador: RE-2026-000002» y «CONGELA comportamiento actual: la serie no se valida; una serie desconocida abre su contador (RN-26)».
- **FR-009 (RN-49) · «Hoy».** El sistema obtiene la fecha de hoy del reloj del equipo, en hora local y con formato AAAA-MM-DD. La usa como fecha por defecto del alta de facturas, como fecha de toda rectificativa y como fecha por defecto del alta y de la baja de contratos. Ejemplo: a las 00:30 del 1 de abril en Madrid ya es 1 de abril.
  - Evidencia: `lib/util.js:9-15` (`hoy`); usos en `routes/facturas.js:44` (alta), `:142` (rectificativa), `routes/contratos.js:21` (alta de contrato) y `:32` (baja de contrato).
  - Test: `util.test.js` › los cuatro tests de «RN-49 · hoy: fecha local del equipo»; `servidor-facturas.test.js` › «RN-17 · sin fecha se usa la de hoy en el servidor (2026-11-16) y vence el 2026-12-16» y «CONGELA comportamiento actual: la RE se fecha hoy (2026-11-16), no con la fecha de la original (A-28, RN-29)».

### Anomalías de esta spec

Todas están cerradas en el [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md) (§7).

| ID | Clasificación | Comportamiento especificado | Tratamiento acordado | Decisión de negocio | Tests |
| --- | --- | --- | --- | --- | --- |
| A-20 | BUG HISTÓRICO CON DEPENDIENTES (C03) | FR-004 (año del reloj, no de la fecha) | Especificar tal cual; corregir en la modernización. **Nunca retroactivo**: los números emitidos no cambian (PR-2) | Acta simulada, P20, Marga y Puri, 2026-11-16; ratificación, N-02, Puri, 2026-11-16 → RS-15 | `numeracion.test.js` › «frontera de año en hora de Madrid»; `servidor-facturas.test.js` › «el 10/01/2027 una factura con fecha 2026-12-20 recibe FA-2027-000001»; `remesa.test.js` › «la remesa de diciembre lanzada el 1 de enero numera en el año siguiente»; `servidor-informes.test.js` › bloque «A-20 · ejercicio del número frente a fecha de la factura (C03)» (efecto en el CSV y en el 4T, spec 009) |
| A-22 | BUG A SECAS | FR-005 (hueco si la grabación falla) | Especificar tal cual; corregir en la modernización conservando el formato y la secuencia por serie y año. No retroactivo | Procedimiento ante un hueco: acta simulada, P23, Puri, 2026-11-16 (PR-3); ratificación, §3 («Resultado», A-22) | `servidor-facturas.test.js` › «una línea con cantidad vacía da 500 y consume el número FA-2026-000111»; GM-09 |
| A-23 | BUG A SECAS | FR-006 y FR-007 (mismo número para peticiones simultáneas; repeticiones admitidas) | Especificar tal cual; corregir en la modernización. No retroactivo. Antes de impedir repeticiones, comprobar que no las hay (hoy no las hay) | Sin repeticiones desde 2021: ratificación, N-12, Marga y Paco, 2026-11-16. Graban a la vez: acta simulada, P34, Marga, 2026-11-16 | `numeracion.test.js` › «tres peticiones simultáneas reciben el mismo número y el contador solo avanza uno» |
| A-47 (numeración) | ACCIDENTAL | **Ninguno: se documenta sin especificar** (paso a 7 cifras) | Documentar sin especificar | Ninguna | `numeracion.test.js` › «frontera de 6 cifras 999.998 / 999.999 / 1.000.000» y «con 7 cifras deja de ordenar bien como texto» |
| A-52 | BUG A SECAS | FR-003 (la primera numeración del año pedida dos veces a la vez hace fallar una) | Especificar tal cual; corregir en la modernización junto con A-23. No retroactivo | Ninguna | `numeracion.test.js` › «la primera numeración de un año pedida dos veces a la vez hace fallar una» |

### Comportamiento documentado sin especificar

- **Paso a 7 cifras (A-47, parte de la numeración).** A partir del correlativo 999.999, el número pasa a 7 cifras sin aviso (999.998 → «…-999998»; 999.999 → «…-999999»; 1.000.000 → «…-1000000»), y entonces los números dejan de ordenarse bien como texto. Hoy es inalcanzable (el correlativo más alto es 108). Evidencia: `lib/numeracion.js:38-42`. La modernización puede elegir otro comportamiento sin efecto retroactivo.

### Convenciones declaradas (no son requisitos)

Son conducta deseada declarada por el negocio. Esta spec **no las impone**.

| # | Convención declarada | Fuente | Relación con el comportamiento actual |
| --- | --- | --- | --- |
| Correlatividad legal | La numeración es correlativa y sin huecos por serie y año; desde la inspección de 2020 las facturas no se borran nunca: los errores se corrigen con rectificativa en la serie RE y factura nueva | Comentario del código (`lib/numeracion.js:3-6`); acta simulada, P23, Dirección, 2026-11-16 (el acta de la inspección está en el archivo de la oficina) | **Diverge** en los huecos (A-22, FR-005) y en los repetidos (A-23, FR-006 y FR-007). Coincide en no borrar (spec 007) |
| CN-6 | El año del número de factura es el de la fecha de la factura | Acta simulada, P20, Puri, 2026-11-16 → RS-15 | **Diverge**: el año sale del reloj al numerar (A-20, FR-004) |
| PR-1 | No se antedata: una factura con número posterior no puede llevar fecha anterior | Acta simulada, P21, Puri, 2026-11-16 → RS-16 | **Diverge** en el alta, que acepta cualquier fecha (A-21, spec 003). La numeración no compara fechas |
| PR-2 | No se renumeran facturas ya emitidas. Las de diciembre de 2025 con número de 2026 se dejan como están, con una nota en el libro registro | Acta simulada, P20, Puri, 2026-11-16; ratificación, N-02, Puri, 2026-11-16 | Fuera del programa: el programa no renumera. Límite para cualquier corrección de A-20 |
| PR-3 | Un número anulado no se reutiliza nunca y se deja constancia escrita | Acta simulada, P23, Puri, 2026-11-16 | Fuera del programa: el programa no reutiliza números ni registra los anulados (FR-005). Es el procedimiento ante un hueco de A-22 |

### Huecos de cobertura

- **Dos altas simultáneas que graban el mismo número (FR-007).** La carrera está probada al pedir números (`numeracion.test.js`) y la grabación de dos documentos con el mismo número, en la rectificación (A-54, spec 007). No hay un test de punta a punta con dos altas simultáneas. Evidencia del alta: `routes/facturas.js:71-76` (numera y graba sin comprobar) y `db.js:52` (sin restricción de unicidad). Se propone añadirlo en la planificación.

### Fuera de alcance

- Validación de la fecha tecleada en el alta (A-21): spec 003.
- Doble rectificativa con el mismo número (A-54) y uso de la serie RE: spec 007.
- Ejercicio y trimestre en los informes (por fecha): spec 009. El efecto de A-20 en el CSV y en el 4T se cita aquí solo como test de A-20.
- Efecto de la zona horaria en el vencimiento (A-38): spec 008.
- Fecha de las facturas de la remesa (el último día del mes facturado) y corte de la remesa por A-52: spec 006.

### Key Entities

- **Número de factura**: identificador legal con la forma SERIE-AAAA-NNNNNN (FR-001). Hoy puede repetirse (FR-007).
- **Serie**: FA (ordinarias: alta y remesa) o RE (rectificativas); cualquier otra abre su propio contador (FR-008).
- **Contador**: último correlativo emitido por serie y año (FR-002); avanza antes de grabar (FR-005).
- **«Hoy»**: fecha local del equipo, que fecha por defecto los documentos (FR-009).

## Success Criteria *(mandatory)*

### Measurable Outcomes

Esta spec es un contrato de comportamiento; sus criterios se miden con la suite de caracterización existente, que no se modifica.

- **SC-001**: los 11 tests de `numeracion.test.js` pasan sin cambios.
- **SC-002**: los 4 tests del bloque «RN-49 · hoy: fecha local del equipo» de `util.test.js` pasan sin cambios.
- **SC-003**: `golden-master.test.js` pasa en GM-09 (número consumido sin factura) y en los contadores finales de todos los casos, con 0 diferencias respecto al master.
- **SC-004**: los tests de A-20 de `servidor-facturas.test.js`, `remesa.test.js` y `servidor-informes.test.js`, y el del hueco de A-22 de `servidor-facturas.test.js`, pasan sin cambios.
- **SC-005**: los 9 requisitos (FR-001 a FR-009) tienen al menos una evidencia y un test citados; FR-007 tiene además un hueco de cobertura declarado para el camino del alta.
- **SC-006**: Puri puede comprobar, con la lista de facturas y los contadores, cada número de los escenarios de las historias 1 a 3 sin consultar el código.

## Assumptions

- La versión de referencia es el código del commit `2b49ea5` y la copia de `datos/gesfact.db` versionada en ese commit. La BD de producción no se toca; los tests trabajan sobre copias temporales, con reloj y zona horaria fijos (Europe/Madrid).
- El servidor de la oficina funciona en hora de Madrid. **SUPOSICIÓN**: no consta su configuración; si fuera otra, «hoy» y el año del número seguirían esa otra hora (FR-004, FR-009).
- El testimonio de negocio citado es simulado y ratificado por la responsable del proyecto (NEGOCIO-RS). No condiciona esta spec, que fija el comportamiento actual; sí condiciona cualquier corrección futura (deuda de confirmación).
- La numeración (004) y el nombre (`004-numeracion-ejercicio`) siguen la [propuesta de partición](../000-reconocimiento/propuesta-particion-specs.md).
