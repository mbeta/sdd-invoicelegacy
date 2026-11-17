# Especificación: Alta manual de facturas y datos del cliente (comportamiento actual)

**Rama**: `003-alta-facturas`

**Creada**: 2026-11-16

**Estado**: Borrador

**Entrada**: descripción del usuario: «Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del alta manual de facturas y de los datos del cliente que intervienen en ella de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.» (El texto completo, con el alcance RN-14 a RN-17, RN-20 y RN-47, las convenciones, las anomalías y los criterios, se recoge íntegro en las secciones de esta spec.)

## Naturaleza de esta spec

- **Es una spec inversa.** Cada requisito describe lo que GesFact 2.4 hace **hoy**, aunque parezca un error. Nada de lo que aquí se exige obliga a cambiar el programa actual (constitución, principio I).
- **Evidencia.** Cada requisito cita su evidencia: `fichero:líneas` del código, dato real de la copia de `datos/gesfact.db` o acta de negocio. Los tests se citan como `fichero › «título del test»`, todos en `pruebas/caracterizacion/`.
- **Anomalías.** Se especifican tal como funcionan hoy, con su ID del [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md). No se corrigen ni se omiten.
- **Convenciones declaradas.** Lo que el negocio dice que **debería** pasar se presenta como «convención declarada», nunca como requisito.
- **Testimonio de negocio.** Las actas citadas son la [entrevista simulada](../000-reconocimiento/entrevista-negocio-simulada.md) y la [ratificación simulada](../000-reconocimiento/ratificacion-negocio-simulada.md) del 2026-11-16 (testigo NEGOCIO-RS). Arrastran una **deuda de confirmación**: no afecta a esta spec, que fija el comportamiento actual, pero sí a cualquier corrección posterior.
- **Respuestas del programa.** Los códigos de respuesta, los textos de error y los avisos forman parte del comportamiento observable (constitución, principio I) y se especifican literalmente.
- **Relación con otras specs.** Esta spec fija qué entra en el alta, cómo se lee y qué se graba. Lo que se calcula con ello es de la [spec 001](../001-calculo-importe-factura/spec.md) (importes) y de la [spec 002](../002-descuento-volumen/spec.md) (descuento y su anotación).
- **Línea base verificada.** El 2026-11-16, sobre el commit `2b49ea5`, los cuatro ficheros de test citados (`servidor-facturas`, `util`, `golden-master` y `anomalias-calculo`) pasan **122 de 122** tests.

## User Scenarios & Testing *(mandatory)*

### Historia 1 - Administración graba una factura a mano y nace emitida (Priority: P1)

Marga (administración), y a veces Paco, graban facturas desde el formulario: eligen el cliente, la fecha y las observaciones, y rellenan filas con descripción, cantidad, precio y tipo de IVA. Las filas que se dejan sin descripción no cuentan. La factura se graba en la serie ordinaria FA, en estado «emitida», y el programa muestra su detalle. Después intenta enviarla por correo, pero el envío está desactivado y solo deja un aviso.

**Why this priority**: es el camino principal por el que nacen las facturas que no son cuotas.

**Independent Test**: `servidor-facturas.test.js` › bloque «Camino 1 · alta manual (POST /facturas/nueva)»; de punta a punta, GM-07 y GM-08.

**Acceptance Scenarios**:

1. **Given** una fila «Vaso caña», 1 × 21,60 € al 21 %, para el cliente 1, **When** se graba, **Then** se crea FA-2026-000109 en estado «emitida», con base 21,60 €, IVA 4,54 € y total 26,14 €, y el programa redirige a su detalle. Test: `servidor-facturas.test.js` › «RN-20 · nace emitida en FA, con el siguiente número, y redirige al detalle».
2. **Given** esa misma alta, **When** termina de grabarse, **Then** no se envía ningún correo y queda en la consola el aviso «[email] AVISO: envio desactivado. Factura FA-2026-000109 pendiente de enviar a mano a laparada@gmail.com». Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: el email no se envía, solo escribe un aviso en consola (A-35, RN-20)».
3. **Given** tres filas, la segunda sin descripción pero con cantidad 5 y precio 99, **When** se graba, **Then** la factura solo lleva las otras dos líneas (base 79,40 €; IVA 16,68 €; total 96,08 €). Test: `servidor-facturas.test.js` › «RN-15 · las filas sin descripción se descartan aunque tengan cantidad y precio».
4. **Given** un alta en la que ninguna fila tiene descripción, **When** se envía, **Then** responde con error 400 «La factura no tiene lineas» y no consume número. Test: `servidor-facturas.test.js` › «RN-15 · sin ninguna línea con descripción responde 400 y no consume número».
5. **Given** líneas con cantidad o precio negativos o a cero, **When** se calcula la factura, **Then** se aceptan sin error: restan, o valen cero. Tests: `anomalias-calculo.test.js` › los cuatro tests de «A-15 · la serie FA admite cantidades y precios negativos o cero»; GM-07 (línea «Abono envases» de −1 × 92,50 €).

---

### Historia 2 - Lo que se teclea en cantidad y precio se lee de una forma fija (Priority: P2)

El formulario admite la coma decimal española. El programa cambia **solo la primera coma** por un punto y lee el número hasta donde puede. Por eso un importe escrito con punto de miles («1.234,56») se lee como 1,234 y se factura mil veces más barato. Marga dice que a veces escribe así los importes grandes. Si la cantidad o el precio quedan vacíos, la grabación falla **después** de haber gastado el número de factura.

**Why this priority**: es la vía por la que un error de tecleo se convierte en una factura emitida, que ya no se puede borrar (A-05), o en un número perdido.

**Independent Test**: `servidor-facturas.test.js` (tests de A-05 y de la cantidad vacía); de punta a punta, GM-08.

**Acceptance Scenarios**:

1. **Given** cuatro filas con cantidad «1», «1,5», «12,5 kg» y «1e3», y precios «1.234,56», «10», «2» y «0,01», **When** se graba, **Then** las líneas quedan así:

   | Fila | Cantidad leída | Precio leído | Base |
   | --- | --- | --- | --- |
   | Miles | 1 | **1,234** | **1,23** |
   | Coma | 1,5 | 10 | 15,00 |
   | Con unidad | 12,5 | 2 | 25,00 |
   | Exponente | **1.000** | 0,01 | 10,00 |

   La factura sale como FA-2026-000112, con base 51,23 €, IVA 10,76 € y total 61,99 €. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: «1.234,56» se lee como 1,234; la siguiente factura salta al FA-2026-000112 (A-05, RN-16, A-22)».
2. **Given** una fila «Portes» con cantidad vacía y precio 6, **When** se graba, **Then** responde con error 500 «Error al grabar: SQLITE_CONSTRAINT: NOT NULL constraint failed: facturas.base», el contador ya ha avanzado a FA-2026-000111 y no hay ninguna factura con ese número. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: una línea con cantidad vacía da 500 y consume el número FA-2026-000111 (A-22, RN-24)».

---

### Historia 3 - La factura se hace a cualquier cliente que exista, también si está de baja (Priority: P3)

El formulario solo ofrece los clientes activos. El programa, en cambio, acepta cualquier cliente que exista, aunque esté dado de baja, si su identificador llega en la petición. Si el cliente no existe, la factura se rechaza sin gastar número.

**Why this priority**: incumple la convención de que a un cliente de baja no se le factura nunca (CN-3), pero solo con una petición directa, no desde el formulario.

**Independent Test**: `servidor-facturas.test.js` (tests de RN-14 y A-07); de punta a punta, GM-08.

**Acceptance Scenarios**:

1. **Given** un identificador de cliente «999» (inexistente) o «abc» (no numérico), **When** se graba, **Then** responde con error 400 «Cliente no valido» y no consume número. Test: `servidor-facturas.test.js` › «RN-14 · un cliente inexistente o no numérico responde 400 «Cliente no valido»».
2. **Given** el cliente 6 dado de baja, **When** se graba una factura a su nombre, **Then** se crea FA-2026-000115 para el cliente 6, por 13,15 €. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: se graba una factura a un cliente dado de baja (A-07, RN-14, C08)»; GM-08.

---

### Historia 4 - La fecha de la factura es la que se teclea, sin comprobaciones (Priority: P4)

Si se deja la fecha vacía, se usa la de hoy en el servidor. Si se teclea, se graba tal cual: no se comprueba su formato, ni que no sea futura, ni que no sea anterior a la de facturas con número menor. Marga graba a veces días después pedidos de fin de mes, aunque Puri no quiere que se antedate (PR-1).

**Why this priority**: permite antedatar, contra PR-1, y una fecha mal escrita altera el vencimiento y los trimestres de los informes (A-21).

**Independent Test**: `servidor-facturas.test.js` (tests de RN-17 y A-21); de punta a punta, GM-08 (fecha vacía) y GM-10 (fecha no ISO).

**Acceptance Scenarios**:

1. **Given** una fecha vacía el 2026-11-16, **When** se graba, **Then** la factura FA-2026-000119 lleva fecha 2026-11-16. Test: `servidor-facturas.test.js` › «RN-17 · sin fecha se usa la de hoy en el servidor (2026-11-16) y vence el 2026-12-16».
2. **Given** la fecha «2026/10/20», **When** se graba, **Then** se guarda «2026/10/20» tal cual. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: la fecha no se valida; «2026/10/20» se graba tal cual y vence el 2026-11-18 (A-21, RN-19)»; GM-10.
3. **Given** la fecha «2026-1-5», **When** se graba, **Then** se guarda «2026-1-5», sin ceros. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: «2026-1-5» se graba sin ceros y vence el 2026-02-04 (A-21)».
4. **Given** el reloj del servidor en el 10/01/2027, **When** se graba una factura con fecha 2026-12-20, **Then** se acepta y recibe un número de 2027. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: el 10/01/2027 una factura con fecha 2026-12-20 recibe FA-2027-000001 (A-20, RN-17, C03)». El año del número es de la spec 004.

---

### Historia 5 - Al dar de alta un cliente, el NIF solo se comprueba por su longitud (Priority: P5)

El NIF es opcional. Si se rellena, el programa lo acepta cuando tiene 9 caracteres sin contar espacios ni guiones, sin comprobar la letra de control. Marga revisa los NIF a mano copiándolos del papel del cliente; en 2023 devolvieron una factura por un NIF erróneo y hubo que rectificarla.

**Why this priority**: el NIF del cliente sale en la factura y un NIF erróneo obliga a rectificar (ya pasó una vez, A-32), pero no cambia importes.

**Independent Test**: `servidor-facturas.test.js` › bloque «RN-47 / A-32 · NIF en el alta de clientes»; `util.test.js` › grupo «RN-47 · validarNIF…»; `anomalias-calculo.test.js` › «A-32 · …».

**Acceptance Scenarios**:

1. **Given** los NIF «XXXXXXXXX», «B-4581239-0» y «70355910k» (este último, dato real del cliente 6, Bar Nuevo Siglo), **When** se validan, **Then** son válidos; **Given** «1234567Z», **Then** no lo es. Test: `util.test.js` › «ejemplos de reglas-de-negocio.md».
2. **Given** NIF de 8, 9 y 10 caracteres («1234567Z», «12345678Z», «123456789Z»), **When** se validan, **Then** solo el de 9 es válido. Test: `util.test.js` › «frontera de longitud: 8 / 9 / 10 caracteres».
3. **Given** « 1234 5678Z», «12345678Z » y «12345678-Z», **When** se validan, **Then** son válidos; **Given** «12345678_Z», **Then** no lo es. Test: `util.test.js` › «se quitan espacios y guiones, pero no otros símbolos».
4. **Given** «12345678A» (la letra correcta sería Z) o «!!!!!!!!!», **When** se validan, **Then** son válidos. Test: `anomalias-calculo.test.js` › «CONGELA comportamiento actual: cualquier cadena de 9 caracteres es un NIF válido, letra de control incluida o no (A-32)».
5. **Given** el alta de un cliente con NIF «1234567Z», **When** se envía, **Then** vuelve al listado de clientes con el aviso «El NIF no parece valido» y no graba el cliente. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: un NIF de 8 caracteres se rechaza con un aviso en la URL, sin grabar (A-32)».
6. **Given** el alta de un cliente con NIF «XXXXXXXXX», **When** se envía, **Then** se graba con ese NIF tal cual. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: «XXXXXXXXX» se acepta como NIF y se graba tal cual (A-32)».
7. **Given** el alta de un cliente sin NIF, **When** se envía, **Then** se graba con el NIF vacío. Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: un cliente con 0 días de pago vence a 30 días, no al contado (A-36, RN-18)», que crea un cliente con NIF vacío y comprueba que queda sin NIF.
8. **Given** el alta de un cliente sin nombre, **When** se envía, **Then** vuelve al listado con el aviso «Falta el nombre». Test: `servidor-facturas.test.js` › «sin nombre redirige con el aviso «Falta el nombre»».

---

### Edge Cases

- **Fila con descripción y sin cantidad o sin precio:** no se descarta; da error 500 al grabar, con el número ya gastado (FR-006; el hueco es A-22, spec 004).
- **Descripción de solo espacios:** no cuenta como vacía y la fila se conserva (`routes/facturas.js:56`). **Sin test.**
- **Importe con unidad u otro texto detrás («12,5 kg»):** se lee la parte numérica inicial (FR-005).
- **Importe con exponente («1e3»):** se lee como 1.000 (FR-005).
- **Importe con dos comas o con punto y coma («1,234,5»):** solo se cambia la primera coma, así que se lee 1,234 (FR-005; mismo mecanismo que A-05). **Sin test** con dos comas.
- **Una sola fila:** se trata igual que varias (`routes/facturas.js:50-53`).
- **Cliente no numérico:** se rechaza igual que un cliente inexistente (FR-001).
- **Fecha que no se puede interpretar:** se graba tal cual. Su efecto en el vencimiento («NaN-NaN-NaN») es de la spec 008 (`util.test.js` › «CONGELA comportamiento actual: fecha irreconocible, vacía o inexistente → «NaN-NaN-NaN» (RN-19)»).
- **Cliente sin NIF:** la validación no se ejecuta y el cliente se graba sin NIF (FR-010).
- **Dos personas grabando a la vez:** Paco y Marga a veces graban a la vez (acta simulada, P34, Marga, 2026-11-16). El efecto en la numeración es de la spec 004.

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito describe el comportamiento **actual**.

- **FR-001 (RN-14) · Cliente inexistente.** El sistema busca el cliente por su identificador numérico. Si no existe, o si el identificador no es numérico, responde con error 400 «Cliente no valido», sin grabar nada y sin consumir número.
  - Evidencia: `routes/facturas.js:43`, `:46-47`.
  - Test: `servidor-facturas.test.js` › «RN-14 · un cliente inexistente o no numérico responde 400 «Cliente no valido»».
- **FR-002 (RN-14) · Cliente de baja.** El formulario de alta solo ofrece los clientes activos, pero el sistema graba la factura para cualquier cliente que exista, esté activo o dado de baja.
  - Evidencia: `routes/facturas.js:31` (el formulario filtra los activos) frente a `:46-47` (el alta no filtra). Anomalía A-07.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: se graba una factura a un cliente dado de baja (A-07, RN-14, C08)»; GM-08.
- **FR-003 (RN-15) · Filas que cuentan.** El sistema solo toma las filas que tienen descripción; las demás se descartan aunque lleven cantidad o precio. Si no queda ninguna, responde con error 400 «La factura no tiene lineas», sin grabar nada y sin consumir número.
  - Evidencia: `routes/facturas.js:55-56`, `:64`.
  - Test: `servidor-facturas.test.js` › los dos tests «RN-15 · …»; GM-08.
- **FR-004 (RN-15) · Signo libre.** El sistema acepta cantidades y precios negativos o a cero, sin ninguna comprobación de signo, y los calcula como cualquier otro (spec 001). Las líneas negativas restan de la base que decide el descuento (spec 002). El sistema no distingue si una línea negativa es una devolución de envases.
  - Evidencia: `routes/facturas.js:55-63` (no hay comprobación de signo). Anomalía A-15.
  - Test: `anomalias-calculo.test.js` › los cuatro tests de «A-15 · la serie FA admite cantidades y precios negativos o cero»; GM-07.
- **FR-005 (RN-16) · Lectura de cantidad y precio.** El sistema cambia **solo la primera coma** del texto tecleado por un punto y lee el número más largo que pueda al principio del texto, ignorando lo que sigue. Resultados que debe reproducir: «1,5» → 1,5; «12,5 kg» → 12,5; «1.234,56» → 1,234; «1e3» → 1.000; vacío → no numérico. El tipo de IVA se lee como número entero. Ejemplo: precio «1.234,56» × 1 → base 1,23 €.
  - Evidencia: `routes/facturas.js:59-61`. Anomalía A-05.
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: «1.234,56» se lee como 1,234; la siguiente factura salta al FA-2026-000112 (A-05, RN-16, A-22)»; GM-08.
- **FR-006 (RN-15) · Cantidad o precio no numéricos.** Si una fila con descripción lleva la cantidad o el precio vacíos o sin número legible, el sistema reserva el número de factura y luego falla al grabar la cabecera, con error 500 «Error al grabar: SQLITE_CONSTRAINT: NOT NULL constraint failed: facturas.base». La factura no queda grabada y el número queda gastado.
  - Evidencia: `routes/facturas.js:59-60` (lectura), `:71` (reserva del número antes de grabar), `:74-78` (fallo al grabar). El hueco de numeración es A-22 (spec 004).
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: una línea con cantidad vacía da 500 y consume el número FA-2026-000111 (A-22, RN-24)».
- **FR-007 (RN-17) · Fecha de la factura.** El sistema graba como fecha el texto tecleado, tal cual; si va vacío, la fecha de hoy según el reloj del servidor, con formato AAAA-MM-DD. No comprueba el formato, ni que la fecha no sea futura, ni que no sea anterior a la de facturas con número menor. Ejemplos: «2026/10/20» y «2026-1-5» se graban tal cual; el 10/01/2027 se acepta una factura con fecha 2026-12-20.
  - Evidencia: `routes/facturas.js:44`; «hoy» es RN-49 (spec 004). Anomalía A-21.
  - Test: `servidor-facturas.test.js` › «RN-17 · sin fecha se usa la de hoy en el servidor (2026-11-16) y vence el 2026-12-16»; los dos tests «CONGELA comportamiento actual: …» de A-21 («2026/10/20» y «2026-1-5»); «CONGELA comportamiento actual: el 10/01/2027 una factura con fecha 2026-12-20 recibe FA-2027-000001 (A-20, RN-17, C03)»; GM-08, GM-10.
- **FR-008 (RN-20) · Estado y serie de la factura nueva.** El sistema graba toda factura del alta en la serie FA y en estado «emitida», con las observaciones tecleadas (más la anotación del descuento, spec 002). Al terminar, redirige al detalle de la factura recién creada.
  - Evidencia: `routes/facturas.js:74-76`, `:94`.
  - Test: `servidor-facturas.test.js` › «RN-20 · nace emitida en FA, con el siguiente número, y redirige al detalle».
- **FR-009 (RN-20) · Llamada al envío por correo.** Grabadas la cabecera y las líneas, el sistema llama al envío por correo, que no envía nada: solo escribe en la consola «[email] AVISO: envio desactivado. Factura <número> pendiente de enviar a mano a <correo del cliente>». La redirección se produce después de esa llamada.
  - Evidencia: `routes/facturas.js:93-95`. El envío en sí es la anomalía A-35 (spec 010).
  - Test: `servidor-facturas.test.js` › «CONGELA comportamiento actual: el email no se envía, solo escribe un aviso en consola (A-35, RN-20)».
- **FR-010 (RN-47) · NIF en el alta de clientes.** El nombre es obligatorio; sin él, el sistema vuelve al listado con el aviso «Falta el nombre». El NIF es opcional. Si se rellena, el sistema lo da por válido cuando, quitando espacios y guiones, tiene exactamente 9 caracteres, sean los que sean; no comprueba la letra de control. Si no es válido, vuelve al listado con el aviso «El NIF no parece valido» y no graba el cliente. Si es válido, lo graba tal como se tecleó, con sus espacios y guiones.
  - Evidencia: `lib/util.js:41-48` (`validarNIF`, con el TODO de noviembre de 2017 «falta comprobar la letra»); `routes/clientes.js:17-22`. Dato real: cliente 6 (Bar Nuevo Siglo), NIF «70355910k» (`db.js:101`). Anomalía A-32.
  - Test: `util.test.js` › los cuatro tests de «RN-47 · validarNIF: válido si tiene 9 caracteres sin contar espacios ni guiones»; `servidor-facturas.test.js` › los tres tests del bloque «RN-47 / A-32 · NIF en el alta de clientes»; `anomalias-calculo.test.js` › «CONGELA comportamiento actual: cualquier cadena de 9 caracteres es un NIF válido, letra de control incluida o no (A-32)».
- **FR-011 · Grabación de cabecera y líneas.** El sistema graba primero la cabecera de la factura y después cada línea por separado, sin agrupar las operaciones en una sola unidad que se deshaga si algo falla. Si falla la grabación de una línea, la cabecera y las líneas ya grabadas se quedan, y el sistema responde con error 500 «Error al grabar lineas: …».
  - Evidencia: `routes/facturas.js:74-99`; el comentario de `:81-82` dice que ya pasó y «se apaño en su dia a mano en la bd». Anomalía A-25.
  - Test: **ninguno**. Solo se verifica por inspección del código (ver «Huecos de cobertura»).
- **FR-012 · Líneas grabadas.** La factura grabada contiene exactamente las líneas que cuentan según FR-003, cada una con lo que dicen FR-005 y la spec 001. Esta spec exige el **conjunto** de líneas, **no su orden**.
  - Evidencia: `routes/facturas.js:83-98`. El orden no es estable (A-46, ver «Comportamiento documentado sin especificar»).
  - Test: los tests del bloque «Camino 1 · alta manual (POST /facturas/nueva)» comparan las líneas ordenadas por descripción (por ejemplo, «RN-15 · las filas sin descripción se descartan aunque tengan cantidad y precio»).

### Anomalías de esta spec

Todas están cerradas en el [registro de anomalías](../000-reconocimiento/registro-de-anomalias.md) (§7).

| ID | Clasificación | Comportamiento especificado | Tratamiento acordado | Decisión de negocio | Tests |
| --- | --- | --- | --- | --- | --- |
| A-05 | BUG A SECAS | FR-005 («1.234,56» → 1,234) | Especificar tal cual; corregir en la modernización admitiendo «1.234,56» y «1234,56» y rechazando lo ambiguo; cambiar solo la lectura de lo tecleado, nunca la de lo grabado. No retroactivo | Uso real: acta simulada, P34, Marga, 2026-11-16 («a veces pongo 1.234,56»). Formatos admitidos: ratificación, §3 («Resultado»), 2026-11-16 | `servidor-facturas.test.js` › ««1.234,56» se lee como 1,234; la siguiente factura salta al FA-2026-000112»; GM-08 |
| A-07 | BUG A SECAS (C08) | FR-002 (el alta factura a un cliente de baja). La remesa hace lo mismo: se especifica en la spec 006 | Especificar tal cual; corregir en el alta y en la remesa. No retroactivo | Acta simulada, P06, Marga y Paco, 2026-11-16 → RS-04 | `servidor-facturas.test.js` › «se graba una factura a un cliente dado de baja (A-07, RN-14, C08)»; GM-08 |
| A-15 | INTENCIONAL (devolución de envases) | FR-004 (cero y negativos aceptados, sin distinguir envases) | Especificar tal cual; el programa no distingue envases | Acta simulada, P15, Marga y Puri, 2026-11-16; ratificación, N-01, Puri y Dirección, 2026-11-16 → RS-12 | `anomalias-calculo.test.js` › 4 tests «A-15 · …»; GM-07 |
| A-21 | BUG A SECAS | FR-007 (fecha libre, sin validar formato ni orden) | Especificar tal cual; validar fecha y orden en la modernización. No retroactivo | Acta simulada, P21, Marga y Puri, 2026-11-16 → RS-16 | `servidor-facturas.test.js` › «la fecha no se valida; «2026/10/20» se graba tal cual y vence el 2026-11-18» y ««2026-1-5» se graba sin ceros y vence el 2026-02-04»; GM-10 |
| A-25 | BUG A SECAS | FR-011 (cabecera y líneas sin transacción) | Especificar tal cual; corregir en la modernización. No retroactivo | Ninguna decisión pendiente; testimonio escrito del autor en `routes/facturas.js:81-82` | Ninguno: verificable solo por inspección |
| A-32 | INTENCIONAL (con riesgo) | FR-010 (NIF validado solo por longitud) | Especificar tal cual; validar el NIF en la modernización | Acta simulada, P26, Marga, 2026-11-16; ratificación, N-08, Marga, 2026-11-16 (incidente de 2023, anterior a la copia) → RS-20 | `servidor-facturas.test.js` › «un NIF de 8 caracteres se rechaza…» y ««XXXXXXXXX» se acepta como NIF…»; `util.test.js` › «RN-47 · …»; `anomalias-calculo.test.js` › «A-32 · …» |
| A-46 | ACCIDENTAL | **Ninguno: se documenta sin especificar.** FR-012 exige el conjunto de líneas, no su orden | Documentar sin especificar | Ninguna | Los tests comparan el conjunto ordenado por descripción |

### Comportamiento documentado sin especificar

- **Orden de las líneas (A-46).** Con 3 o más líneas, el orden en que se graban no sigue siempre el del formulario y cambia de una ejecución a otra (observados, entre otros, 1-4-3-2 y 1-3-2-4, en la caracterización del 2026-11-16). Con 1 o 2 líneas no se ha observado desorden. Como la factura impresa muestra las líneas en el orden en que se grabaron, el cliente puede recibirlas en un orden distinto del tecleado. Evidencia: `routes/facturas.js:85`; ficha A-46 del registro. La modernización no debe tomar ningún orden concreto como contrato.

### Convenciones declaradas (no son requisitos)

Son conducta deseada declarada por el negocio. Esta spec **no las impone**.

| # | Convención declarada | Fuente | Anomalía que la separa del comportamiento actual |
| --- | --- | --- | --- |
| CN-3 | A un cliente de baja no se le factura nunca | Acta simulada, P06, Paco, 2026-11-16 → RS-04 | **A-07**: el alta acepta un cliente de baja por petición directa (FR-002) |
| CN-5 | Las líneas negativas en la serie FA solo valen para devolver envases; anular una factura va siempre por rectificativa | Acta simulada, P15, Puri, 2026-11-16 → RS-12; ratificación, N-01, Puri y Dirección, 2026-11-16 | **A-15**: el programa acepta cualquier línea negativa o a cero, sin distinguir envases (FR-004) |
| PR-1 | No se antedata: una factura con número posterior no puede llevar fecha anterior. Dueña: spec 004 | Acta simulada, P21, Puri, 2026-11-16 → RS-16 | **A-21**: la fecha es libre (FR-007), y Marga graba a veces días después pedidos de fin de mes (P21) |
| CD-A05 | Para la modernización: se admiten «1.234,56» y «1234,56»; ante un formato ambiguo, se rechaza | Ratificación, §3 («Resultado», A-05), 2026-11-16 | **A-05**: hoy «1.234,56» se lee como 1,234 (FR-005) |

### Huecos de cobertura

- **Grabación sin transacción (A-25, FR-011).** No tiene test: solo se provoca con un fallo de la base de datos durante la grabación de una línea, y desde la interfaz toda entrada que haría fallar una línea hace fallar antes la cabecera (A-22). Haría falta inyectar fallos (`pruebas/caracterizacion/LEEME.md:144`, «Fuera de la red»). Criterio verificable por inspección: en `routes/facturas.js:74-99` no hay transacción que agrupe la cabecera y las líneas.
- **Descripción de solo espacios y texto con dos comas.** Comportamiento evidente en el código (`routes/facturas.js:56`, `:59-60`), sin test propio. Se propone añadirlos en la planificación.

### Fuera de alcance

- Cálculo de importes, tipos de IVA admitidos y recargo (A-14): spec 001.
- Descuento por volumen y su anotación en observaciones: spec 002.
- Número, año del número y hueco por error de grabación (A-20, A-22): spec 004.
- Vencimiento (RN-18, A-36, A-37): spec 008. Los tests de vencimiento del bloque «Camino 1» son de esa spec.
- Envío por correo e impresión (A-35, RN-51): spec 010.
- Facturación de cuotas: specs 005 y 006. Que la remesa facture a clientes de baja (A-07) se especifica en la 006.

### Key Entities

- **Petición de alta**: cliente, fecha, observaciones y filas con descripción, cantidad, precio y tipo de IVA, tal como se teclearon.
- **Fila del formulario**: cuenta como línea solo si tiene descripción (FR-003); su cantidad y su precio se leen según FR-005.
- **Factura nueva**: serie FA, estado «emitida», fecha según FR-007, observaciones según FR-008 y la spec 002.
- **Cliente**: identificador, marca de activo (que el alta no mira, FR-002), NIF opcional validado solo por longitud (FR-010) y correo, que aparece en el aviso del envío (FR-009).

## Success Criteria *(mandatory)*

### Measurable Outcomes

Esta spec es un contrato de comportamiento; sus criterios se miden con la suite de caracterización existente, que no se modifica.

- **SC-001**: los 17 tests del bloque «Camino 1 · alta manual (POST /facturas/nueva)» de `servidor-facturas.test.js` pasan sin cambios. El bloque incluye tests cuyas reglas son de otras specs (descuento de la 002, vencimiento de la 008, tipos de IVA de la 001); se exige el bloque completo porque todos ejercitan el alta.
- **SC-002**: los 3 tests del bloque «RN-47 / A-32 · NIF en el alta de clientes» de `servidor-facturas.test.js` y los 4 del grupo «RN-47 · validarNIF…» de `util.test.js` (con las fronteras de 8, 9 y 10 caracteres) pasan sin cambios.
- **SC-003**: los 4 tests de A-15 y el de A-32 de `anomalias-calculo.test.js` pasan sin cambios.
- **SC-004**: `golden-master.test.js` pasa en GM-07, GM-08 y GM-10, con 0 diferencias respecto al master.
- **SC-005**: 11 de los 12 requisitos (FR-001 a FR-012) tienen al menos un test citado; el que no lo tiene (FR-011, A-25) figura en «Huecos de cobertura» con su criterio de inspección.
- **SC-006**: Marga puede repetir en el formulario cada escenario de las historias 1 a 4 y obtener las mismas facturas, respuestas y avisos, sin consultar el código.

## Assumptions

- La versión de referencia es el código del commit `2b49ea5` y la copia de `datos/gesfact.db` versionada en ese commit. La BD de producción no se toca; los tests trabajan sobre copias temporales, con reloj y zona horaria fijos.
- El testimonio de negocio citado es simulado y ratificado por la responsable del proyecto (NEGOCIO-RS). No condiciona esta spec, que fija el comportamiento actual; sí condiciona cualquier corrección futura (deuda de confirmación).
- El alta solo se usa desde el formulario de la aplicación, en la red de la oficina y sin autenticación (A-39, excluida de las specs). Las peticiones directas que saltan el formulario (cliente de baja, tipos de IVA fuera del desplegable) son posibles y por eso se especifican.
- La lectura de importes también existe, igual, en artículos (`routes/articulos.js:19`) y contratos (`routes/contratos.js:19`); esta spec solo especifica la del alta de facturas.
- La numeración (003) y el nombre (`003-alta-facturas`) siguen la [propuesta de partición](../000-reconocimiento/propuesta-particion-specs.md).
