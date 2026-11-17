# Especificación: Remesa mensual — ejecución del proceso (comportamiento actual)

**Rama**: `006-remesa-mensual`

**Creada**: 2026-11-16

**Estado**: Borrador

**Entrada**: descripción del usuario: «Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la ejecución de la remesa mensual de cuotas (lanzamiento, factura generada, fecha, vencimiento, textos y control de repetición) de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.» (El texto completo, con el alcance RN-33 y RN-35 a RN-38, las convenciones, las anomalías y los criterios, se recoge íntegro en las secciones de esta spec.)

## Naturaleza de esta spec

- **Es una spec inversa.** Cada requisito describe lo que GesFact 2.4 hace **hoy**, aunque parezca un error. Nada de lo que aquí se exige obliga a cambiar el programa actual (constitución, principio I).
- **Evidencia.** Cada requisito cita su evidencia: `fichero:líneas` del código, dato real de la copia de `datos/gesfact.db` o acta de negocio. Los tests se citan como `fichero › «título del test»`, todos en `pruebas/caracterizacion/`.
- **Anomalías.** Se especifican tal como funcionan hoy, con su ID del [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md). No se corrigen ni se omiten.
- **Convenciones declaradas.** Lo que el negocio dice que **debería** pasar se presenta como «convención declarada», nunca como requisito.
- **Testimonio de negocio.** Las actas citadas son la [entrevista simulada](../000-reconocimiento/entrevista-negocio-simulada.md) y la [ratificación simulada](../000-reconocimiento/ratificacion-negocio-simulada.md) del 2026-11-16 (testigo NEGOCIO-RS). Arrastran una **deuda de confirmación**: no afecta a esta spec, que fija el comportamiento actual, pero sí a cualquier corrección posterior.
- **Qué decide esta spec.** Cómo se lanza la remesa y qué factura genera: fecha, vencimiento, textos, mensajes y lo que pasa si se lanza mal o dos veces. **Qué** contratos entran y **cuánto** se cobra de cada uno es de la [spec 005](../005-cuotas-contratos/spec.md).
- **Salidas del proceso.** Los mensajes de consola y los códigos de salida forman parte del comportamiento observable (constitución, principio I) y se especifican literalmente.
- **Golden master.** Esta spec no tiene casos en el golden master, que no cubre la remesa; su red es `remesa.test.js`.
- **Línea base verificada.** El 2026-11-16, sobre el commit `2b49ea5`, `remesa.test.js` pasa **33 de 33** tests.

## User Scenarios & Testing *(mandatory)*

### Historia 1 - Administración lanza la remesa del mes y sale una factura por contrato (Priority: P1)

El primer día laborable de cada mes, Marga lanza la remesa del mes anterior desde un acceso directo de su escritorio, indicando el mes (AAAA-MM). La remesa emite una factura ordinaria (serie FA) por cada contrato vigente, con una sola línea: la cuota del mes. Por la consola va saliendo cada factura con su número, el cliente y el total, y al final el número de facturas emitidas.

**Why this priority**: es el proceso que factura todas las cuotas recurrentes cada mes.

**Independent Test**: `remesa.test.js` › bloque «RN-33 / RN-36 / RN-37 · una factura de una línea por contrato vigente».

**Acceptance Scenarios**:

1. **Given** la copia de la BD real, **When** se lanza la remesa de mayo de 2026, **Then** termina con código 0, la consola muestra exactamente:

   ```text
     FA-2026-000109  Cafetería La Parada, S.C.  108.90 eur
     FA-2026-000110  Restaurante Casa Ubaldo, S.L.  175.45 eur
     FA-2026-000111  Bar Nuevo Siglo  108.90 eur
   Remesa 2026-05 terminada: 3 facturas.
   ```

   y se graban tres facturas «emitidas» con fecha 2026-05-31 y observaciones «Remesa mayo 2026». Cada una lleva una línea de cantidad 1 con la cuota como precio y texto «<concepto> (mayo 2026)». La del contrato 2 (145,00 € al 21 %, Casa Ubaldo, 60 días de pago) tiene base 145,00 €, IVA 30,45 €, total 175,45 € y vencimiento 2026-07-30; las otras dos vencen el 2026-06-30. Test: `remesa.test.js` › «remesa 2026-05 completa: salida de consola, cabeceras y líneas».
2. **Given** el cliente 1 en recargo de equivalencia, **When** se lanza la remesa de mayo de 2026, **Then** su factura lleva recargo de 4,68 € (total 113,58 €). Test: `remesa.test.js` › «el recargo del cliente se aplica a la cuota: cliente 1 en recargo → 4,68».
3. **Given** un contrato con mes parcial (contrato 4, febrero de 2026, 14 días), **When** se lanza la remesa, **Then** la línea dice «Alquiler máquina de café Futurmat F3 (14 dias)», sin tilde, y las observaciones «Remesa febrero 2026». Test: `remesa.test.js` › «ejemplo de reglas-de-negocio.md: contrato 4 en febrero de 2026, 14 de 28 días → 45,00; total 54,45».
4. **Given** meses completos de 31 y de 30 días, **When** se lanzan las remesas de marzo y abril de 2026, **Then** las líneas dicen «(marzo 2026)» y «(abril 2026)», no los días, y las fechas son 2026-03-31 y 2026-04-30. Test: `remesa.test.js` › «mes completo de 31 y de 30 días: el texto lleva «(mes año)», no los días».

---

### Historia 2 - La fecha es el último día del mes y el vencimiento ignora la configuración (Priority: P2)

Las facturas de la remesa llevan la fecha del último día del mes facturado, sea cual sea el día en que se lanza. Vencen a los días de pago del cliente; si el cliente no tiene días de pago, a 30 días. Ese 30 está fijo en la remesa: no usa el plazo por defecto de la configuración, que sí usa el alta manual.

**Why this priority**: la fecha decide el trimestre en que se declara la factura y el vencimiento, cuándo se reclama el cobro. Hoy el plazo de la configuración en producción también es 30, así que no hay diferencia visible.

**Independent Test**: `remesa.test.js` › «remesa 2026-05 completa…» y «CONGELA comportamiento actual: la remesa vence a 30 días aunque config.VENCIMIENTO_DIAS valga 45 (A-37, C06)».

**Acceptance Scenarios**:

1. **Given** la remesa de mayo de 2026 del contrato 1 (cliente sin días de pago), **When** se graba, **Then** su fecha es 2026-05-31 y su vencimiento 2026-06-30, como en la factura real FA-2026-000108. Test: `remesa.test.js` › «remesa 2026-05 completa: salida de consola, cabeceras y líneas».
2. **Given** el plazo por defecto de la configuración cambiado a 45 días, **When** se lanza la remesa de mayo de 2026, **Then** los clientes sin días de pago siguen venciendo a 30 días (2026-06-30) y el de 60 días, a 60 (2026-07-30). Test: `remesa.test.js` › «CONGELA comportamiento actual: la remesa vence a 30 días aunque config.VENCIMIENTO_DIAS valga 45 (A-37, C06)».
3. **Given** un cliente con 0 días de pago, **When** se lanza la remesa, **Then** vence a 30 días. Test: `remesa.test.js` › «CONGELA comportamiento actual: un cliente con 0 días de pago vence a 30 días también en la remesa (A-36)». La anomalía A-36 se especifica en la spec 008.

---

### Historia 3 - La remesa no comprueba si el mes ya está facturado (Priority: P3)

La remesa solo comprueba que el mes tenga la forma AAAA-MM. No mira si ese mes ya se facturó: si se lanza dos veces, factura otra vez todos los contratos con números nuevos. Si falla a mitad, se detiene dejando grabadas las facturas que ya había emitido, y no hay forma de continuar donde lo dejó. En abril de 2026 Marga relanzó la remesa porque la primera dio error y creyó que no había grabado nada.

**Why this priority**: un relanzamiento duplica cuotas en documentos que no se pueden borrar (A-03); ya pasó una vez con una versión anterior del programa.

**Independent Test**: `remesa.test.js` › bloque «RN-38 · lanzamiento manual sin control de repetición».

**Acceptance Scenarios**:

1. **Given** un mes mal escrito («junio», «2026-6») o ningún mes, **When** se lanza la remesa, **Then** muestra «Uso: node scripts/remesa_mensual.js YYYY-MM», termina con código 1 y no graba nada (el contador FA sigue en 108). Test: `remesa.test.js` › «un mes con formato incorrecto o sin mes sale con código 1 y el mensaje de uso, sin grabar nada».
2. **Given** un mes sin contratos vigentes (2020-01), **When** se lanza, **Then** muestra «No hay contratos que facturar en 2020-01», termina con código 0 y no graba nada. Test: `remesa.test.js` › «un mes sin contratos sale con código 0 y lo dice».
3. **Given** la remesa de junio de 2026 ya lanzada (FA-2026-000109 a 000111), **When** se lanza otra vez, **Then** termina con código 0 y emite otras tres facturas (FA-2026-000112 a 000114) para los mismos clientes, también con «Remesa junio 2026». Test: `remesa.test.js` › «CONGELA comportamiento actual: lanzar dos veces el mismo mes duplica todas las facturas con números distintos (A-03, RN-38)».
4. **Given** la remesa de mayo de 2026, **When** se emiten las facturas, **Then** salen en el orden de los contratos 1, 2 y 4 (clientes 1, 3 y 6). Test: `remesa.test.js` › «CONGELA comportamiento actual: los contratos se procesan en el orden que devuelve la consulta sin ORDER BY, hoy por id (A-46, RN-38)».

---

### Historia 4 - La remesa acepta meses imposibles e importes negativos (Priority: P4)

Como solo comprueba la forma AAAA-MM, la remesa acepta meses que no existen («2026-13», «2026-00») y graba facturas con fechas imposibles, vencimiento ilegible y el texto «undefined». Tampoco impide importes negativos: si un contrato tiene la baja antes del alta dentro del mismo mes, cobra días negativos en una factura ordinaria.

**Why this priority**: son errores que acaban en facturas emitidas que no se pueden borrar (A-26). No dependen del uso normal, sino de un error de tecleo o de datos.

**Independent Test**: `remesa.test.js` › bloque «RN-35 / A-26 · importes negativos y meses imposibles».

**Acceptance Scenarios**:

1. **Given** el contrato 4 (90 €) con alta 2026-03-20 y baja 2026-03-10, **When** se lanza la remesa de marzo de 2026, **Then** emite una FA con la línea «Alquiler máquina de café Futurmat F3 (-9 dias)», precio y base −26,13 €, IVA −5,49 € y total −31,62 €. Test: `remesa.test.js` › «CONGELA comportamiento actual: baja anterior al alta en el mismo mes → −9 días y −26,13 en una FA (A-26, RN-35)».
2. **Given** el mes «2026-13», **When** se lanza, **Then** termina con código 0 y graba tres facturas FA-2026-000109 a 000111 con fecha «2026-13-31», vencimiento «NaN-NaN-NaN», observaciones «Remesa undefined 2026» y líneas «<concepto> (undefined 2026)» por la cuota entera. Test: `remesa.test.js` › «CONGELA comportamiento actual: «2026-13» graba facturas con fecha 2026-13-31, vencimiento NaN-NaN-NaN y «undefined 2026» (A-26)».
3. **Given** el mes «2026-00», **When** se lanza, **Then** graba dos facturas (clientes 1 y 3) con fecha «2026-00-31», vencimiento «NaN-NaN-NaN» y observaciones «Remesa undefined 2026». Test: `remesa.test.js` › «CONGELA comportamiento actual: «2026-00» graba 2 facturas con fecha 2026-00-31 (A-26)».
4. **Given** un contrato nuevo de 90 € con alta 2026-03-20 al que se le da de baja el 2026-03-10, **When** se lanza la remesa de marzo, **Then** factura −26,13 € (total −31,62 €). Test: `remesa.test.js` › «CONGELA comportamiento actual: baja antes del alta → la pantalla da 30,00 (ignora el alta) y la remesa −26,13 (A-26, A-13, C01)».

---

### Historia 5 - Lanzada desde otra carpeta, la remesa factura a clientes de ejemplo (Priority: P5)

La remesa busca la base de datos en la carpeta desde la que se lanza. Si allí no hay ninguna, crea una nueva, la rellena con los datos de referencia de ejemplo y factura sus contratos. Hoy no pasa porque el acceso directo de Marga arranca en la carpeta correcta.

**Why this priority**: es un error latente (A-27): emitiría facturas de clientes de ejemplo en una base de datos que nadie mira, y la real quedaría sin facturar ese mes.

**Independent Test**: `remesa.test.js` › «CONGELA comportamiento actual: lanzada en una carpeta sin BD, crea una nueva, la siembra y factura los contratos de ejemplo (A-27, RN-52)».

**Acceptance Scenarios**:

1. **Given** una carpeta sin base de datos, **When** se lanza la remesa de junio de 2026 desde ella, **Then** termina con código 0, muestra las tres facturas FA-2026-000109 a 000111 de los clientes de ejemplo y deja una base de datos nueva con 6 clientes, 8 artículos, 4 contratos, 12 facturas y 31 líneas. Test: el mismo.

---

### Edge Cases

- **Mes con un solo dígito («2026-6»):** se rechaza como formato incorrecto (FR-001).
- **Mes «2026-13» o «2026-00»:** se acepta y graba facturas imposibles (FR-012).
- **Lanzar la remesa de diciembre en enero:** las facturas llevan fecha de diciembre y número del año siguiente (A-20, spec 004).
- **Primer número del año pedido a la vez por la remesa y un alta:** uno de los dos falla (A-52, spec 004); si es la remesa, se detiene a mitad (FR-010).
- **Fallo a mitad de la remesa:** las facturas ya emitidas se quedan; relanzarla vuelve a facturar todos los contratos, también los ya facturados (FR-009, FR-010).
- **Cliente dado de baja:** se le factura (A-07, spec 003).
- **Cuota de más de 1.000 €:** recibe descuento sin anotarlo (A-12, spec 005).
- **Contrato con días de servicio iguales a los del mes:** el texto lleva «(<mes> <año>)»; con menos días, «(<N> dias)» (FR-006).

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito describe el comportamiento **actual**.

- **FR-001 (RN-38) · Lanzamiento y mes.** La remesa se lanza a mano indicando el mes con la forma AAAA-MM (cuatro cifras, guion y dos cifras). Si falta el mes o no tiene esa forma, muestra «Uso: node scripts/remesa_mensual.js YYYY-MM», termina con código 1 y no graba nada. No comprueba que el mes exista.
  - Evidencia: `scripts/remesa_mensual.js:14-18`.
  - Test: `remesa.test.js` › «un mes con formato incorrecto o sin mes sale con código 1 y el mensaje de uso, sin grabar nada».
- **FR-002 (RN-38) · Mes sin contratos.** Si ningún contrato entra en el mes (criterio de la spec 005), la remesa muestra «No hay contratos que facturar en <AAAA-MM>», termina con código 0 y no graba nada.
  - Evidencia: `scripts/remesa_mensual.js:31`.
  - Test: `remesa.test.js` › «un mes sin contratos sale con código 0 y lo dice».
- **FR-003 (RN-33) · Una factura de una línea por contrato.** Por cada contrato que entra en el mes, la remesa emite una factura de la serie FA con una sola línea: cantidad 1, precio igual al importe del mes (spec 005), el tipo de IVA del contrato y recargo de equivalencia si el cliente lo tiene. La factura se calcula con las mismas reglas que el alta manual (specs 001 y 002). Ejemplo: contrato 2 (145,00 € al 21 %) → base 145,00 €, IVA 30,45 €, total 175,45 €; con el cliente 1 en recargo, su factura de 90 € lleva 4,68 € de recargo.
  - Evidencia: `scripts/remesa_mensual.js:54-55`, `:57`, `:61-68`.
  - Test: `remesa.test.js` › «remesa 2026-05 completa: salida de consola, cabeceras y líneas» y «el recargo del cliente se aplica a la cuota: cliente 1 en recargo → 4,68».
- **FR-004 (RN-36) · Fecha y estado.** Cada factura de la remesa lleva como fecha el último día del mes facturado (según el calendario real, spec 005) y nace en estado «emitida». La fecha no depende del día en que se lanza.
  - Evidencia: `scripts/remesa_mensual.js:21`, `:59`, `:62`.
  - Test: `remesa.test.js` › «remesa 2026-05 completa: salida de consola, cabeceras y líneas» y «mes completo de 31 y de 30 días: el texto lleva «(mes año)», no los días».
- **FR-005 (RN-36) · Vencimiento.** El vencimiento es la fecha de la factura más los días de pago del cliente; si el cliente no tiene días de pago o tiene 0, más 30 días. Ese 30 está fijo: no usa el plazo por defecto de la configuración. Dato real: la remesa de mayo de 2026 del contrato 1 → fecha 2026-05-31 y vencimiento 2026-06-30, igual que la factura real FA-2026-000108.
  - Evidencia: `scripts/remesa_mensual.js:60`; FA-2026-000108 en `db.js:168`. Anomalía A-37 (el 0 que se trata como «sin días» es A-36, spec 008).
  - Test: `remesa.test.js` › «remesa 2026-05 completa: salida de consola, cabeceras y líneas» y «CONGELA comportamiento actual: la remesa vence a 30 días aunque config.VENCIMIENTO_DIAS valga 45 (A-37, C06)».
- **FR-006 (RN-37) · Texto de la línea.** Si los días de servicio son menos que los del mes, el texto de la línea es «<concepto> (<N> dias)», con «dias» sin tilde; si no, «<concepto> (<mes> <año>)», con el nombre del mes en minúsculas. Ejemplos: «Alquiler máquina de café Futurmat F3 (14 dias)»; «Mantenimiento cámaras frigoríficas (mayo 2026)».
  - Evidencia: `scripts/remesa_mensual.js:53`, `:80-84`.
  - Test: `remesa.test.js` › «ejemplo de reglas-de-negocio.md: contrato 4 en febrero de 2026, 14 de 28 días → 45,00; total 54,45» y «mes completo de 31 y de 30 días: el texto lleva «(mes año)», no los días».
- **FR-007 (RN-37) · Observaciones.** Las observaciones de cada factura de la remesa son siempre «Remesa <mes> <año>», con el nombre del mes en minúsculas (por ejemplo, «Remesa febrero 2026»), sin ninguna otra anotación.
  - Evidencia: `scripts/remesa_mensual.js:62`, `:80-84`.
  - Test: `remesa.test.js` › «remesa 2026-05 completa: salida de consola, cabeceras y líneas».
- **FR-008 · Mensajes de consola.** Por cada factura emitida, la remesa muestra una línea con dos espacios, el número, dos espacios, el nombre del cliente, dos espacios, el total con punto decimal y dos decimales, y « eur». Al terminar muestra «Remesa <AAAA-MM> terminada: <N> facturas.» y termina con código 0.
  - Evidencia: `scripts/remesa_mensual.js:38-39`, `:71`. El formato del importe con punto es A-19 (spec 010).
  - Test: `remesa.test.js` › «remesa 2026-05 completa: salida de consola, cabeceras y líneas».
- **FR-009 (RN-38) · Sin control de repetición.** La remesa no comprueba si un contrato ya se facturó en ese mes. Si se lanza dos veces el mismo mes, emite otra factura por cada contrato, con números nuevos y los mismos textos.
  - Evidencia: `scripts/remesa_mensual.js:26-29` (la selección no mira las facturas existentes). Anomalía A-03.
  - Test: `remesa.test.js` › «CONGELA comportamiento actual: lanzar dos veces el mismo mes duplica todas las facturas con números distintos (A-03, RN-38)».
- **FR-010 · Fallo a mitad.** Si falla la numeración o la grabación de una factura o de su línea, la remesa muestra el error y termina con código 1. Las facturas emitidas hasta ese momento se quedan, y no hay forma de continuar desde el contrato que falló. Si el fallo se produce al grabar la línea, la factura de ese contrato se queda sin línea.
  - Evidencia: `scripts/remesa_mensual.js:58`, `:64`, `:70` (salida con código 1 tras cada fallo). Anomalía A-03.
  - Test: **ninguno** (ver «Huecos de cobertura»).
- **FR-011 (RN-38) · Orden de los contratos.** La remesa procesa los contratos en el orden en que los devuelve la consulta, que no fija ningún orden; hoy salen por orden de alta en la base de datos (contratos 1, 2 y 4 en mayo de 2026), y ese es el orden en que reciben número. Esta spec no garantiza ningún orden concreto.
  - Evidencia: `scripts/remesa_mensual.js:26-29`. Anomalía A-46 (spec 003).
  - Test: `remesa.test.js` › «CONGELA comportamiento actual: los contratos se procesan en el orden que devuelve la consulta sin ORDER BY, hoy por id (A-46, RN-38)».
- **FR-012 (RN-35) · Meses imposibles e importes negativos.** La remesa acepta cualquier mes con la forma AAAA-MM, aunque no exista. Con «2026-13» o «2026-00» graba facturas con fecha «<año>-13-31» o «<año>-00-31», vencimiento «NaN-NaN-NaN» y el texto «undefined <año>» en las observaciones y en la línea. Tampoco impide importes negativos: si la baja de un contrato es anterior a su alta en el mismo mes, cobra días negativos (por ejemplo, −9 días y −26,13 €) en una factura ordinaria.
  - Evidencia: `scripts/remesa_mensual.js:15` (solo comprueba la forma), `:45-51` (días de servicio sin cota, frente a la cota en 0 de `services/calculo.js:100`), `:80-84`. Anomalía A-26.
  - Test: `remesa.test.js` › los tres tests de «RN-35 / A-26 · importes negativos y meses imposibles» y «CONGELA comportamiento actual: baja antes del alta → la pantalla da 30,00 (ignora el alta) y la remesa −26,13 (A-26, A-13, C01)».
- **FR-013 · Carpeta sin base de datos.** Si se lanza desde una carpeta donde no hay base de datos, la remesa crea una nueva, la rellena con los datos de referencia de ejemplo (6 clientes, 8 artículos, 4 contratos y 9 facturas) y factura sus contratos con normalidad.
  - Evidencia: la base de datos se busca en la carpeta desde la que se lanza (`config.js`, ruta relativa) y se abre al cargar el programa (`db.js`); la siembra es RN-52 (excluida de las specs). Anomalía A-27.
  - Test: `remesa.test.js` › «CONGELA comportamiento actual: lanzada en una carpeta sin BD, crea una nueva, la siembra y factura los contratos de ejemplo (A-27, RN-52)».

### Anomalías de esta spec

Todas están cerradas en el [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md) (§7).

| ID | Clasificación | Comportamiento especificado | Tratamiento acordado | Decisión de negocio | Tests |
| --- | --- | --- | --- | --- | --- |
| A-03 | BUG A SECAS | FR-009 (sin control de repetición) y FR-010 (no se puede reanudar) | Especificar tal cual; corregir en la modernización con el criterio contrato + mes (CN-4). No retroactivo | Acta simulada, P05, Marga, 2026-11-16; origen del caso de abril: ratificación, N-03, Marga y Julián, 2026-11-16 (habla Julián) | `remesa.test.js` › «lanzar dos veces el mismo mes duplica todas las facturas con números distintos (A-03, RN-38)» |
| A-26 | BUG A SECAS | FR-012 (meses imposibles e importes negativos) | Especificar tal cual; corregir en la modernización. No retroactivo | Ninguna | `remesa.test.js` › bloque «RN-35 / A-26 · …» (3 tests) y «baja antes del alta → la pantalla da 30,00 (ignora el alta) y la remesa −26,13» |
| A-27 | BUG A SECAS (latente) | FR-013 (efecto: BD nueva sembrada y facturada). El arranque desde otra carpeta se documenta sin especificar | Documentar sin especificar el arranque; especificar el efecto; corregir en la modernización | Ratificación, §2.1, P25, Julián, 2026-11-16 → RS-17 | `remesa.test.js` › «lanzada en una carpeta sin BD, crea una nueva, la siembra y factura los contratos de ejemplo» |
| A-37 | ACCIDENTAL (C06) | FR-005 (30 días fijos, sin mirar la configuración) | Especificar tal cual; unificar con el alta en la modernización (CN-7) | Valor en producción, 30: ratificación, §2.1, P30, Julián, 2026-11-16 → RS-25 | `remesa.test.js` › «la remesa vence a 30 días aunque config.VENCIMIENTO_DIAS valga 45 (A-37, C06)» |

### Comportamiento documentado sin especificar

- **De qué carpeta se lanza (A-27).** La remesa usa la base de datos de la carpeta desde la que se lanza. Marga la lanza desde un acceso directo que le preparó Julián; ese acceso arranca en la carpeta de GesFact, así que hoy usa la base de datos buena (ratificación, §2.1, P25, Julián, 2026-11-16). Los datos de referencia sirvieron para formar a Marga en 2017 y hoy no los usa nadie (misma fuente).
- **Facturas históricas de remesa que el código actual no genera (D11, A-04).** En la copia hay facturas de remesa con varias líneas, con el mes sin año en la línea («Alquiler máquina de café Futurmat F3 (enero)») y en las observaciones («Remesa enero», «Remesa mayo»). Por ejemplo, FA-2026-000101 (`db.js:126-127`) y FA-2026-000108 (`db.js:168`). El código actual emite una sola línea y añade el año (FR-003, FR-006, FR-007). Salieron de versiones anteriores del programa (ratificación, N-03, Marga y Julián, 2026-11-16 → RS-02). Su procedencia (A-04) está excluida de las specs y va al plan de migración; esas facturas se conservan sin recalcular.

### Convenciones declaradas (no son requisitos)

Son conducta deseada declarada por el negocio. Esta spec **no las impone**.

| # | Convención declarada | Fuente | Relación con el comportamiento actual |
| --- | --- | --- | --- |
| CN-4 | Como máximo, una cuota por contrato y mes; un mes está «ya facturado» para un contrato si ya tiene su cuota de ese mes. Lo extra (reparaciones, portes) va en una factura manual sin contrato | Acta simulada, P05, Marga, 2026-11-16; criterio ratificado en la ratificación, §3 («Resultado», A-03) | **Diverge**: la remesa no comprueba nada y un relanzamiento duplica (A-03, FR-009) |
| Día de lanzamiento | La remesa se lanza el primer día laborable del mes siguiente | Acta simulada, P20, Marga, 2026-11-16; comentario del código «Se lanza el dia 1» (`scripts/remesa_mensual.js:7`) | Práctica de uso, compatible con FR-004. Su efecto en el año del número de la remesa de diciembre es A-20 (spec 004) |
| CN-7 | El plazo de vencimiento por defecto es el mismo en el alta manual y en las cuotas. Dueña: spec 008 | Acta simulada, P30, Marga, 2026-11-16 → RS-25 | **Diverge** en el mecanismo: la remesa tiene 30 días fijos y el alta usa la configuración (A-37, FR-005). Hoy coinciden porque la configuración de producción vale 30 |

### Huecos de cobertura

- **Fallo a mitad de la remesa (FR-010).** No hay test que provoque un fallo de numeración o de grabación en mitad de la remesa: haría falta inyectar fallos en la base de datos. El comportamiento se verifica por inspección: tras cada fallo, `scripts/remesa_mensual.js:58`, `:64` y `:70` terminan el proceso con código 1, sin deshacer lo grabado. Un caso alcanzable sin inyectar fallos es la primera numeración del año pedida a la vez por la remesa y por un alta (A-52, spec 004).

### Fuera de alcance

- Qué contratos entran y cuánto se cobra (vigencia, prorrateo, baja, descuento en cuotas, bonificaciones): spec 005.
- Año del número de la remesa de diciembre (A-20): spec 004.
- Facturación a clientes de baja (A-07): spec 003. Cliente con 0 días de pago (A-36): spec 008.
- Cálculo de la línea y del recargo: spec 001.
- Formato de los importes en la consola (A-19): spec 010.
- Siembra de los datos de referencia (RN-52): excluida (plan de operación y migración).

### Key Entities

- **Mes de remesa**: texto AAAA-MM indicado al lanzar; solo se comprueba su forma (FR-001).
- **Factura de cuota**: serie FA, estado «emitida», fecha del último día del mes, vencimiento según FR-005, observaciones «Remesa <mes> <año>».
- **Línea de cuota**: cantidad 1, precio igual al importe del mes, IVA del contrato, texto según FR-006.
- **Salida del proceso**: mensajes de consola y código de salida (0 o 1) (FR-001, FR-002, FR-008, FR-010).

## Success Criteria *(mandatory)*

### Measurable Outcomes

Esta spec es un contrato de comportamiento; sus criterios se miden con la suite de caracterización existente, que no se modifica.

- **SC-001**: el test «remesa 2026-05 completa: salida de consola, cabeceras y líneas» de `remesa.test.js` pasa con la salida de consola idéntica carácter a carácter.
- **SC-002**: el 100 % de los tests de los bloques «RN-33 / RN-36 / RN-37 · …» (2), «RN-35 / A-26 · …» (3), «RN-38 · …» (4) y «Anomalías de la remesa sobre datos preparados» (6) de `remesa.test.js` pasa sin cambios.
- **SC-003**: 12 de los 13 requisitos (FR-001 a FR-013) tienen al menos un test citado; el que no lo tiene (FR-010) figura en «Huecos de cobertura» con su criterio de inspección.
- **SC-004**: Marga puede lanzar la remesa de un mes sobre una copia y comprobar, sin consultar el código, que obtiene las facturas, los textos, las fechas, los vencimientos y los mensajes que describe esta spec.

## Assumptions

- La versión de referencia es el código del commit `2b49ea5` y la copia de `datos/gesfact.db` versionada en ese commit. La BD de producción no se toca; los tests ejecutan la remesa sobre copias temporales, con reloj y zona horaria fijos.
- La remesa se lanza siempre a mano, desde el ordenador de Marga; no hay ninguna tarea programada que la lance (comentario de `scripts/remesa_mensual.js:5-7`; acta simulada, P25, Marga, 2026-11-16).
- El testimonio de negocio citado es simulado y ratificado por la responsable del proyecto (NEGOCIO-RS). No condiciona esta spec, que fija el comportamiento actual; sí condiciona cualquier corrección futura (deuda de confirmación).
- La numeración (006) y el nombre (`006-remesa-mensual`) siguen la [propuesta de partición](../000-reconocimiento/propuesta-particion-specs.md).
