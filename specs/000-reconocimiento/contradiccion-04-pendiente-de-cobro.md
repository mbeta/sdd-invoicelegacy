# C04 · Facturas pendientes de cobro: el recuento y el importe del panel

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `2ca40e3` · Método y experimentos: [contradicciones.md](contradicciones.md) §2

**En una línea:** el panel de inicio muestra, una debajo de otra, dos cifras de «pendiente de cobro» calculadas con criterios distintos. El número de facturas incluye las rectificativas; el importe, no.

## 1. Implementaciones

| | A · «Facturas pendientes de cobro» | B · «Importe pendiente de cobro» | C · Filtro «emitidas» del listado |
| --- | --- | --- | --- |
| Código | `server.js:23`: `SELECT COUNT(*) FROM facturas WHERE estado = 'emitida'` | `server.js:24`: `SELECT SUM(total) FROM facturas WHERE estado = 'emitida' AND serie = 'FA'` | `routes/facturas.js:18-21` con `views/facturas.ejs:7`: `WHERE f.estado = 'emitida'` |
| Series que entran | FA y RE | Solo FA | FA y RE |
| Se muestra en | `views/index.ejs:5` | `views/index.ejs:6`, con `toFixed(2)` (ver C05) | Listado de facturas |
| Camino | Página de inicio `/` | Página de inicio `/` | Facturas → Estado: emitidas |

## 2. Comparación paso a paso

| Paso | A · Recuento | B · Importe | ¿Igual? |
| --- | --- | --- | --- |
| Estado | `emitida` | `emitida` | Igual |
| Serie | Cualquiera | Solo `FA` | **Distinto** |
| Agregado | `COUNT(*)` | `SUM(total)` | Distinto por naturaleza |
| Sin facturas | 0 | 0 (`imp && imp.s ? imp.s : 0`, `server.js:29`) | Igual |

## 3. Ejemplos con resultados distintos (datos reales)

| Medida | Lo que muestra el panel (E3) | Con el criterio del otro indicador |
| --- | --- | --- |
| Facturas pendientes | **4**: FA-2026-000105, -000107, -000108 y **RE-2026-000001** | 3, si solo se cuentan las FA |
| Importe pendiente | **3032.85 €**: 2.756,38 + 122,23 + 154,24 | **2.910,62 €**, si se incluye la RE (−122,23) |

Consultas:

- `SELECT COUNT(*) FROM facturas WHERE estado='emitida'` → 4.
- `SELECT SUM(total) FROM facturas WHERE estado='emitida' AND serie='FA'` → 3032.85.
- `SELECT SUM(total) FROM facturas WHERE estado='emitida'` → 2910.62.

**La diferencia es de 1 factura y 122,23 €.** El panel dice «4 facturas pendientes por 3.032,85 €», pero las cuatro facturas que cuenta suman 2.910,62 €.

**Si se «cobra» la rectificativa por URL (E3):** `POST /facturas/7/cobrar` la pasa a `cobrada` (ver C09). El recuento baja a 3 y el importe sigue en 3032.85. Las dos cifras vuelven a cuadrar, pero porque un abono figura como cobrado.

## 4. Cuándo divergen y cuándo coinciden

**Coinciden** mientras no haya ninguna rectificativa en estado `emitida`.

**Divergen en cuanto se emite la primera rectificativa, y para siempre:**

- Toda RE nace `emitida` (`routes/facturas.js:142`).
- La vista no ofrece «Marcar cobrada» para la serie RE (`views/factura_detalle.ejs:47`).
- Ningún proceso cambia su estado (flujo §6).

Así que cada rectificativa suma 1 al recuento para siempre y nunca al importe. Con los datos actuales, la diferencia ya existe desde la `RE-2026-000001` del 06/05/2026.

**Por qué nadie lo ha detectado:**

- El panel no muestra el detalle de qué facturas cuenta.
- Con una sola RE, la diferencia es de una unidad sobre un número pequeño.
- El importe por sí solo sí parece razonable: es lo que deben los clientes en facturas FA.

## 5. Historia probable

1. El panel es deliberadamente mínimo: «dashboard: cuatro números y a correr» (`server.js:21`).
2. La serie RE nació con la política de «no borrar nunca» de 2020 (`lib/numeracion.js:3-6`; memoria H17). El esquema solo prevé los estados `emitida`, `cobrada` y `rectificada` (`db.js:61`), sin ningún significado propio para una rectificativa.
3. El `AND serie = 'FA'` del importe parece añadido para que los abonos no restasen del pendiente, sin aplicar el mismo filtro al recuento de la línea anterior. Es una **SUPOSICIÓN**: no hay comentario ni historial que lo confirme.

## 6. Para el registro y la entrevista

- **Registro:** está mencionado dentro de **R14** («el panel cuenta las RE como pendientes aunque el importe pendiente solo suma FA») y de flujo A6. Se propone registrarlo como **Rareza propia**: dos indicadores contiguos con criterios distintos. Impacto: Bajo (seguimiento de cobros, sin efecto en importes facturados). Probabilidad: Alta (ya ocurre). No se propone ninguna corrección.
- **Preguntas:**
  - **C04-1 (Marga):** una rectificativa (abono), ¿es algo «pendiente de cobro»? ¿Se paga o se compensa al cliente? ¿Cómo lo controla hoy?
  - **C04-2 (Marga):** ¿usa el panel de inicio para el seguimiento de cobros, o lo hace con otra herramienta?
