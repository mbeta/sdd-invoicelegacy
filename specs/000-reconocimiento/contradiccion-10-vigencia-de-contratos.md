# C10 · Si un contrato está vigente

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `2ca40e3` · Método y experimentos: [contradicciones.md](contradicciones.md) §2

**En una línea:** la pantalla de contratos da un contrato por terminado en cuanto tiene fecha de baja, aunque esa fecha sea futura. La remesa lo factura mientras el mes facturado se solape con el periodo entre alta y baja. Con una baja futura, la pantalla lo muestra «de baja» y la remesa lo sigue facturando entero.

## 1. Implementaciones

| | A · Pantalla de contratos | B · Remesa mensual | C · Esquema |
| --- | --- | --- | --- |
| Código | `views/contratos.ejs:6`: fila con clase `baja` si `co.fecha_baja`; `:10-13`: el botón «baja» solo aparece si no hay `fecha_baja` | `scripts/remesa_mensual.js:26-29`: `fecha_alta <= último día AND (fecha_baja IS NULL OR fecha_baja >= primer día)` | `db.js:48`: `fecha_baja TEXT … // NULL = sigue activo` |
| Criterio | Vigente = sin fecha de baja | Vigente en el mes = el mes se solapa con el intervalo entre alta y baja | Vigente = sin fecha de baja |
| ¿Mira la fecha de hoy? | No | No; mira el mes facturado | No |
| ¿Mira el alta? | No | Sí | No |

La ruta de baja (`routes/contratos.js:31-43`) graba la fecha que se teclee, también futura, sin comprobar el alta ni si ya había una baja (R13).

## 2. Comparación paso a paso

| Situación del contrato | A · Pantalla | B · Remesa del mes M | ¿Igual? |
| --- | --- | --- | --- |
| Sin baja, alta pasada | Vigente | Se factura | Igual |
| Baja ya pasada (antes de M) | De baja | No se factura | Igual |
| Baja dentro del mes M | De baja | Se factura **prorrateado** (C01) | Distinto, aunque es coherente con la intención del prorrateo |
| **Baja futura** (después de M) | **De baja** (fila marcada y sin botón) | **Se factura entero** | **Distinto** |
| **Alta futura** (después de M) | **Vigente** | No se factura | **Distinto** |

## 3. Ejemplos con resultados distintos (E3 y E4, código real)

El 16/11/2026 se dio de baja el contrato 1 (Cafetería La Parada) con fecha **15/12/2026**:

| Momento | A · Pantalla de contratos | B · Remesa |
| --- | --- | --- |
| Justo después de la baja | Fila con clase `baja`, «Baja: 15/12/2026», sin botón; redirección con `?prorrateo=45.00` | — |
| Remesa `2026-11` | (sigue mostrándolo de baja) | **FA-2026-000111**, «(noviembre 2026)», 90,00 € de base: mes **entero** |
| Remesa `2026-12` | (sigue mostrándolo de baja) | **FA-2026-000115**, «(15 dias)», 43,55 € de base |

Si administración emitiese también la factura manual de la baja, se sumarían los 45,00 € de la pantalla (C01 §3.4).

**Datos reales:** el único contrato con baja (contrato 3, baja 15/09/2025) tiene la baja en el pasado, y los cuatro tienen el alta en el pasado (`SELECT id, fecha_alta, fecha_baja FROM contratos`). Hoy no hay divergencia.

## 4. Cuándo divergen y cuándo coinciden

**Coinciden** cuando la baja ya ha pasado o no existe y el alta ya ha pasado. Es el caso de todos los contratos reales.

**Divergen:**

- **Baja con fecha futura.** La pantalla invita a hacerlo: el campo de fecha está junto al botón (`views/contratos.ejs:11-12`) y la nota habla de bajas «a mitad de mes» (`:17`).
- **Contrato con alta futura.** Solo se pueden crear contratos por POST directo, porque no hay pantalla de alta (C07).

**Por qué nadie lo ha detectado:** lo más natural es dar la baja el mismo día o después. Si se da con antelación, la pantalla parece correcta («ya está de baja») y la remesa factura lo que corresponde al servicio. Nadie compara las dos.

## 5. Historia probable

1. El esquema define la vigencia como «`NULL` = sigue activo» (`db.js:47-48`), y la pantalla de contratos aplica exactamente esa definición.
2. La baja con prorrateo y factura manual (`routes/contratos.js:28-30`; memoria H30) introduce fechas de baja a mitad de mes, pero no cambia la pantalla.
3. En 2021 la remesa de Roberto (memoria H20) necesitaba saber qué contratos facturar **en un mes concreto**, y lo resolvió con un rango de fechas (`scripts/remesa_mensual.js:26-29`). Es otra definición de vigencia, más precisa para su propósito. La de la pantalla no se actualizó (**SUPOSICIÓN**: no hay comentario ni historial que lo confirme).

## 6. Para el registro y la entrevista

- **Registro:** nueva entrada propuesta. **Rareza**: la pantalla y la remesa usan definiciones distintas de contrato vigente; un contrato con baja futura aparece de baja y se sigue facturando entero. Impacto: Medio (administración puede creer que el contrato ya no se factura). Probabilidad: Baja (requiere dar bajas con antelación). Relacionado con R13 y RN-32. No se propone ninguna corrección.
- **Preguntas:**
  - **C10-1 (Marga):** ¿se registran bajas de contratos con antelación (por ejemplo, al recibir el preaviso del cliente)? ¿O siempre el mismo día?
  - **C10-2 (Marga):** para administración, ¿un contrato con baja el 15 del mes que viene está «de baja» o «vigente»?
