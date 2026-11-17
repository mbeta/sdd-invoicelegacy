# Especificación: Vencimientos y cobros (comportamiento actual)

**Rama**: `008-cobros-vencimientos`

**Creada**: 2026-11-17

**Estado**: Borrador

**Entrada**: descripción del usuario: «Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del cálculo de vencimientos y del registro de cobros (estados y panel de pendientes) de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.» (El texto completo, con el alcance RN-18, RN-19, RN-27 y el panel de inicio, las convenciones, las anomalías y los criterios, se recoge íntegro en las secciones de esta spec.)

## Naturaleza de esta spec

- **Es una spec inversa.** Cada requisito describe lo que GesFact 2.4 hace **hoy**, aunque parezca un error. Nada de lo que aquí se exige obliga a cambiar el programa actual (constitución, principio I).
- **Evidencia.** Cada requisito cita su evidencia: `fichero:líneas` del código, dato real de la copia de `datos/gesfact.db` (los datos históricos están en la siembra de `db.js:95-173`) o acta de negocio. Los tests se citan como `fichero › «título del test»`, todos en `pruebas/caracterizacion/`.
- **Anomalías.** Se especifican tal como funcionan hoy, con su ID del [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md). No se corrigen ni se omiten.
- **Convenciones declaradas.** Lo que el negocio dice que **debería** pasar se presenta como «convención declarada», nunca como requisito.
- **Testimonio de negocio.** Las actas citadas son la [entrevista simulada](../000-reconocimiento/entrevista-negocio-simulada.md) y la [ratificación simulada](../000-reconocimiento/ratificacion-negocio-simulada.md) del 2026-11-16 (testigo NEGOCIO-RS). Arrastran una **deuda de confirmación**: no afecta a esta spec, que fija el comportamiento actual, pero sí a cualquier corrección posterior.
- **Advertencia sobre el estado de cobro.** El estado «cobrada» de GesFact **no es una fuente fiable de cobros**: administración lleva los cobros reales en un Excel desde 2021 y marca «cobrada» en el programa solo a veces (A-50, RS-35). Esta spec describe los estados del programa, no la situación real de cobro de cada cliente.
- **Qué decide esta spec.** Cómo se calcula el vencimiento de una factura del alta, cómo se suma días a una fecha (también para la remesa), cómo se marca una factura como cobrada y qué muestra el panel de inicio sobre lo pendiente. Los 30 días fijos de la remesa (A-37) son de la [spec 006](../006-remesa-mensual/spec.md); qué se puede rectificar, de la [spec 007](../007-rectificacion-conservacion/spec.md).
- **Zona horaria de referencia.** Todos los resultados de fechas se especifican en hora peninsular española (`Europe/Madrid`), que es donde funciona el programa; los tests fijan esa zona y el reloj en 2026-11-16 10:00.
- **Golden master.** Casos GM-01, GM-10 y GM-11.
- **Línea base verificada.** El 2026-11-17, sobre el commit `2b49ea5`, `servidor-facturas.test.js`, `servidor-informes.test.js`, `util.test.js`, `remesa.test.js` y `golden-master.test.js` pasan **149 de 149** tests, sin cambios en `datos/gesfact.db`.

## User Scenarios & Testing *(mandatory)*

### Historia 1 - Cada factura del alta nace con su fecha de vencimiento (Priority: P1)

Al dar de alta una factura, el programa calcula su vencimiento sumando a la fecha de la factura los días de pago del cliente, en días naturales y sin ajustar a fin de mes. Si el cliente no tiene días de pago anotados, usa el plazo por defecto de la configuración, que en la oficina es de 30 días.

**Why this priority**: el vencimiento se imprime en la factura y es la fecha en que administración espera el cobro.

**Independent Test**: `servidor-facturas.test.js` › «RN-18 · vencimiento = fecha + días de pago del cliente (Casa Ubaldo, 60): 2026-02-20 → 2026-04-21»; golden master GM-01.

**Acceptance Scenarios**:

1. **Given** Restaurante Casa Ubaldo (60 días de pago), **When** se da de alta una factura con fecha 2026-02-20, **Then** vence el 2026-04-21. Test: el citado.
2. **Given** Cafetería La Parada (sin días de pago) y el plazo por defecto de 30 días, **When** se da de alta una factura con fecha 2026-01-31, **Then** vence el 2026-03-02, cruzando febrero sin ajustar a fin de mes. Test: `golden-master.test.js` › «GM-01 · Redondeo línea a línea con IVA mixto 21/10; vencimiento que cruza febrero (RN-01, RN-02, RN-04, RN-18, A-17)».
3. **Given** el plazo por defecto de la configuración cambiado a 45 días, **When** se da de alta una factura del cliente 1 (sin días de pago) con fecha 2026-03-01, **Then** vence el 2026-04-15. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: el alta usa config.VENCIMIENTO_DIAS; con 45 vence a 45 días (A-37, C06)».
4. **Given** una factura sin fecha tecleada, con el reloj en 2026-11-16, **When** se da de alta, **Then** se fecha el 2026-11-16 y vence el 2026-12-16. Test: `servidor-facturas.test.js` › «RN-17 · sin fecha se usa la de hoy en el servidor (2026-11-16) y vence el 2026-12-16».
5. **Given** los datos reales, **When** se comprueban los 8 vencimientos de las facturas FA de la copia, **Then** todos coinciden con la regla: por ejemplo, FA-2026-000103 (Hotel Vega Baja, 60 días) 2026-02-20 → 2026-04-21 y FA-2026-000101 (sin días) 2026-01-31 → 2026-03-02. Evidencia: `db.js:126-168`; registro, A-38 (QD12).

---

### Historia 2 - Un cliente con 0 días de pago vence a 30 días (Priority: P2)

Si un cliente tiene anotados 0 días de pago, el programa lo trata igual que si no tuviera ninguno y le pone el plazo por defecto. Administración entiende que 0 días es pago al contado. Hoy no hay ningún cliente con 0 días.

**Why this priority**: es un error latente que daría 30 días de crédito a un cliente al contado en cuanto se dé de alta uno.

**Independent Test**: `servidor-facturas.test.js` › «CONGELA comportamiento actual: un cliente con 0 días de pago vence a 30 días, no al contado (A-36, RN-18)»; GM-10.

**Acceptance Scenarios**:

1. **Given** un cliente nuevo con 0 días de pago, **When** se le da de alta una factura con fecha 2026-03-01, **Then** vence el 2026-03-31. Test: el citado.
2. **Given** el cliente 1 con 0 días de pago, **When** se lanza la remesa de mayo de 2026, **Then** su factura vence el 2026-06-30. Test: `remesa.test.js` › «CONGELA comportamiento actual: un cliente con 0 días de pago vence a 30 días también en la remesa (A-36)».
3. **Given** el cliente nuevo «Kiosco El Contado» con 0 días de pago, **When** se le da de alta una factura con fecha «2026/10/20», **Then** el caso queda fijado en el golden master. Test: `golden-master.test.js` › «GM-10 · Cliente con 0 días de pago → 30; fecha no ISO que pierde un día en octubre; número tras el hueco (A-21, A-36, A-38, RN-19)».

---

### Historia 3 - La suma de días es correcta en hora peninsular, salvo fechas mal escritas (Priority: P3)

El cálculo de «fecha + días» da el resultado correcto en la oficina, también cuando el plazo cruza un cambio de hora, siempre que la fecha esté escrita como AAAA-MM-DD. Si la fecha se escribió de otra forma (por ejemplo «2026/10/20») y el plazo cruza el cambio de hora de octubre, el vencimiento sale un día antes. Si la fecha es ilegible, el vencimiento sale como «NaN-NaN-NaN». Si el programa funcionara en un equipo con otra zona horaria al oeste de UTC, todos los vencimientos saldrían un día antes.

**Why this priority**: hoy ningún documento emitido está afectado, pero el resultado depende del equipo y de cómo se teclee la fecha.

**Independent Test**: `util.test.js` › bloques «RN-18 / RN-19 · sumarDias en hora de Madrid» y «A-38 · el vencimiento depende de la zona horaria del equipo».

**Acceptance Scenarios**:

1. **Given** hora de Madrid, **When** se suman días a fechas AAAA-MM-DD, **Then** 2026-02-20 + 60 → 2026-04-21; 2026-01-31 + 30 → 2026-03-02; 2026-12-31 + 1 → 2027-01-01; 2028-02-28 + 1 → 2028-02-29; 2026-01-31 − 1 → 2026-01-30. Tests: `util.test.js` › «ejemplos de reglas-de-negocio.md: 2026-02-20 + 60 → 2026-04-21; 2026-01-31 + 30 → 2026-03-02», «fin de mes y fin de año», «febrero bisiesto y no bisiesto» y «cero y negativos».
2. **Given** hora de Madrid y fechas AAAA-MM-DD, **When** el plazo cruza el cambio de hora, **Then** el resultado es correcto: 2026-03-20 + 30 → 2026-04-19; 2026-10-20 + 30 → 2026-11-19. Test: `util.test.js` › «cambio de hora con fecha ISO: correcto en marzo y en octubre».
3. **Given** hora de Madrid y la fecha «2026/10/20», **When** se suman 30 días, **Then** da 2026-11-18, un día menos que con guiones; «2026/10/25» + 1 da 2026-10-25. En marzo no pierde el día («2026/03/05» + 30 → 2026-04-04). Tests: `util.test.js` › «CONGELA comportamiento actual: fecha no ISO que cruza el cambio de hora de octubre pierde un día (RN-19, A-38)» y «fecha no ISO en marzo: no pierde el día (RN-19)»; en el alta, `servidor-facturas.test.js` › «CONGELA comportamiento actual: la fecha no se valida; «2026/10/20» se graba tal cual y vence el 2026-11-18 (A-21, RN-19)».
4. **Given** una fecha «basura», vacía o inexistente, **When** se suman 30 días, **Then** el resultado es «NaN-NaN-NaN». Test: `util.test.js` › «CONGELA comportamiento actual: fecha irreconocible, vacía o inexistente → «NaN-NaN-NaN» (RN-19)».
5. **Given** el equipo en hora de Buenos Aires, **When** se suman 30 días a 2026-01-31, **Then** da 2026-03-01, un día antes que en Madrid; en UTC y en Tokio coincide con Madrid. Tests: `util.test.js` › «CONGELA comportamiento actual: en Buenos Aires el vencimiento sale un día antes (A-38, RN-19)», «CONGELA comportamiento actual: en UTC coincide con Madrid (flujo-factura.md §2)» y «CONGELA comportamiento actual: al este de UTC (Tokio) coincide con Madrid».

---

### Historia 4 - Administración marca una factura como cobrada (Priority: P4)

En el detalle de una factura FA emitida, Marga pulsa «Marcar cobrada» y la factura pasa a «cobrada». No se anota la fecha del cobro, el importe ni la forma de pago, y no se pueden registrar cobros parciales ni deshacer el cobro. El programa no protege contra usos indebidos por petición directa: acepta cobrar una rectificativa, no avisa si se cobra dos veces y redirige igual si la factura no existe.

**Why this priority**: es el único registro de cobros del programa, aunque administración no lo usa como fuente (A-50).

**Independent Test**: `servidor-facturas.test.js` › bloque «Cobro (POST /facturas/:id/cobrar)»; GM-11.

**Acceptance Scenarios**:

1. **Given** una FA emitida (la factura 10 de la copia de pruebas), **When** se cobra, **Then** pasa a «cobrada» y se vuelve a su detalle. Test: `servidor-facturas.test.js` › «RN-27 · una emitida pasa a cobrada y redirige al detalle».
2. **Given** esa factura ya cobrada, **When** se cobra otra vez, **Then** no cambia nada y se vuelve a su detalle sin ningún aviso. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: cobrar una ya cobrada no cambia nada y redirige sin avisar (A-33, RN-27)».
3. **Given** RE-2026-000001 emitida, **When** se cobra por petición directa, **Then** pasa a «cobrada». Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: una rectificativa RE se puede cobrar por petición directa (A-33, C09)».
4. **Given** una factura 999 que no existe, **When** se cobra, **Then** se redirige a su detalle igualmente. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: cobrar una factura inexistente redirige igualmente a su detalle (A-33)».
5. **Given** una factura cobrada, **When** se rectifica, **Then** pasa a «rectificada» y deja de constar como cobrada. Tests: `servidor-facturas.test.js` › «CONGELA comportamiento actual: la original cobrada pasa a «rectificada» y pierde la marca de cobro (A-33, RN-30)»; `golden-master.test.js` › «GM-11 · Ciclo completo de GM-01: cobro y rectificación con motivo; espejo sin recalcular, fecha de hoy, pierde la marca de cobro (RN-27, RN-28, RN-29, A-28, A-29, A-33)».
6. **Given** una FA emitida, una cobrada y una RE, **When** se abre su detalle, **Then** solo la FA emitida muestra «Marcar cobrada». Test: `servidor-facturas.test.js` › «RN-51 · los botones de cobro y rectificación solo salen en FA emitidas».

---

### Historia 5 - El panel de inicio cuenta las rectificativas pero no las suma (Priority: P5)

La pantalla de inicio muestra cuántas facturas están pendientes de cobro y por qué importe. Cuenta como pendientes todas las facturas en estado «emitida», rectificativas incluidas, pero el importe solo suma las facturas FA. Con los datos reales dice 4 pendientes por 3.032,85 €, que es el importe de 3 facturas. Marga no usa el panel.

**Why this priority**: la cifra no cuadra con el número de facturas, pero nadie toma decisiones con ella.

**Independent Test**: `servidor-informes.test.js` › bloque «Panel de inicio (GET /)».

**Acceptance Scenarios**:

1. **Given** la copia de la BD real, **When** se abre la pantalla de inicio, **Then** muestra: facturas emitidas (total histórico) 9, facturas pendientes de cobro 4, importe pendiente de cobro «3032.85 €» y clientes activos 6. Las 4 pendientes son FA-2026-000105, FA-2026-000107, FA-2026-000108 y RE-2026-000001; el importe es la suma de las tres FA (2.756,38 + 122,23 + 154,24) y deja fuera la RE (−122,23 €; con ella serían 2.910,62 €). Test: `servidor-informes.test.js` › «CONGELA comportamiento actual: cuenta 4 pendientes (incluida la RE) pero el importe solo suma las 3 FA (A-34, C04)».

---

### Edge Cases

- **Cliente con 0 días de pago:** plazo por defecto, no al contado (FR-002, A-36).
- **Plazo por defecto cambiado en la configuración:** el alta lo usa; la remesa no (A-37, spec 006).
- **Vencimiento que cae en otro mes o año, o en 29 de febrero:** se suma en días naturales sin ajustes (FR-003).
- **Plazo que cruza el cambio de hora con fecha AAAA-MM-DD:** correcto en hora de Madrid (FR-003).
- **Fecha tecleada «2026/10/20» o «2026-1-5»:** se graba tal cual (A-21, spec 003); el vencimiento pierde un día si la fecha no ISO cruza el cambio de hora de octubre (FR-004).
- **Fecha ilegible o vacía al sumar días:** «NaN-NaN-NaN» (FR-004). En el alta, una fecha vacía se sustituye antes por la de hoy (FR-001).
- **Equipo con otra zona horaria:** al oeste de UTC, un día menos en todos los vencimientos y otro «hoy» cerca de medianoche (FR-005, A-38).
- **Cobrar una RE, cobrar dos veces o cobrar una inexistente:** se acepta sin aviso (FR-007, A-33).
- **Rectificar una cobrada:** pierde la marca de cobro (FR-008, A-33).
- **Error de la base de datos al cobrar:** responde 500 «Error BD: » seguido del mensaje de error (FR-006).
- **Error de la base de datos al abrir el panel:** la cifra afectada se muestra como 0, sin aviso (FR-009).

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito describe el comportamiento **actual**.

- **FR-001 (RN-18) · Vencimiento en el alta.** Al dar de alta una factura, su vencimiento es la fecha de la factura más los días de pago del cliente, contados en días naturales y sin ajustar a fin de mes. Si el cliente no tiene días de pago, se usa el plazo por defecto de la configuración, que en producción es de 30 días. Si la factura se da de alta sin fecha, se toma la de hoy y el vencimiento se calcula desde ella. Dato real: los 8 vencimientos de las FA de la copia siguen esta regla (FA-2026-000103, 60 días: 2026-02-20 → 2026-04-21; FA-2026-000101, sin días: 2026-01-31 → 2026-03-02).
  - Evidencia: `routes/facturas.js:68-69`; `config.js:39-40` («dias de vencimiento por defecto si el cliente no tiene forma de pago»); `db.js:28` (`dias_pago`, «NULL -> el de config»); datos en `db.js:126-168`. Valor 30 en producción: ratificación, P30, Julián, 2026-11-16 → RS-25.
  - Test: `servidor-facturas.test.js` › «RN-18 · vencimiento = fecha + días de pago del cliente (Casa Ubaldo, 60): 2026-02-20 → 2026-04-21», «CONGELA comportamiento actual: el alta usa config.VENCIMIENTO_DIAS; con 45 vence a 45 días (A-37, C06)» y «RN-17 · sin fecha se usa la de hoy en el servidor (2026-11-16) y vence el 2026-12-16»; GM-01.
- **FR-002 (RN-18) · 0 días de pago.** Un cliente con 0 días de pago recibe el plazo por defecto, igual que uno sin días. Lo mismo pasa en la remesa, con su plazo fijo de 30 días (spec 006). Hoy ningún cliente de la copia tiene 0 días.
  - Evidencia: `routes/facturas.js:68` (el 0 cuenta como «sin días»); `scripts/remesa_mensual.js:60`; clientes en `db.js:96-101`. Anomalía A-36.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: un cliente con 0 días de pago vence a 30 días, no al contado (A-36, RN-18)»; `remesa.test.js` › «CONGELA comportamiento actual: un cliente con 0 días de pago vence a 30 días también en la remesa (A-36)»; GM-10.
- **FR-003 (RN-19) · Suma de días con fecha AAAA-MM-DD.** Sumar N días a una fecha escrita AAAA-MM-DD da, en hora peninsular, la fecha N días naturales posterior (o anterior, si N es negativo), también cuando cruza un fin de mes, un fin de año, un 29 de febrero o un cambio de hora.
  - Evidencia: `lib/util.js:17-26` (la fecha AAAA-MM-DD se lee como medianoche UTC, se suman N × 24 horas y se devuelve la fecha local).
  - Test: `util.test.js` › bloque «RN-18 / RN-19 · sumarDias en hora de Madrid», tests «ejemplos de reglas-de-negocio.md: …», «fin de mes y fin de año», «febrero bisiesto y no bisiesto», «cero y negativos» y «cambio de hora con fecha ISO: correcto en marzo y en octubre».
- **FR-004 (RN-19) · Suma de días con otra forma de fecha.** Una fecha escrita de otra forma que el programa reconoce (por ejemplo «2026/10/20» o «2026-1-5») se lee como medianoche en hora local. Si el plazo cruza el cambio de hora de octubre, el resultado sale un día antes («2026/10/20» + 30 → 2026-11-18, frente a 2026-11-19 con guiones); en marzo no pierde el día. Una fecha irreconocible, vacía o inexistente da «NaN-NaN-NaN».
  - Evidencia: `lib/util.js:17-26`; el TODO del autor sobre «un dia menos» en marzo de 2019 (`lib/util.js:17-18`) no se reproduce en marzo (registro, A-38). Que el alta acepte esas fechas es A-21 (spec 003).
  - Test: `util.test.js` › «CONGELA comportamiento actual: fecha no ISO que cruza el cambio de hora de octubre pierde un día (RN-19, A-38)», «fecha no ISO en marzo: no pierde el día (RN-19)», «CONGELA comportamiento actual: fecha sin ceros 2026-1-5 se lee como local y suma bien en Madrid (A-21)» y «CONGELA comportamiento actual: fecha irreconocible, vacía o inexistente → «NaN-NaN-NaN» (RN-19)»; `servidor-facturas.test.js` › «CONGELA comportamiento actual: la fecha no se valida; «2026/10/20» se graba tal cual y vence el 2026-11-18 (A-21, RN-19)»; GM-10.
- **FR-005 · Dependencia de la zona horaria.** El vencimiento y la fecha de hoy dependen de la zona horaria del equipo donde funciona el programa. Esta spec los fija en hora peninsular. En un equipo al oeste de UTC (por ejemplo, Buenos Aires) el vencimiento sale un día antes (2026-01-31 + 30 → 2026-03-01; 2026-03-20 + 30 → 2026-04-18); en UTC y al este de UTC (Tokio) coincide con Madrid. Cerca de medianoche, la fecha de hoy es la del día local del equipo.
  - Evidencia: `lib/util.js:9-26`. Anomalía A-38.
  - Test: `util.test.js` › bloque «A-38 · el vencimiento depende de la zona horaria del equipo» (3 tests) y «CONGELA comportamiento actual: la misma hora UTC es otro día en Buenos Aires (A-38)»; GM-10.
- **FR-006 (RN-27) · Marcar cobrada.** Marcar una factura como cobrada la cambia de «emitida» a «cobrada» y vuelve a su detalle. No se anota fecha de cobro, importe, forma de pago ni quién cobró; no hay cobros parciales. No existe ninguna operación para volver de «cobrada» a «emitida». Si la base de datos falla, responde 500 «Error BD: » seguido del mensaje de error.
  - Evidencia: `routes/facturas.js:116-122` (único cambio: el estado, y solo si estaba «emitida»); estados posibles en `db.js:61` («emitida / cobrada / rectificada»). Dato real: FA-2026-000101 a 000104 constan «cobrada» y FA-2026-000105 «emitida» (`db.js:126-149`).
  - Test: `servidor-facturas.test.js` › «RN-27 · una emitida pasa a cobrada y redirige al detalle».
- **FR-007 (RN-27) · Cobro sin comprobaciones.** El cobro solo cambia facturas en estado «emitida», de cualquier serie. Si la factura no estaba «emitida» (ya cobrada o rectificada) o no existe, no cambia nada y vuelve igualmente a su detalle, sin ningún aviso. Una rectificativa RE emitida se puede marcar como cobrada por petición directa.
  - Evidencia: `routes/facturas.js:117-121` (la condición no mira la serie ni comprueba cuántas facturas cambian). Anomalía A-33.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: cobrar una ya cobrada no cambia nada y redirige sin avisar (A-33, RN-27)», «CONGELA comportamiento actual: una rectificativa RE se puede cobrar por petición directa (A-33, C09)» y «CONGELA comportamiento actual: cobrar una factura inexistente redirige igualmente a su detalle (A-33)».
- **FR-008 · Rectificar una cobrada borra la marca de cobro.** Al rectificar una factura cobrada, su estado pasa a «rectificada» y deja de constar que estaba cobrada; no queda ningún rastro del cobro. Qué se puede rectificar es de la spec 007.
  - Evidencia: `routes/facturas.js:154`. Anomalía A-33 (C09).
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: la original cobrada pasa a «rectificada» y pierde la marca de cobro (A-33, RN-30)»; GM-11.
- **FR-009 · Botón de cobro.** El detalle de una factura muestra «Marcar cobrada» solo si la factura es de la serie FA y está «emitida».
  - Evidencia: `views/factura_detalle.ejs:47-48`.
  - Test: `servidor-facturas.test.js` › «RN-51 · los botones de cobro y rectificación solo salen en FA emitidas».
- **FR-010 · Panel de inicio.** La pantalla de inicio muestra cuatro cifras: el número total de facturas (cualquier serie y estado) como «Facturas emitidas (total histórico)»; el número de facturas en estado «emitida», de cualquier serie, como «Facturas pendientes de cobro»; la suma del total de las facturas en estado «emitida» **de la serie FA** como «Importe pendiente de cobro»; y el número de clientes activos. Las rectificativas emitidas cuentan como pendientes pero no suman en el importe. Si alguna consulta falla, esa cifra sale como 0, sin aviso. Dato real: 9 / 4 / 3032.85 € / 6.
  - Evidencia: `server.js:20-35` (`:23` cuenta todas las emitidas, `:24` suma solo las FA); `views/index.ejs:3-8`. Anomalía A-34. El formato «3032.85» (punto decimal, sin miles) es A-19 (spec 010).
  - Test: `servidor-informes.test.js` › «CONGELA comportamiento actual: cuenta 4 pendientes (incluida la RE) pero el importe solo suma las 3 FA (A-34, C04)». El caso de fallo de consulta no tiene test (ver «Huecos de cobertura»).

### Anomalías de esta spec

Todas están cerradas en el [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md) (§7).

| ID | Clasificación | Comportamiento especificado | Tratamiento acordado | Decisión de negocio | Tests |
| --- | --- | --- | --- | --- | --- |
| A-33 | BUG A SECAS (sin dependientes en el programa) | FR-007 (RE cobrable, cobro doble o de inexistente sin aviso) y FR-008 (rectificar una cobrada borra la marca) | Especificar tal cual; corregir el ciclo de estados en la modernización. No retroactivo | Acta simulada, P27, Marga y Puri, 2026-11-16; ratificación, RS-21, Marga y Puri, 2026-11-16 | `servidor-facturas.test.js` › bloque «Cobro (POST /facturas/:id/cobrar)» (3 de sus 4 tests) y «la original cobrada pasa a «rectificada» y pierde la marca de cobro (A-33, RN-30)»; GM-11 |
| A-34 | ACCIDENTAL (C04) | FR-010 (4 pendientes, importe de 3) | Especificar tal cual; corregir en la modernización. No retroactivo | Acta simulada, P28, Marga, 2026-11-16; ratificación, RS-22, Marga, 2026-11-16 | `servidor-informes.test.js` › «cuenta 4 pendientes (incluida la RE) pero el importe solo suma las 3 FA (A-34, C04)» |
| A-36 | BUG A SECAS (latente) | FR-002 (0 días → plazo por defecto, en el alta y en la remesa) | Especificar tal cual; corregir en la modernización. No retroactivo | Acta simulada, P29, Marga, 2026-11-16; ratificación, RS-24, Marga, 2026-11-16 | `servidor-facturas.test.js` › «un cliente con 0 días de pago vence a 30 días, no al contado (A-36, RN-18)»; `remesa.test.js` › «un cliente con 0 días de pago vence a 30 días también en la remesa (A-36)»; GM-10 |
| A-38 | ACCIDENTAL | FR-004 (fecha no ISO en octubre) y FR-005 (zona horaria del equipo) | Especificar tal cual en hora de Madrid; independizar de la zona horaria en la modernización | Ninguna (clasificación por código y datos: los 8 vencimientos FA se reproducen en hora de Madrid) | `util.test.js` › bloque «A-38 · el vencimiento depende de la zona horaria del equipo» (3) y «fecha no ISO que cruza el cambio de hora de octubre pierde un día (RN-19, A-38)»; GM-10 |
| A-50 | INTENCIONAL (práctica de administración fuera del programa) | Ninguno: se documenta sin especificar (ver abajo) | Documentar sin especificar. La modernización decidirá la fuente única de cobros. No retroactivo | Ratificación, N-06, Marga, 2026-11-16 → RS-35 (Marga, Dirección) | No aplica |

### Comportamiento documentado sin especificar

- **Los cobros reales se llevan fuera del programa (A-50).** Marga lleva un Excel de cobros desde 2021; lo revisa ella y lo pasa a Dirección a fin de mes. En GesFact marca «cobrada» solo a veces: «el Excel es lo que vale» (ratificación, N-06, Marga, 2026-11-16 → RS-35). En la copia, 4 de las 9 facturas constan «cobrada», así que el botón se usa al menos a veces. Consecuencia para esta spec: el estado «cobrada» y el panel de inicio (FR-006 a FR-010) describen lo que hace el programa, **no** qué está cobrado. Ningún uso del estado de cobro de GesFact como registro contable está respaldado por esta spec.

### Convenciones declaradas (no son requisitos)

Son conducta deseada declarada por el negocio. Esta spec **no las impone**.

| # | Convención declarada | Fuente | Relación con el comportamiento actual |
| --- | --- | --- | --- |
| CN-7 | El plazo de vencimiento por defecto es el mismo en el alta manual y en las cuotas | Acta simulada, P30, Julián y Marga (responde Marga: «también para las cuotas»), 2026-11-16 → ratificación, RS-25 (Julián, Marga) | **Diverge** en el mecanismo: el alta usa la configuración (FR-001) y la remesa 30 fijos (A-37, spec 006). Hoy coinciden porque la configuración de producción vale 30 |
| 0 días = al contado | Un cliente con 0 días de pago paga al contado | Acta simulada, P29, Marga, 2026-11-16 → ratificación, RS-24 | **Diverge**: el programa le da el plazo por defecto (FR-002, A-36) |
| Un abono no es pendiente | Una rectificativa no es un cobro pendiente; el panel no se usa | Acta simulada, P28, Marga, 2026-11-16 → ratificación, RS-22 | **Diverge**: el panel cuenta las RE como pendientes (FR-010, A-34) |
| Fuente de cobros | La fuente de verdad de los cobros es el Excel de administración desde 2021 | Ratificación, N-06, Marga, 2026-11-16 → RS-35 | Fuera del programa (A-50) |
| Una RE no se cobra | Una rectificativa se compensa en la siguiente factura o se devuelve por transferencia; no se cobra | Acta simulada, P27, Marga, 2026-11-16 → ratificación, RS-21 | **Diverge**: el programa permite marcar una RE como cobrada (FR-007, A-33) |

### Huecos de cobertura

- **Fallo de consulta en el panel (FR-010).** No hay test que haga fallar una consulta del panel; haría falta inyectar fallos en la base de datos. Se verifica por inspección: `server.js:21-32` sustituye cada resultado ausente por 0.
- **Error de la base de datos al cobrar (FR-006).** Sin test por la misma razón; se verifica por inspección de `routes/facturas.js:119`.
- **Ausencia de «deshacer cobro» (FR-006).** Se verifica por inspección: el único cambio de estado hacia «emitida» no existe en `routes/facturas.js` (solo hay `:118`, a «cobrada», y `:154`, a «rectificada»).

### Fuera de alcance

- Vencimiento fijo de 30 días en la remesa (A-37): spec 006. Aquí solo se cita el caso de 0 días en la remesa (A-36).
- Formato «toFixed» del importe del panel (A-19): spec 010.
- Qué facturas se pueden rectificar (RN-30): spec 007.
- Validación de la fecha tecleada en el alta (A-21): spec 003.
- Fecha de hoy como fecha de la factura y de la RE (RN-49): spec 004.

### Key Entities

- **Cliente · días de pago**: número de días naturales de crédito; puede faltar. Falta o 0 → plazo por defecto (FR-001, FR-002).
- **Plazo por defecto**: valor de la configuración, 30 días en producción; solo lo usa el alta (FR-001).
- **Factura · vencimiento**: fecha AAAA-MM-DD calculada al grabar; las rectificativas no tienen (spec 007).
- **Factura · estado**: «emitida», «cobrada» o «rectificada». Transiciones: emitida → cobrada (cobro, FR-006); emitida o cobrada → rectificada (rectificación, FR-008). No hay ninguna otra.
- **Panel de inicio**: cuatro cifras calculadas al abrir la pantalla (FR-010).

## Success Criteria *(mandatory)*

### Measurable Outcomes

Esta spec es un contrato de comportamiento; sus criterios se miden con la suite de caracterización existente, que no se modifica.

- **SC-001**: en `servidor-facturas.test.js` pasan sin cambios los tests «RN-18 · vencimiento = fecha + días de pago del cliente (Casa Ubaldo, 60)…», «… el alta usa config.VENCIMIENTO_DIAS; con 45 vence a 45 días…», «RN-17 · sin fecha se usa la de hoy en el servidor (2026-11-16) y vence el 2026-12-16», «… un cliente con 0 días de pago vence a 30 días, no al contado…» y los 4 del bloque «Cobro (POST /facturas/:id/cobrar)».
- **SC-002**: en `util.test.js` pasa el 100 % de los bloques «RN-18 / RN-19 · sumarDias en hora de Madrid» (9 tests) y «A-38 · el vencimiento depende de la zona horaria del equipo» (3 tests).
- **SC-003**: en `servidor-informes.test.js` pasa el 100 % del bloque «Panel de inicio (GET /)» (2 tests), con las cuatro cifras idénticas: 9, 4, «3032.85 €» y 6.
- **SC-004**: `golden-master.test.js` pasa en GM-01, GM-10 y GM-11, con la salida idéntica a la del master.
- **SC-005**: los 10 requisitos (FR-001 a FR-010) tienen al menos un test citado; las partes sin test (fallos de la base de datos, ausencia de «deshacer cobro») figuran en «Huecos de cobertura» con su criterio de inspección.
- **SC-006**: Marga puede, sobre una copia, dar de alta una factura, marcarla cobrada y abrir el panel, y comprobar sin consultar el código que el vencimiento, el estado y las cifras son los que describe esta spec.

## Assumptions

- La versión de referencia es el código del commit `2b49ea5` y la copia de `datos/gesfact.db` versionada en ese commit. La BD de producción no se toca; los tests trabajan sobre copias temporales, con reloj (2026-11-16 10:00) y zona horaria (`Europe/Madrid`) fijos.
- El servidor de la oficina funciona en hora peninsular española; no consta otra zona (registro, A-38: los 8 vencimientos FA de la copia se reproducen exactos en esa zona).
- El plazo por defecto en producción es 30 días (ratificación, P30, Julián, 2026-11-16 → RS-25); `config.js` se copia a mano al servidor (`config.js:1-3`).
- El testimonio de negocio citado es simulado y ratificado por la responsable del proyecto (NEGOCIO-RS). No condiciona esta spec, que fija el comportamiento actual; sí condiciona cualquier corrección futura (deuda de confirmación).
- La numeración (008) y el nombre (`008-cobros-vencimientos`) siguen la [propuesta de partición](../000-reconocimiento/propuesta-particion-specs.md).
