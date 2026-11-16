# Ciclo de vida de una factura — GesFact 2.4

**Recorrido de una factura desde que se crea hasta su último estado, siguiendo el código.** Fecha: 2026-11-16. Fase: documentar y proteger (ver `.specify/memory/constitution.md`).

Cada paso lleva evidencia (`fichero:líneas`, consulta SQL sobre una **copia** de la BD o prueba reproducible). No se propone ningún cambio. Las anomalías se indexan en §9. Complementa a `mapa-sistema.md`.

## 1. Caminos de creación

Se han buscado todas las escrituras en `facturas`, `lineas` y `contadores` del repositorio. Hay **exactamente tres caminos**:

- **Camino 1 — Alta manual:** formulario web → `POST /facturas/nueva`, serie `FA` (`routes/facturas.js:40-102`).
- **Camino 2 — Remesa mensual:** `node scripts/remesa_mensual.js AAAA-MM`, serie `FA` (`scripts/remesa_mensual.js:1-84`).
- **Camino 3 — Rectificación:** botón del detalle → `POST /facturas/:id/rectificar`, serie `RE` (`routes/facturas.js:124-164`).

Fuera de esos tres:

- **Siembra inicial:** inserta 9 facturas históricas, pero solo con la BD vacía (`db.js:83-87,122-177`).
- **Baja de contrato:** no graba factura. Calcula un importe para que administración lo facture a mano por el camino 1 (`routes/contratos.js:28-40`).
- **Borrado:** no existe ningún `DELETE`. Las facturas no se borran nunca (`lib/numeracion.js:3-6`).

## 2. Piezas comunes

### `calculo.calcularFactura(lineas, cliente)` — caminos 1 y 2

1. Si `cliente.recargo_equivalencia == 1`, aplica recargo (`services/calculo.js:49`).
2. **Primera pasada** con el precio original para obtener la base bruta (`services/calculo.js:53-58`).
3. Descuento por volumen con `porcentajeDescuento`: `> 5000` → 5 %, `> 1000` → 2 % (`services/calculo.js:39-43,60`).
4. **Segunda pasada:** redondea el precio unitario con el descuento aplicado y calcula cada línea con `calcularLinea`, redondeando base, IVA y recargo en cada línea (`services/calculo.js:26-34,65-71`).
5. La línea guarda el **precio ya descontado** (`services/calculo.js:75`).
6. Los totales de la cabecera son la suma de las líneas; `total = base + iva + recargo` (`services/calculo.js:81-86`).

### `numeracion.siguienteNumero(serie)` — los tres caminos

- Lee `contadores` de la serie y del **año del reloj**; si no hay fila, la crea a 0 (`lib/numeracion.js:15-23`).
- Hace `UPDATE ultimo + 1` y devuelve `SERIE-AAAA-NNNNNN` (`lib/numeracion.js:30-42`).
- El número queda **consumido antes** de grabar la factura, sin transacción (A1).

### `util.sumarDias(fecha, dias)` — vencimiento en los caminos 1 y 2

- Interpreta la fecha en UTC y la devuelve en hora local (`lib/util.js:20-26`).
- Prueba con `sumarDias('2026-03-20', 30)`: da `2026-04-19` en `Europe/Madrid` y `UTC`, pero `2026-04-18` en `America/Buenos_Aires` (A9).

## 3. Camino 1 — Alta manual

**Entradas:** `cliente_id` (solo clientes activos en el desplegable), `fecha` opcional, 6 filas de `desc`/`cant`/`precio`/`iva` (21/10/4) y `obs` (`views/factura_nueva.ejs:6-25`, `routes/facturas.js:31`). El catálogo solo autorrellena: el servidor usa el precio del formulario (`public/js/factura.js:3-15`, `routes/facturas.js:57-62`).

**Recorrido:**

1. Fecha del formulario, o `util.hoy()` si viene vacía (`routes/facturas.js:44`).
2. Busca el cliente; si no existe, responde **400** (`routes/facturas.js:46-47`). No comprueba que esté activo.
3. Monta las líneas: descarta las que no tienen descripción y lee números con `parseFloat`, cambiando solo la primera coma (`routes/facturas.js:55-63`). Si no queda ninguna, responde **400** (`routes/facturas.js:64`).
4. `calcularFactura(lineas, cliente)` (`routes/facturas.js:66`).
5. Vencimiento: `sumarDias(fecha, cliente.dias_pago || config.VENCIMIENTO_DIAS)` (`routes/facturas.js:68-69`).
6. Número: `siguienteNumero('FA')` (`routes/facturas.js:71`).
7. Graba en este orden:
   - `contadores` (`lib/numeracion.js:20,32`).
   - `INSERT facturas` con estado `emitida` y observaciones = `obs` + « Descuento volumen N% aplicado» si hay descuento (`routes/facturas.js:74-76`).
   - `INSERT lineas` de todas las líneas **en paralelo** (`routes/facturas.js:83-91`).
8. «Envía» el email, que solo escribe un aviso en consola (`routes/facturas.js:93`, `services/email.js:26-28`), y redirige al detalle (`routes/facturas.js:94`).

**Si falla a mitad:**

- Si falla la cabecera, el número se pierde y queda un hueco. Basta una línea con descripción y precio vacío: sale `NaN` y SQLite rechaza el `NOT NULL` (prueba en una BD en memoria; A1).
- Si falla alguna línea, la cabecera queda grabada con solo parte de las líneas y el usuario ve un error 500 (`routes/facturas.js:81-82,92`).

## 4. Camino 2 — Remesa mensual

**Entradas:** el mes `AAAA-MM` (`scripts/remesa_mensual.js:14-18`) y los contratos con `fecha_alta <= último día` y sin baja o con baja `>= día 1`. La consulta no filtra clientes inactivos, no lleva `ORDER BY` y no mira si el mes ya está facturado (`scripts/remesa_mensual.js:26-29`).

**Recorrido**, contrato a contrato y en secuencia (`scripts/remesa_mensual.js:33-41,72`):

1. Antes de nada, `db.inicializar`, que siembra datos históricos si la BD está vacía (`scripts/remesa_mensual.js:23`).
2. Prorrateo propio por **días reales del mes**: `redondear2(cuota / diasMes * diasServicio)` (`scripts/remesa_mensual.js:45-51`).
3. Una sola línea: `concepto + ' (N dias)'` si el mes es parcial, o `+ ' (mes año)'` si es completo; cantidad 1 y precio = importe (`scripts/remesa_mensual.js:53-54`).
4. `calcularFactura(lineas, { recargo_equivalencia })` (`scripts/remesa_mensual.js:55`). Una cuota de más de 1.000 € recibiría descuento por volumen (prueba con 1.200 € → precio 1.176 €; A5).
5. Número: `siguienteNumero('FA')`, del mismo contador que el camino 1 (`scripts/remesa_mensual.js:57`).
6. Fecha = último día del mes facturado; vencimiento = `sumarDias(fecha, co.dias_pago || 30)` (`scripts/remesa_mensual.js:59-60`).
7. Graba `contadores`, luego `INSERT facturas` (`emitida`, observaciones «Remesa junio 2026») y después `INSERT` de la línea (`scripts/remesa_mensual.js:61-68`).
8. No envía email.

**Si falla a mitad:** `process.exit(1)` (`scripts/remesa_mensual.js:58,64,70`). Las facturas anteriores quedan grabadas, y relanzar el script las duplica (A4). Hay un precedente en los datos: `FA-2026-000106`, «ERROR cuota duplicada» (`db.js:156`).

## 5. Camino 3 — Rectificación (abono total)

**Entradas:** el `id` de la original y un `motivo` opcional (`views/factura_detalle.ejs:49-50`). El botón solo aparece en facturas `FA` `emitida`, pero la ruta también acepta facturas `cobrada` (`views/factura_detalle.ejs:47`, `routes/facturas.js:132-133`).

**Recorrido:**

1. Rechaza la petición si la factura no existe (404), si ya está `rectificada` (400) o si es serie `RE` (400) (`routes/facturas.js:130-133`).
2. Lee las líneas **sin `ORDER BY`** (`routes/facturas.js:135`).
3. Número: `siguienteNumero('RE')` (`routes/facturas.js:138`).
4. **No recalcula nada**: invierte signos, porque la rectificativa debe ser «espejo exacto» (Puri, `routes/facturas.js:127-128`).
5. Graba en este orden:
   - `contadores`.
   - `INSERT facturas` RE con fecha `hoy()`, vencimiento `null`, importes de la **cabecera** original negados, `emitida`, `rectifica_a` = número de la original y observaciones «Rectifica X. motivo» (`routes/facturas.js:141-143`).
   - `INSERT lineas` en paralelo: «Rectificación: » + descripción, cantidad y cuotas negadas, precio con el mismo signo (`routes/facturas.js:148-150`).
   - `UPDATE` de la original a `rectificada` (`routes/facturas.js:154`).
6. Redirige a la rectificativa. La factura correcta se emite después a mano por el camino 1, como `FA-2026-000107` «Sustituye a FA-2026-000106» (`db.js:164`).

**Si falla a mitad:**

- Los errores de las líneas y del `UPDATE` se ignoran (`routes/facturas.js:151,154`).
- Una original sin líneas deja la petición colgada y la original sin marcar (A2).
- Un doble clic puede crear dos rectificativas de la misma factura (A3).

## 6. Estados

Los estados posibles son `emitida`, `cobrada` y `rectificada` (`db.js:61`). Las tres vías de creación graban `emitida`. No hay estado «vencida» ni ningún proceso automático que cambie estados.

```text
 Camino 1 / 2 ──► FA emitida ──cobrar──► FA cobrada
                     │                       │ (rectificar solo por URL)
                     └──rectificar──► FA rectificada (final) ◄┘
 Camino 3 ───────────────────────► RE emitida ──cobrar (solo por URL)──► RE cobrada
```

- **`emitida` → `cobrada`:** botón «Marcar cobrada». La SQL exige `estado = 'emitida'`; si no se cumple, redirige sin avisar (`routes/facturas.js:117-121`; A14).
- **`emitida`/`cobrada` → `rectificada`:** camino 3. Si estaba cobrada, se pierde esa marca (`routes/facturas.js:154`; A7).
- **RE → `cobrada`:** `/cobrar` no comprueba la serie, así que funciona escribiendo la URL a mano (`routes/facturas.js:118`; A6).
- **Quién lee los estados:**
  - El panel cuenta como pendientes las `emitida` de ambas series, pero el importe pendiente solo suma `FA` (`server.js:23-24`).
  - El CSV exporta el estado como columna (`routes/informes.js:36-45`).
  - El resumen de IVA no filtra por estado: original y rectificativa se compensan (`routes/informes.js:21-25`).

## 7. Puntos donde dos caminos hacen «lo mismo» con código distinto

### 7.1 Prorrateo de un mes parcial ⚠️ (el más grave)

- Baja de contrato: `calcularProrrateo`, mes fijo de **30 días** con tope de 30 (`services/calculo.js:95-102`, `routes/contratos.js:39`). Ese importe se factura a mano por el camino 1.
- Remesa: fórmula propia por **días reales** (`scripts/remesa_mensual.js:45-51`).
- Con una cuota de 90 € (prueba):

  | Periodo | Remesa | Baja |
  | --- | --- | --- |
  | 1-14 feb 2026 | 45,00 | 42,00 |
  | 1-20 mar 2026 | 58,06 | 60,00 |
  | Febrero completo | 90,00 | 84,00 |

### 7.2 Cálculo de importes

- Caminos 1 y 2 usan `calcularFactura`, pero con objetos de cliente distintos: la fila completa frente a `{recargo_equivalencia}` (`routes/facturas.js:66`, `scripts/remesa_mensual.js:55`). Hoy da igual, porque solo se lee ese campo (`services/calculo.js:49`).
- Camino 3 no calcula: niega la cabecera y las líneas **por separado**, así que hereda cualquier descuadre de la original (§8).

### 7.3 Vencimiento y fecha

- **Vencimiento:**
  - Camino 1: `dias_pago || config.VENCIMIENTO_DIAS` (`routes/facturas.js:68`).
  - Camino 2: `dias_pago || 30` literal (`scripts/remesa_mensual.js:60`).
  - Camino 3: `null`.
  - En los caminos 1 y 2, `dias_pago = 0` se convierte en 30 (A12).
- **Fecha:**
  - Camino 1: la del usuario o hoy.
  - Camino 2: el último día del mes.
  - Camino 3: siempre hoy.
  - En todos, el año del número sale del reloj y no de esta fecha (`lib/numeracion.js:15`).

### 7.4 Grabación de cabecera y líneas

- **`INSERT facturas` copiado tres veces** (`routes/facturas.js:74`, `scripts/remesa_mensual.js:61`, `routes/facturas.js:141`).
- **Líneas:**
  - Camino 1: en paralelo, guarda el último error (`routes/facturas.js:85-92`).
  - Camino 2: una sola línea, con `exit(1)` si falla (`scripts/remesa_mensual.js:67-70`).
  - Camino 3: en paralelo y sin mirar errores (`routes/facturas.js:148-151`).
- **Errores:** HTTP 400/500 en el camino 1, consola y fin del proceso en el 2, ignorados en el 3.

### 7.5 Observaciones y email

- **Observaciones:**
  - Camino 1: anota el descuento (`routes/facturas.js:76`).
  - Camino 2: «Remesa mes año», aunque haya descuento (`scripts/remesa_mensual.js:62`).
  - Camino 3: «Rectifica X. motivo».
- **Email:** solo el camino 1 llama a `enviarFactura` (`routes/facturas.js:93`).

### 7.6 Lectura de líneas y totales de IVA

- **Orden de las líneas:** el detalle las lee `ORDER BY id` y la rectificación sin orden (`routes/facturas.js:109,135`).
- **Totales de IVA:** el resumen de IVA suma **líneas** y el CSV usa la **cabecera** (`routes/informes.js:23-25,36-38`). Con datos nuevos coinciden; con los históricos no (§8).

## 8. Contraste con los datos reales (copia de la BD)

- **Estados:** `FA` cobrada 4, emitida 3, rectificada 1; `RE` emitida 1 (`GROUP BY serie, estado`).
- **Contadores:** `FA/2026/108` y `RE/2026/1`, igual al último número de cada serie.
- **`RE-2026-000001`:** es espejo exacto de `FA-2026-000106`. Las sumas de base y de total dan 0, el vencimiento es `NULL` y las líneas llevan el prefijo «Rectificación: ».
- **Recálculo con `calcularFactura`:** de las 8 facturas `FA`, solo `FA-2026-000104` se reproduce exacta.
  - En 101, 105, 106, 107 y 108, el IVA de la cabecera no es la suma de sus líneas. En la 101: 27,97 = 133,20 × 21 %, aunque tiene líneas al 10 %.
  - `FA-2026-000103`, el caso «base 1000 sin descuento» (`db.js:138-139`), sale con un 2 % al recalcular: la línea de portes 0,92 × 6,00 da 5,52, no 5,50.
  - `FA-2026-000105` tiene precios sin descontar, aunque su observación dice «Descuento volumen 2% aplicado».
  - Conclusión: los datos históricos **no sirven** como resultado esperado de los tests (A10).

## 9. Anomalías y suposiciones registradas en este documento (índice)

- **A1** El número se consume antes de grabar la cabecera → huecos en la numeración (p. ej. precio vacío → `NaN`) — §3, `lib/numeracion.js:32-34`, `routes/facturas.js:59-78`.
- **A2** Rectificar una factura sin líneas deja la petición colgada, la RE grabada y la original sin marcar — §5, `routes/facturas.js:147-159`.
- **A3** Un doble clic en «Rectificar» puede crear dos RE (la comprobación y el cambio de estado van separados) — §5, `routes/facturas.js:132,154`.
- **A4** La remesa no es idempotente ni reanudable: relanzarla duplica facturas — §4, `scripts/remesa_mensual.js:26-29,58-70`.
- **A5** La remesa aplicaría descuento por volumen a cuotas de más de 1.000 € sin anotarlo — §4, `scripts/remesa_mensual.js:55,62`.
- **A6** `/cobrar` no comprueba la serie; el panel cuenta las RE como pendientes — §6, `routes/facturas.js:118`, `server.js:23-24`.
- **A7** Rectificar una factura cobrada borra la marca de cobro — §6, `routes/facturas.js:154`.
- **A8** `'1.234,56'` se lee como `1.234` — §3, `routes/facturas.js:59-60`.
- **A9** `sumarDias` resta un día en zonas horarias al oeste de UTC (correcto en Madrid) — §2, `lib/util.js:20-26`.
- **A10** Los datos históricos no se reproducen con el cálculo actual; IVA y CSV no cuadran entre sí — §8.
- **A11** Se pierde el precio original sin descuento — §2, `services/calculo.js:75`.
- **A12** `dias_pago = 0` se trata como 30 días — §7.3, `routes/facturas.js:68`, `scripts/remesa_mensual.js:60`.
- **A13** El orden de las líneas no está garantizado (inserción en paralelo, lectura sin `ORDER BY`) — §3, §5, `routes/facturas.js:85,135,148`.
- **A14** `/cobrar` sobre una factura no `emitida` redirige sin error aunque no cambie nada — §6, `routes/facturas.js:118-120`.
- Ya registradas en `mapa-sistema.md`: numeración no atómica (A1), año del reloj (A2), grabación sin transacción (A3), dos prorrateos (A4) y vencimiento por defecto distinto (A5).
- **S1** El `id` de las líneas sigue el orden del formulario — §3 (pendiente de comprobar con un test de caracterización).
- **S2** La remesa numera los contratos por orden de `id` — §4 (consulta sin `ORDER BY`).
- **S3** Los descuadres históricos vienen de una versión anterior o de retoques a mano — §8 (pregunta a Julián y Puri).
- **S4** Causa de la cuota duplicada de `FA-2026-000106` — §4 (pregunta a Marga).
- **S5** Qué prorrateo es el correcto para la gestoría — §7.1 (pregunta a Paco y Puri).
- **S6** Zona horaria de los equipos de la oficina — §2 (pregunta a Julián).

Ninguna de estas anomalías se corrige en esta fase. Se documentan para trasladarlas al registro de anomalías y, en su caso, a decisión escrita del negocio.
