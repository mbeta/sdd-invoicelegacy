# C09 · Qué factura se puede cobrar y cuál se puede rectificar

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `2ca40e3` · Método y experimentos: [contradicciones.md](contradicciones.md) §2

**En una línea:** la vista de detalle y las rutas del servidor deciden por separado qué facturas admiten «cobrar» y «rectificar», con criterios distintos. La vista solo ofrece las dos acciones a facturas FA emitidas. El servidor cobra cualquier factura emitida, también las RE, y rectifica cualquier FA que no esté ya rectificada, también las cobradas.

## 1. Implementaciones

| | A · Vista de detalle | B · Ruta de cobro | C · Ruta de rectificación |
| --- | --- | --- | --- |
| Código | `views/factura_detalle.ejs:47-52`: botones solo si `f.estado === 'emitida' && f.serie === 'FA'` | `routes/facturas.js:117-122`: `UPDATE … SET estado = 'cobrada' WHERE id = ? AND estado = 'emitida'` | `routes/facturas.js:129-133`: rechaza `rectificada` (`400`) y serie `RE` (`400`) |
| Condición para cobrar | Emitida **y** FA | Emitida (cualquier serie) | — |
| Condición para rectificar | Emitida **y** FA | — | No rectificada **y** no RE, así que admite FA `emitida` y FA `cobrada` |
| Camino | Botones «Marcar cobrada» y «Rectificar (abono total)» | `POST /facturas/:id/cobrar` | `POST /facturas/:id/rectificar` |

## 2. Comparación paso a paso

| Situación | A · Vista | B · Cobro | C · Rectificación | ¿Igual? |
| --- | --- | --- | --- | --- |
| FA emitida | Ofrece las dos acciones | Cobra | Rectifica | Igual |
| FA cobrada | No ofrece nada | No hace nada y redirige sin aviso (A14) | **Rectifica** | **Distinto** |
| FA rectificada | No ofrece nada | No hace nada | `400 Ya esta rectificada` | Igual |
| RE emitida | No ofrece nada | **Cobra** | `400 No se rectifica una rectificativa` | **Distinto** |

## 3. Ejemplos con resultados distintos (E3, servidor real)

| Acción | Respuesta | Efecto en la BD |
| --- | --- | --- |
| `GET /facturas/7` (RE-2026-000001) y `GET /facturas/1` (FA-2026-000101, cobrada) | Ningún botón de cobrar ni de rectificar | — |
| `POST /facturas/7/cobrar` | `302` a `/facturas/7` | `RE-2026-000001` pasa a **`cobrada`**. El panel baja de 4 a 3 pendientes (C04) |
| `POST /facturas/1/rectificar` con `motivo=prueba` | `302` a `/facturas/10` | Se crea **RE-2026-000002** y `FA-2026-000101` pasa de `cobrada` a **`rectificada`**: se pierde la marca de cobro (R14) |

**Datos reales afectados:** las 4 facturas cobradas (101 a 104) son rectificables por URL, y la única RE (`RE-2026-000001`) es «cobrable» por URL. Consulta: `SELECT numero, serie, estado FROM facturas`.

## 4. Cuándo divergen y cuándo coinciden

**Coinciden** siempre que se trabaja con los botones: la vista es más restrictiva que el servidor, así que todo lo que ofrece también lo admite el servidor.

**Divergen** solo con peticiones que no salen de los botones de la vista:

- una URL escrita a mano;
- una página de detalle abierta antes de que cambie el estado, por ejemplo en otra pestaña o en el puesto de otra persona;
- un formulario externo, ya que no hay protección CSRF (R19).

**Por qué nadie lo ha detectado:** no hay rastro de su uso en los datos. `RE-2026-000001` sigue `emitida`, y la única factura rectificada es `FA-2026-000106` (`SELECT numero, estado FROM facturas WHERE estado IN ('cobrada','rectificada')` → 101-104 `cobrada`, 106 `rectificada`). Como la rectificación sobrescribe el estado, no se puede saber si la 106 estaba cobrada antes (pregunta C09-1).

## 5. Historia probable

1. El cobro es la acción más antigua y simple: solo comprueba el estado (`routes/facturas.js:116-122`).
2. La rectificación llegó con la serie RE y la política de 2020 (`lib/numeracion.js:3-6`; memoria H17). Sus comprobaciones apuntan a los dos errores obvios: rectificar dos veces y rectificar una rectificativa (`:132-133`). Si debía rectificarse algo ya cobrado era una pregunta de negocio que el código no se planteó.
3. La condición de la vista (`serie === 'FA'`) parece añadida cuando aparecieron las RE, para no ofrecerles botones. No se trasladó a la ruta de cobro (**SUPOSICIÓN**: no hay comentario ni historial).

## 6. Para el registro y la entrevista

- **Registro:** ya existe como **R14** (Bug, impacto Medio) y flujo A6, A7 y A14. Se propone precisar en R14 que la causa es la **doble validación con criterios distintos** entre la vista y las rutas, con la reproducción de E3. No se propone ninguna corrección.
- **Preguntas** (amplían P9):
  - **C09-1 (Marga, Puri):** ¿se puede rectificar una factura ya cobrada? Si se hace, ¿debe seguir constando como cobrada?
  - **C09-2 (Marga):** una rectificativa, ¿se «cobra» (se paga o se compensa al cliente)? ¿Hace falta registrarlo en el programa?
