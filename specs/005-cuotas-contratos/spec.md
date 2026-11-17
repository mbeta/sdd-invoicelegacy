# Especificación: Cuotas de contratos — vigencia, prorrateo y baja (comportamiento actual)

**Rama**: `005-cuotas-contratos`

**Creada**: 2026-11-16

**Estado**: Borrador

**Entrada**: descripción del usuario: «Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del cálculo de las cuotas de los contratos (qué contratos se cobran cada mes y cuánto: vigencia, prorrateo del mes parcial, importe de la baja y descuento aplicado a cuotas) de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.» (El texto completo, con el alcance RN-32, RN-34, RN-39, RN-40 y RN-48, las convenciones, las anomalías y los criterios, se recoge íntegro en las secciones de esta spec.)

## Naturaleza de esta spec

- **Es una spec inversa.** Cada requisito describe lo que GesFact 2.4 hace **hoy**, aunque parezca un error. Nada de lo que aquí se exige obliga a cambiar el programa actual (constitución, principio I).
- **Evidencia.** Cada requisito cita su evidencia: `fichero:líneas` del código, dato real de la copia de `datos/gesfact.db` o acta de negocio. Los tests se citan como `fichero › «título del test»`, todos en `pruebas/caracterizacion/`.
- **Anomalías.** Se especifican tal como funcionan hoy, con su ID del [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md). No se corrigen ni se omiten.
- **Convenciones declaradas.** Lo que el negocio dice que **debería** pasar se presenta como «convención declarada», nunca como requisito.
- **Testimonio de negocio.** Las actas citadas son la [entrevista simulada](../000-reconocimiento/entrevista-negocio-simulada.md) y la [ratificación simulada](../000-reconocimiento/ratificacion-negocio-simulada.md) del 2026-11-16 (testigo NEGOCIO-RS). Arrastran una **deuda de confirmación**: no afecta a esta spec, que fija el comportamiento actual, pero sí a cualquier corrección posterior.
- **Dos cálculos distintos para lo mismo.** Hoy hay **dos fórmulas** de prorrateo del mes parcial: la de la remesa mensual (días reales del mes) y la de la pantalla de baja (mes comercial de 30 días). Esta spec las especifica **las dos**, tal como son (A-13).
- **Qué decide esta spec.** Qué contratos se cobran cada mes y cuánto. Cómo se lanza la remesa y qué documento genera es de la spec 006.
- **Línea base verificada.** El 2026-11-16, sobre el commit `2b49ea5`, los cuatro ficheros de test citados (`calculo`, `remesa`, `anomalias-calculo` y `util`) pasan **149 de 149** tests.

## User Scenarios & Testing *(mandatory)*

### Historia 1 - La remesa cobra cada mes los contratos vigentes (Priority: P1)

Los contratos son cuotas mensuales: alquiler de máquinas y mantenimientos. Cada mes, la remesa factura los contratos que han estado vigentes en algún momento del mes: dados de alta como muy tarde el último día del mes y sin baja, o con la baja el día 1 o después. El día del alta y el de la baja cuentan como días de servicio. La remesa no mira si el cliente está dado de baja.

**Why this priority**: decide qué clientes reciben factura de cuota cada mes; es la fuente de ingresos recurrente.

**Independent Test**: `remesa.test.js` › bloque «RN-32 · qué contratos entran en el mes (fronteras de alta y baja, marzo de 2026)» y el dato real del contrato 3.

**Acceptance Scenarios**:

1. **Given** el contrato 4 (90 €) y la remesa de marzo de 2026, **When** se cambian su alta o su baja a las fronteras del mes, **Then** se factura o no así:

   | Cambio en el contrato 4 | Resultado en marzo de 2026 |
   | --- | --- |
   | baja 2026-02-28 (día anterior al 1) | no se factura |
   | baja 2026-03-01 (el día 1) | 1 día → 2,90 € |
   | baja 2026-03-02 (día 2) | 2 días → 5,81 € |
   | alta 2026-03-30 (penúltimo día) | 2 días → 5,81 € |
   | alta 2026-03-31 (último día) | 1 día → 2,90 € |
   | alta 2026-04-01 (día siguiente al último) | no se factura |

   Test: `remesa.test.js` › los seis tests de la tabla de «RN-32 · qué contratos entran en el mes…».
2. **Given** el contrato 3 (60 €, alta 2025-06-16, baja 2025-09-15; dato real), **When** se lanzan las remesas de junio, septiembre y octubre de 2025, **Then** junio y septiembre facturan 30,00 € cada una y octubre no lo factura. Test: `remesa.test.js` › «dato real de reglas-de-negocio.md: contrato 3 (60 €) en junio y septiembre de 2025 → 30,00 cada uno; en octubre no entra».
3. **Given** un cliente dado de baja con un contrato vigente, **When** se lanza la remesa, **Then** se le factura. Test: `remesa.test.js` › «CONGELA comportamiento actual: la remesa factura a un cliente dado de baja (A-07, C08)». La anomalía A-07 se especifica en la spec 003.

---

### Historia 2 - El mes parcial de la remesa se cobra por los días reales del mes (Priority: P2)

Si el contrato empieza o termina dentro del mes, la remesa cobra la parte proporcional: cuota dividida entre los días que tiene ese mes y multiplicada por los días de servicio, redondeada al céntimo. Si el contrato está todo el mes, cobra la cuota entera.

**Why this priority**: es lo que se factura de verdad en los meses de alta y de baja. Difiere de lo que dice el negocio (CN-1, CN-9) y de lo que calcula la pantalla de baja (historia 3).

**Independent Test**: `remesa.test.js` › bloque «RN-34 · el mes parcial se prorratea por los días reales del mes»; `util.test.js` › bloque «RN-48 · diasDelMes: calendario real con bisiestos».

**Acceptance Scenarios**:

1. **Given** el contrato 4 (90 €, alta 2026-02-15), **When** se lanza la remesa de febrero de 2026, **Then** cobra 14 de 28 días: base 45,00 € y total 54,45 €. Test: `remesa.test.js` › «ejemplo de reglas-de-negocio.md: contrato 4 en febrero de 2026, 14 de 28 días → 45,00; total 54,45».
2. **Given** el contrato 2 (145 €, alta 2023-01-15), **When** se lanza la remesa de enero de 2023, **Then** cobra 17 de 31 días: 79,52 €. Test: `remesa.test.js` › «ejemplo de reglas-de-negocio.md: contrato 2 en enero de 2023, 17 de 31 días → 79,52 (vence a 60 días: 2023-04-01)».
3. **Given** un contrato de 90 € con alta el 15/02/2028 (año bisiesto), **When** se lanza la remesa de febrero de 2028, **Then** cobra 15 de 29 días: 46,55 €. Test: `remesa.test.js` › «ejemplo de reglas-de-negocio.md: alta el 15/02/2028 (bisiesto), 15 de 29 días → 46,55».
4. **Given** febrero de 2026, 2028 y 2100, **When** se cuentan sus días, **Then** son 28, 29 y 28. Test: `util.test.js` › «ejemplos de reglas-de-negocio.md: febrero 2026 → 28; 2028 → 29; 2100 → 28».

---

### Historia 3 - La pantalla de baja calcula un importe «a lo comercial» que no se graba (Priority: P3)

Para dar de baja un contrato se indica la fecha (si no, hoy). El programa graba la fecha de baja y calcula el importe del último mes «a lo comercial», como lo hacía Paco en el Access: cuota entre 30 por los días desde el día 1 hasta la baja, con un máximo de 30 días. Ese importe solo aparece en la barra de direcciones: no se graba ni genera factura. La pantalla dice que administración emita esa factura a mano, pero Marga no lo hace, porque el mes ya lo factura la remesa.

**Why this priority**: es un importe que se comunica al cliente y que no coincide con el que factura la remesa (A-13); y el aviso de la pantalla induce a cobrar dos veces (A-06).

**Independent Test**: `calculo.test.js` › bloque «RN-39 · calcularProrrateo: mes comercial de 30 días (baja de contratos)»; `anomalias-calculo.test.js` › bloque «A-13 · …»; `remesa.test.js` › bloque «Baja de contratos y remesa sobre la misma copia».

**Acceptance Scenarios**:

1. **Given** una cuota de 90 €, **When** se calcula el importe de la baja, **Then** sale:

   | Baja | Días cobrados | Importe |
   | --- | --- | --- |
   | 1 de marzo | 1 | 3,00 |
   | 14 de febrero | 14 | 42,00 |
   | 15 de marzo | 15 | 45,00 |
   | 28 de febrero (mes completo) | 28 | **84,00** |
   | 30 de marzo | 30 | 90,00 |
   | 31 de marzo | 30 (tope) | 90,00 |

   Test: `calculo.test.js` › los seis tests «tabla de reglas-de-negocio.md: 90 € del … al … → …».
2. **Given** el contrato 3 (60 €) con baja el 2025-09-15 (dato real), **When** se calcula, **Then** sale 30,00 €. Test: `calculo.test.js` › «dato real de reglas-de-negocio.md: contrato 3, 60 € con baja 2025-09-15 → 30,00».
3. **Given** el contrato 1 (90 €), **When** se da de baja el 14/02/2026, **Then** la pantalla vuelve al listado con «?prorrateo=42.00» en la dirección; y **When** después se lanza la remesa de febrero, **Then** factura además 14 días por 45,00 € (total 54,45 €). Test: `remesa.test.js` › «CONGELA comportamiento actual: baja el 14/02/2026 → pantalla 42,00 y la remesa de febrero factura además 45,00 (A-06, A-13, C01)».
4. **Given** el contrato 2 (145 €), **When** se da de baja sin fecha el 2026-11-16, **Then** graba la baja con fecha 2026-11-16 y la pantalla muestra 77,33 € (16 días). Test: `remesa.test.js` › «RN-39 / RN-49 · baja sin fecha: se usa hoy (2026-11-16) y el prorrateo comercial de 16 días de 145 € → 77,33».
5. **Given** un contrato inexistente, **When** se da de baja, **Then** responde con error 404 «Contrato no encontrado». Test: `remesa.test.js` › «RN-39 · un contrato inexistente responde 404».

---

### Historia 4 - Una baja futura se ve como baja, pero la remesa sigue cobrando (Priority: P4)

Marga graba la baja en cuanto llega el preaviso, aunque sea para el mes siguiente. La pantalla de contratos marca el contrato como «de baja» y quita el botón de baja en cuanto tiene fecha de baja, sea pasada o futura. La remesa, en cambio, lo sigue cobrando hasta la fecha de baja, que es lo que el negocio entiende por vigente (P12).

**Why this priority**: la pantalla da una imagen equivocada de qué contratos siguen vivos (A-08), aunque lo que se factura es correcto según el negocio.

**Independent Test**: `remesa.test.js` › «CONGELA comportamiento actual: una baja futura se ve «de baja» en la pantalla y la remesa sigue facturando el mes entero (A-08, C10)».

**Acceptance Scenarios**:

1. **Given** el contrato 4 (90 €), **When** el 2026-11-16 se le graba una baja para el 2026-12-15, **Then** la pantalla muestra 45,00 € de prorrateo, marca la fila como «de baja» y sin botón de baja; y **When** se lanza la remesa de noviembre de 2026, **Then** factura el mes entero de ese contrato (90,00 €). Test: el mismo.

---

### Historia 5 - Una cuota grande recibe descuento por volumen sin anotarlo (Priority: P5)

La factura de cada cuota pasa por el mismo cálculo que el alta manual, incluido el descuento por volumen (spec 002). Una cuota de más de 1.000 € recibe un 2 % (o un 5 % si pasa de 5.000 €), y la factura no lo anota. Hoy no hay ninguna cuota así: las cuotas reales son de 90, 145, 60 y 90 €.

**Why this priority**: es un error latente (A-12) contra la convención de que las cuotas nunca llevan descuento (CN-2); no afecta a ningún contrato actual.

**Independent Test**: `remesa.test.js` › «CONGELA comportamiento actual: una cuota de 1.200 € recibe un 2 % de descuento sin anotarlo (A-12, RN-13)».

**Acceptance Scenarios**:

1. **Given** un contrato con cuota de 1.200 €, **When** se lanza la remesa de un mes completo, **Then** la factura lleva base 1.176,00 € (un 2 % menos) y sus observaciones no mencionan el descuento. Test: el mismo.

---

### Historia 6 - Los contratos se dan de alta por petición directa, con valores por defecto (Priority: P6)

No hay pantalla de alta de contratos. Julián los da de alta con una petición directa, siempre al 21 %. Si no se indica el tipo de IVA, se usa el 21 %; si no se indica la fecha de alta, la de hoy. La cuota se lee como los importes del alta de facturas: «1.234,56» se lee 1,234.

**Why this priority**: los valores por defecto deciden el IVA y el primer mes de cada contrato nuevo; la falta de pantalla se documenta, no se especifica (A-45).

**Independent Test**: `remesa.test.js` › «CONGELA comportamiento actual: alta de contrato sin tipo de IVA ni fecha → 21 % y hoy; «1.234,56» se lee 1,234 (A-45, A-05)».

**Acceptance Scenarios**:

1. **Given** un alta de contrato para el cliente 1 con cuota «1.234,56», sin tipo de IVA ni fecha, el 2026-11-16, **When** se envía, **Then** se graba con cuota 1,234, IVA del 21 %, alta 2026-11-16 y sin baja. Test: el mismo.

---

### Edge Cases

- **Alta o baja en el día límite del mes:** el día cuenta; una baja el día 1 cobra 1 día y un alta el último día cobra 1 día (FR-001, FR-002).
- **Baja el último día del mes o después:** la remesa cobra el mes entero, con la cuota completa (FR-002).
- **Mes completo en la remesa:** cobra la cuota entera, tenga el mes 28, 29, 30 o 31 días (FR-002).
- **Febrero completo en la pantalla de baja:** 84,00 € de 90 € (28/30) en 2026, y 87,00 € en un año bisiesto (29/30), no la cuota entera (FR-004; A-13). Test: `calculo.test.js` › «febrero bisiesto completo cuenta 29 días: 87,00 de 90,00».
- **Baja el día 31:** la pantalla cobra como máximo 30 días (90,00 € de 90 €). Test: `calculo.test.js` › «frontera del tope de 30 días: 29 / 30 / 31 días cobrados → 87 / 90 / 90».
- **Redondeo del importe de la baja:** al céntimo; 100 € por 1 día → 3,33; 145 € por 17 días → 82,17. Test: `calculo.test.js` › «redondeo del importe: 100 € por 1 día → 3,33; 145 € por 17 días → 82,17».
- **Cuota cero o negativa en la baja:** 0 €, o un importe negativo. Test: `calculo.test.js` › «cuota cero → 0; cuota negativa → importe negativo».
- **Baja anterior al alta en el mismo mes:** la pantalla ignora el alta y cobra desde el día 1 (30,00 € para una baja el día 10 con cuota de 90 €); la remesa cobra días negativos (−26,13 €). Test: `remesa.test.js` › «CONGELA comportamiento actual: baja antes del alta → la pantalla da 30,00 (ignora el alta) y la remesa −26,13 (A-26, A-13, C01)». El importe negativo de la remesa es A-26, que se especifica en la spec 006.
- **Fechas de meses distintos en el cálculo comercial:** da 0 (D4, parte de A-47). Desde la pantalla de baja es inalcanzable, porque siempre calcula desde el día 1 del mismo mes de la baja (`routes/contratos.js:38`). Test: `calculo.test.js` › «CONGELA comportamiento actual: fechas de meses distintos dan 0 (D4, A-47)».
- **Volver a dar de baja un contrato ya de baja:** la pantalla oculta el botón, pero una petición directa sobrescribiría la fecha de baja, porque el programa no lo comprueba (`routes/contratos.js:33-35`). **Sin test.**
- **Fechas mal escritas en contratos:** se comparan como texto (FR-001); una fecha sin ceros («2026-3-5») no se compararía bien. **SUPOSICIÓN** sobre su efecto: no hay fechas así en los datos ni test que lo pruebe.

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito describe el comportamiento **actual**.

- **FR-001 (RN-32) · Contratos que entran en la remesa del mes.** El sistema factura en la remesa de un mes todo contrato cuya fecha de alta sea igual o anterior al último día del mes y que no tenga baja o la tenga el día 1 del mes o después. Compara las fechas como texto en formato AAAA-MM-DD. No mira si el cliente está activo. Datos reales: el contrato 3 (alta 2025-06-16, baja 2025-09-15) se factura de junio a septiembre de 2025 y no en octubre.
  - Evidencia: `scripts/remesa_mensual.js:20-21` (primer y último día del mes), `:26-29` (selección). Que el cliente de baja se facture es A-07 (spec 003).
  - Test: `remesa.test.js` › los seis tests de la tabla de «RN-32 · qué contratos entran en el mes…» y «dato real de reglas-de-negocio.md: contrato 3 (60 €) en junio y septiembre de 2025 → 30,00 cada uno; en octubre no entra».
- **FR-002 (RN-34) · Importe de la cuota en la remesa.** El sistema calcula el importe del mes como cuota ÷ días del mes × días de servicio, redondeado al céntimo. Los días de servicio van desde el alta (o el día 1, si el alta es anterior) hasta la baja (o el último día, si la baja es posterior o no hay), los dos incluidos. Si el contrato está todo el mes, el importe es la cuota entera. Ejemplos: contrato 4 (90 €, alta 2026-02-15), 14 de 28 días → 45,00 €; contrato 2 (145 €), enero de 2023, 17 de 31 días → 79,52 €; alta el 15/02/2028, 15 de 29 días → 46,55 €; alta el 31 de marzo, 1 de 31 días → 2,90 €.
  - Evidencia: `scripts/remesa_mensual.js:43-51`. Anomalía A-13 (parte de la remesa).
  - Test: `remesa.test.js` › los tres ejemplos de «RN-34 · el mes parcial se prorratea por los días reales del mes» y «alta 2026-03-31 (último día) → 2.9 €».
- **FR-003 (RN-48) · Días del mes.** El sistema cuenta los días de cada mes según el calendario real, con años bisiestos: febrero de 2026 → 28; de 2028 → 29; de 2100 → 28; de 2000 → 29.
  - Evidencia: `lib/util.js:35-39` (`diasDelMes`).
  - Test: `util.test.js` › los cuatro tests de «RN-48 · diasDelMes: calendario real con bisiestos».
- **FR-004 (RN-39) · Importe de la baja.** Al dar de baja un contrato, el sistema calcula el importe del último mes como cuota ÷ 30 × días cobrados, redondeado al céntimo. Los días cobrados van del día 1 del mes de la baja al día de la baja, los dos incluidos, con un máximo de 30 y un mínimo de 0. No tiene en cuenta la fecha de alta. Febrero cuenta sus días reales, así que un febrero completo no llega a la cuota entera. Valores con cuota de 90 €: los de la tabla de la historia 3. Dato real: contrato 3 (60 €, baja 2025-09-15) → 30,00 €.
  - Evidencia: `services/calculo.js:90-102` (`calcularProrrateo`, con el comentario «a lo comercial … Asi lo hacia Paco a mano en el Access y asi lo espera la gestoria»); `routes/contratos.js:37-39`. Anomalía A-13 (parte de la baja).
  - Test: `calculo.test.js` › los trece tests de «RN-39 · calcularProrrateo: mes comercial de 30 días (baja de contratos)»; `anomalias-calculo.test.js` › los tres tests de «A-13 · dos prorrateos para el mismo mes parcial (C01) — implementación de la baja».
- **FR-005 (RN-40) · Qué hace la baja.** Al dar de baja un contrato, el sistema graba la fecha de baja (la indicada o, si no se indica, la de hoy) y vuelve al listado de contratos con el importe de FR-004 en la dirección («?prorrateo=42.00»). No graba el importe ni emite ninguna factura. La remesa de ese mes factura el contrato según FR-002, independientemente de la baja. Si el contrato no existe, responde con error 404 «Contrato no encontrado». La pantalla dice que, si la baja cae a mitad de mes, administración emite a mano la factura del prorrateo.
  - Evidencia: `routes/contratos.js:28-30` (comentario), `:31-41`; `views/contratos.ejs:17` (aviso de la pantalla). Anomalías A-06 y A-13.
  - Test: `remesa.test.js` › «CONGELA comportamiento actual: baja el 14/02/2026 → pantalla 42,00 y la remesa de febrero factura además 45,00 (A-06, A-13, C01)», «RN-39 / RN-49 · baja sin fecha: se usa hoy (2026-11-16) y el prorrateo comercial de 16 días de 145 € → 77,33» y «RN-39 · un contrato inexistente responde 404».
- **FR-006 · Contrato con fecha de baja en la pantalla.** La pantalla de contratos marca como «de baja» todo contrato con fecha de baja, sea pasada o futura, y no le ofrece el botón de baja. La remesa sigue facturándolo hasta esa fecha (FR-001, FR-002).
  - Evidencia: `views/contratos.ejs:6`, `:10-12`. Anomalía A-08.
  - Test: `remesa.test.js` › «CONGELA comportamiento actual: una baja futura se ve «de baja» en la pantalla y la remesa sigue facturando el mes entero (A-08, C10)».
- **FR-007 · Descuento por volumen en las cuotas.** El sistema calcula la factura de cada cuota con las mismas reglas que el alta manual, incluido el descuento por volumen (spec 002): una cuota cuyo importe del mes pasa de 1.000 € recibe un 2 %, y de 5.000 €, un 5 %. Las observaciones de la factura no lo anotan (spec 002, FR-008). Ejemplo: cuota de 1.200 € → base 1.176,00 €.
  - Evidencia: `scripts/remesa_mensual.js:55` (mismo cálculo), `:62` (observaciones fijas); `services/calculo.js:39-43`. Anomalía A-12. Datos reales: las cuotas son de 90, 145, 60 y 90 € (`db.js:116-119`).
  - Test: `remesa.test.js` › «CONGELA comportamiento actual: una cuota de 1.200 € recibe un 2 % de descuento sin anotarlo (A-12, RN-13)».
- **FR-008 · Valores por defecto del alta de contrato.** Al dar de alta un contrato, si no se indica el tipo de IVA, el sistema usa el 21 %; si no se indica la fecha de alta, la de hoy. La cuota se lee cambiando solo la primera coma por un punto (como en el alta de facturas, spec 003): «1.234,56» → 1,234. El contrato se crea sin baja.
  - Evidencia: `routes/contratos.js:16-26`; esquema de contratos con IVA 21 por defecto (`db.js:41-48`). Anomalía A-45 (y A-05 para la lectura de la cuota, spec 003).
  - Test: `remesa.test.js` › «CONGELA comportamiento actual: alta de contrato sin tipo de IVA ni fecha → 21 % y hoy; «1.234,56» se lee 1,234 (A-45, A-05)».

### Anomalías de esta spec

Todas están cerradas en el [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md) (§7).

| ID | Clasificación | Comportamiento especificado | Tratamiento acordado | Decisión de negocio | Tests |
| --- | --- | --- | --- | --- | --- |
| A-06 | BUG A SECAS (latente) | FR-005 (la pantalla pide emitir a mano la factura del mes de baja, que la remesa ya cobra) | Especificar tal cual; corregir el aviso de la vista en la modernización. No retroactivo | Acta simulada, P08, Marga, 2026-11-16 → RS-03 | `remesa.test.js` › «baja el 14/02/2026 → pantalla 42,00 y la remesa de febrero factura además 45,00 (A-06, A-13, C01)» |
| A-08 | ACCIDENTAL (C10) | FR-006 (baja futura vista como baja; la remesa sigue cobrando) | Especificar tal cual; corregir la pantalla en la modernización | Acta simulada, P12, Marga, 2026-11-16 → RS-05 | `remesa.test.js` › «una baja futura se ve «de baja» en la pantalla y la remesa sigue facturando el mes entero» |
| A-12 | BUG A SECAS (latente) | FR-007 (cuota de más de 1.000 € con descuento sin anotar) | Especificar tal cual; corregir en la modernización. No retroactivo (no hay casos) | Acta simulada, P13, Paco, 2026-11-16 → RS-09 | `remesa.test.js` › «una cuota de 1.200 € recibe un 2 % de descuento sin anotarlo» |
| A-13 | INTENCIONAL (mes comercial de la baja) / ACCIDENTAL (días reales de la remesa) / BUG A SECAS latente (febrero completo en la baja: 84,00 en vez de 90,00) (C01) | FR-002 y FR-004: **las dos fórmulas**, tal cual | Especificar tal cual las dos; unificar en la modernización según CN-1 y CN-9. No retroactivo | Acta simulada, P10, Paco y Puri, 2026-11-16; ratificación, N-07, Paco y Puri, 2026-11-16 → RS-10 | `anomalias-calculo.test.js` › bloque «A-13 · …» (42,00; 60,00; 84,00); `remesa.test.js` › ejemplos de «RN-34 · …» |
| A-45 | ACCIDENTAL | FR-008 (valores por defecto). La falta de pantalla de alta se documenta sin especificar | Documentar sin especificar la falta de pantalla; especificar los valores por defecto | Acta simulada, P33, Julián, 2026-11-16 → RS-32 | `remesa.test.js` › «alta de contrato sin tipo de IVA ni fecha → 21 % y hoy» |
| A-49 | INTENCIONAL (práctica comercial fuera del programa) | **Ninguno: se documenta sin especificar** | Documentar sin especificar; decidir en la modernización si se informatiza | Ratificación, N-04, Paco, y N-05, Marga y Julián, 2026-11-16 → RS-34 | Ninguno: no hay comportamiento del programa que probar |

### Comportamiento documentado sin especificar

- **No hay pantalla de alta de contratos (A-45).** Los contratos solo se dan de alta con una petición directa, y lo hace Julián, siempre al 21 % (acta simulada, P33, Julián, 2026-11-16). La modernización decidirá si añade una pantalla.
- **Bonificación del primer mes (A-49).** Paco regala a veces el primer mes parcial a algunos clientes nuevos de alquiler y lo anota en el contrato en papel (ratificación, N-04, Paco, 2026-11-16). En el programa no hay ningún campo de bonificación (`db.js:41-48`); para que la remesa no cobre ese mes, Julián da de alta el contrato **después** de lanzar la remesa. Así se hizo con el contrato 4, dado de alta con fecha 15/02/2026 después de la remesa de febrero (ratificación, N-05, Marga y Julián, 2026-11-16).

### Convenciones declaradas (no son requisitos)

Son conducta deseada declarada por el negocio. Esta spec **no las impone**.

| # | Convención declarada | Fuente | Relación con el comportamiento actual |
| --- | --- | --- | --- |
| CN-1 y CN-9 | Mes comercial: un mes parcial se cobra por días de servicio / 30, también en febrero; un mes completo se cobra entero, tenga los días que tenga. Según la convención: baja el 14/02 → 42,00 €; febrero completo → 90,00 € | Acta simulada, P10, Paco y Puri, 2026-11-16; ratificación, N-07, Paco y Puri, 2026-11-16 → RS-10 | **Diverge** en las dos fórmulas (A-13): la remesa usa los días reales del mes (14/02 → 45,00 €, FR-002) y la baja cobra el febrero completo por 28/30 (84,00 €, FR-004) |
| Vigencia | El contrato está vigente hasta su fecha de baja | Acta simulada, P12, Marga, 2026-11-16 → RS-05 | **Coincide** con la remesa (FR-001). **Diverge** en la pantalla, que lo marca de baja antes (A-08, FR-006) |
| CN-2 | Las cuotas de contrato nunca llevan descuento por volumen. Dueña: spec 002 | Acta simulada, P13, Paco, 2026-11-16 → RS-09 | **Diverge**: una cuota de más de 1.000 € recibe descuento (A-12, FR-007) |
| Baja informativa | La pantalla de baja es una calculadora para decir al cliente cuánto le queda; no se emite factura manual del mes de baja, que factura la remesa | Acta simulada, P08, Marga, 2026-11-16 → RS-03 | **Diverge** del aviso de la pantalla y del comentario del código, que piden emitirla (A-06, FR-005). Coincide con lo que se hace en la práctica |

### Fuera de alcance

- Lanzamiento de la remesa, documento generado (textos, fecha, vencimiento), repetición del mismo mes, meses imposibles e importes negativos (A-03, A-26): spec 006.
- Cliente de baja facturado por la remesa (A-07): spec 003, dueña de CN-3.
- Tramos y mecánica del descuento: spec 002.
- Formato de los importes en las pantallas de contratos y en la dirección de la baja (A-19): spec 010.

### Key Entities

- **Contrato**: cliente, concepto, cuota mensual sin IVA, tipo de IVA (21 % por defecto), fecha de alta y fecha de baja opcional. No tiene campo de bonificación.
- **Mes de remesa**: del día 1 al último día del mes, según el calendario real (FR-003).
- **Días de servicio**: días del mes en que el contrato está vigente, contando el del alta y el de la baja (FR-002).
- **Importe de la baja**: importe comercial del último mes (FR-004); se muestra y no se graba (FR-005).

## Success Criteria *(mandatory)*

### Measurable Outcomes

Esta spec es un contrato de comportamiento; sus criterios se miden con la suite de caracterización existente, que no se modifica.

- **SC-001**: los 13 tests del bloque «RN-39 · calcularProrrateo…» de `calculo.test.js` pasan sin cambios, incluidos el tope de 30 días, la cota en 0, el febrero bisiesto, el redondeo y las fechas de meses distintos (D4).
- **SC-002**: los tests de los bloques «RN-34 · …» (4), «RN-32 · qué contratos entran en el mes» (7) y «Baja de contratos y remesa sobre la misma copia» (7) de `remesa.test.js` pasan sin cambios, junto con el de la cuota de 1.200 € (A-12).
- **SC-003**: los 3 tests del bloque «A-13 · …» de `anomalias-calculo.test.js` y los 4 del bloque «RN-48 · diasDelMes…» de `util.test.js` pasan sin cambios.
- **SC-004**: los 8 requisitos (FR-001 a FR-008) tienen al menos una evidencia y un test citados (100 % de trazabilidad).
- **SC-005**: para un mismo mes parcial (baja el 14/02/2026, cuota de 90 €), la spec deja fijados los dos importes que da hoy el programa (42,00 € en la pantalla y 45,00 € en la remesa) y el que pide la convención (42,00 €), de modo que Paco o Puri puedan comprobarlos con calculadora.

## Assumptions

- La versión de referencia es el código del commit `2b49ea5` y la copia de `datos/gesfact.db` versionada en ese commit. La BD de producción no se toca; los tests trabajan sobre copias temporales, con reloj y zona horaria fijos.
- Las fechas de alta y baja de los contratos se graban siempre con formato AAAA-MM-DD (todas las de la copia lo cumplen y la pantalla de baja usa un selector de fecha, `views/contratos.ejs:12`). Con otro formato, la comparación como texto de FR-001 daría otro resultado (**SUPOSICIÓN**, ver «Edge Cases»).
- El testimonio de negocio citado es simulado y ratificado por la responsable del proyecto (NEGOCIO-RS). No condiciona esta spec, que fija el comportamiento actual; sí condiciona cualquier corrección futura (deuda de confirmación).
- La numeración (005) y el nombre (`005-cuotas-contratos`) siguen la [propuesta de partición](../000-reconocimiento/propuesta-particion-specs.md).
