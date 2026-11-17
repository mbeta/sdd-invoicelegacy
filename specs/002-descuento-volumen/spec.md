# Especificación: Descuento por volumen (comportamiento actual)

**Rama**: `002-descuento-volumen`

**Creada**: 2026-11-16

**Estado**: Borrador

**Entrada**: descripción del usuario: «Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del descuento por volumen de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.» (El texto completo, con el alcance RN-09 a RN-13, las convenciones, las anomalías y los criterios, se recoge íntegro en las secciones de esta spec.)

## Naturaleza de esta spec

- **Es una spec inversa.** Cada requisito describe lo que GesFact 2.4 hace **hoy**, aunque parezca un error. Nada de lo que aquí se exige obliga a cambiar el programa actual (constitución, principio I).
- **Evidencia.** Cada requisito cita su evidencia: `fichero:líneas` del código, dato real de la copia de `datos/gesfact.db` o acta de negocio. Los tests se citan como `fichero › «título del test»`, todos en `pruebas/caracterizacion/`.
- **Anomalías.** Se especifican tal como funcionan hoy, con su ID del [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md). No se corrigen ni se omiten.
- **Convenciones declaradas.** Lo que el negocio dice que **debería** pasar se presenta como «convención declarada», nunca como requisito.
- **Testimonio de negocio.** Las actas citadas son la [entrevista simulada](../000-reconocimiento/entrevista-negocio-simulada.md) y la [ratificación simulada](../000-reconocimiento/ratificacion-negocio-simulada.md) del 2026-11-16 (testigo NEGOCIO-RS). Arrastran una **deuda de confirmación**: no afecta a esta spec, que fija el comportamiento actual, pero sí a cualquier corrección posterior.
- **Relación con la spec 001.** Esta spec decide **si** hay descuento y **qué precio** queda en cada línea. Con ese precio, la línea, el IVA, el recargo y los totales se calculan como dice la [spec 001](../001-calculo-importe-factura/spec.md).
- **Línea base verificada.** El 2026-11-16, sobre el commit `2b49ea5`, los seis ficheros de test citados (`calculo`, `anomalias-calculo`, `golden-master`, `datos-historicos`, `servidor-facturas` y `remesa`) pasan **175 de 175** tests.

## User Scenarios & Testing *(mandatory)*

### Historia 1 - Un cliente que compra por encima del umbral recibe el descuento de su tramo (Priority: P1)

Paco (comercial) acordó en 2018 un descuento por volumen para fidelizar a la hostelería: si la base de la factura pasa de 1.000 €, un 2 %; si pasa de 5.000 €, un 5 %. Los umbrales son **estrictos**: una factura de exactamente 1.000,00 € no lleva descuento, y una de exactamente 5.000,00 € lleva el 2 %, no el 5 %.

**Why this priority**: decide el importe de todas las facturas grandes, y la frontera exacta tiene un caso real cobrado (FA-2026-000103, Hotel Vega Baja).

**Independent Test**: se comprueba solo con el cálculo de una factura: `calculo.test.js` (RN-09) y `anomalias-calculo.test.js` (A-10). De punta a punta, GM-03 y GM-04 del golden master.

**Acceptance Scenarios**:

1. **Given** una factura de una sola línea al 21 %, **When** su base bruta es la de la tabla, **Then** el descuento, la base final y el total son exactamente:

   | Base bruta | Descuento | Base final | Total |
   | --- | --- | --- | --- |
   | 999,99 | 0 % | 999,99 | 1.209,99 |
   | **1.000,00** | **0 %** | 1.000,00 | 1.210,00 |
   | 1.000,01 | 2 % | 980,01 | 1.185,81 |
   | 4.999,99 | 2 % | 4.899,99 | 5.928,99 |
   | **5.000,00** | **2 %** | 4.900,00 | 5.929,00 |
   | 5.000,01 | 5 % | 4.750,01 | 5.747,51 |

   Test: `calculo.test.js` › los seis tests «tabla de reglas-de-negocio.md: base bruta … → … %, base …, total …».
2. **Given** las dos fronteras, **When** se pide el porcentaje justo debajo, en el umbral exacto y justo encima, **Then** 1.000,00 → 0 %; 1.000,01 → 2 %; 5.000,00 → 2 %; 5.000,01 → 5 %. Tests: `calculo.test.js` › «porcentajeDescuento en las dos fronteras (justo debajo / exacto / justo encima)»; `anomalias-calculo.test.js` › «CONGELA comportamiento actual: 1.000,00 → 0 %; 1.000,01 → 2 %; 5.000,00 → 2 %; 5.000,01 → 5 % (A-10)».
3. **Given** un alta para el Hotel Vega Baja con una línea de 1.000 € al 21 %, **When** se graba, **Then** sale sin descuento; **Given** la misma alta con 1.000,01 €, **Then** sale con un 2 % rebajando el precio. Tests: GM-03 y GM-04.

---

### Historia 2 - La gestoría ve el descuento desglosado en cada línea, con el precio ya rebajado (Priority: P2)

Puri (gestoría) pidió en 2018 ver el descuento desglosado igual en cada línea. Por eso el descuento no aparece como una línea aparte: rebaja el precio unitario de cada línea, redondeado al céntimo, y la línea se recalcula entera con ese precio. El precio de tarifa no se guarda. Como el precio rebajado se redondea, el descuento real no es exactamente el 2 % o el 5 %.

**Why this priority**: es lo que llega a Contaplus línea a línea, y fija céntimo a céntimo el importe de cada línea con descuento.

**Independent Test**: `calculo.test.js` (RN-11, RN-12) y `anomalias-calculo.test.js` (A-11); de punta a punta, GM-04.

**Acceptance Scenarios**:

1. **Given** 40 «Plato llano» a 28,90 € (base bruta 1.156,00 € → 2 %), **When** se calcula, **Then** el precio queda en 28,32 €/ud (28,322 redondeado), la base de la línea en 1.132,80 € y su IVA en 237,89 €. Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 40 platos con 2 % → 28,32 €/ud; base 1.132,80; IVA 237,89».
2. **Given** 2.000 ud a 0,51 € (1.020,00 € brutos → 2 %), **When** se calcula, **Then** el precio queda en 0,50 € (0,4998 redondeado), la base en 1.000,00 € y el descuento efectivo es de 20,00 € (1,96 %), no 20,40 €. Tests: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 2.000 ud a 0,51 → precio 0,50 → base 1.000,00 (descuento efectivo 1,96 %)»; `anomalias-calculo.test.js` › «CONGELA comportamiento actual: 2.000 × 0,51 con 2 % descuenta 20,00 € (1,96 %) y no 20,40 (A-11)».
3. **Given** 1.000 ud a 1,01 €, **When** se calcula, **Then** el precio queda en 0,99 € y la base en 990,00 € (con un 2 % exacto serían 989,80 €). Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 1.000 ud a 1,01 → precio 0,99 → base 990,00 (con 2 % exacto serían 989,80)».
4. **Given** una factura con descuento, **When** se calcula, **Then** cada línea resultante solo conserva el precio rebajado, no el de tarifa. Test: `anomalias-calculo.test.js` › «CONGELA comportamiento actual: la línea resultante solo conserva el precio rebajado, no el de tarifa (A-11)».

---

### Historia 3 - El tramo se decide con toda la factura y no se revisa después (Priority: P3)

El tramo se decide sumando las bases de **todas** las líneas antes de descontar: todos los tipos de IVA, los portes y los servicios; las líneas negativas restan. Decidido el tramo, no se vuelve a comprobar, aunque la base descontada quede por debajo del umbral. Como el descuento se aplica a toda la base y no solo a lo que pasa del umbral, al cruzarlo el total puede **bajar**: comprar una unidad más puede costar menos.

**Why this priority**: es el diseño acordado (descuento sobre toda la base) y su consecuencia aceptada (no monotonía). Afecta a pocas facturas reales, pero cualquier cambio altera importes.

**Independent Test**: `calculo.test.js` (RN-10, RN-12) y `anomalias-calculo.test.js` (A-09); de punta a punta, GM-05 y GM-06.

**Acceptance Scenarios**:

1. **Given** 35 «Plato llano» (1.011,50 € brutos), **When** se calcula, **Then** lleva un 2 % y la base final queda en 991,20 €, por debajo de 1.000 €, conservando el descuento. Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 35 platos = 1.011,50 brutos → 2 % → base final 991,20 (conserva el descuento)».
2. **Given** una línea de 1.500 € y otra de −600 €, **When** se calcula, **Then** la base bruta es de 900 € y no hay descuento. Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 1.500 y −600 → 900 brutos y ningún descuento».
3. **Given** 600 € al 21 % y 401 € al 4 %, **When** se calcula, **Then** la base bruta es de 1.001 € y lleva un 2 %: cuentan todos los tipos de IVA. Test: `calculo.test.js` › «entran todos los tipos de IVA en la base bruta: 600 al 21 % + 401 al 4 % = 1.001 → 2 %».
4. **Given** 182 «Aceite 5L» a 27,45 € al 4 % (4.995,90 € brutos → 2 %) y 183 (5.023,35 € → 5 %), **When** se calculan, **Then** los totales son 5.091,63 € y 4.963,55 €: una unidad más cuesta 128,08 € menos. Tests: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 182 aceites → total 5.091,63; 183 aceites → 4.963,55»; `anomalias-calculo.test.js` › «CONGELA comportamiento actual: 183 aceites cuestan 128,08 € menos que 182 (A-09)»; GM-05 y GM-06.
5. **Given** bases brutas de 1.000,00 € y 1.000,01 €, **When** se calculan, **Then** la primera paga 1.210,00 € y la segunda 1.185,81 €, 24,19 € menos. Tests: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: base bruta 1.000,00 paga 1.210,00; 1.000,01 paga 1.185,81»; `anomalias-calculo.test.js` › «CONGELA comportamiento actual: 1.000,01 de base bruta paga 24,19 € menos que 1.000,00 (A-09)».

---

### Historia 4 - La factura del alta deja constancia del descuento; la de la remesa no (Priority: P4)

Cuando el alta manual aplica un descuento, añade a las observaciones el texto « Descuento volumen N% aplicado», con un espacio delante también si no había observaciones. Las facturas de cuotas de la remesa mensual nunca llevan esa anotación: sus observaciones son siempre «Remesa mes año», aunque el cálculo les haya aplicado descuento.

**Why this priority**: es el único rastro visible del descuento en el documento, porque el precio de tarifa no se guarda (historia 2).

**Independent Test**: `servidor-facturas.test.js` (dos tests de RN-13) y `remesa.test.js` (cuota de 1.200 €); de punta a punta, GM-04 y GM-06.

**Acceptance Scenarios**:

1. **Given** un alta sin observaciones que lleva un 2 %, **When** se graba, **Then** las observaciones quedan « Descuento volumen 2% aplicado», con espacio inicial. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: con descuento y sin observaciones queda « Descuento volumen 2% aplicado», con espacio inicial (RN-13)»; GM-04.
2. **Given** un alta con observaciones que lleva descuento, **When** se graba, **Then** la anotación se añade detrás de las observaciones, separada por ese espacio (por ejemplo, «Pedido temporada Descuento volumen 5% aplicado»). Test: `servidor-facturas.test.js` › «RN-13 · con observaciones, la anotación del descuento se añade detrás»; GM-06.
3. **Given** un alta sin descuento, **When** se graba, **Then** las observaciones quedan tal como se escribieron, sin anotación. Evidencia: `routes/facturas.js:76`; GM-01 (factura sin descuento).
4. **Given** un contrato con una cuota de 1.200 €, **When** la remesa mensual genera su factura, **Then** lleva un 2 % de descuento y sus observaciones no lo anotan. Test: `remesa.test.js` › «CONGELA comportamiento actual: una cuota de 1.200 € recibe un 2 % de descuento sin anotarlo (A-12, RN-13)». Que la cuota reciba descuento es la anomalía A-12, que especifica la spec 005; esta spec solo fija que la remesa no anota.

---

### Historia 5 - El equipo de modernización sabe qué facturas históricas con descuento no reproduce el código (Priority: P5)

Dos facturas reales de la frontera del descuento no salen igual con el código actual. Esta historia **no las especifica**: las documenta, para que la migración conserve sus valores grabados y nadie las tome como ejemplo de la regla. Su procedencia (A-04) está excluida de las specs y va al plan de migración.

**Why this priority**: evita tomar como regla dos casos que la contradicen y recalcular documentos ya emitidos.

**Independent Test**: `datos-historicos.test.js` › los dos tests de FA-2026-000103 y FA-2026-000105.

**Acceptance Scenarios**:

1. **Given** FA-2026-000103 («base 1000 justa», cobrada sin descuento), **When** se recalculan sus líneas grabadas, **Then** suman 1.000,02 € brutos (los portes, 0,92 × 6,00 = 5,52, se grabaron como 5,50) y saldría con un 2 %. Test: `datos-historicos.test.js` › «CONGELA comportamiento actual: FA-2026-000103 («base 1000 justa») recalculada suma 1.000,02 brutos y saldría con 2 % (A-04, D9)».
2. **Given** FA-2026-000105, **When** se revisa, **Then** anota «Descuento volumen 2% aplicado» (sin espacio inicial) con precios de catálogo sin rebajar, y su base grabada (2.287,75 €) no es la que daría el código (2.288,68 €). Test: `datos-historicos.test.js` › «CONGELA comportamiento actual: FA-2026-000105 anota descuento con precios sin rebajar; el código daría base 2.288,68 (A-04, D12)».

---

### Edge Cases

- **Base bruta en el umbral exacto:** 1.000,00 € → 0 %; 5.000,00 € → 2 % (FR-001, A-10).
- **Base bruta que solo llega al umbral por los céntimos de redondeo de las líneas:** la base bruta es la suma de las bases ya redondeadas de cada línea (spec 001, FR-001), así que esos céntimos sí cuentan. Es lo que separa los 1.000,02 € recalculados de FA-2026-000103 de los 1.000,00 € grabados (historia 5).
- **Base descontada por debajo del umbral:** conserva el descuento; el tramo no se revisa (FR-003).
- **Líneas negativas:** restan de la base bruta y pueden anular el descuento (FR-002). Cuando hay descuento, también se rebaja su precio. Que se admitan líneas negativas en la serie FA es de la spec 003 (A-15).
- **Base bruta cero, negativa, enorme o no numérica:** cero, negativa y no numérica → 0 %; enorme → 5 %. Test: `calculo.test.js` › «cero, negativos, enormes y NaN».
- **Precio rebajado con medio céntimo:** se redondea con la misma operación de redondeo de la spec 001 (FR-005), con sus efectos de coma flotante.
- **Descuento real distinto del nominal:** puede quedarse por debajo o por encima del 2 % o del 5 % según el redondeo del precio (FR-006).

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito describe el comportamiento **actual**. «Base bruta» es la suma de las bases de todas las líneas de la factura, calculadas con el precio sin descontar y redondeadas como dice la spec 001.

- **FR-001 (RN-09) · Tramos con umbrales estrictos.** El sistema aplica un 2 % de descuento si la base bruta es **mayor** que 1.000 €, un 5 % si es **mayor** que 5.000 €, y ninguno en otro caso. El umbral exacto no entra en el tramo: 1.000,00 € → 0 %; 5.000,00 € → 2 %. Los valores exactos son los de la tabla de la historia 1. Dato real: FA-2026-000103 (Hotel Vega Baja), base 1.000,00 € y sin descuento.
  - Evidencia: `services/calculo.js:39-43` (`porcentajeDescuento`); `db.js:138-139` (FA-2026-000103, con el comentario «base 1000 justa NO lleva descuento»); cliente 5 = Hotel Vega Baja (`db.js:100`). Anomalía A-10.
  - Test: `calculo.test.js` › los ocho tests de «RN-09 · tramos de descuento con umbrales estrictos: > 1.000 → 2 %; > 5.000 → 5 %»; `anomalias-calculo.test.js` › «… (A-10)»; GM-03, GM-04.
- **FR-002 (RN-10) · Base que decide el tramo.** El sistema decide el tramo con la base bruta de **todas** las líneas de la factura: todos los tipos de IVA, portes y servicios incluidos; las líneas negativas restan. Ejemplos: 600 € al 21 % + 401 € al 4 % = 1.001 € → 2 %; 1.500 € y −600 € → 900 € → sin descuento.
  - Evidencia: `services/calculo.js:53-61`.
  - Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 1.500 y −600 → 900 brutos y ningún descuento»; «entran todos los tipos de IVA en la base bruta: 600 al 21 % + 401 al 4 % = 1.001 → 2 %».
- **FR-003 (RN-10) · El tramo no se revisa.** Una vez decidido, el sistema no vuelve a comprobar el tramo, aunque la base final descontada quede por debajo del umbral. Ejemplo: 35 «Plato llano» = 1.011,50 € → 2 % → base final 991,20 €.
  - Evidencia: `services/calculo.js:60-61`, `:65-84` (el porcentaje se calcula una vez y se aplica en una segunda pasada sin volver a evaluarlo).
  - Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 35 platos = 1.011,50 brutos → 2 % → base final 991,20 (conserva el descuento)».
- **FR-004 (RN-11) · El descuento rebaja el precio unitario de cada línea.** Con descuento, el sistema sustituye el precio unitario de **cada** línea por precio × (100 − descuento) / 100, redondeado al céntimo, y recalcula la línea entera con ese precio (base, IVA y recargo, según la spec 001). No se añade ninguna línea de descuento. Ejemplo: 40 «Plato llano» con 2 % → 28,32 €/ud; base 1.132,80 €; IVA 237,89 €.
  - Evidencia: `services/calculo.js:63-80`; el comentario «el descuento se aplica linea a linea para que la gestoria lo vea desglosado igual (peticion de Puri, 2018)» está en `:63-64`. Anomalía A-11.
  - Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 40 platos con 2 % → 28,32 €/ud; base 1.132,80; IVA 237,89»; GM-04.
- **FR-005 (RN-11) · El precio de tarifa no se conserva.** La línea resultante solo lleva el precio rebajado; el precio de tarifa no queda en la factura ni en ningún otro sitio.
  - Evidencia: `services/calculo.js:72-80` (la línea guarda `precio: precioConDto`). Anomalía A-11.
  - Test: `anomalias-calculo.test.js` › «CONGELA comportamiento actual: la línea resultante solo conserva el precio rebajado, no el de tarifa (A-11)».
- **FR-006 (RN-12) · Descuento efectivo y saltos entre tramos.** Como consecuencia de FR-001 a FR-004, el sistema debe reproducir exactamente estos resultados:
  - 2.000 ud a 0,51 € → precio 0,50 € → base 1.000,00 € (descuento efectivo de 20,00 €, un 1,96 %);
  - 1.000 ud a 1,01 € → precio 0,99 € → base 990,00 € (con un 2 % exacto serían 989,80 €);
  - 182 «Aceite 5L» → total 5.091,63 €; 183 → 4.963,55 € (una unidad más cuesta 128,08 € menos);
  - base bruta 1.000,00 € → total 1.210,00 €; 1.000,01 € → 1.185,81 € (24,19 € menos).
  - Evidencia: `services/calculo.js:39-43`, `:68-70`. Anomalías A-09 y A-11.
  - Test: `calculo.test.js` › los cuatro tests de «RN-12 · el descuento real no es exactamente el nominal y los tramos tienen saltos»; `anomalias-calculo.test.js` › los dos tests de «A-09 · el descuento por volumen no es monótono» y «CONGELA comportamiento actual: 2.000 × 0,51 con 2 % descuenta 20,00 € (1,96 %) y no 20,40 (A-11)»; GM-05, GM-06.
- **FR-007 (RN-13) · Anotación en el alta manual.** Si la factura del alta lleva descuento, el sistema graba como observaciones lo que se tecleó (o nada) seguido literalmente de « Descuento volumen N% aplicado», con un espacio inicial, donde N es 2 o 5. Sin descuento, graba las observaciones tal cual.
  - Evidencia: `routes/facturas.js:74-76`.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: con descuento y sin observaciones queda « Descuento volumen 2% aplicado», con espacio inicial (RN-13)» y «RN-13 · con observaciones, la anotación del descuento se añade detrás»; GM-04, GM-06.
- **FR-008 (RN-13) · Sin anotación en la remesa.** Las facturas de cuotas que genera la remesa mensual llevan siempre como observaciones «Remesa mes año», sin anotar el descuento aunque el cálculo lo haya aplicado.
  - Evidencia: `scripts/remesa_mensual.js:55` (pasa por el mismo cálculo), `:62` (observaciones fijas).
  - Test: `remesa.test.js` › «CONGELA comportamiento actual: una cuota de 1.200 € recibe un 2 % de descuento sin anotarlo (A-12, RN-13)». Que la cuota reciba descuento (A-12) lo especifica la spec 005.

### Anomalías de esta spec

Todas están cerradas en el [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md) (§7).

| ID | Clasificación | Comportamiento especificado | Tratamiento acordado | Decisión de negocio | Tests |
| --- | --- | --- | --- | --- | --- |
| A-09 | INTENCIONAL (descuento sobre toda la base) / ACCIDENTAL aceptada (no monotonía) | FR-002, FR-003 y FR-006 (182 frente a 183 aceites; 1.000,00 frente a 1.000,01) | Especificar tal cual; no se corrige. No retroactivo | Acta simulada, P07, Paco, 2026-11-16; ratificación §2.1, P07, Paco y Puri, 2026-11-16 → RS-06 | `anomalias-calculo.test.js` › «183 aceites cuestan 128,08 € menos que 182 (A-09)» y «1.000,01 de base bruta paga 24,19 € menos que 1.000,00 (A-09)»; GM-05, GM-06 |
| A-10 | INTENCIONAL (anomalía positiva) | FR-001 (1.000,00 → 0 %; 5.000,00 → 2 %) | Especificar tal cual, frontera exacta incluida; no se corrige. FA-2026-000103 no se toca | Acta simulada, P09, Paco, 2026-11-16 → RS-07 | `anomalias-calculo.test.js` › «1.000,00 → 0 %; 1.000,01 → 2 %; 5.000,00 → 2 %; 5.000,01 → 5 % (A-10)»; GM-03 |
| A-11 | INTENCIONAL (desglose por línea) / ACCIDENTAL aceptada (desviación por redondeo) | FR-004, FR-005 y FR-006 (1,96 %; 990,00 frente a 989,80) | Especificar tal cual. Guardar el precio de tarifa sería una ampliación de la modernización, no retroactiva | Comentario del código, petición de Puri de 2018 (`services/calculo.js:63-64`); acta simulada, P16, Puri, 2026-11-16 → RS-08 | `anomalias-calculo.test.js` › «2.000 × 0,51 con 2 % descuenta 20,00 € (1,96 %) y no 20,40 (A-11)» y «la línea resultante solo conserva el precio rebajado, no el de tarifa (A-11)»; GM-04 |

**Discrepancia documental D1 (se registra, no se corrige).** El comentario de `services/calculo.js:37` dice «a partir de 1.000 eur -> 2%, a partir de 5.000 eur -> 5%», mientras que el código usa «mayor que» (`:40-41`). Manda el código, respaldado por el comentario de la siembra (`db.js:138`) y por CN-8.

### Convenciones declaradas (no son requisitos)

Son conducta deseada declarada por el negocio. Esta spec **no las impone**.

| # | Convención declarada | Fuente | Relación con el comportamiento actual |
| --- | --- | --- | --- |
| CN-8 | «A partir de» un umbral significa «por encima de»: el umbral exacto no se incluye | Acta simulada, P09, Paco, 2026-11-16 → RS-07; ratificada en la §4 de la ratificación | **Coincide** con FR-001 (A-10 es una anomalía positiva). Solo la contradice el comentario D1 |
| CN-10 | Para el umbral cuentan todas las líneas de la factura, portes y servicios incluidos, y las devoluciones de envases restan | Ratificación §2.1, P07, Paco y Puri, 2026-11-16 | **Coincide** con FR-002 en lo que cuenta. Matiz: el programa resta **cualquier** línea negativa, no solo las de envases; esa diferencia es la anomalía A-15 (CN-5), que especifica la spec 003 |
| CN-2 | Las cuotas de contrato nunca llevan descuento por volumen | Acta simulada, P13, Paco, 2026-11-16 → RS-09 | **Diverge**: una cuota de más de 1.000 € recibe descuento en la remesa (A-12, BUG A SECAS latente; ninguna cuota real pasa de 145 €). Se especifica en la spec 005; aquí solo se cita por FR-008 |

### Fuera de alcance

- Cálculo de la línea, el IVA, el recargo y los totales a partir del precio rebajado: spec 001.
- Descuento aplicado a las cuotas en la remesa (A-12): spec 005.
- Admisión de líneas negativas en la serie FA (A-15): spec 003.
- Procedencia de los datos históricos (A-04): excluida, va al plan de migración. FA-2026-000103 y FA-2026-000105 se documentan en la historia 5, no se especifican.

### Key Entities

- **Base bruta de la factura**: suma de las bases de todas sus líneas con los precios sin descontar. Decide el tramo (FR-001, FR-002).
- **Tramo de descuento**: 0 %, 2 % o 5 %, según la base bruta con umbrales estrictos en 1.000 € y 5.000 € (FR-001).
- **Línea de factura**: con descuento, su precio unitario pasa a ser el rebajado y redondeado; el de tarifa se pierde (FR-004, FR-005).
- **Observaciones de la factura**: en el alta reciben la anotación del descuento; en la remesa, nunca (FR-007, FR-008).

## Success Criteria *(mandatory)*

### Measurable Outcomes

Esta spec es un contrato de comportamiento; sus criterios se miden con la suite de caracterización existente, que no se modifica.

- **SC-001**: el 100 % de los tests de `calculo.test.js` de los grupos RN-09 a RN-12 pasa sin cambios, incluidas las tres comprobaciones de cada frontera (justo debajo, exacto y justo encima de 1.000 € y de 5.000 €).
- **SC-002**: el 100 % de los tests de `anomalias-calculo.test.js` de los grupos A-09, A-10 y A-11 pasa sin cambios.
- **SC-003**: los dos tests de RN-13 de `servidor-facturas.test.js` y el de la cuota de 1.200 € de `remesa.test.js` pasan.
- **SC-004**: `golden-master.test.js` pasa en GM-03, GM-04, GM-05 y GM-06, con 0 céntimos de diferencia respecto al master.
- **SC-005**: los dos tests de `datos-historicos.test.js` de FA-2026-000103 y FA-2026-000105 pasan y las mantienen documentadas como no reproducibles.
- **SC-006**: los 8 requisitos (FR-001 a FR-008) y las 3 anomalías tienen al menos una evidencia y un test citados (100 % de trazabilidad).
- **SC-007**: un revisor de negocio (Paco o Puri) puede comprobar a mano, con calculadora, cada fila de la tabla de la historia 1 y cada ejemplo de FR-006, y obtener el mismo importe al céntimo aplicando solo FR-001 a FR-004 y las reglas de la spec 001.

## Assumptions

- La versión de referencia es el código del commit `2b49ea5` y la copia de `datos/gesfact.db` versionada en ese commit. La BD de producción no se toca; los tests trabajan sobre copias temporales.
- El testimonio de negocio citado es simulado y ratificado por la responsable del proyecto (NEGOCIO-RS). No condiciona esta spec, que fija el comportamiento actual; sí condiciona cualquier corrección futura (deuda de confirmación).
- El cálculo de cada línea, una vez fijado el precio rebajado, es el de la spec 001 (redondeo línea a línea, recargo por tipo, totales por suma de líneas).
- Los porcentajes de descuento posibles son solo 0, 2 y 5; el texto de la anotación usa ese número entero sin decimales (FR-007).
- La numeración (002) y el nombre (`002-descuento-volumen`) siguen la [propuesta de partición](../000-reconocimiento/propuesta-particion-specs.md).
