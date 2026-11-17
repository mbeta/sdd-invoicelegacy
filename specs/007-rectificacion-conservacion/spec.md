# Especificación: Rectificación y conservación de facturas (comportamiento actual)

**Rama**: `007-rectificacion-conservacion`

**Creada**: 2026-11-17

**Estado**: Borrador

**Entrada**: descripción del usuario: «Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la rectificación de facturas y de su conservación (nunca se borran) de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.» (El texto completo, con el alcance RN-28 a RN-31, las convenciones, las anomalías y los criterios, se recoge íntegro en las secciones de esta spec.)

## Naturaleza de esta spec

- **Es una spec inversa.** Cada requisito describe lo que GesFact 2.4 hace **hoy**, aunque parezca un error. Nada de lo que aquí se exige obliga a cambiar el programa actual (constitución, principio I).
- **Evidencia.** Cada requisito cita su evidencia: `fichero:líneas` del código, dato real de la copia de `datos/gesfact.db` (los datos históricos están en la siembra de `db.js:156-165`) o acta de negocio. Los tests se citan como `fichero › «título del test»`, todos en `pruebas/caracterizacion/`.
- **Anomalías.** Se especifican tal como funcionan hoy, con su ID del [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md). No se corrigen ni se omiten.
- **Convenciones declaradas.** Lo que el negocio dice que **debería** pasar se presenta como «convención declarada», nunca como requisito.
- **Testimonio de negocio.** Las actas citadas son la [entrevista simulada](../000-reconocimiento/entrevista-negocio-simulada.md) y la [ratificación simulada](../000-reconocimiento/ratificacion-negocio-simulada.md) del 2026-11-16 (testigo NEGOCIO-RS). Arrastran una **deuda de confirmación**: no afecta a esta spec, que fija el comportamiento actual, pero sí a cualquier corrección posterior.
- **Qué decide esta spec.** Cómo se corrige una factura ya emitida: qué se puede rectificar, qué contiene la rectificativa (serie RE), qué le pasa a la original y que no existe el borrado. **Qué número** recibe la RE es de la [spec 004](../004-numeracion-ejercicio/spec.md); cómo cuenta la RE en los informes, de la spec 009.
- **Golden master.** Casos GM-11 y GM-12.
- **Línea base verificada.** El 2026-11-17, sobre el commit `2b49ea5`, `servidor-facturas.test.js`, `servidor-informes.test.js` y `golden-master.test.js` pasan **75 de 75** tests, sin cambios en `datos/gesfact.db`.

## User Scenarios & Testing *(mandatory)*

### Historia 1 - Administración anula una factura errónea con una rectificativa total (Priority: P1)

Cuando una factura emitida tiene un error, Marga abre su detalle, escribe opcionalmente un motivo y pulsa «Rectificar (abono total)». El programa emite una factura rectificativa de la serie RE que es el espejo exacto de la original con los importes en negativo, y deja la original como «rectificada». Después, si procede, se emite una factura nueva correcta. Así se corrigió en mayo de 2026 la cuota de abril duplicada de Bar Nuevo Siglo.

**Why this priority**: es la única forma que tiene el programa de corregir una factura emitida (la inspección de 2020 prohibió borrarlas) y produce un documento fiscal que va a la gestoría.

**Independent Test**: `servidor-facturas.test.js` › bloque «Camino 3 · rectificación (POST /facturas/:id/rectificar)»; golden master GM-11.

**Acceptance Scenarios**:

1. **Given** la copia de la BD real con el reloj en 2026-11-16, **When** se rectifica FA-2026-000101 (cobrada) sin motivo, **Then** se redirige al detalle de la nueva factura 23 y esta es RE-2026-000002, del cliente 1, con fecha 2026-11-16, sin vencimiento, base −133,20 €, IVA −27,97 €, recargo 0, total −161,17 €, estado «emitida», rectifica a FA-2026-000101 y observaciones «Rectifica FA-2026-000101. ». Sus cuatro líneas son las de la original con la cantidad, la base y las cuotas en negativo, el mismo precio en positivo, el mismo tipo de IVA y el texto precedido de «Rectificación: » (por ejemplo, «Rectificación: Vaso caña 20cl (caja 72)», cantidad −0,44, precio 21,60, base −9,50, IVA −2,00). Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: rectificar FA-2026-000101 (cobrada y descuadrada) copia el espejo exacto sin recalcular (A-29, RN-28)».
2. **Given** la rectificación anterior, **When** se consultan las fechas, **Then** la RE lleva 2026-11-16 y la original sigue con 2026-01-31. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: la RE se fecha hoy (2026-11-16), no con la fecha de la original (A-28, RN-29)».
3. **Given** la rectificación anterior, **When** se consulta la original, **Then** su estado es «rectificada». Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: la original cobrada pasa a «rectificada» y pierde la marca de cobro (A-33, RN-30)».
4. **Given** FA-2026-000103, **When** se rectifica con el motivo «Precio mal», **Then** la RE es RE-2026-000003, con observaciones «Rectifica FA-2026-000103. Precio mal», base −1.000,00 € y total −1.210,00 €. Test: `servidor-facturas.test.js` › «RN-29 · con motivo, las observaciones son «Rectifica <número>. <motivo>»».
5. **Given** el dato real de la copia, **When** se examina la corrección de abril de 2026, **Then** FA-2026-000106 (2026-04-30) consta «rectificada», RE-2026-000001 (2026-05-06) la rectifica con cabecera −101,61 / −20,62 / 0 / −122,23 y líneas de base −90,00 y −11,61, y FA-2026-000107 (2026-05-06) la sustituye con «Sustituye a FA-2026-000106». Evidencia: `db.js:156-165`.

---

### Historia 2 - La rectificativa copia la original tal cual, también sus descuadres (Priority: P2)

La rectificativa no recalcula nada: niega lo que tiene grabado la original, cabecera y líneas por separado. Si la cabecera de la original no cuadraba con sus líneas, la de la rectificativa tampoco cuadra, con el mismo descuadre en negativo. Puri lo pidió así para que el abono sea el espejo de lo declarado.

**Why this priority**: la gestoría cuadra la rectificativa contra la original; cualquier recálculo cambiaría el importe abonado frente al declarado.

**Independent Test**: golden master GM-12 y el test de FA-2026-000101 de la historia 1.

**Acceptance Scenarios**:

1. **Given** FA-2026-000101, cuya cabecera dice IVA 27,97 € y cuyas líneas suman 24,27 €, **When** se rectifica, **Then** la RE lleva IVA −27,97 € en la cabecera y sus líneas suman −24,27 €. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: rectificar FA-2026-000101 (cobrada y descuadrada) copia el espejo exacto sin recalcular (A-29, RN-28)».
2. **Given** el dato real RE-2026-000001, **When** se suman las cuotas de sus líneas, **Then** dan −20,06 € (−18,90 y −1,16), frente a −20,62 € en su cabecera: el mismo descuadre que FA-2026-000106. Evidencia: `db.js:156-162`.
3. **Given** la histórica descuadrada FA-2026-000105, **When** se rectifica, **Then** la RE copia su cabecera y sus líneas en negativo, con el descuadre. Test: `golden-master.test.js` › «GM-12 · Rectificación de la histórica FA-2026-000105 (descuadrada): la RE copia el descuadre; segunda rectificación rechazada (A-01, A-29, RN-30)».

---

### Historia 3 - Qué se puede rectificar y qué se rechaza (Priority: P3)

Se puede rectificar cualquier factura que no sea una rectificativa ni esté ya rectificada, incluida una cobrada. Una rectificativa o una factura ya rectificada se rechazan con un mensaje; una factura que no existe, con «Factura no encontrada». En pantalla, el botón de rectificar solo aparece en las facturas FA emitidas; una cobrada solo se puede rectificar con una petición directa.

**Why this priority**: impide abonar dos veces la misma factura por el camino normal y rectificar un abono.

**Independent Test**: `servidor-facturas.test.js` › «RN-30 · no se rectifica una rectificada (400), una RE (400) ni una inexistente (404)»; GM-12.

**Acceptance Scenarios**:

1. **Given** FA-2026-000101 ya rectificada, RE-2026-000001 y una factura 999 inexistente, **When** se intenta rectificar cada una, **Then** responden 400 «Ya esta rectificada», 400 «No se rectifica una rectificativa» y 404 «Factura no encontrada», y el contador de la serie RE no avanza (sigue en 3). Test: el citado.
2. **Given** FA-2026-000105 recién rectificada, **When** se rectifica por segunda vez, **Then** se rechaza. Test: `golden-master.test.js` › GM-12.
3. **Given** una factura FA emitida, una cobrada y una RE, **When** se abre su detalle, **Then** solo la FA emitida muestra los botones de cobro y de rectificación. Test: `servidor-facturas.test.js` › «RN-51 · los botones de cobro y rectificación solo salen en FA emitidas» (comprueba el botón de cobro; el de rectificar va en el mismo bloque de la pantalla, ver «Huecos de cobertura»).

---

### Historia 4 - Las facturas no se borran nunca (Priority: P4)

El programa no tiene ninguna forma de borrar una factura ni sus líneas. Cualquier error se corrige con una rectificativa total y, si hace falta, una factura nueva. La regla viene de la inspección de 2020.

**Why this priority**: es un requisito legal (numeración correlativa sin huecos) que ninguna modernización puede romper.

**Independent Test**: `servidor-facturas.test.js` › bloque «RN-31 · las facturas no se borran nunca».

**Acceptance Scenarios**:

1. **Given** FA-2026-000112, **When** se pide borrarla por cualquiera de los caminos plausibles (DELETE sobre la factura, «/borrar», «/eliminar»), **Then** los tres responden 404 y la factura sigue existiendo. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: no hay ninguna ruta de borrado de facturas; Express responde 404 (A-30, RN-31)».
2. **Given** la copia de la BD, **When** se examina la cadena de abril de 2026, **Then** la factura errónea se conserva como «rectificada», con su RE y su factura sustituta (historia 1, escenario 5).

---

### Historia 5 - Un doble clic o una factura sin líneas dejan la rectificación a medias (Priority: P5)

La rectificación da varios pasos seguidos sin garantizar que se hagan todos o ninguno. Si se pulsa dos veces seguidas el botón, salen dos rectificativas de la misma factura, y además con el mismo número. Si la factura no tiene líneas, se graba la rectificativa, la original no se marca como rectificada y la pantalla se queda esperando sin respuesta.

**Why this priority**: produce abonos duplicados y números repetidos en documentos que no se pueden borrar. Hoy no consta que haya pasado (solo hay una RE en la copia).

**Independent Test**: los tres últimos tests del bloque «Camino 3 · rectificación».

**Acceptance Scenarios**:

1. **Given** FA-2026-000104 emitida, **When** llegan a la vez dos peticiones de rectificarla (motivos «uno» y «dos»), **Then** las dos responden con redirección (a las facturas 25 y 26, sin orden estable) y quedan dos RE que rectifican FA-2026-000104, una con cada motivo. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: un doble clic crea dos rectificativas de la misma factura (A-24)».
2. **Given** el doble clic anterior, **When** se consultan sus números, **Then** las dos son RE-2026-000004 y el contador RE queda en 4. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: las dos rectificativas del doble clic llevan el mismo número RE-2026-000004 (A-54)».
3. **Given** una factura FA emitida sin líneas (total 12,10 €), **When** se rectifica, **Then** la petición no recibe respuesta, se graba RE-2026-000005 con total −12,10 € y la original sigue «emitida». Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: rectificar una factura sin líneas deja la petición colgada, graba la RE y no marca la original (A-24)».

---

### Edge Cases

- **Rectificar una cobrada:** se permite por petición directa (el botón no sale) y la original pasa a «rectificada», perdiendo la marca de cobro (A-33, spec 008).
- **Rectificar en otro trimestre que la original:** la RE lleva la fecha de hoy y resta en el trimestre de hoy, no en el de la original (A-28; efecto en los informes: spec 009).
- **Original descuadrada:** la RE copia el descuadre (FR-002).
- **Sin motivo:** las observaciones terminan en «. » con espacio final (FR-004).
- **Doble clic:** dos RE con el mismo número (FR-009).
- **Factura sin líneas:** RE grabada, original sin marcar y petición sin respuesta (FR-010).
- **Factura cuyo cliente ya no existe en la base de datos, o error al leerla:** responde 404 «Factura no encontrada», como si no existiera (FR-006).
- **Fallo al grabar una línea de la RE o al marcar la original:** el error se ignora; la RE puede quedar incompleta y la original sin marcar (FR-010).
- **Rectificar en enero una factura de diciembre:** la RE se numera en la serie RE del año nuevo (A-20, spec 004).

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito describe el comportamiento **actual**.

- **FR-001 (RN-28) · Rectificación siempre total.** La rectificación anula la factura entera: no hay forma de rectificar solo algunas líneas o una parte del importe. Cada rectificación emite una factura nueva de la serie RE con todas las líneas de la original.
  - Evidencia: `routes/facturas.js:124-129` (comentario «rectificar una factura entera (abono total)») y `:135`, `:148-157` (se copian todas las líneas, sin selección). La pantalla solo ofrece «Rectificar (abono total)» (`views/factura_detalle.ejs:49-51`).
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: rectificar FA-2026-000101 (cobrada y descuadrada) copia el espejo exacto sin recalcular (A-29, RN-28)».
- **FR-002 (RN-28) · Espejo exacto sin recalcular.** La cabecera de la RE lleva la base, el IVA, el recargo y el total de la original con el signo cambiado. Cada línea de la RE lleva la cantidad, la base, la cuota de IVA y la cuota de recargo de la original con el signo cambiado, el mismo precio unitario en positivo, el mismo tipo de IVA y el texto «Rectificación: <texto original>». No se recalcula ningún importe, así que si la original no cuadraba, la RE tampoco. Dato real: RE-2026-000001 → cabecera −101,61 / −20,62 / 0 / −122,23; líneas −90,00 y −11,61; las cuotas de las líneas suman −20,06 frente a −20,62 en la cabecera.
  - Evidencia: `routes/facturas.js:141-142` (cabecera), `:148-150` (líneas); comentario «Puri dixit: la rectificativa tiene que ser espejo exacto de la original» (`:127-128`); dato real en `db.js:156-162`. Anomalía A-29.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: rectificar FA-2026-000101 (cobrada y descuadrada) copia el espejo exacto sin recalcular (A-29, RN-28)»; `golden-master.test.js` › GM-11 y GM-12.
- **FR-003 (RN-29) · Datos de la cabecera de la RE.** La RE es del mismo cliente que la original, lleva la fecha de hoy (RN-49, spec 004), no tiene vencimiento, nace en estado «emitida» y consta como rectificativa del número de la original.
  - Evidencia: `routes/facturas.js:141-142`. La fecha de hoy es A-28.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: rectificar FA-2026-000101 …» y «CONGELA comportamiento actual: la RE se fecha hoy (2026-11-16), no con la fecha de la original (A-28, RN-29)»; `servidor-informes.test.js` › «CONGELA comportamiento actual: rectificar hoy una factura del 1T no cambia el 1T y resta en el 4T (A-28, RN-41)»; GM-11.
- **FR-004 (RN-29) · Observaciones de la RE.** Las observaciones de la RE son «Rectifica <número de la original>. <motivo>», con el motivo tal como se escribe. Sin motivo quedan «Rectifica <número>. », con punto y espacio final.
  - Evidencia: `routes/facturas.js:143`.
  - Test: `servidor-facturas.test.js` › «RN-29 · con motivo, las observaciones son «Rectifica <número>. <motivo>»» y «CONGELA comportamiento actual: rectificar FA-2026-000101 …» (sin motivo).
- **FR-005 (RN-29) · La original queda «rectificada».** Al terminar de grabar las líneas de la RE, la original pasa a estado «rectificada», también si estaba cobrada, y se muestra el detalle de la RE. La original no cambia en nada más: conserva su fecha, sus importes y sus líneas.
  - Evidencia: `routes/facturas.js:153-155`. Dato real: FA-2026-000106 consta «rectificada» (`db.js:156`). La pérdida de la marca de cobro es A-33 (spec 008).
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: la original cobrada pasa a «rectificada» y pierde la marca de cobro (A-33, RN-30)».
- **FR-006 (RN-30) · Qué se puede rectificar.** Se puede rectificar cualquier factura que exista, no esté «rectificada» y no sea de la serie RE, sea cual sea su estado («emitida» o «cobrada»). Si está «rectificada», responde 400 «Ya esta rectificada»; si es una RE, 400 «No se rectifica una rectificativa»; si no se encuentra (incluido que su cliente no exista o que falle la lectura), 404 «Factura no encontrada». Ninguno de los tres rechazos graba nada ni consume número.
  - Evidencia: `routes/facturas.js:130-133` (la lectura une la factura con su cliente, `:130`).
  - Test: `servidor-facturas.test.js` › «RN-30 · no se rectifica una rectificada (400), una RE (400) ni una inexistente (404)»; GM-12.
- **FR-007 (RN-30) · Botón en pantalla.** El detalle de una factura muestra el campo de motivo y el botón «Rectificar (abono total)» solo si la factura es de la serie FA y está «emitida». Una cobrada solo se puede rectificar con una petición directa.
  - Evidencia: `views/factura_detalle.ejs:47-52`.
  - Test: `servidor-facturas.test.js` › «RN-51 · los botones de cobro y rectificación solo salen en FA emitidas» (parcial, ver «Huecos de cobertura»).
- **FR-008 (RN-31) · No existe el borrado.** El programa no ofrece ninguna operación para borrar facturas ni líneas. Las peticiones de borrado responden 404 y la factura se conserva. La corrección de una factura errónea es una RE total más, si procede, una factura nueva. Dato real: FA-2026-000106 → RE-2026-000001 → FA-2026-000107 «Sustituye a FA-2026-000106».
  - Evidencia: `lib/numeracion.js:3-6` («desde la inspeccion de 2020 las facturas NO SE BORRAN NUNCA»); dato real en `db.js:156-165`. Anomalía A-30.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: no hay ninguna ruta de borrado de facturas; Express responde 404 (A-30, RN-31)».
- **FR-009 · Doble clic: dos RE con el mismo número.** La comprobación de «ya rectificada» y el cambio de estado van separados. Si llegan dos peticiones de rectificar la misma factura a la vez, las dos pasan la comprobación y se graban dos RE de la misma original, una por petición, con el mismo número (las dos leen el contador antes de que ninguna lo actualice). La original queda «rectificada».
  - Evidencia: `routes/facturas.js:132` (comprobación), `:138` (numeración), `:154` (cambio de estado); mecanismo del número repetido en `lib/numeracion.js` (A-23, spec 004). Anomalías A-24 y A-54.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: un doble clic crea dos rectificativas de la misma factura (A-24)» y «CONGELA comportamiento actual: las dos rectificativas del doble clic llevan el mismo número RE-2026-000004 (A-54)».
- **FR-010 · Rectificación no atómica.** La RE, sus líneas y el cambio de estado de la original se graban por separado. Si la original no tiene líneas, se graba la cabecera de la RE, la original no se marca como «rectificada» y la petición se queda sin respuesta. Si falla la grabación de una línea o el cambio de estado, el error se ignora.
  - Evidencia: `routes/facturas.js:146-147` (la marca solo se hace al terminar la última línea, que no existe si no hay líneas), `:151` y `:154` (errores ignorados). Anomalía A-24.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: rectificar una factura sin líneas deja la petición colgada, graba la RE y no marca la original (A-24)». Los fallos ignorados no tienen test (ver «Huecos de cobertura»).

### Anomalías de esta spec

Todas están cerradas en el [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md) (§7).

| ID | Clasificación | Comportamiento especificado | Tratamiento acordado | Decisión de negocio | Tests |
| --- | --- | --- | --- | --- | --- |
| A-24 | BUG A SECAS | FR-009 (doble RE) y FR-010 (sin líneas: petición colgada, RE grabada, original sin marcar) | Especificar tal cual; corregir en la modernización sin cambiar el contenido de la RE (A-29). No retroactivo | Ninguna | `servidor-facturas.test.js` › «un doble clic crea dos rectificativas de la misma factura (A-24)» y «rectificar una factura sin líneas deja la petición colgada, graba la RE y no marca la original (A-24)» |
| A-28 | INTENCIONAL | FR-003 (la RE se fecha hoy y resta en su propio trimestre) | Especificar tal cual. No retroactivo | Acta simulada, P22, Puri, 2026-11-16; ratificación, RS-18, Puri, 2026-11-16 | `servidor-facturas.test.js` › «la RE se fecha hoy (2026-11-16), no con la fecha de la original (A-28, RN-29)»; `servidor-informes.test.js` › «rectificar hoy una factura del 1T no cambia el 1T y resta en el 4T (A-28, RN-41)»; GM-11 |
| A-29 | INTENCIONAL (anomalía positiva) | FR-002 (espejo exacto sin recalcular, con los descuadres) | Especificar tal cual. No se corrige | Ninguna (dos testigos: código y datos) | `servidor-facturas.test.js` › «rectificar FA-2026-000101 (cobrada y descuadrada) copia el espejo exacto sin recalcular (A-29, RN-28)»; GM-11; GM-12 |
| A-30 | INTENCIONAL (anomalía positiva) | FR-008 (no existe el borrado) | Especificar tal cual. No se corrige; ninguna modernización puede introducir el borrado | Ninguna para clasificar (dos testigos: código y datos); acta simulada, P23, Puri y Dirección, 2026-11-16, como apoyo | `servidor-facturas.test.js` › «no hay ninguna ruta de borrado de facturas; Express responde 404 (A-30, RN-31)» |
| A-54 | BUG A SECAS | FR-009 (las dos RE del doble clic llevan el mismo número) | Especificar tal cual; corregir en la modernización junto con A-23 y A-24. No retroactivo | Ninguna | `servidor-facturas.test.js` › «las dos rectificativas del doble clic llevan el mismo número RE-2026-000004 (A-54)» |

### Comportamiento documentado sin especificar

- **Observación de la RE real que el código actual no genera (D13, A-04).** RE-2026-000001 tiene las observaciones «Rectifica FA-2026-000106 (cuota abril duplicada)», sin el «. » que pone el código actual entre el número y el motivo (FR-004) (`db.js:160`). Salió de una versión anterior del programa. Su procedencia (A-04) está excluida de las specs y va al plan de migración; la RE se conserva tal cual, sin regenerar. El carácter de espejo de esa RE sí es el del código actual (A-29).

### Convenciones declaradas (no son requisitos)

Son conducta deseada declarada por el negocio. Esta spec **no las impone**.

| # | Convención declarada | Fuente | Relación con el comportamiento actual |
| --- | --- | --- | --- |
| Fecha de la RE | La rectificativa lleva la fecha del día en que se hace y resta en ese trimestre | Acta simulada, P22, Puri, 2026-11-16 → ratificación, RS-18 | **Coincide** con FR-003 (A-28) |
| C09 (rectificar una cobrada) | Se puede rectificar una cobrada; queda «rectificada» y el cobro se apunta aparte. Dueña del estado de cobro: spec 008 | Acta simulada, P27, Puri (respuesta de Puri en la pregunta a Marga y Puri), 2026-11-16 → ratificación, RS-21 | **Coincide** con FR-005 y FR-006. Que la original pierda la marca de cobro es A-33 (spec 008) |
| Corrección de las descuadradas | Las facturas descuadradas 101, 105, 107 y 108 se corrigen con RE total más factura nueva bien calculada; la de la 101 incluye los 3,70 € de menos. Es una operación de negocio que se hará con el programa, no un requisito del programa | Acta simulada, P02, Puri, 2026-11-16; ratificación, N-01, Puri y Dirección, 2026-11-16 (A-01, spec 001) | **Compatible**: el programa permite hacerla (FR-001, FR-002, FR-006); la RE copiará el descuadre de cada original (GM-12) |

### Huecos de cobertura

- **Botón de rectificar (FR-007).** El test «RN-51 · los botones de cobro y rectificación solo salen en FA emitidas» comprueba solo el texto «Marcar cobrada». El botón de rectificar está en el mismo bloque condicional de la pantalla (`views/factura_detalle.ejs:47-52`), así que se verifica por inspección.
- **Fallos ignorados (FR-010).** No hay test que provoque un fallo al grabar una línea de la RE o al marcar la original: haría falta inyectar fallos en la base de datos. Se verifica por inspección: `routes/facturas.js:151` y `:154` no miran el error.
- **Cliente inexistente (FR-006).** No hay test de una factura cuyo cliente no exista; se verifica por inspección de la unión de `routes/facturas.js:130`.

### Fuera de alcance

- Numeración de la serie RE y carrera de números (A-23): spec 004. El número repetido del doble clic (A-54) sí es de esta spec.
- Pérdida de la marca de cobro y RE cobrable (A-33): spec 008.
- Resta de la RE en el resumen de IVA y en el CSV de la gestoría: spec 009 (aquí solo se cita el test de A-28 como prueba de la fecha).
- Impresión de la RE («Rectifica a:», sin vencimiento): spec 010.
- Cabeceras descuadradas de las facturas originales (A-01): spec 001.

### Key Entities

- **Factura original**: factura de la serie FA (o de otra serie distinta de RE) que se rectifica; pasa a estado «rectificada» y no cambia en nada más.
- **Factura rectificativa (RE)**: serie RE, mismo cliente, fecha de hoy, sin vencimiento, estado «emitida», referencia al número de la original, observaciones «Rectifica <número>. <motivo>», importes de la original con el signo cambiado.
- **Línea rectificativa**: copia de cada línea de la original con cantidad, base y cuotas negadas, precio y tipo de IVA iguales y texto «Rectificación: <texto>».
- **Motivo**: texto libre opcional que se añade a las observaciones.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Esta spec es un contrato de comportamiento; sus criterios se miden con la suite de caracterización existente, que no se modifica.

- **SC-001**: el 100 % de los tests de los bloques «Camino 3 · rectificación (POST /facturas/:id/rectificar)» (8) y «RN-31 · las facturas no se borran nunca» (1) de `servidor-facturas.test.js` pasa sin cambios.
- **SC-002**: `golden-master.test.js` pasa en GM-11 (cobro y rectificación con motivo) y GM-12 (rectificación de la histórica descuadrada FA-2026-000105 y segundo intento rechazado), con la salida idéntica a la del master.
- **SC-003**: el test «rectificar hoy una factura del 1T no cambia el 1T y resta en el 4T (A-28, RN-41)» de `servidor-informes.test.js` pasa sin cambios.
- **SC-004**: los 10 requisitos (FR-001 a FR-010) tienen al menos un test citado; las partes sin test (botón de rectificar, fallos ignorados, cliente inexistente) figuran en «Huecos de cobertura» con su criterio de inspección.
- **SC-005**: Puri puede rectificar una factura sobre una copia y comprobar, sin consultar el código, que la rectificativa es el espejo exacto de la original, con la fecha, las observaciones y los estados que describe esta spec.

## Assumptions

- La versión de referencia es el código del commit `2b49ea5` y la copia de `datos/gesfact.db` versionada en ese commit. La BD de producción no se toca; los tests trabajan sobre copias temporales, con reloj (2026-11-16) y zona horaria fijos.
- Las rectificaciones se hacen solo desde la pantalla de detalle o, en los tests, con peticiones directas; no hay ningún proceso automático que rectifique.
- El testimonio de negocio citado es simulado y ratificado por la responsable del proyecto (NEGOCIO-RS). No condiciona esta spec, que fija el comportamiento actual; sí condiciona cualquier corrección futura (deuda de confirmación).
- La numeración (007) y el nombre (`007-rectificacion-conservacion`) siguen la [propuesta de partición](../000-reconocimiento/propuesta-particion-specs.md).
