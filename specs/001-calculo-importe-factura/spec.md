# Especificación: Importe de la factura — líneas, IVA, recargo de equivalencia y redondeo (comportamiento actual)

**Rama**: `001-calculo-importe-factura`

**Creada**: 2026-11-16

**Estado**: Borrador

**Entrada**: descripción del usuario: «Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del cálculo del importe de una factura (líneas, IVA, recargo de equivalencia y redondeo) de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.» (El texto completo, con el alcance RN-01 a RN-08, las anomalías y los criterios, se recoge íntegro en las secciones de esta spec.)

## Naturaleza de esta spec

- **Es una spec inversa.** Cada requisito describe lo que GesFact 2.4 hace **hoy**, aunque parezca un error. Nada de lo que aquí se exige obliga a cambiar el programa actual (constitución, principio I).
- **Evidencia.** Cada requisito cita su evidencia: `fichero:líneas` del código, dato real de la copia de `datos/gesfact.db` o acta de negocio. Los tests se citan como `fichero › «título del test»`, todos en `pruebas/caracterizacion/`.
- **Anomalías.** Se especifican tal como funcionan hoy, con su ID del [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md). No se corrigen ni se omiten.
- **Convenciones declaradas.** Lo que el negocio dice que **debería** pasar se presenta como «convención declarada», nunca como requisito, junto a la anomalía que lo separa del comportamiento actual.
- **Testimonio de negocio.** Las actas citadas son la [entrevista simulada](../000-reconocimiento/entrevista-negocio-simulada.md) y la [ratificación simulada](../000-reconocimiento/ratificacion-negocio-simulada.md) del 2026-11-16 (testigo NEGOCIO-RS). Arrastran una **deuda de confirmación**: no afecta a esta spec, que fija el comportamiento actual, pero sí a cualquier corrección posterior.
- **Línea base verificada.** El 2026-11-16, sobre el commit `2b49ea5`, los cinco ficheros de test citados (`calculo`, `anomalias-calculo`, `golden-master`, `datos-historicos` y `servidor-facturas`) pasan **142 de 142** tests.

## User Scenarios & Testing *(mandatory)*

### Historia 1 - La gestoría recibe importes que cuadran línea a línea con su contabilidad (Priority: P1)

Puri (gestoría) importa en Contaplus los importes que calcula GesFact. Cada línea redondea al céntimo su base, su cuota de IVA y su recargo, y la factura suma esas cifras ya redondeadas. Así cuadra Contaplus: en mayo de 2019 se cambió a redondear sobre la base total y la gestoría devolvió el trimestre entero.

**Why this priority**: es el contrato del que dependen Contaplus y el modelo 303 en **todas** las facturas. Es la regla más protegida del sistema (A-17, PR-4) y un céntimo de diferencia rompe el cuadre.

**Independent Test**: se comprueba solo con el cálculo de una factura, sin servidor ni base de datos: `calculo.test.js` (RN-01 a RN-05) y `anomalias-calculo.test.js` (A-17, A-18). De punta a punta, GM-01 y GM-07 del golden master.

**Acceptance Scenarios**:

1. **Given** una línea de 0,44 «Vaso caña» a 21,60 € (FA-2026-000101), **When** se calcula, **Then** su base es 9,50 € (0,44 × 21,60 = 9,504, redondeado en la propia línea). Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md (FA-2026-000101): 0,44 × 21,60 = 9,504 → 9,50».
2. **Given** 1 «Vaso caña» (21,60 €) y 2 «Plato llano» (57,80 €), ambos al 21 %, **When** se calcula la factura, **Then** el IVA es 4,54 + 12,14 = 16,68 €, y no los 16,67 € que saldrían sobre la base total. Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 1 vaso + 2 platos al 21 % → IVA 16,68 (sobre el total serían 16,67)».
3. **Given** las líneas de FA-2026-000104, **When** se calcula la factura, **Then** base 152,30 €, IVA 6,09 €, recargo 0,76 € y total 159,15 €. Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md (FA-2026-000104): 152,30 + 6,09 + 0,76 = 159,15».
4. **Given** 21 × 18,50 € al 21 %, **When** se calcula, **Then** la cuota de IVA es 81,58 € (81,585 baja, A-18). Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 21 × 18,50 = 388,50; IVA 81,585 → 81,58».
5. **Given** 55 × 11,95 € al 10 %, **When** se calcula, **Then** la cuota de IVA es 65,72 € (65,725 baja, A-18). Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 55 × 11,95 = 657,25; IVA 10 % 65,725 → 65,72».
6. **Given** −1 × 92,50 € al 21 %, **When** se calcula, **Then** la cuota de IVA es −19,42 €, mientras que la misma línea en positivo da 19,43 € (asimetría de signo, A-18). Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: −1 × 92,50 al 21 % da IVA −19,42; en positivo 19,43».
7. **Given** todo el catálogo multiplicado por cantidades de 1 a 60, **When** se calculan las cuotas de IVA, **Then** aparecen 66 medios céntimos, de los que 4 bajan y 62 suben. Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: catálogo × cantidades 1-60 → 66 medios céntimos de IVA, 4 bajan y 62 suben».

---

### Historia 2 - Un cliente en recargo de equivalencia paga el recargo de cada línea según su tipo de IVA (Priority: P2)

Los clientes marcados en régimen de recargo de equivalencia (comercios minoristas) pagan, además del IVA, un recargo en **todas** sus líneas. El porcentaje sale de una tabla fija por tipo de IVA, que conserva los tipos antiguos «por si hay que reabrir ejercicios».

**Why this priority**: afecta a los importes de una parte de los clientes y a la liquidación del recargo. Depende de la misma regla de redondeo que la historia 1.

**Independent Test**: `calculo.test.js` (RN-03, RN-06, RN-07) y `anomalias-calculo.test.js` (A-16); de punta a punta, GM-02.

**Acceptance Scenarios**:

1. **Given** un cliente en recargo y una línea de 4 × 18,50 € = 74,00 € al 21 % (FA-2026-000102), **When** se calcula, **Then** el recargo es 3,85 € (5,2 %). Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md (FA-2026-000102): 4 × 18,50 = 74,00 → recargo 3,85».
2. **Given** un cliente en recargo con 1 vaso y 1 plato, **When** se calcula, **Then** el recargo es 1,12 + 1,50 = 2,62 €, y no los 2,63 € que saldrían sobre la base total. Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 1 vaso + 1 plato en recargo → 1,12 + 1,50 = 2,62 (sobre el total serían 2,63)».
3. **Given** un cliente en recargo, **When** factura 100 € al 10 %, **Then** el recargo es 1,40 €; y **When** factura 100 € al 5 %, **Then** el recargo es 0 €. Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 100 € al 5 % en recargo → 0; al 10 % → 1,40».
4. **Given** un cliente en recargo con líneas a los tipos antiguos, **When** se calcula, **Then** 16 % y 18 % llevan un 4 % de recargo, y 7 % y 8 % un 1 %. Test: `anomalias-calculo.test.js` › «CONGELA comportamiento actual: 16 y 18 → 4 %; 7 y 8 → 1 % en una factura en recargo (A-16)».
5. **Given** la marca de recargo del cliente vale 1, «1» o «verdadero», **When** se calcula, **Then** se aplica recargo; **Given** vale 2, 0, vacío o «si», **Then** no se aplica. Test: `calculo.test.js` › «comparación laxa: 1, «1» y true aplican recargo; 2, 0, null, undefined y «si» no».
6. **Given** FA-2026-000101 (cliente sin recargo) y FA-2026-000104 (cliente en recargo), **When** se calculan, **Then** la primera lleva 0 € de recargo y la segunda 0,76 €. Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md (FA-2026-000104): 152,30 + 6,09 + 0,76 = 159,15».

---

### Historia 3 - Quien factura decide el precio y el tipo de IVA de cada línea (Priority: P3)

Marga (administración) puede facturar un artículo a un precio distinto del de catálogo, por ejemplo a un hotel con precio especial. El formulario rellena precio e IVA del catálogo al elegir el artículo, pero ambos se pueden cambiar, y el programa calcula con lo que llega. El desplegable solo ofrece 21, 10 y 4 %, pero el programa acepta cualquier tipo entero que reciba.

**Why this priority**: el precio libre es intencional (A-14). El tipo libre es un riesgo latente que hoy no ha producido ningún documento: en los datos reales solo hay líneas al 21, 10 y 4 %.

**Independent Test**: `servidor-facturas.test.js` (alta con tipos 5, 7 y 16) y `anomalias-calculo.test.js` (A-14); de punta a punta, GM-02.

**Acceptance Scenarios**:

1. **Given** el artículo «Aceite de oliva virgen extra 5L» (catálogo: 27,45 € al 4 %), **When** se factura a 20,00 € al 21 %, **Then** la línea se calcula con 20,00 € y 21 %, sin contrastarlos con el catálogo. Evidencia: `routes/facturas.js:57-62`. **Sin test específico** del precio fuera de catálogo (hueco de cobertura; ver «Huecos de cobertura»).
2. **Given** un alta con líneas al 5 %, 7 % y 16 % para un cliente en recargo, **When** se graba, **Then** se acepta y el recargo es del 0 %, 1 % y 4 % respectivamente. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: el servidor acepta IVA 5, 7 y 16; en recargo dan 0, 1 y 4 % (A-14, RN-08, C07)».
3. **Given** un cliente en recargo con líneas al 5 %, 2 % y 0 %, **When** se calcula, **Then** el recargo de esas líneas es 0. Test: `anomalias-calculo.test.js` › «CONGELA comportamiento actual: cliente en recargo con línea al 5 % paga 0 de recargo; al 2 % y 0 % también (A-14)».

---

### Historia 4 - El equipo de modernización sabe qué facturas históricas no cumplen la regla de totales (Priority: P4)

En 6 de las 9 facturas reales, la cabecera no es la suma de sus líneas. El código actual no puede producir ese descuadre: la cabecera siempre sale de sumar las líneas. Esta historia **no especifica** el descuadre como comportamiento que haya que reproducir: lo **documenta**, para que la modernización conserve los valores grabados y no los tome como regla.

**Why this priority**: no cambia ningún cálculo nuevo, pero evita dos errores en la migración: recalcular documentos ya emitidos o tomar las cabeceras históricas como ejemplo de la regla.

**Independent Test**: `datos-historicos.test.js` › los 3 tests de «A-01 · la cabecera de 6 de las 9 facturas reales no cuadra con sus líneas».

**Acceptance Scenarios**:

1. **Given** la copia de la BD real, **When** se compara el total de cabecera con la suma de líneas, **Then** las diferencias son las de la tabla QD5 del registro (FA-2026-000101 +3,70 €; FA-2026-000105 +81,86 €; FA-2026-000106 +0,56 €; RE-2026-000001 −0,56 €; FA-2026-000107 +0,56 €; FA-2026-000108 +1,93 €). Test: `datos-historicos.test.js` › «CONGELA comportamiento actual: diferencias de total cabecera − líneas de la tabla QD5 (A-01)».
2. **Given** las 4 FA vivas con descuadre, **When** se suman sus diferencias, **Then** facturan 88,05 € más que sus líneas. Test: `datos-historicos.test.js` › «CONGELA comportamiento actual: las 4 FA vivas con descuadre facturan 88,05 € más que sus líneas (A-01)».
3. **Given** FA-2026-000101, **When** se compara su IVA, **Then** la cabecera dice 27,97 € (el 21 % de toda la base, aunque dos líneas van al 10 %) y las líneas suman 24,27 €. Test: `datos-historicos.test.js` › «CONGELA comportamiento actual: en FA-2026-000101 el IVA de cabecera 27,97 es el 21 % de toda la base; por líneas 24,27 (A-01)».

---

### Edge Cases

- **Medio céntimo exacto.** Puede subir o bajar según su representación binaria (81,585 → 81,58; 19,425 → 19,43). No se aplica la regla «medio céntimo, hacia arriba» de forma uniforme (FR-005, A-18).
- **Importes negativos.** El medio céntimo negativo va hacia cero (−19,425 → −19,42), así que una línea y su opuesta no suman cero en IVA (FR-005, A-18). Que se admitan líneas negativas en la serie FA es de la spec 003 (A-15).
- **Tipo de IVA desconocido para la tabla de recargo** (0, 2, 5, 12, negativos, vacío): recargo 0, sin aviso. El IVA sí se calcula con ese tipo (FR-006, A-14). Test: `calculo.test.js` › «cualquier otro tipo → 0 (0, 2, 5, 12, negativos, null, undefined)».
- **Tipo de IVA recibido como texto «21».** No encuentra recargo (0), pero sí calcula el IVA al 21 %. Test: `anomalias-calculo.test.js` › «CONGELA comportamiento actual: el tipo como texto «21» no encuentra recargo pero sí calcula IVA (A-14)». Por el alta manual el tipo llega siempre convertido a número (`routes/facturas.js:61`), así que este caso solo se da con otro origen de líneas: **SUPOSICIÓN** sobre qué caminos lo alcanzan (pregunta abierta para la planificación).
- **Cliente nulo o ausente:** sin recargo y sin error. Test: `calculo.test.js` › «cliente nulo o ausente → sin recargo y sin error».
- **Factura sin líneas:** todo a cero. Test: `calculo.test.js` › «factura sin líneas → todo a cero». Que el alta la rechace es de la spec 003.
- **Cantidad cero:** todo a cero. Test: `calculo.test.js` › «cantidad cero → todo cero».
- **Cantidad no numérica:** base e IVA no numéricos y recargo 0. Test: `calculo.test.js` › «CONGELA comportamiento actual: cantidad NaN propaga NaN a base e IVA, el recargo queda 0 (RN-15)». La lectura de lo tecleado es de la spec 003.
- **Precio con tres decimales:** se usa tal cual y solo se redondea la base. Test: `anomalias-calculo.test.js` › «CONGELA comportamiento actual: un precio de 3 decimales se usa sin redondear y solo se redondea la base (A-18, C05 §3.3)».
- **Base bruta por encima de 1.000 €:** el precio de cada línea se rebaja **antes** de aplicar las reglas de esta spec. Esa rebaja es de la spec 002; esta spec calcula sobre el precio que resulte.

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito describe el comportamiento **actual**. «Redondear al céntimo» significa siempre la operación de FR-005, con sus efectos.

- **FR-001 (RN-01) · Base de línea.** El sistema calcula la base de cada línea como cantidad × precio y la redondea al céntimo en la propia línea, antes de cualquier otro cálculo. Ejemplo: FA-2026-000101, 0,44 × 21,60 = 9,504 → 9,50 €.
  - Evidencia: `services/calculo.js:26-27` (`calcularLinea`); `lib/util.js:5-7` (`redondear2`).
  - Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md (FA-2026-000101): 0,44 × 21,60 = 9,504 → 9,50»; GM-01.
- **FR-002 (RN-02) · Cuota de IVA por línea.** El sistema calcula la cuota de IVA de cada línea sobre su base ya redondeada y la redondea al céntimo. El IVA de la factura es la suma de esas cuotas redondeadas; nunca se calcula sobre la base total. Ejemplo: 4,54 + 12,14 = 16,68 € (sobre la base total serían 16,67 €).
  - Evidencia: `services/calculo.js:28`, `:82`.
  - Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md: 1 vaso + 2 platos al 21 % → IVA 16,68 (sobre el total serían 16,67)»; `anomalias-calculo.test.js` › «CONGELA comportamiento actual: el IVA de la factura es la suma de cuotas redondeadas, 1 céntimo más que sobre la base (A-17)»; GM-01.
- **FR-003 (RN-03) · Recargo por línea.** Si se aplica recargo (FR-007), el sistema calcula el recargo de cada línea sobre su base ya redondeada, con el porcentaje de su tipo de IVA (FR-006), y lo redondea al céntimo. El recargo de la factura es la suma de esos recargos redondeados. Ejemplos: FA-2026-000102, 74,00 € al 5,2 % = 3,85 €; 1 vaso + 1 plato → 1,12 + 1,50 = 2,62 € (sobre el total, 2,63 €).
  - Evidencia: `services/calculo.js:29-32`, `:83`.
  - Test: `calculo.test.js` › los dos tests de «RN-03 · el recargo de equivalencia se redondea línea a línea»; `anomalias-calculo.test.js` › «CONGELA comportamiento actual: el recargo de la factura es 1 céntimo menos que sobre la base (A-17)»; GM-02.
- **FR-004 (RN-04) · Totales de la factura.** El sistema obtiene la base, el IVA y el recargo de la factura sumando los de sus líneas y redondeando al céntimo tras **cada** suma. El total es base + IVA + recargo, redondeado al céntimo. Ejemplo: FA-2026-000104 → 152,30 + 6,09 + 0,76 = 159,15 €. Este requisito rige para las facturas que calcula el programa. Las facturas históricas descuadradas no lo cumplen y **no** se toman como ejemplo (A-01, historia 4).
  - Evidencia: `services/calculo.js:81-86`.
  - Test: `calculo.test.js` › «ejemplo de reglas-de-negocio.md (FA-2026-000104): 152,30 + 6,09 + 0,76 = 159,15»; GM-01.
- **FR-005 (RN-05) · Operación de redondeo.** El sistema redondea al céntimo multiplicando por 100, redondeando al entero más próximo (medio hacia arriba) y dividiendo por 100, **con los efectos de la representación binaria de los decimales**. Debe reproducir exactamente estos resultados:
  - 21 × 18,50 al 21 % → IVA 81,585 → **81,58** (el medio céntimo baja);
  - 55 × 11,95 al 10 % → IVA 65,725 → **65,72** (baja);
  - −1 × 92,50 al 21 % → IVA **−19,42**; la misma línea en positivo → **19,43** (asimetría de signo);
  - catálogo × cantidades de 1 a 60 → **66** medios céntimos de IVA: **4** bajan y **62** suben.
  - Evidencia: `lib/util.js:4-7`. Anomalía A-18.
  - Test: `calculo.test.js` › los cuatro tests de «RN-05 · redondeo con efectos de coma flotante, aplicado a líneas»; `anomalias-calculo.test.js` › los tres tests de «A-18 · efectos de coma flotante en el redondeo al céntimo»; GM-07.
- **FR-006 (RN-06) · Tabla de recargo por tipo de IVA.** El sistema asigna el porcentaje de recargo según el tipo de IVA de la línea con esta tabla fija:

  | Tipo de IVA | Recargo | Nota |
  | --- | --- | --- |
  | 21 % | 5,2 % | vigente |
  | 10 % | 1,4 % | vigente |
  | 4 % | 0,5 % | vigente |
  | 18 % y 16 % | 4 % | antiguo; se conserva (A-16) |
  | 8 % y 7 % | 1 % | antiguo; se conserva (A-16) |
  | cualquier otro (0, 2, 5, 12, negativos, vacío…) | 0 % | sin aviso (A-14) |

  La comparación es **estricta**: un tipo que llega como texto («21») no coincide con ninguna fila y lleva recargo 0 %. Ejemplo: 100 € al 5 % en recargo → 0 €; al 10 % → 1,40 €.
  - Evidencia: `services/calculo.js:12-23` (`recargoPara`); el aviso «no borrar por si hay que reabrir ejercicios viejos del Access» está en `:16-17`.
  - Test: `calculo.test.js` › los cinco tests de «RN-06 · tabla fija de recargo por tipo de IVA, con tipos antiguos»; `anomalias-calculo.test.js` › «CONGELA comportamiento actual: 16 y 18 → 4 %; 7 y 8 → 1 % en una factura en recargo (A-16)»; GM-02.
- **FR-007 (RN-07) · Cuándo se aplica el recargo.** El sistema aplica recargo a **todas** las líneas de la factura, cada una con el porcentaje de su tipo, solo si la marca de recargo de equivalencia del cliente es igual a 1 en comparación **laxa**: 1, «1» y «verdadero» aplican; 2, 0, vacío, ausente y «si» no aplican. Sin cliente no hay recargo y no se produce error. Ejemplo: FA-2026-000104 lleva 0,76 € de recargo; FA-2026-000101, 0 €.
  - Evidencia: `services/calculo.js:49`.
  - Test: `calculo.test.js` › los tres tests de «RN-07 · recargo solo si el cliente tiene recargo_equivalencia == 1, en todas sus líneas»; GM-02.
- **FR-008 (RN-08) · Precio y tipo libres en cada línea.** El sistema calcula cada línea con el precio y el tipo de IVA que recibe, sin contrastarlos con el catálogo. El formulario rellena precio e IVA del catálogo al elegir un artículo, y su desplegable solo ofrece 21, 10 y 4 %, pero quien factura puede cambiar ambos. El servidor acepta cualquier tipo entero. Ejemplo: aceite 5L a 20,00 € al 21 %, aunque el catálogo diga 27,45 € al 4 %.
  - Evidencia: `routes/facturas.js:57-62`; `views/factura_nueva.ejs:18`; `public/js/factura.js:1-15`. Anomalía A-14.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: el servidor acepta IVA 5, 7 y 16; en recargo dan 0, 1 y 4 % (A-14, RN-08, C07)»; GM-02. El precio fuera de catálogo y el autorrelleno del navegador **no tienen test** (ver «Huecos de cobertura»).

### Anomalías de esta spec

Todas están cerradas en el [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md) (§7). La columna «Comportamiento especificado» dice qué fija esta spec.

| ID | Clasificación | Comportamiento especificado | Tratamiento acordado | Decisión de negocio | Tests |
| --- | --- | --- | --- | --- | --- |
| A-01 | BUG HISTÓRICO CON DEPENDIENTES | **Ninguno: se documenta sin especificar.** FR-004 rige para lo que calcula el programa; 6 de las 9 facturas reales no lo cumplen (historia 4) | Documentar sin especificar. La corrección es por rectificativa, fuera del programa y no retroactiva. Una migración conserva los valores grabados sin recalcularlos | Acta simulada, P02, Puri, 2026-11-16: rectificar 101, 105, 107 y 108 con rectificativa total y factura nueva. Ratificación, N-01, Puri y Dirección, 2026-11-16: los 3,70 € no van como línea negativa; la factura nueva, bien calculada, ya los lleva de menos | `datos-historicos.test.js` › 3 tests «A-01 · …» |
| A-14 | INTENCIONAL (precio libre) / BUG A SECAS latente (tipos fuera de la tabla con recargo 0) | FR-006 (fila «cualquier otro» y comparación estricta) y FR-008 | Especificar tal cual; validar los tipos en la modernización, admitiendo los antiguos (A-16). No retroactivo | Acta simulada, P14, Puri y Marga, 2026-11-16; ratificación §2.1, P14, Puri, 2026-11-16 → RS-11 | `anomalias-calculo.test.js` › 2 tests «A-14 · …»; `servidor-facturas.test.js` › «el servidor acepta IVA 5, 7 y 16; en recargo dan 0, 1 y 4 %»; GM-02 |
| A-16 | INTENCIONAL | FR-006 (filas de los tipos antiguos) | Especificar tal cual, «no tocar» | Acta simulada, P19, Puri, 2026-11-16 → RS-13 | `anomalias-calculo.test.js` › «16 y 18 → 4 %; 7 y 8 → 1 %» |
| A-17 | INTENCIONAL | FR-001 a FR-004 (todo redondeado por línea) | Especificar tal cual, céntimo a céntimo; no se corrige (PR-4) | Aviso del código, mayo de 2019 (`services/calculo.js:3-6`); acta simulada, P17, Puri, 2026-11-16; ratificación §2.1, P17 (1T de 2019) → RS-14 | `anomalias-calculo.test.js` › 2 tests «A-17 · …»; GM-01 |
| A-18 | ACCIDENTAL | FR-005 (medio céntimo que baja y asimetría de signo) | Especificar tal cual; forma parte del redondeo protegido (A-17) | Ratificación §2.1, P18, Puri, 2026-11-16: Contaplus no recalcula; el medio céntimo lo decide GesFact | `anomalias-calculo.test.js` › 3 tests «A-18 · …»; GM-07 |

### Convenciones declaradas (no son requisitos)

Son conducta deseada declarada por el negocio. Esta spec **no las impone**: se citan para que la modernización sepa qué separa lo que el negocio quiere de lo que el programa hace.

| # | Convención declarada | Fuente | Anomalía que la separa del comportamiento actual | Situación |
| --- | --- | --- | --- | --- |
| CD-1 | Los tipos válidos para facturas nuevas son 21, 10 y 4 %; desde que existe GesFact nunca se ha facturado a otros | Ratificación §2.1, P14, Puri, 2026-11-16 → RS-11. Datos: solo hay líneas al 21 % (18), 10 % (7) y 4 % (3) (QD16) | **A-14**: el programa acepta cualquier tipo entero (FR-008) y le da recargo 0 si no está en la tabla (FR-006) | Diverge (latente: ningún documento afectado) |
| CD-2 | Si algún día hiciera falta el 5 %, su recargo sería el 0,62 % | Ratificación §2.1, P14, Puri, 2026-11-16; pendiente de verificar en la normativa (IN-6) | **A-14**: hoy una línea al 5 % lleva recargo 0 (FR-006) | Diverge; **SUPOSICIÓN** normativa hasta verificar IN-6 |
| CD-3 | No se toca el redondeo línea a línea sin aviso previo a la gestoría | PR-4 (acta simulada, Puri, P17 y P24), ratificada en la §4 de la ratificación, 2026-11-16 | Ninguna: coincide con FR-001 a FR-004 (A-17 es una anomalía positiva) | Coincide |
| CD-4 | Contaplus importa los importes tal como llegan: el medio céntimo lo decide GesFact | Ratificación §2.1, P18, Puri, 2026-11-16 | Ninguna: el comportamiento de FR-005 es el que vale para la gestoría (A-18) | Coincide |
| CD-5 | Los documentos emitidos solo se corrigen con rectificativa más factura nueva, nunca retocando la BD | Acta simulada, P02, Puri; ratificación, N-01, Puri y Dirección; ambas 2026-11-16 | **A-01**: hay cabeceras históricas descuadradas que no cumplen FR-004 | Corrección fuera del programa, no retroactiva |

### Huecos de cobertura

- **Precio fuera de catálogo (FR-008).** Ningún test fija que una línea se calcula con un precio distinto del de catálogo (ejemplo del aceite a 20,00 € al 21 %). La evidencia es solo de código (`routes/facturas.js:57-62`). Se propone añadir un test de caracterización en la planificación.
- **Autorrelleno del formulario (`public/js/factura.js:1-15`).** No se puede probar sin un navegador y sin dependencias nuevas (`pruebas/caracterizacion/LEEME.md:148`). Queda como prueba manual.

### Fuera de alcance

- Descuento por volumen y rebaja del precio unitario: spec 002.
- Lectura de importes tecleados, líneas admitidas (negativas, vacías) y cliente facturable: spec 003.
- Formato de importes en pantalla y en documentos: spec 010.
- Suma del IVA por periodo y CSV de la gestoría: spec 009 (incluye A-02, consecuencia de A-01 en los informes).
- Rectificativa espejo que copia los descuadres: spec 007.
- Procedencia de los datos históricos (A-04): excluida, va al plan de migración.

### Key Entities

- **Línea de factura**: descripción, cantidad, precio unitario, tipo de IVA y, ya calculados, base, cuota de IVA y recargo, cada uno redondeado al céntimo.
- **Factura (cabecera)**: base, IVA, recargo y total. En lo que calcula el programa, salen de sumar sus líneas (FR-004). En los datos históricos pueden no coincidir (A-01).
- **Cliente**: aporta la marca de recargo de equivalencia, que decide si todas las líneas de su factura llevan recargo (FR-007).
- **Tabla de recargo por tipo de IVA**: correspondencia fija entre tipo de IVA y porcentaje de recargo, con tipos vigentes y antiguos (FR-006).
- **Catálogo de artículos**: propone precio y tipo de IVA en el formulario, pero no condiciona el cálculo (FR-008).

## Success Criteria *(mandatory)*

### Measurable Outcomes

Esta spec es un contrato de comportamiento; sus criterios se miden con la suite de caracterización existente, que no se modifica.

- **SC-001**: el 100 % de los tests de `calculo.test.js` de los grupos RN-01 a RN-07 pasa sin cambios en los tests.
- **SC-002**: el 100 % de los tests de `anomalias-calculo.test.js` de los grupos A-14, A-16, A-17 y A-18 pasa sin cambios.
- **SC-003**: `golden-master.test.js` pasa en GM-01, GM-02 y GM-07, con 0 céntimos de diferencia respecto al master.
- **SC-004**: los 3 tests «A-01 · …» de `datos-historicos.test.js` pasan y fijan los descuadres tal como están: 6 de 9 facturas descuadradas, +88,05 € en las 4 FA vivas y 27,97 € frente a 24,27 € en FA-2026-000101.
- **SC-005**: `servidor-facturas.test.js` › «el servidor acepta IVA 5, 7 y 16; en recargo dan 0, 1 y 4 %» pasa.
- **SC-006**: los 8 requisitos (FR-001 a FR-008) y las 5 anomalías tienen al menos una evidencia citada; 7 de los 8 requisitos tienen además al menos un test citado, y el que no lo tiene entero (FR-008, precio libre) figura en «Huecos de cobertura».
- **SC-007**: un revisor de negocio (Puri) puede comprobar a mano, con calculadora, cada ejemplo canónico de esta spec y obtener el mismo importe al céntimo, aplicando solo las reglas FR-001 a FR-007.

## Assumptions

- La versión de referencia es el código del commit `2b49ea5` y la copia de `datos/gesfact.db` versionada en ese commit. La BD de producción no se toca; los tests trabajan sobre copias temporales.
- El testimonio de negocio citado es simulado y ratificado por la responsable del proyecto (NEGOCIO-RS). No condiciona esta spec, que fija el comportamiento actual; sí condiciona cualquier corrección futura (deuda de confirmación).
- Las reglas de esta spec se aplican sobre el precio de cada línea **después** de la rebaja por volumen, si la hay; esa rebaja la especifica la spec 002.
- Los importes son euros con dos decimales; la cantidad y el precio pueden llevar más decimales y solo se redondean los resultados (FR-001 y el caso límite del precio de tres decimales).
- La numeración de esta spec (001) sigue la [propuesta de partición](../000-reconocimiento/propuesta-particion-specs.md), que la llamaba `001-importes-iva-recargo`; la rama y la carpeta usan `001-calculo-importe-factura`. El contenido es el mismo.
